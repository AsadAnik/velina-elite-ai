import { Test, TestingModule } from '@nestjs/testing';
import { AddressesService } from '../addresses.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

// Mock Prisma client for the address model and order count
const prismaMock = {
  address: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  order: {
    count: jest.fn(),
  },
};

describe('AddressesService (unit)', () => {
  let service: AddressesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<AddressesService>(AddressesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createAddress ----------
  it('createAddress creates an address', async () => {
    const customerId = 42;
    const dto = { street: '123 Main St', city: 'Metropolis' } as any;
    prismaMock.address.create.mockResolvedValue({ id: 1, ...dto });

    const result = await service.createAddress(customerId, dto);

    expect(prismaMock.address.create).toHaveBeenCalledWith({
      data: { customer_id: customerId, ...dto, is_default: false },
    });
    expect(result).toMatchObject({ id: 1, street: '123 Main St', city: 'Metropolis' });
  });

  // ---------- getUserAddresses ----------
  it('getUserAddresses returns empty when no customerId', async () => {
    const result = await service.getUserAddresses(undefined as any);
    expect(result).toEqual([]);
    expect(prismaMock.address.findMany).not.toHaveBeenCalled();
  });

  it('getUserAddresses returns addresses for a customer', async () => {
    const mockAddresses = [{ id: 10, street: 'A', city: 'B' }];
    prismaMock.address.findMany.mockResolvedValueOnce(mockAddresses);

    const result = await service.getUserAddresses(5);

    expect(prismaMock.address.findMany).toHaveBeenCalledWith({
      where: { customer_id: 5 },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
    expect(result).toBe(mockAddresses);
  });

  // ---------- updateAddress ----------
  it('updateAddress updates correctly when owned and sets default', async () => {
    const existing = { id: 20, customer_id: 7, is_default: false } as any;
    prismaMock.address.findUnique.mockResolvedValueOnce(existing);
    prismaMock.address.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.address.update.mockResolvedValueOnce({ ...existing, street: 'New St', is_default: true });

    const dto = { street: 'New St', is_default: true } as any;
    const result = await service.updateAddress(7, 20, dto);

    expect(prismaMock.address.updateMany).toHaveBeenCalledWith({
      where: { customer_id: 7, is_default: true },
      data: { is_default: false },
    });
    expect(prismaMock.address.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: { street: 'New St', is_default: true },
    });
    expect(result).toMatchObject({ street: 'New St', is_default: true });
  });

  it('updateAddress throws NotFoundException if address does not exist', async () => {
    prismaMock.address.findUnique.mockResolvedValueOnce(null);
    await expect(service.updateAddress(1, 999, {} as any)).rejects.toThrow(NotFoundException);
  });

  it('updateAddress throws ForbiddenException if address belongs to another customer', async () => {
    const existing = { id: 30, customer_id: 9 } as any;
    prismaMock.address.findUnique.mockResolvedValueOnce(existing);
    await expect(service.updateAddress(1, 30, {} as any)).rejects.toThrow(ForbiddenException);
  });

  // ---------- deleteAddress ----------
  it('deleteAddress deletes when address owned and not used in orders', async () => {
    const existing = { id: 30, customer_id: 9 } as any;
    prismaMock.address.findUnique.mockResolvedValueOnce(existing);
    prismaMock.order.count.mockResolvedValueOnce(0);
    prismaMock.address.delete.mockResolvedValueOnce({});

    const result = await service.deleteAddress(9, 30);
    expect(prismaMock.address.delete).toHaveBeenCalledWith({ where: { id: 30 } });
    expect(result).toMatchObject({ message: 'Address deleted successfully' });
  });

  it('deleteAddress throws ForbiddenException if address is used in orders', async () => {
    const existing = { id: 31, customer_id: 9 } as any;
    prismaMock.address.findUnique.mockResolvedValueOnce(existing);
    prismaMock.order.count.mockResolvedValueOnce(2);
    await expect(service.deleteAddress(9, 31)).rejects.toThrow(ForbiddenException);
  });

  // ---------- setDefaultAddress ----------
  it('setDefaultAddress switches defaults correctly', async () => {
    const existing = { id: 40, customer_id: 11 } as any;
    prismaMock.address.findUnique.mockResolvedValueOnce(existing);
    prismaMock.address.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.address.update.mockResolvedValueOnce({ ...existing, is_default: true });

    const result = await service.setDefaultAddress(11, 40);
    expect(prismaMock.address.updateMany).toHaveBeenCalledWith({
      where: { customer_id: 11, is_default: true },
      data: { is_default: false },
    });
    expect(prismaMock.address.update).toHaveBeenCalledWith({
      where: { id: 40 },
      data: { is_default: true },
    });
    expect(result).toMatchObject({ is_default: true });
  });
});
