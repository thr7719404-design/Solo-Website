import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PromosService } from './promos.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto, ValidatePromoCodeDto } from './dto/promo-code.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('promo-codes')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  // ===========================================================================
  // PUBLIC ENDPOINTS
  // ===========================================================================

  /** Validate a promo code (storefront use) */
  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async validate(@Body() dto: ValidatePromoCodeDto) {
    return this.promosService.validate(dto.code, dto.orderAmount);
  }

  // ===========================================================================
  // ADMIN ENDPOINTS
  // ===========================================================================

  /** List all promo codes (admin) */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.promosService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  /** Get a single promo code (admin) */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findOne(@Param('id') id: string) {
    return this.promosService.findOne(id);
  }

  /** Get orders that used a specific promo code (admin tracking) */
  @Get(':id/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getPromoCodeOrders(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.promosService.getPromoCodeOrders(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  /** Create a new promo code (admin) */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async create(@Body() dto: CreatePromoCodeDto) {
    return this.promosService.create(dto);
  }

  /** Update a promo code (admin) */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
    return this.promosService.update(id, dto);
  }

  /** Delete a promo code (admin) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.promosService.remove(id);
  }
}
