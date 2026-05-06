import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CircuitBreakerService } from '../common/resilience/circuit-breaker.service';

export interface TabbyCheckoutSession {
  id: string;
  status: string;
  payment: {
    id: string;
    status: string;
  };
  configuration: {
    available_products: {
      installments: any[] | null;
    };
  };
}

export interface CreateTabbySessionDto {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  buyer: {
    name: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    city: string;
    address: string;
    zip?: string;
  };
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    category?: string;
  }>;
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
}

@Injectable()
export class TabbyService {
  private readonly logger = new Logger(TabbyService.name);
  private readonly baseUrl = 'https://api.tabby.ai/api/v2';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly breaker: CircuitBreakerService,
  ) {}

  private async getSecretKey(): Promise<string | null> {
    try {
      const setting = await this.prisma.siteSetting.findUnique({
        where: { key: 'tabby_secret_key' },
      });
      if (setting?.value) return setting.value;
    } catch (_e) { /* table might not exist */ }
    return this.configService.get<string>('TABBY_SECRET_KEY') || null;
  }

  private async getPublicKey(): Promise<string | null> {
    try {
      const setting = await this.prisma.siteSetting.findUnique({
        where: { key: 'tabby_public_key' },
      });
      if (setting?.value) return setting.value;
    } catch (_e) {}
    return this.configService.get<string>('TABBY_PUBLIC_KEY') || null;
  }

  async isEnabled(): Promise<boolean> {
    try {
      const setting = await this.prisma.siteSetting.findUnique({
        where: { key: 'tabby_enabled' },
      });
      if (setting?.value === 'true') {
        const key = await this.getSecretKey();
        return !!key;
      }
    } catch (_e) {}
    return false;
  }

  async getPublicConfig(): Promise<{ publicKey: string | null; isEnabled: boolean }> {
    const isEnabled = await this.isEnabled();
    const publicKey = isEnabled ? await this.getPublicKey() : null;
    return { publicKey, isEnabled };
  }

  async createCheckoutSession(dto: CreateTabbySessionDto): Promise<{ sessionId: string; paymentUrl: string }> {
    const secretKey = await this.getSecretKey();
    if (!secretKey) {
      throw new BadRequestException('Tabby is not configured');
    }

    const payload = {
      payment: {
        amount: dto.amount.toFixed(2),
        currency: dto.currency.toUpperCase(),
        description: `Order ${dto.orderNumber}`,
        buyer: {
          name: dto.buyer.name,
          email: dto.buyer.email,
          phone: dto.buyer.phone || '',
        },
        shipping_address: {
          city: dto.shippingAddress.city,
          address: dto.shippingAddress.address,
          zip: dto.shippingAddress.zip || '',
        },
        order: {
          reference_id: dto.orderId,
          items: dto.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unitPrice.toFixed(2),
            category: item.category || 'general',
          })),
        },
      },
      lang: 'en',
      merchant_code: 'default',
      merchant_urls: {
        success: dto.successUrl,
        cancel: dto.cancelUrl,
        failure: dto.failureUrl,
      },
    };

    const response = await this.breaker.execute('tabby', () =>
      fetch(`${this.baseUrl}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }),
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Tabby session creation failed: ${response.status} ${errorBody}`);
      throw new BadRequestException('Failed to create Tabby checkout session. This order may not be eligible for installments.');
    }

    const session = await response.json() as TabbyCheckoutSession;

    if (!session.configuration?.available_products?.installments?.length) {
      throw new BadRequestException('Tabby installments are not available for this order.');
    }

    const paymentUrl = (session as any).configuration.available_products.installments[0]?.web_url;
    if (!paymentUrl) {
      throw new BadRequestException('Tabby payment URL not available.');
    }

    this.logger.log(`Tabby session created: ${session.id} for order ${dto.orderNumber}`);
    return { sessionId: session.id, paymentUrl };
  }

  async getPayment(paymentId: string): Promise<any> {
    const secretKey = await this.getSecretKey();
    if (!secretKey) throw new BadRequestException('Tabby is not configured');

    const response = await this.breaker.execute('tabby', () =>
      fetch(`${this.baseUrl}/payments/${encodeURIComponent(paymentId)}`, {
        headers: { 'Authorization': `Bearer ${secretKey}` },
      }),
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to retrieve Tabby payment');
    }

    return response.json();
  }

  async capturePayment(paymentId: string, amount: number): Promise<any> {
    const secretKey = await this.getSecretKey();
    if (!secretKey) throw new BadRequestException('Tabby is not configured');

    const response = await this.breaker.execute('tabby', () =>
      fetch(`${this.baseUrl}/payments/${encodeURIComponent(paymentId)}/captures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: amount.toFixed(2) }),
      }),
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Tabby capture failed: ${errorBody}`);
      throw new BadRequestException('Failed to capture Tabby payment');
    }

    return response.json();
  }

  async saveConfiguration(secretKey: string, publicKey: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const [key, value, label] of [
        ['tabby_secret_key', secretKey, 'Secret Key'],
        ['tabby_public_key', publicKey, 'Public Key'],
        ['tabby_enabled', 'true', 'Enabled'],
      ] as const) {
        await tx.siteSetting.upsert({
          where: { key },
          update: { value, updatedAt: new Date() },
          create: { key, value, type: 'string', group: 'tabby', label },
        });
      }
    });
    this.logger.log('Tabby configuration saved');
  }

  async getAdminConfig(): Promise<{ secretKey: string; publicKey: string; isEnabled: boolean }> {
    const settings = await this.prisma.siteSetting.findMany({ where: { group: 'tabby' } });
    const getValue = (key: string) => settings.find((s) => s.key === key)?.value || '';
    const secretKey = getValue('tabby_secret_key');

    return {
      secretKey: secretKey ? (secretKey.substring(0, 8) + '****' + secretKey.substring(secretKey.length - 4)) : '',
      publicKey: getValue('tabby_public_key'),
      isEnabled: getValue('tabby_enabled') === 'true',
    };
  }
}
