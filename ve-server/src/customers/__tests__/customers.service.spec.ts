import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomersService } from '../customers.service';

const txMock = {
  order: { findMany: jest.fn(), deleteMany: jest.fn() },
  orderHistory: { deleteMany: jest.fn() },
  orderItem: { deleteMany: jest.fn() },
  rating: { deleteMany: jest.fn() },
  cart: { deleteMany: jest.fn() },
  wishlist: { deleteMany: jest.fn() },
  address: { deleteMany: jest.fn() },
  customer: { delete: jest.fn() },
  user: { delete: jest.fn() },
};

const prismaMock = {
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(async (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock)),
};

describe('CustomersService (unit)', () => {
  let service: CustomersService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- getCustomers ----------
  describe('getCustomers', () => {
    it('returns paginated customers with default role=customer and computed totalSpent', async () => {
      const now = new Date();
      prismaMock.user.count.mockResolvedValueOnce(1);
      prismaMock.user.findMany.mockResolvedValueOnce([
        {
          id: 1,
          username: 'alice',
          email: 'alice@example.com',
          role: Role.customer,
          created_at: now,
          updated_at: now,
          customer: {
            id: 10,
            fname: 'Alice',
            lname: 'Smith',
            phone: '+8801700000000',
            gender: 'female',
            addresses: [],
            orders: [{ total_amount: '1500' }, { total_amount: '500' }],
            _count: { orders: 2, ratings: 1, wishlists: 3 },
          },
        },
      ]);

      const result = await service.getCustomers({});

      expect(prismaMock.user.count).toHaveBeenCalledWith({
        where: { role: Role.customer },
      });
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(result.items[0]).toMatchObject({
        id: 1,
        fullName: 'Alice Smith',
        customer: {
          id: 10,
          ordersCount: 2,
          ratingsCount: 1,
          wishlistsCount: 3,
          totalSpent: 2000,
        },
      });
    });

    it('applies search filter, role=all, and clamps limit to 100', async () => {
      prismaMock.user.count.mockResolvedValueOnce(0);
      prismaMock.user.findMany.mockResolvedValueOnce([]);

      await service.getCustomers({
        page: 2,
        limit: 500,
        search: '  bob  ',
        role: 'all',
      });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.any(Array),
          },
          skip: 100,
          take: 100,
        }),
      );
    });
  });

  // ---------- getCustomerById ----------
  describe('getCustomerById', () => {
    it('throws NotFoundException when customer does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.getCustomerById(999)).rejects.toThrow(NotFoundException);
    });

    it('returns full customer details with totalSpent', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 5,
        username: 'bob',
        email: 'bob@example.com',
        role: Role.customer,
        created_at: new Date(),
        updated_at: new Date(),
        customer: {
          id: 50,
          fname: 'Bob',
          lname: 'Builder',
          orders: [{ total_amount: 1200 }, { total_amount: 300 }],
          addresses: [],
          ratings: [],
          wishlists: [],
        },
      });

      const result = await service.getCustomerById(5);

      expect(result).toMatchObject({
        id: 5,
        fullName: 'Bob Builder',
        totalSpent: 1500,
      });
    });
  });

  // ---------- updateCustomer ----------
  describe('updateCustomer', () => {
    it('throws NotFoundException when user is missing', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateCustomer(999, { fname: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when new email is already taken', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({
          id: 1,
          email: 'old@example.com',
          username: 'user1',
          customer: null,
        })
        .mockResolvedValueOnce({ id: 2, email: 'taken@example.com' });

      await expect(
        service.updateCustomer(1, { email: 'taken@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when new username is already taken', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({
          id: 1,
          email: 'old@example.com',
          username: 'user1',
          customer: null,
        })
        .mockResolvedValueOnce({ id: 2, username: 'takenuser' });

      await expect(
        service.updateCustomer(1, { username: 'takenuser' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates user and existing customer profile', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'user1@example.com',
        username: 'user1',
        customer: { id: 10 },
      });
      prismaMock.user.update.mockResolvedValueOnce({
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        role: Role.customer,
        created_at: new Date(),
        updated_at: new Date(),
        customer: {
          id: 10,
          fname: 'Updated',
          lname: 'Name',
          addresses: [],
        },
      });

      const result = await service.updateCustomer(1, {
        fname: '  Updated ',
        lname: ' Name ',
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: {
            customer: {
              update: { fname: 'Updated', lname: 'Name' },
            },
          },
        }),
      );
      expect(result.fullName).toBe('Updated Name');
    });

    it('creates customer profile if user had none and fname/lname provided', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 2,
        email: 'bare@example.com',
        username: 'bareuser',
        customer: null,
      });
      prismaMock.user.update.mockResolvedValueOnce({
        id: 2,
        username: 'bareuser',
        email: 'bare@example.com',
        role: Role.customer,
        created_at: new Date(),
        updated_at: new Date(),
        customer: { id: 20, fname: 'First', lname: 'Last', addresses: [] },
      });

      await service.updateCustomer(2, { fname: 'First', lname: 'Last' });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            customer: {
              create: {
                fname: 'First',
                lname: 'Last',
                phone: null,
                gender: 'other',
              },
            },
          },
        }),
      );
    });
  });

  // ---------- deleteCustomer ----------
  describe('deleteCustomer', () => {
    it('throws BadRequestException on self-delete', async () => {
      await expect(service.deleteCustomer(5, 5)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteCustomer(99, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when deleting the last remaining owner', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 2,
        role: Role.owner,
        customer: null,
      });
      prismaMock.user.count.mockResolvedValueOnce(1);

      await expect(service.deleteCustomer(2, 1)).rejects.toThrow(BadRequestException);
    });

    it('deletes orders, child records, customer, and user in a transaction', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 8,
        username: 'cust8',
        email: 'cust8@example.com',
        role: Role.customer,
        customer: { id: 80 },
      });
      txMock.order.findMany.mockResolvedValueOnce([{ id: 101 }, { id: 102 }]);

      const result = await service.deleteCustomer(8, 1);

      expect(txMock.orderHistory.deleteMany).toHaveBeenCalledWith({
        where: { order_id: { in: [101, 102] } },
      });
      expect(txMock.orderItem.deleteMany).toHaveBeenCalledWith({
        where: { order_id: { in: [101, 102] } },
      });
      expect(txMock.order.deleteMany).toHaveBeenCalledWith({
        where: { customer_id: 80 },
      });
      expect(txMock.rating.deleteMany).toHaveBeenCalledWith({ where: { customer_id: 80 } });
      expect(txMock.cart.deleteMany).toHaveBeenCalledWith({ where: { customer_id: 80 } });
      expect(txMock.wishlist.deleteMany).toHaveBeenCalledWith({ where: { customer_id: 80 } });
      expect(txMock.address.deleteMany).toHaveBeenCalledWith({ where: { customer_id: 80 } });
      expect(txMock.customer.delete).toHaveBeenCalledWith({ where: { id: 80 } });
      expect(txMock.user.delete).toHaveBeenCalledWith({ where: { id: 8 } });
      expect(result.message).toContain('cust8');
    });
  });
});
