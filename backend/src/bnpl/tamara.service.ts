import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CircuitBreakerService } from '../common/resilience/circuit-breaker.service';

export interface CreateTamaraSessionDto {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    firstName: string;
    lastName: string;
    city: string;
    addressLine1: string;
    countryCode: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    sku?: string;
  }>;
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
}

@Injectable()
export class TamaraService {
  private readonly logger = new Logger(TamaraService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly breaker: CircuitBreakerService,
  ) {}

  private async ensureBaseUrl(): Promise<string> {
    let useSandbox = false;
    try {
      const setting = await this.prisma.siteSetting.findUnique({
        where: { key: 'tamara_sandbox' },
      });
      if (setting?.value === 'true') useSandbox = true;
    } catch (_e) {}
    if (!useSandbox) {
      const envSandbox = this.configService.get<string>('TAMARA_SANDBOX');
      if (envSandbox === 'true') useSandbox = true;
    }
    return useSandbox ? 'https://api-sandbox.tamara.co' : 'https://api.tamara.co';
  }

  private async getApiToken(): Promise<string | null> {
    try {
      const setting = await this.prisma.siteSetting.findUnique({
        where: { key: 'tamara_api_token' },
      });
      if (setting?.value) return setting.value;
    } catch (_e) {}
    return this.configService.get<string>('TAMARA_API_TOKEN') || null;
  }

  async isEnabled(): Promise<boolean> {
    try {
      const setting = await this.prisma.siteSetting.findUnique({
        where: { key: 'tamara_enabled' },
      });
      if (setting?.value === 'true') {
        const token = await this.getApiToken();
        return !!token;
      }
    } catch (_e) {}
    return false;
  }

  async getPublicConfig(): Promise<{ isEnabled: boolean }> {
    const isEnabled = await this.isEnabled();
    return { isEnabled };
  }

  async createCheckoutSession(dto: CreateTamaraSessionDto): Promise<{ orderId: string; checkoutUrl: string }> {
    const apiToken = await this.getApiToken();
    if (!apiToken) {
      throw new BadRequestException('Tamara is not configured');
    }

    const payload = {
      order_reference_id: dto.orderId,
      order_number: dto.orderNumber,
      total_amount: {
        amount: dto.amount.toFixed(2),
        currency: dto.currency.toUpperCase(),
      },
      description: `Order ${dto.orderNumber}`,
      country_code: 'AE',
      payment_type: 'PAY_BY_INSTALMENTS',
      instalments: 3,
      locale: 'en_US',
      items: dto.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: {
          amount: item.unitPrice.toFixed(2),
          currency: dto.currency.toUpperCase(),
        },
        total_amount: {
          amount: (item.unitPrice * item.quantity).toFixed(2),
          currency: dto.currency.toUpperCase(),
        },
        reference_id: item.sku || '',
        sku: item.sku || '',
      })),
      consumer: {
        first_name: dto.buyer.firstName,
        last_name: dto.buyer.lastName,
        email: dto.buyer.email,
        phone_number: dto.buyer.phone || '',
      },
      shipping_address: {
        first_name: dto.shippingAddress.firstName,
        last_name: dto.shippingAddress.lastName,
        city: dto.shippingAddress.city,
        line1: dto.shippingAddress.addressLine1,
        country_code: dto.shippingAddress.countryCode || 'AE',
      },
      tax_amount: { amount: '0.00', currency: dto.currency.toUpperCase() },
      shipping_amount: { amount: '0.00', currency: dto.currency.toUpperCase() },
      merchant_url: {
        success: dto.successUrl,
        failure: dto.failureUrl,
        cancel: dto.cancelUrl,
        notification: dto.successUrl.replace('/payment-callback', '/api/tamara/webhook'),
      },
    };

    const baseUrl = await this.ensureBaseUrl();
    const response = await this.breaker.execute('tamara', () =>
      fetch(`${baseUrl}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }),
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Tamara session creation failed: ${response.status} ${errorBody}`);
      throw new BadRequestException('Failed to create Tamara checkout session. This order may not be eligible for installments.');
    }

    const result = await response.json();
    const checkoutUrl = result.checkout_url;
    const tamaraOrderId = result.order_id;

    if (!checkoutUrl) {
      throw new BadRequestException('Tamara checkout URL not available');
    }

    this.logger.log(`Tamara session created: ${tamaraOrderId} for order ${dto.orderNumber}`);
    return { orderId: tamaraOrderId, checkoutUrl };
  }

  async authoriseOrder(tamaraOrderId: string): Promise<any> {
    const apiToken = await this.getApiToken();
    if (!apiToken) throw new BadRequestException('Tamara is not configured');

    const baseUrl = await this.ensureBaseUrl();
    const response = await this.breaker.execute('tamara', () =>
      fetch(`${baseUrl}/orders/${encodeURIComponent(tamaraOrderId)}/authorise`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }),
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Tamara authorise failed: ${errorBody}`);
      throw new BadRequestException('Failed to authorise Tamara order');
    }

    return response.json();
  }

  async capturePayment(tamaraOrderId: string, amount: number, currency: string): Promise<any> {
    const apiToken = await this.getApiToken();
    if (!apiToken) throw new BadRequestException('Tamara is not configured');

    const baseUrl = await this.ensureBaseUrl();
    const response = await this.breaker.execute('tamara', () =>
      fetch(`${baseUrl}/payments/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: tamaraOrderId,
          total_amount: {
            amount: amount.toFixed(2),
            currency: currency.toUpperCase(),
          },
        }),
      }),
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Tamara capture failed: ${errorBody}`);
      throw new BadRequestException('Failed to capture Tamara payment');
    }

    return response.json();
  }

  async getOrder(tamaraOrderId: string): Promise<any> {
    const apiToken = await this.getApiToken();
    if (!apiToken) throw new BadRequestException('Tamara is not configured');

    const baseUrl = await this.ensureBaseUrl();
    const response = await this.breaker.execute('tamara', () =>
      fetch(`${baseUrl}/orders/${encodeURIComponent(tamaraOrderId)}`, {
        headers: { 'Authorization': `Bearer ${apiToken}` },
      }),
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to retrieve Tamara order');
    }

    return response.json();
  }

  async saveConfiguration(apiToken: string, sandbox: boolean): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const [key, value, label] of [
        ['tamara_api_token', apiToken, 'API Token'],
        ['tamara_enabled', 'true', 'Enabled'],
        ['tamara_sandbox', sandbox ? 'true' : 'false', 'Sandbox Mode'],
      ] as const) {
        await tx.siteSetting.upsert({
          where: { key },
          update: { value, updatedAt: new Date() },
          create: { key, value, type: 'string', group: 'tamara', label },
        });
      }
    });
    this.logger.log(`Tamara configuration saved (sandbox: ${sandbox})`);
  }

  async getAdminConfig(): Promise<{ apiToken: string; isEnabled: boolean; sandbox: boolean }> {
    const settings = await this.prisma.siteSetting.findMany({ where: { group: 'tamara' } });
    const getValue = (key: string) => settings.find((s) => s.key === key)?.value || '';
    const token = getValue('tamara_api_token');

    return {
      apiToken: token ? (token.substring(0, 8) + '****' + token.substring(token.length - 4)) : '',
      isEnabled: getValue('tamara_enabled') === 'true',
      sandbox: getValue('tamara_sandbox') === 'true',
    };
  }
}
