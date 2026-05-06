import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PromosModule } from './promos/promos.module';
import { StripeModule } from './stripe/stripe.module';
import { StripeWebhookModule } from './stripe/stripe-webhook.module';
import { ContentModule } from './content/content.module';
import { AdminModule } from './admin/admin.module';
import { MediaModule } from './media/media.module';
import { CatalogModule } from './catalog/catalog.module';
import { PrismaModule } from './prisma/prisma.module';
import { NavigationModule } from './navigation/navigation.module';
import { CollectionsModule } from './collections/collections.module';
import { DebugModule } from './debug/debug.module';
import { CmsModule } from './cms/cms.module';
import { CustomersModule } from './customers/customers.module';
import { FavoritesModule } from './favorites/favorites.module';
import { SettingsModule } from './settings/settings.module';
import { StockModule } from './stock/stock.module';
import { ReturnsModule } from './returns/returns.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { BulkOrdersModule } from './bulk-orders/bulk-orders.module';
import { BnplModule } from './bnpl/bnpl.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { ResilienceModule } from './common/resilience/resilience.module';
import { envValidationSchema } from './common/config/env.validation';

@Module({
  imports: [
    // Configuration with Joi validation (fail-fast on bad/missing env vars)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false, allowUnknown: true },
    }),

    // Structured JSON logging via pino. In production, emits one JSON line per
    // request with a generated request id (x-request-id) so log aggregators can
    // correlate. In dev, pretty-prints to the console.
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<string>('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: config.get<string>('LOG_LEVEL') || (isProd ? 'info' : 'debug'),
            // Reuse incoming x-request-id if the upstream proxy set one, else generate.
            genReqId: (req, res) => {
              const existing = (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string);
              const id = existing || randomUUID();
              res.setHeader('x-request-id', id);
              return id;
            },
            // Redact common credential fields so they never reach logs.
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["stripe-signature"]',
                'req.body.password',
                'req.body.currentPassword',
                'req.body.newPassword',
                'req.body.token',
                'res.headers["set-cookie"]',
              ],
              censor: '[REDACTED]',
            },
            customLogLevel: (_req, res, err) => {
              if (err || res.statusCode >= 500) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
            // Skip noisy health-probe logs.
            autoLogging: {
              ignore: (req) => {
                const url = (req as any).url as string | undefined;
                return !!url && (url.startsWith('/api/health') || url === '/api/health');
              },
            },
            transport: isProd
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true, translateTime: 'SYS:standard' },
                },
          },
        };
      },
    }),

    // In-memory cache (used by hot read endpoints via @UseInterceptors(CacheInterceptor))
    CacheModule.register({
      isGlobal: true,
      ttl: 60_000, // default 60s; individual routes can override via @CacheTTL
      max: 500,
    }),

    // Rate Limiting — single global throttler. Stricter limits on sensitive
    // routes (e.g. /auth login) are applied with @Throttle({ default: ... })
    // which OVERRIDES the default for that route only.
    //
    // NOTE: Do NOT register additional named throttlers here. nestjs-throttler
    // applies every named throttler to every request, so adding a second
    // "strict" entry would silently rate-limit ALL endpoints (including the
    // public homepage / catalog), even though @Throttle is only on /auth.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: (config.get<number>('THROTTLE_TTL') || 60) * 1000,
            limit: config.get<number>('THROTTLE_LIMIT') || 1000,
          },
        ],
      }),
    }),

    // Core modules
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    CartModule,
    OrdersModule,
    PromosModule,
    StripeModule,
    StripeWebhookModule,
    ContentModule,
    MediaModule,
    CatalogModule,
    AdminModule,
    
    // Porto Theme CMS modules
    NavigationModule,
    CollectionsModule,
    CmsModule,
    CustomersModule,
    FavoritesModule,
    SettingsModule,
    StockModule,
    ReturnsModule,
    AnnouncementsModule,
    BulkOrdersModule,
    BnplModule,
    EmailModule,
    HealthModule,
    ResilienceModule,
    
    // Debug module (dev only — conditionally loaded)
    ...(process.env.NODE_ENV !== 'production' ? [DebugModule] : []),
  ],
  controllers: [AppController],
  providers: [
    // In-memory throttler storage (no Redis needed for test/staging)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
