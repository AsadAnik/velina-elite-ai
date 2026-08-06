import { Module } from '@nestjs/common';
import { ShippingCostsService } from './shipping-costs.service';
import { ShippingCostsController } from './shipping-costs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ShippingCostsController],
  providers: [ShippingCostsService],
  exports: [ShippingCostsService],
})
export class ShippingCostsModule {}
