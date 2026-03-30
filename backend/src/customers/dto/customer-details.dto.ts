export class CustomerAddressDto {
  id: string;
  label: string | null;
  city: string;
  addressLine1: string;
  addressLine2: string | null;
  phone: string | null;
  isDefault: boolean;
  createdAt: Date;
}

export class CustomerOrderDto {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: Date;
}

export class CustomerLoyaltyDto {
  balanceAed: number;
  totalEarnedAed: number;
  totalRedeemedAed: number;
}

export class CustomerDetailsDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  ordersCount: number;
  addressesCount: number;
  addresses: CustomerAddressDto[];
  orders: CustomerOrderDto[];
  loyalty: CustomerLoyaltyDto;
}
