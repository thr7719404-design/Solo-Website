import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethodDto {
  CREDIT_CARD = 'CREDIT_CARD',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export enum ShippingMethodDto {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  PICKUP = 'PICKUP',
}

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsOptional()
  @IsString()
  apartment?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class OrderItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  // Option 1: Use an existing saved address by ID
  @IsOptional()
  @IsUUID()
  shippingAddressId?: string;

  // Option 2: Provide full address object (required if shippingAddressId not provided)
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress?: AddressDto;

  // Billing address - Option 1: Use existing saved address by ID
  @IsOptional()
  @IsUUID()
  billingAddressId?: string;

  // Billing address - Option 2: Provide full address object
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @IsEnum(ShippingMethodDto)
  shippingMethod: ShippingMethodDto;

  @IsEnum(PaymentMethodDto)
  paymentMethod: PaymentMethodDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  billingInvoiceCompany?: string;

  @IsOptional()
  @IsString()
  billingInvoiceVatNumber?: string;

  // For credit card payments
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  // Loyalty cash redemption (AED amount)
  @IsOptional()
  @IsNumber()
  loyaltyRedeemAed?: number;
}
