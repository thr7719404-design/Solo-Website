import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ProductGroupsService } from './product-groups.service';

interface AttributeInputDto {
  key: string;
  value: string;
  colorHex?: string | null;
}

@Controller('admin/product-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class ProductGroupsController {
  constructor(private readonly service: ProductGroupsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  // by-slug must come BEFORE the catch-all :id route
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body()
    dto: {
      name: string;
      slug?: string;
      description?: string;
      category?: string;
      tags?: string[];
      variantAxes?: string[];
      productIds?: number[];
    },
  ) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      slug?: string;
      description?: string;
      category?: string;
      tags?: string[];
      variantAxes?: string[];
      productIds?: number[];
    },
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ── Variant operations ─────────────────────────────────────────────
  @Post(':id/add-variant')
  addVariant(
    @Param('id') groupId: string,
    @Body()
    dto: {
      productId: number;
      attributes?: AttributeInputDto[];
      isDefault?: boolean;
      variantSortOrder?: number;
    },
  ) {
    return this.service.addVariant(groupId, dto);
  }

  @Delete(':id/remove-variant/:productId')
  removeVariant(
    @Param('id') groupId: string,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.service.removeVariant(groupId, productId);
  }

  @Post(':id/set-default/:productId')
  setDefault(
    @Param('id') groupId: string,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.service.setDefault(groupId, productId);
  }

  // ── Bulk auto-group (manual SKU list) ──────────────────────────────
  @Post('auto-group')
  autoGroup(
    @Body()
    dto: {
      skus: string[];
      groupName: string;
      slug?: string;
      category?: string;
      variantAxes?: string[];
    },
  ) {
    return this.service.autoGroup(dto);
  }

  // ── Migration helper: parse "Base | Variant" names ─────────────────
  @Post('auto-group-by-name')
  autoGroupByName(@Query('dryRun') dryRun?: string) {
    return this.service.autoGroupByName(dryRun === 'true');
  }

  // ── Backward-compat (used by existing AdminProductsPage Variants tab) ──
  @Patch('products/:productId')
  setProductVariant(
    @Param('productId', ParseIntPipe) productId: number,
    @Body()
    dto: {
      productGroupId: string | null;
      variantAttributes?: Record<string, any> | null;
      variantSortOrder?: number;
    },
  ) {
    return this.service.setProductVariant(productId, dto);
  }
}
