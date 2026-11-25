import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Summary: Retrieves all addresses for a specific customer.
   * @param customerId - The ID of the customer whose addresses are to be retrieved.
   * @returns An array of addresses belonging to the specified customer.
   */
  // region GET ADDRESS
  async getUserAddresses(customerId: number) {
    if (!customerId) return [];
    const addresses = await this.prisma.address.findMany({
      where: { customer_id: customerId },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });

    return addresses;
  }

  /**
   * Summary: Creates a new address for a specific customer.
   * @param customerId - The ID of the customer to create the address for.
   * @param createAddressDto - The data for the new address.
   * @returns The created address.
   */
  // region CREATE ADDRESS
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

  /**
   * Summary: Updates an existing address for a specific customer.
   * @param customerId - The ID of the customer who owns the address.
   * @param addressId - The ID of the address to update.
   * @param updateAddressDto - The data for updating the address.
   * @returns The updated address.
   */
  // region UPDATE ADDRESS
  async updateAddress(customerId: number, addressId: number, updateAddressDto: UpdateAddressDto) {
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

  /**
   * Summary: Deletes an existing address for a specific customer.
   * @param customerId - The ID of the customer who owns the address.
   * @param addressId - The ID of the address to delete.
   * @returns A success message if the address was deleted successfully.
   */
  // region DELETE ADDRESS
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

  /**
   * Summary: Sets a specific address as the default address for a customer.
   * @param customerId - The ID of the customer who owns the address.
   * @param addressId - The ID of the address to set as default.
   * @returns The updated address.
   */
  // region SET DEFAULT ADDRESS
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
