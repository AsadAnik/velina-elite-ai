import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { AuthModule } from './auth/auth.module';
import { WishlistsModule } from './wishlists/wishlists.module';
import { CartsModule } from './carts/carts.module';
import { AddressesModule } from './addresses/addresses.module';
import { OrdersModule } from './orders/orders.module';
import { ShippingCostsModule } from './shipping-costs/shipping-costs.module';
import { RatingsModule } from './ratings/ratings.module';
import { HomeSectionsModule } from './home-sections/home-sections.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { CustomersModule } from './customers/customers.module';
import { RedisModule } from './redis/redis.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ProductsModule,
    CategoriesModule,
    SubCategoriesModule,
    AuthModule,
    WishlistsModule,
    CartsModule,
    AddressesModule,
    OrdersModule,
    ShippingCostsModule,
    RatingsModule,
    HomeSectionsModule,
    SiteSettingsModule,
    AdminUsersModule,
    CustomersModule,
    DashboardModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
