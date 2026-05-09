import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

/** HTTP methods that mutate state — the ones we want to audit. */
const MUTABLE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Derives a human-readable action label and entityType from a URL path.
 *
 * Handles patterns like:
 *   POST   /api/products              → PRODUCT_CREATED  / Product
 *   PATCH  /api/products/123          → PRODUCT_UPDATED  / Product
 *   DELETE /api/products/123          → PRODUCT_DELETED  / Product
 *   PATCH  /api/admin/orders/456      → ORDER_UPDATED    / Order
 *   POST   /api/admin/promo-codes     → PROMO_CODE_CREATED / PromoCode
 *   POST   /api/auth/login            → LOGIN_SUCCESS    / Auth
 */
function deriveAction(
  method: string,
  path: string,
): { action: string; entityType: string; entityId: string | null } {
  // Normalise path: strip /api prefix and trailing slashes
  const normalised = path.replace(/^\/api/, '').replace(/\/$/, '');

  // Match a resource segment + optional id
  const match = normalised.match(
    /^\/(?:admin\/)?([a-z-]+)(?:\/([^/?]+))?/i,
  );
  if (!match) return { action: `${method}_UNKNOWN`, entityType: 'Unknown', entityId: null };

  const [, resourceSlug, id = null] = match;
  const entityType = slugToEntityType(resourceSlug);
  const hasId = id != null && !/new|bulk/.test(id);

  let verb: string;
  switch (method) {
    case 'POST':   verb = 'CREATED'; break;
    case 'PUT':
    case 'PATCH':  verb = 'UPDATED'; break;
    case 'DELETE': verb = 'DELETED'; break;
    default:       verb = method;
  }

  // Refine verb for known sub-paths
  if (/status/i.test(normalised)) verb = 'STATUS_CHANGED';
  if (/auth\/login/i.test(normalised)) return { action: 'LOGIN', entityType: 'Auth', entityId: null };
  if (/auth\/logout/i.test(normalised)) return { action: 'LOGOUT', entityType: 'Auth', entityId: null };
  if (/auth\/register/i.test(normalised)) return { action: 'REGISTER', entityType: 'Auth', entityId: null };

  const action = `${entityType.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toUpperCase()}_${verb}`.replace(/__+/g, '_');

  return { action, entityType, entityId: hasId ? id : null };
}

function slugToEntityType(slug: string): string {
  const MAP: Record<string, string> = {
    products: 'Product',
    'product-groups': 'ProductGroup',
    categories: 'Category',
    subcategories: 'Subcategory',
    brands: 'Brand',
    orders: 'Order',
    'order-items': 'OrderItem',
    returns: 'Return',
    'promo-codes': 'PromoCode',
    banners: 'Banner',
    announcements: 'Announcement',
    navigation: 'Navigation',
    loyalty: 'Loyalty',
    vat: 'Vat',
    shipping: 'Shipping',
    payments: 'Payment',
    customers: 'Customer',
    users: 'User',
    settings: 'Settings',
    pages: 'CmsPage',
    'landing-pages': 'CmsPage',
    auth: 'Auth',
    'bulk-orders': 'BulkOrder',
  };
  return MAP[slug.toLowerCase()] ?? slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function extractIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress ?? req.ip ?? 'unknown';
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method?.toUpperCase() ?? '';

    if (!MUTABLE_METHODS.has(method)) {
      return next.handle();
    }

    const user = req.user;
    // Only audit authenticated admin users
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return next.handle();
    }

    const path: string = req.url ?? req.path ?? '';
    const { action, entityType, entityId } = deriveAction(method, path);

    const ipAddress = extractIp(req);
    const userAgent = req.headers?.['user-agent'] ?? null;

    // Capture sanitised request body (exclude file uploads / streams)
    const requestData =
      req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)
        ? req.body
        : undefined;

    return next.handle().pipe(
      tap({
        next: (responseBody: any) => {
          // Extract entityId from response if not in URL
          let resolvedId = entityId;
          if (!resolvedId && responseBody) {
            resolvedId =
              responseBody?.id?.toString() ??
              responseBody?.data?.id?.toString() ??
              null;
          }

          this.auditService.log({
            userId: user.sub ?? user.id,
            userEmail: user.email,
            action,
            entityType,
            entityId: resolvedId ?? undefined,
            description: buildDescription(action, entityType, resolvedId, responseBody),
            requestData,
            responseData: responseBody,
            ipAddress,
            userAgent,
          });
        },
        error: () => {
          // Log failed mutations too — useful to know when someone tried to delete/update
          this.auditService.log({
            userId: user.sub ?? user.id,
            userEmail: user.email,
            action: `${action}_FAILED`,
            entityType,
            entityId: entityId ?? undefined,
            description: `Failed attempt: ${action} on ${entityType ?? 'entity'}`,
            requestData,
            ipAddress,
            userAgent,
          });
        },
      }),
    );
  }
}

function buildDescription(
  action: string,
  entityType: string,
  entityId: string | null,
  response: any,
): string {
  const name =
    response?.name ?? response?.data?.name ??
    response?.sku ?? response?.productName ??
    response?.orderNumber ?? response?.email ?? null;

  const parts: string[] = [action];
  if (entityType && entityType !== 'Unknown') parts.push(`${entityType}`);
  if (entityId) parts.push(`#${entityId}`);
  if (name) parts.push(`"${name}"`);
  return parts.join(' ');
}
