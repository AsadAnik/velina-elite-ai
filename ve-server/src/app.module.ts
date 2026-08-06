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

@Module({
  imports: [
    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
