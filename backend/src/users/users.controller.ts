import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { LoyaltyService } from './loyalty.service';
import { PaymentMethodsService, CreatePaymentMethodDto } from './payment-methods.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private loyaltyService: LoyaltyService,
    private paymentMethodsService: PaymentMethodsService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, updateUserDto);
  }

  // ============================================================================
  // ORDERS (fetched from user's orders)
  // ============================================================================

  @Get('orders')
  async getOrders(@CurrentUser('id') userId: string) {
    return this.usersService.getUserOrders(userId);
  }

  @Get('orders/:id')
  async getOrder(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ) {
    return this.usersService.getUserOrder(userId, orderId);
  }

  // ============================================================================
  // ADDRESSES
  // ============================================================================

  @Get('addresses')
  async getAddresses(@CurrentUser('id') userId: string) {
    return this.usersService.getAddresses(userId);
  }

  @Post('addresses')
  async createAddress(
    @CurrentUser('id') userId: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(userId, createAddressDto);
  }

  @Patch('addresses/:id')
  async updateAddress(
    @CurrentUser('id') userId: string,
    @Param('id') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(userId, addressId, updateAddressDto);
  }

  @Delete('addresses/:id')
  async deleteAddress(
    @CurrentUser('id') userId: string,
    @Param('id') addressId: string,
  ) {
    return this.usersService.deleteAddress(userId, addressId);
  }

  @Patch('addresses/:id/default')
  async setDefaultAddress(
    @CurrentUser('id') userId: string,
    @Param('id') addressId: string,
  ) {
    return this.usersService.setDefaultAddress(userId, addressId);
  }

  // ============================================================================
  // LOYALTY
  // ============================================================================

  @Get('loyalty')
  async getLoyalty(@CurrentUser('id') userId: string) {
    return this.loyaltyService.getLoyalty(userId);
  }

  // ============================================================================
  // PAYMENT METHODS
  // ============================================================================

  @Get('payment-methods')
  async getPaymentMethods(@CurrentUser('id') userId: string) {
    return this.paymentMethodsService.getPaymentMethods(userId);
  }

  @Post('payment-methods')
  async addPaymentMethod(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.addPaymentMethod(userId, dto);
  }

  @Patch('payment-methods/:id/default')
  async setDefaultPaymentMethod(
    @CurrentUser('id') userId: string,
    @Param('id') paymentMethodId: string,
  ) {
    return this.paymentMethodsService.setDefaultPaymentMethod(userId, paymentMethodId);
  }

  @Delete('payment-methods/:id')
  async deletePaymentMethod(
    @CurrentUser('id') userId: string,
    @Param('id') paymentMethodId: string,
  ) {
    return this.paymentMethodsService.deletePaymentMethod(userId, paymentMethodId);
  }
}
