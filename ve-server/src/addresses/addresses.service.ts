import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserAddresses(customerId: number) {
    const addresses = await this.prisma.address.findMany({
      where: { customer_id: customerId },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });

    return addresses;
  }

  async createAddress(customerId: number, createAddressDto: CreateAddressDto) {
    const { is_default, ...addressData } = createAddressDto;

    // If setting as default, unset all other default addresses
    if (is_default) {
      await this.prisma.address.updateMany({
        where: { customer_id: customerId, is_default: true },
        data: { is_default: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        customer_id: customerId,
        ...addressData,
        is_default: is_default || false,
      },
    });

    return address;
  }

  async updateAddress(
    customerId: number,
    addressId: number,
    updateAddressDto: UpdateAddressDto,
  ) {
    // Check if address exists and belongs to customer
    const existingAddress = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    if (existingAddress.customer_id !== customerId) {
      throw new ForbiddenException('You do not have permission to update this address');
    }

    const { is_default, ...addressData } = updateAddressDto;

    // If setting as default, unset all other default addresses
    if (is_default) {
      await this.prisma.address.updateMany({
        where: { customer_id: customerId, is_default: true },
        data: { is_default: false },
      });
    }

    const updatedAddress = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...addressData,
        ...(is_default !== undefined && { is_default }),
      },
    });

    return updatedAddress;
  }

  async deleteAddress(customerId: number, addressId: number) {
    // Check if address exists and belongs to customer
    const existingAddress = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    if (existingAddress.customer_id !== customerId) {
      throw new ForbiddenException('You do not have permission to delete this address');
    }

    // Check if address is being used in any order
    const orderCount = await this.prisma.order.count({
      where: { shipping_address_id: addressId },
    });

    if (orderCount > 0) {
      throw new ForbiddenException('Cannot delete address that is used in orders');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(customerId: number, addressId: number) {
    // Check if address exists and belongs to customer
    const existingAddress = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    if (existingAddress.customer_id !== customerId) {
      throw new ForbiddenException('You do not have permission to update this address');
    }

    // Unset all other default addresses
    await this.prisma.address.updateMany({
      where: { customer_id: customerId, is_default: true },
      data: { is_default: false },
    });

    // Set this address as default
    const updatedAddress = await this.prisma.address.update({
      where: { id: addressId },
      data: { is_default: true },
    });

    return updatedAddress;
  }
}
