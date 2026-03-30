import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { PackagesModule } from './packages/packages.module';
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

    // Core modules
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    PackagesModule,
    CartModule,
    OrdersModule,
    PromosModule,
    StripeModule,
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
    
    // Debug module (dev only)
    DebugModule,
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
