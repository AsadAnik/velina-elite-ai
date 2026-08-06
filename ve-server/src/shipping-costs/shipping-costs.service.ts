import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShippingCostDto } from './dto/create-shipping-cost.dto';
import { UpdateShippingCostDto } from './dto/update-shipping-cost.dto';

@Injectable()
export class ShippingCostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CREATE OR UPDATE SHIPPING COST SERVICE
   * Since there should be only one shipping cost configuration, this will create if none exists or update if exists
   * @param dto createShippingCostDto
   * @returns Object
   */
  async createShippingCost(dto: CreateShippingCostDto) {
    const existingConfig = await (this.prisma as any).shippingCost.findFirst();
    
    if (existingConfig) {
      throw new BadRequestException('Shipping cost configuration already exists. Use update instead.');
    }

    return (this.prisma as any).shippingCost.create({
      data: {
        inside_dhaka_cost: dto.inside_dhaka_cost,
        outside_dhaka_cost: dto.outside_dhaka_cost,
        currency_symbol: dto.currency_symbol || '৳',
      },
    });
  }

  /**
   * GET SHIPPING COST CONFIGURATION
   * @returns Object
   */
  async getShippingCost() {
    const config = await (this.prisma as any).shippingCost.findFirst();
    
    if (!config) {
      // Return default values if no configuration exists
      return {
        id: null,
        inside_dhaka_cost: 70,
        outside_dhaka_cost: 120,
        currency_symbol: '৳',
        created_at: null,
        updated_at: null,
      };
    }
    
    return config;
  }

  /**
   * UPDATE SHIPPING COST SERVICE
   * @param id shipping_cost_id
   * @param dto updateShippingCostDto
   * @returns Object
   */
  async updateShippingCost(id: number, dto: UpdateShippingCostDto) {
    const existingConfig = await (this.prisma as any).shippingCost.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new BadRequestException('Shipping cost configuration not found');
    }

    return (this.prisma as any).shippingCost.update({
      where: { id },
      data: {
        ...(dto.inside_dhaka_cost !== undefined && { inside_dhaka_cost: dto.inside_dhaka_cost }),
        ...(dto.outside_dhaka_cost !== undefined && { outside_dhaka_cost: dto.outside_dhaka_cost }),
        ...(dto.currency_symbol !== undefined && { currency_symbol: dto.currency_symbol }),
      },
    });
  }

  /**
   * DELETE SHIPPING COST SERVICE
   * @param id shipping_cost_id
   * @returns Object
   */
  async deleteShippingCost(id: number) {
    const existingConfig = await (this.prisma as any).shippingCost.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new BadRequestException('Shipping cost configuration not found');
    }

    return (this.prisma as any).shippingCost.delete({
      where: { id },
    });
  }
}
