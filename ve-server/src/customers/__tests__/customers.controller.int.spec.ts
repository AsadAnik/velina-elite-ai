import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomersController } from '../customers.controller';
import { CustomersService } from '../customers.service';

let mockAuthUser: { sub: number; role: Role } = {
  sub: 1,
  role: Role.admin,
};

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = mockAuthUser;
    return true;
  }
}

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

describe('CustomersController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        CustomersService,
        RolesGuard,
        Reflector,
        { provide: PrismaService, useValue: prismaMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockAuthUser = { sub: 1, role: Role.admin };
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /customers returns 403 Forbidden for customer role', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };

    await request(app.getHttpServer()).get('/customers').expect(403);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it('GET /customers returns paginated list for admin', async () => {
    prismaMock.user.count.mockResolvedValueOnce(1);
    prismaMock.user.findMany.mockResolvedValueOnce([
      {
        id: 10,
        username: 'alice',
        email: 'alice@example.com',
        role: Role.customer,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        customer: {
          id: 20,
          fname: 'Alice',
          lname: 'Wonder',
          phone: null,
          gender: 'female',
          addresses: [],
          orders: [],
          _count: { orders: 0, ratings: 0, wishlists: 0 },
        },
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/customers?page=1&limit=10')
      .expect(200);

    expect(res.body.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    expect(res.body.items[0]).toMatchObject({ id: 10, fullName: 'Alice Wonder' });
  });

  it('GET /customers/:id rejects non-numeric id with 400', async () => {
    await request(app.getHttpServer()).get('/customers/abc').expect(400);
  });

  it('GET /customers/:id returns customer details', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 10,
      username: 'alice',
      email: 'alice@example.com',
      role: Role.customer,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      customer: {
        id: 20,
        fname: 'Alice',
        lname: 'Wonder',
        orders: [{ total_amount: 500 }],
      },
    });

    const res = await request(app.getHttpServer()).get('/customers/10').expect(200);

    expect(res.body).toMatchObject({
      id: 10,
      fullName: 'Alice Wonder',
      totalSpent: 500,
    });
  });

  it('PATCH /customers/:id updates customer profile', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 10,
      email: 'alice@example.com',
      username: 'alice',
      customer: { id: 20 },
    });
    prismaMock.user.update.mockResolvedValueOnce({
      id: 10,
      username: 'alice',
      email: 'alice@example.com',
      role: Role.customer,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      customer: { id: 20, fname: 'Alicia', lname: 'Wonder', addresses: [] },
    });

    const res = await request(app.getHttpServer())
      .patch('/customers/10')
      .send({ fname: 'Alicia' })
      .expect(200);

    expect(res.body).toMatchObject({ id: 10, fullName: 'Alicia Wonder' });
  });

  it('DELETE /customers/:id prevents self-deletion (400)', async () => {
    mockAuthUser = { sub: 10, role: Role.admin };

    await request(app.getHttpServer()).delete('/customers/10').expect(400);
  });

  it('DELETE /customers/:id deletes customer via transaction', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 10,
      username: 'alice',
      email: 'alice@example.com',
      role: Role.customer,
      customer: { id: 20 },
    });
    txMock.order.findMany.mockResolvedValueOnce([]);

    const res = await request(app.getHttpServer()).delete('/customers/10').expect(200);

    expect(res.body.message).toContain('alice');
  });
});
