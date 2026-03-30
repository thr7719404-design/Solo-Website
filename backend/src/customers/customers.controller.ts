import { Controller, Get, Post, Patch, Delete, Query, Body, Param, BadRequestException, NotFoundException, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerListQueryDto, CustomerListResponseDto } from './dto/customer-list.dto';
import { CreateCustomerDto, CreateCustomerResponseDto } from './dto/create-customer.dto';
import { CustomerDetailsDto } from './dto/customer-details.dto';
import { UpdateCustomerDto, UpdateCustomerResponseDto } from './dto/update-customer.dto';
import { CreateAddressDto, UpdateAddressDto, AddressResponseDto } from './dto/address.dto';
import { AdjustLoyaltyDto, LoyaltySummaryDto } from './dto/adjust-loyalty.dto';
import { LoyaltyService } from '../users/loyalty.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  @Get()
  async findAll(@Query() query: CustomerListQueryDto): Promise<CustomerListResponseDto> {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CustomerDetailsDto> {
    return this.customersService.findOne(id);
  }

  @Post()
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<CreateCustomerResponseDto> {
    return this.customersService.create(createCustomerDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<UpdateCustomerResponseDto> {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.customersService.softDelete(id);
  }

  // ============================================================================
  // ADDRESS ENDPOINTS
  // ============================================================================

  @Post(':id/addresses')
  async createAddress(
    @Param('id') customerId: string,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.customersService.createAddress(customerId, createAddressDto);
  }

  // ============================================================================
  // LOYALTY ADJUSTMENT ENDPOINT
  // ============================================================================

  @Post(':id/loyalty/adjust')
  async adjustLoyalty(
    @Param('id') customerId: string,
    @Body() adjustLoyaltyDto: AdjustLoyaltyDto,
  ): Promise<LoyaltySummaryDto> {
    // Validate amountAed is not 0
    if (adjustLoyaltyDto.amountAed === 0) {
      throw new BadRequestException('Amount cannot be 0');
    }

    // Validate customer exists
    const customer = await this.customersService.findOne(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Adjust loyalty using LoyaltyService
    const result = await this.loyaltyService.adjustLoyalty(
      customerId,
      adjustLoyaltyDto.amountAed,
      adjustLoyaltyDto.description,
    );

    return {
      balanceAed: Number(result.balanceAed),
      totalEarnedAed: Number(result.totalEarnedAed),
      totalRedeemedAed: Number(result.totalRedeemedAed),
    };
  }
}

@Controller('admin/customer-addresses')
export class CustomerAddressesController {
  constructor(private readonly customersService: CustomersService) {}

  @Patch(':addressId')
  async updateAddress(
    @Param('addressId') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.customersService.updateAddress(addressId, updateAddressDto);
  }

  @Delete(':addressId')
  async deleteAddress(
    @Param('addressId') addressId: string,
  ): Promise<{ success: boolean }> {
    return this.customersService.deleteAddress(addressId);
  }

  @Patch(':addressId/default')
  async setDefaultAddress(
    @Param('addressId') addressId: string,
  ): Promise<AddressResponseDto> {
    return this.customersService.setDefaultAddress(addressId);
  }
}
