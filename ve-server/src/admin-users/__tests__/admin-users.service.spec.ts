import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUsersService } from '../admin-users.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

const prismaMock = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  cart: { deleteMany: jest.fn() },
  wishlist: { deleteMany: jest.fn() },
  address: { deleteMany: jest.fn() },
  rating: { deleteMany: jest.fn() },
  customer: { delete: jest.fn() },
  $transaction: jest.fn(),
};

describe('AdminUsersService (unit)', () => {
  let service: AdminUsersService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- getAdminUsers ----------
  describe('getAdminUsers', () => {
    it('returns formatted admin and owner users with fullName fallback', async () => {
      const now = new Date();
      prismaMock.user.findMany.mockResolvedValueOnce([
        {
          id: 1,
          username: 'owner-1',
          email: 'owner@velina.com',
          role: Role.owner,
          created_at: now,
          updated_at: now,
          customer: {
            id: 10,
            fname: 'Jane',
            lname: 'Doe',
            phone: '+8801700000000',
            gender: 'female',
          },
        },
        {
          id: 2,
          username: 'admin-bare',
          email: 'admin@velina.com',
          role: Role.admin,
          created_at: now,
          updated_at: now,
          customer: null,
        },
      ]);

      const result = await service.getAdminUsers();

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { role: { in: [Role.owner, Role.admin] } },
        include: {
          customer: {
            select: {
              id: true,
              fname: true,
              lname: true,
              phone: true,
              gender: true,
            },
          },
        },
        orderBy: [{ role: 'desc' }, { created_at: 'asc' }],
      });

      expect(result).toEqual([
        expect.objectContaining({ id: 1, fullName: 'Jane Doe', role: Role.owner }),
        expect.objectContaining({ id: 2, fullName: 'admin-bare', role: Role.admin }),
      ]);
    });
  });

  // ---------- searchCustomers ----------
  describe('searchCustomers', () => {
    it('returns empty array and skips DB query when query is blank', async () => {
      const result = await service.searchCustomers('   ');

      expect(result).toEqual([]);
      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });

    it('trims query and searches customers by email, username, or customer profile', async () => {
      const now = new Date();
      prismaMock.user.findMany.mockResolvedValueOnce([
        {
          id: 5,
          username: 'alice99',
          email: 'alice@example.com',
          role: Role.customer,
          created_at: now,
          customer: {
            id: 20,
            fname: 'Alice',
            lname: 'Smith',
            phone: '01711111111',
            gender: 'female',
          },
        },
      ]);

      const result = await service.searchCustomers('  alice  ');

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            role: Role.customer,
            OR: [
              { email: { contains: 'alice', mode: 'insensitive' } },
              { username: { contains: 'alice', mode: 'insensitive' } },
              {
                customer: {
                  OR: [
                    { fname: { contains: 'alice', mode: 'insensitive' } },
                    { lname: { contains: 'alice', mode: 'insensitive' } },
                    { phone: { contains: 'alice', mode: 'insensitive' } },
                  ],
                },
              },
            ],
          },
          take: 10,
          orderBy: { created_at: 'desc' },
        }),
      );

      expect(result).toEqual([
        expect.objectContaining({ id: 5, fullName: 'Alice Smith', email: 'alice@example.com' }),
      ]);
    });
  });

  // ---------- createAdminUser ----------
  describe('createAdminUser', () => {
    it('throws BadRequestException if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'admin@velina.com' });

      await expect(
        service.createAdminUser({
          fullName: 'Admin User',
          email: '  ADMIN@velina.com ',
          password: 'Password123',
          role: Role.admin,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@velina.com' },
      });
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException if role is not admin or owner', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.createAdminUser({
          fullName: 'Customer User',
          email: 'cust@velina.com',
          password: 'Password123',
          role: Role.customer,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('hashes password, splits fullName, and creates admin user with customer profile', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-pw');

      const createdAt = new Date();
      prismaMock.user.create.mockResolvedValueOnce({
        id: 10,
        username: 'john-wick-123',
        email: 'john@velina.com',
        role: Role.admin,
        created_at: createdAt,
        customer: {
          id: 50,
          fname: 'John',
          lname: 'Wick',
          phone: '+8801700000000',
          gender: 'male',
        },
      });

      const result = await service.createAdminUser({
        fullName: 'John Wick',
        email: '  JOHN@velina.com ',
        password: 'Secret123',
        role: Role.admin,
        phone: '+8801700000000',
        gender: 'male',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('Secret123', 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          username: expect.stringMatching(/^john-wick-\d+$/),
          email: 'john@velina.com',
          password: 'hashed-pw',
          role: Role.admin,
          customer: {
            create: {
              fname: 'John',
              lname: 'Wick',
              phone: '+8801700000000',
              gender: 'male',
            },
          },
        },
        include: { customer: true },
      });

      expect(result).toEqual({
        id: 10,
        username: 'john-wick-123',
        email: 'john@velina.com',
        role: Role.admin,
        created_at: createdAt,
        customer: {
          id: 50,
          fname: 'John',
          lname: 'Wick',
          phone: '+8801700000000',
          gender: 'male',
        },
        fullName: 'John Wick',
      });
    });

    it('uses first name as last name and defaults optional fields for single-word fullName', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-pw');
      prismaMock.user.create.mockResolvedValueOnce({
        id: 11,
        username: 'madonna-123',
        email: 'madonna@velina.com',
        role: Role.owner,
        created_at: new Date(),
        customer: {
          id: 51,
          fname: 'Madonna',
          lname: 'Madonna',
          phone: null,
          gender: 'other',
        },
      });

      await service.createAdminUser({
        fullName: 'Madonna',
        email: 'madonna@velina.com',
        password: 'Secret123',
        role: Role.owner,
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customer: {
              create: {
                fname: 'Madonna',
                lname: 'Madonna',
                phone: null,
                gender: 'other',
              },
            },
          }),
        }),
      );
    });
  });

  // ---------- updateUserRole ----------
  describe('updateUserRole', () => {
    it('throws NotFoundException when target user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateUserRole(999, { role: Role.admin }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when demoting the only remaining owner', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 2, role: Role.owner });
      prismaMock.user.count.mockResolvedValueOnce(1);

      await expect(
        service.updateUserRole(2, { role: Role.admin }, 1),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('updates user role when safe (e.g. multiple owners exist)', async () => {
      const updatedAt = new Date();
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 2, role: Role.owner });
      prismaMock.user.count.mockResolvedValueOnce(2);
      prismaMock.user.update.mockResolvedValueOnce({
        id: 2,
        username: 'owner-2',
        email: 'owner2@velina.com',
        role: Role.admin,
        updated_at: updatedAt,
        customer: { fname: 'Bob', lname: 'Builder' },
      });

      const result = await service.updateUserRole(2, { role: Role.admin }, 1);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { role: Role.admin },
        include: { customer: true },
      });
      expect(result).toMatchObject({
        id: 2,
        role: Role.admin,
        fullName: 'Bob Builder',
      });
    });
  });

  // ---------- removeAdmin ----------
  describe('removeAdmin', () => {
    it('throws BadRequestException when trying to remove own account', async () => {
      await expect(service.removeAdmin(5, 5, 'revoke')).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when target user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.removeAdmin(99, 1, 'revoke')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when removing the only remaining owner', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 2,
        role: Role.owner,
        customer: null,
      });
      prismaMock.user.count.mockResolvedValueOnce(1);

      await expect(service.removeAdmin(2, 1, 'revoke')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('revokes role back to customer on default revoke action', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 3,
        role: Role.admin,
        customer: null,
      });
      prismaMock.user.update.mockResolvedValueOnce({ id: 3, role: Role.customer });

      const result = await service.removeAdmin(3, 1);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { role: Role.customer },
      });
      expect(result).toEqual({
        message: 'Admin access successfully revoked. User role set to Customer.',
        actionTaken: 'revoked',
      });
    });

    it('revokes instead of deleting when action is delete and user has existing orders', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 4,
        role: Role.admin,
        customer: {
          id: 40,
          orders: [{ id: 1001 }],
        },
      });
      prismaMock.user.update.mockResolvedValueOnce({ id: 4, role: Role.customer });

      const result = await service.removeAdmin(4, 1, 'delete');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { role: Role.customer },
      });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(result).toMatchObject({ actionTaken: 'revoked' });
    });

    it('deletes customer child records and user in a transaction when action is delete and no orders exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 6,
        role: Role.admin,
        customer: {
          id: 60,
          orders: [],
        },
      });
      prismaMock.$transaction.mockResolvedValueOnce([]);

      const result = await service.removeAdmin(6, 1, 'delete');

      expect(prismaMock.cart.deleteMany).toHaveBeenCalledWith({ where: { customer_id: 60 } });
      expect(prismaMock.wishlist.deleteMany).toHaveBeenCalledWith({ where: { customer_id: 60 } });
      expect(prismaMock.address.deleteMany).toHaveBeenCalledWith({ where: { customer_id: 60 } });
      expect(prismaMock.rating.deleteMany).toHaveBeenCalledWith({ where: { customer_id: 60 } });
      expect(prismaMock.customer.delete).toHaveBeenCalledWith({ where: { id: 60 } });
      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 6 } });
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        message: 'Admin account has been permanently removed successfully.',
        actionTaken: 'deleted',
      });
    });

    it('deletes user directly when action is delete and user has no customer profile', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 7,
        role: Role.admin,
        customer: null,
      });
      prismaMock.user.delete.mockResolvedValueOnce({ id: 7 });

      const result = await service.removeAdmin(7, 1, 'delete');

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 7 } });
      expect(result).toEqual({
        message: 'Admin account has been permanently removed successfully.',
        actionTaken: 'deleted',
      });
    });
  });
});
