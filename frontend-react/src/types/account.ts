// ============================================================================
// Account Types — profile, loyalty, payment methods
// Matches NestJS backend /account/*
// ============================================================================

export interface ProfileDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// -- Loyalty ------------------------------------------------------------------

export interface LoyaltyDto {
  balanceAed: number;
  totalEarnedAed: number;
  totalRedeemedAed: number;
  totalEarned?: number;
  totalRedeemed?: number;
  transactions: LoyaltyTransactionDto[];
}

export interface LoyaltyTransactionDto {
  id: string;
  type: 'EARNED' | 'REDEEMED' | 'ADJUSTMENT';
  amountAed: number;
  description?: string;
  orderId?: string;
  createdAt: string;
}

export interface LoyaltyPageConfig {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  spendAedThreshold: number;
  rewardAed: number;
  howItWorks: Array<{ icon: string; title: string; description: string }>;
  faqs: Array<{ question: string; answer: string }>;
}

// -- Payment methods ----------------------------------------------------------

export interface PaymentMethodDto {
  id: string;
  type: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}
