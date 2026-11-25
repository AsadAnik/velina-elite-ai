import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

const createMockExecutionContext = (request: Record<string, any>): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  }) as unknown as ExecutionContext;

describe('Auth Guards (unit)', () => {
  describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let jwtServiceMock: { verifyAsync: jest.Mock };
    let prismaMock: { customer: { findUnique: jest.Mock } };

    beforeEach(() => {
      jwtServiceMock = { verifyAsync: jest.fn() };
      prismaMock = { customer: { findUnique: jest.fn() } };
      guard = new JwtAuthGuard(
        jwtServiceMock as unknown as JwtService,
        prismaMock as unknown as PrismaService,
      );
    });

    it('throws UnauthorizedException when Authorization header is missing', async () => {
      const ctx = createMockExecutionContext({ headers: {} });
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token verification fails', async () => {
      const ctx = createMockExecutionContext({
        headers: { authorization: 'Bearer bad-token' },
      });
      jwtServiceMock.verifyAsync.mockRejectedValueOnce(new Error('invalid signature'));
      jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('attaches payload and resolves missing customerId from Prisma', async () => {
      const req: Record<string, any> = {
        headers: { authorization: 'Bearer valid-token' },
      };
      const ctx = createMockExecutionContext(req);

      jwtServiceMock.verifyAsync.mockResolvedValueOnce({
        sub: 12,
        email: 'cust@example.com',
        role: Role.customer,
      });
      prismaMock.customer.findUnique.mockResolvedValueOnce({ id: 55 });

      const allowed = await guard.canActivate(ctx);

      expect(allowed).toBe(true);
      expect(prismaMock.customer.findUnique).toHaveBeenCalledWith({
        where: { user_id: 12 },
        select: { id: true },
      });
      expect(req.user).toEqual({
        sub: 12,
        email: 'cust@example.com',
        role: Role.customer,
        customerId: 55,
      });
    });

    it('skips Prisma lookup when customerId is already in token payload', async () => {
      const req: Record<string, any> = {
        headers: { authorization: 'Bearer valid-token' },
      };
      const ctx = createMockExecutionContext(req);

      jwtServiceMock.verifyAsync.mockResolvedValueOnce({
        sub: 12,
        email: 'cust@example.com',
        role: Role.customer,
        customerId: 99,
      });

      const allowed = await guard.canActivate(ctx);

      expect(allowed).toBe(true);
      expect(prismaMock.customer.findUnique).not.toHaveBeenCalled();
      expect(req.user.customerId).toBe(99);
    });
  });

  describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflectorMock: { getAllAndOverride: jest.Mock };

    beforeEach(() => {
      reflectorMock = { getAllAndOverride: jest.fn() };
      guard = new RolesGuard(reflectorMock as unknown as Reflector);
    });

    it('allows access when no roles metadata is defined', () => {
      reflectorMock.getAllAndOverride.mockReturnValueOnce(undefined);
      const ctx = createMockExecutionContext({ user: { role: Role.customer } });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows access when user has one of the required roles', () => {
      reflectorMock.getAllAndOverride.mockReturnValueOnce([Role.admin, Role.owner]);
      const ctx = createMockExecutionContext({ user: { role: Role.admin } });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('denies access when user lacks the required role', () => {
      reflectorMock.getAllAndOverride.mockReturnValueOnce([Role.admin, Role.owner]);
      const ctx = createMockExecutionContext({ user: { role: Role.customer } });

      expect(guard.canActivate(ctx)).toBe(false);
    });
  });
});
