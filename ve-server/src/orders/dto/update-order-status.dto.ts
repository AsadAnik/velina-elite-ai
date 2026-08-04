import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({ 
    enum: ['pending', 'confirmed', 'preparing', 'shipping', 'shipped', 'delivered', 'ready_for_receive', 'completed', 'cancelled'],
    example: 'preparing' 
  })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;

  @ApiProperty({ example: 'Order is being prepared', required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
