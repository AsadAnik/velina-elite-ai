import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock }; customer: { create: jest.Mock } };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      customer: {
        create: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };

    authService = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  it('should return a JWT for a valid customer login', async () => {
    const password = 'Customer.1234';
    const hash = await bcrypt.hash(password, 10);

    prisma.user.findUnique.mockResolvedValue({
      id: 22,
      email: 'customer@example.com',
      role: 'customer',
      password: hash,
    });

    const result = await authService.login({
      email: 'customer@example.com',
      password,
    });

    expect(result.access_token).toBe('signed-token');
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 22,
      email: 'customer@example.com',
      role: 'customer',
    });
  });

  it('should return a JWT for a valid admin login', async () => {
    const password = 'Velina.Admin1234';
    const hash = await bcrypt.hash(password, 10);

    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'velinaelitebd01@gmail.com',
      role: 'owner',
      password: hash,
    });

    const result = await authService.adminLogin({
      email: 'velinaelitebd01@gmail.com',
      password,
    });

    expect(result.access_token).toBe('signed-token');
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 1,
      email: 'velinaelitebd01@gmail.com',
      role: 'owner',
    });
  });

  it('should reject an invalid password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'velinaelitebd01@gmail.com',
      role: 'owner',
      password: await bcrypt.hash('wrong-password', 10),
    });

    await expect(
      authService.adminLogin({
        email: 'velinaelitebd01@gmail.com',
        password: 'Velina.Admin1234',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
