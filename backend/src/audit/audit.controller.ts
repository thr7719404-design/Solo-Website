import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class AuditLogQueryDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() userEmail?: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() entityType?: string;
  @IsOptional() @IsString() entityId?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
}

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() q: AuditLogQueryDto) {
    return this.auditService.findAll({
      page: q.page ? Number.parseInt(q.page, 10) : 1,
      limit: q.limit ? Number.parseInt(q.limit, 10) : 50,
      userId: q.userId,
      userEmail: q.userEmail,
      action: q.action,
      entityType: q.entityType,
      entityId: q.entityId,
      from: q.from,
      to: q.to,
    });
  }
}

