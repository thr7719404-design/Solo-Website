// ============================================================================
// Stripe Types — matches NestJS backend /stripe/*
// ============================================================================

export interface StripeConfig {
  publishableKey: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface VerifyPaymentRequest {
  paymentIntentId: string;
}

// -- Promo codes --------------------------------------------------------------

export interface ValidatePromoRequest {
  code: string;
  orderAmount: number;
}

export interface PromoValidationResult {
  valid: boolean;
  discount: number;
  discountType: 'percentage' | 'fixed';
  message?: string;
}
