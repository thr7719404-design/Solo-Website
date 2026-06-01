import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
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
import { ContentModule } from './content/content.module';
import { AdminModule } from './admin/admin.module';
import { MediaModule } from './media/media.module';
import { CatalogModule } from './catalog/catalog.module';
import { PrismaModule } from './prisma/prisma.module';
import { BlogModule } from './blog/blog.module';
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
import { AuditModule } from './audit/audit.module';
import { EmailModule } from './email/email.module';
import { BnplModule } from './bnpl/bnpl.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting — default profile for general API protection.
    // The "strict" profile (5 req/15min) is applied per-route via @Throttle() on auth endpoints.
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

    // Cache (in-memory, global) — required by CacheInterceptor usages in
    // ProductsController, CategoriesController, SeedImagesController.
    CacheModule.register({ isGlobal: true, ttl: 60 }),

    // Pino structured logger — main.ts calls app.useLogger(app.get(Logger))
    // from 'nestjs-pino', so LoggerModule must be registered.
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        ...(process.env.NODE_ENV !== 'production'
          ? { transport: { target: 'pino-pretty', options: { singleLine: true } } }
          : {}),
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password', 'req.body.token'],
          remove: true,
        },
        autoLogging: {
          ignore: (req: any) => req.url === '/api/health' || req.url === '/api/healthz',
        },
      },
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
    BnplModule,
    ContentModule,
    MediaModule,
    CatalogModule,
    AdminModule,
    
    // Porto Theme CMS modules
    BlogModule,
    NavigationModule,
    CollectionsModule,
    CmsModule,
    CustomersModule,
    FavoritesModule,
    SettingsModule,
    StockModule,
    ReturnsModule,
    AnnouncementsModule,
    AuditModule,
    EmailModule,
    
    // Debug module (dev only — conditionally loaded)
    ...(process.env.NODE_ENV !== 'production' ? [DebugModule] : []),
  ],
  controllers: [AppController],
  providers: [
    // Logger as a provider — required by OpenTelemetry / Azure Monitor
    // nestjs-core instrumentation, which resolves it via app.get(Logger).
    Logger,
    // In-memory throttler storage (no Redis needed for test/staging)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
