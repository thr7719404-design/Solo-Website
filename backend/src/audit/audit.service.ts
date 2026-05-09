import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  requestData?: Record<string, any>;
  responseData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Write an audit log entry. Never throws — failures are swallowed so they
   *  never break the main request flow. */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          userEmail: entry.userEmail ?? null,
          action: entry.action,
          entityType: entry.entityType ?? null,
          entityId: entry.entityId != null ? String(entry.entityId) : null,
          description: entry.description ?? null,
          requestData: entry.requestData
            ? this.sanitize(entry.requestData)
            : undefined,
          responseData: entry.responseData
            ? this.truncateJson(entry.responseData)
            : undefined,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent
            ? entry.userAgent.slice(0, 500)
            : null,
        },
      });
    } catch {
      // Intentionally silent — audit failures must not break app flow.
    }
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    userId?: string;
    userEmail?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    from?: string;
    to?: string;
  }) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(200, Math.max(1, options.limit ?? 50));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.userId) where.userId = options.userId;
    if (options.userEmail)
      where.userEmail = { contains: options.userEmail, mode: 'insensitive' };
    if (options.action) where.action = { contains: options.action, mode: 'insensitive' };
    if (options.entityType) where.entityType = options.entityType;
    if (options.entityId) where.entityId = options.entityId;

    if (options.from || options.to) {
      where.createdAt = {};
      if (options.from) where.createdAt.gte = new Date(options.from);
      if (options.to) where.createdAt.lte = new Date(options.to);
    }

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Remove sensitive fields from request bodies before persisting. */
  private sanitize(obj: Record<string, any>): Record<string, any> {
    const SENSITIVE = new Set([
      'password', 'passwordHash', 'token', 'secret', 'cardNumber',
      'cvv', 'pin', 'accessToken', 'refreshToken', 'authorization',
    ]);
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE.has(k.toLowerCase())) {
        clean[k] = '[REDACTED]';
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        clean[k] = this.sanitize(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }

  /** Trim large response objects to avoid bloating the audit table. */
  private truncateJson(obj: Record<string, any>): Record<string, any> {
    const str = JSON.stringify(obj);
    if (str.length <= 4000) return obj;
    // Return a truncation marker with key top-level fields
    const keys = Object.keys(obj);
    const preview: Record<string, any> = { _truncated: true, _keys: keys };
    for (const k of ['id', 'name', 'sku', 'status', 'message']) {
      if (obj[k] !== undefined) preview[k] = obj[k];
    }
    return preview;
  }
}
