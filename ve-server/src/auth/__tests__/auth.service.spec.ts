import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const jwtServiceMock = {
  sign: jest.fn(),
};

describe('AuthService (unit - comprehensive)', () => {
  let service: AuthService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- login ----------
  describe('login', () => {
    it('throws UnauthorizedException if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'Password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password is invalid', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'cust@example.com',
        password: 'hashed-password',
        role: Role.customer,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login({ email: 'cust@example.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if user role is not customer', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 2,
        email: 'admin@example.com',
        password: 'hashed-password',
        role: Role.admin,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      await expect(
        service.login({ email: 'admin@example.com', password: 'Password123' }),
      ).rejects.toThrow('Only customers can login from this route');
    });

    it('returns access_token and user info with customerId for valid customer', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 10,
        email: 'cust@example.com',
        password: 'hashed-password',
        role: Role.customer,
        customer: { id: 77 },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      jwtServiceMock.sign.mockReturnValueOnce('jwt-token-123');

      const result = await service.login({
        email: 'CUST@example.com',
        password: 'Password123',
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'cust@example.com' },
        include: { customer: true },
      });
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        sub: 10,
        email: 'cust@example.com',
        role: Role.customer,
        customerId: 77,
      });
      expect(result).toEqual({
        access_token: 'jwt-token-123',
        user: {
          id: 10,
          email: 'cust@example.com',
          role: Role.customer,
          customerId: 77,
        },
      });
    });
  });

  // ---------- adminLogin ----------
  describe('adminLogin', () => {
    it('throws UnauthorizedException when user not found and credentials are not default admin', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.adminLogin({ email: 'nobody@example.com', password: 'Password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('bootstraps default owner user when DB has none and default credentials match', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(null) // initial adminLogin lookup
        .mockResolvedValueOnce(null); // ensureDefaultAdminUser lookup
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-default');
      prismaMock.user.create.mockResolvedValueOnce({
        id: 1,
        email: 'velinaelitebd01@gmail.com',
        role: Role.owner,
      });
      jwtServiceMock.sign.mockReturnValueOnce('owner-jwt');

      const result = await service.adminLogin({
        email: 'velinaelitebd01@gmail.com',
        password: 'Velina.Admin1234',
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          username: 'velina-admin',
          email: 'velinaelitebd01@gmail.com',
          password: 'hashed-default',
          role: Role.owner,
        },
      });
      expect(result.access_token).toBe('owner-jwt');
      expect(result.user.role).toBe(Role.owner);
    });

    it('throws UnauthorizedException if a customer tries to use adminLogin', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 5,
        email: 'cust@example.com',
        password: 'hashed-password',
        role: Role.customer,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      await expect(
        service.adminLogin({ email: 'cust@example.com', password: 'Password123' }),
      ).rejects.toThrow('Only admin or owner role can access the admin panel');
    });

    it('returns access_token for valid admin or owner', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 3,
        email: 'admin@velina.com',
        password: 'hashed-password',
        role: Role.admin,
        customer: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      jwtServiceMock.sign.mockReturnValueOnce('admin-jwt');

      const result = await service.adminLogin({
        email: 'admin@velina.com',
        password: 'Password123',
      });

      expect(result).toEqual({
        access_token: 'admin-jwt',
        user: {
          id: 3,
          email: 'admin@velina.com',
          role: Role.admin,
          customerId: undefined,
        },
      });
    });
  });

  // ---------- register ----------
  describe('register', () => {
    it('throws BadRequestException when password and confirmPassword do not match', async () => {
      await expect(
        service.register({
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'Password123',
          confirmPassword: 'DifferentPassword',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when email is already registered', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'john@example.com' });

      await expect(
        service.register({
          fullName: 'John Doe',
          email: 'JOHN@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        }),
      ).rejects.toThrow('Email already registered');
    });

    it('registers customer, creates customer profile, and returns JWT', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-pw');
      prismaMock.user.create.mockResolvedValueOnce({
        id: 42,
        email: 'jane@example.com',
        role: Role.customer,
        customer: { id: 88 },
      });
      jwtServiceMock.sign.mockReturnValueOnce('register-jwt');

      const result = await service.register({
        fullName: 'Jane Marie Doe',
        email: 'Jane@Example.com',
        phone: '+8801700000000',
        password: 'Password123',
        confirmPassword: 'Password123',
        gender: 'female',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          username: expect.stringMatching(/^jane-marie-doe-\d+$/),
          email: 'jane@example.com',
          password: 'hashed-pw',
          role: Role.customer,
          customer: {
            create: {
              fname: 'Jane',
              lname: 'Marie Doe',
              phone: '+8801700000000',
              gender: 'female',
            },
          },
        },
        include: { customer: true },
      });
      expect(result).toEqual({
        access_token: 'register-jwt',
        user: {
          id: 42,
          email: 'jane@example.com',
          role: Role.customer,
          customerId: 88,
        },
      });
    });
  });

  // ---------- changePassword ----------
  describe('changePassword', () => {
    it('throws UnauthorizedException if user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.changePassword(999, {
          currentPassword: 'old',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws BadRequestException if current password is incorrect', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 10,
        password: 'stored-hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.changePassword(10, {
          currentPassword: 'wrong',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates password when current password matches', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 10,
        password: 'stored-hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('new-hash');
      prismaMock.user.update.mockResolvedValueOnce({ id: 10 });

      const result = await service.changePassword(10, {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { password: 'new-hash' },
      });
      expect(result).toEqual({ message: 'Password changed successfully' });
    });
  });
});
