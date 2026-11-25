import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersController } from '../orders.controller';
import { OrdersService } from '../orders.service';

let mockAuthUser: { sub: number; role: Role; customerId: number } = {
  sub: 10,
  role: Role.customer,
  customerId: 50,
};

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = mockAuthUser;
    return true;
  }
}

const txMock = {
  order: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  orderItem: {
    createMany: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  orderHistory: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  product: { update: jest.fn() },
  cart: { deleteMany: jest.fn() },
};

const prismaMock = {
  address: { findUnique: jest.fn() },
  product: { findMany: jest.fn() },
  order: { findUnique: jest.fn(), findMany: jest.fn() },
  $transaction: jest.fn(async (cb: (tx: typeof txMock) => Promise<any>) => cb(txMock)),
};

describe('OrdersController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        OrdersService,
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
    mockAuthUser = { sub: 10, role: Role.customer, customerId: 50 };
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /orders creates a COD order for authenticated customer', async () => {
    prismaMock.address.findUnique.mockResolvedValueOnce({ id: 3, customer_id: 50 });
    prismaMock.product.findMany.mockResolvedValueOnce([
      { id: 1, title: 'Serum', price: 750, stock_quantity: 5 },
    ]);
    txMock.order.create.mockResolvedValueOnce({ id: 200 });
    prismaMock.order.findUnique.mockResolvedValueOnce({
      id: 200,
      customer_id: 50,
      total_amount: 1500,
      status: OrderStatus.pending,
    });

    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({
        shipping_address_id: 3,
        items: [{ product_id: 1, quantity: 2 }],
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: 200,
      customer_id: 50,
      total_amount: 1500,
      status: OrderStatus.pending,
    });
  });

  it('GET /orders/my-orders returns orders for current customer', async () => {
    prismaMock.order.findMany.mockResolvedValueOnce([{ id: 200, customer_id: 50 }]);

    const res = await request(app.getHttpServer())
      .get('/orders/my-orders')
      .expect(200);

    expect(res.body).toEqual([{ id: 200, customer_id: 50 }]);
  });

  it('GET /orders/my-orders/:id returns 403 when order belongs to another customer', async () => {
    prismaMock.order.findUnique.mockResolvedValueOnce({ id: 201, customer_id: 999 });

    await request(app.getHttpServer())
      .get('/orders/my-orders/201')
      .expect(403);
  });

  it('POST /orders/my-orders/:id/cancel cancels owned order and restores stock', async () => {
    prismaMock.order.findUnique.mockResolvedValueOnce({
      id: 200,
      customer_id: 50,
      status: OrderStatus.pending,
    });
    txMock.orderItem.findMany.mockResolvedValueOnce([{ product_id: 1, quantity: 2 }]);

    const res = await request(app.getHttpServer())
      .post('/orders/my-orders/200/cancel')
      .expect(200);

    expect(res.body).toEqual({ message: 'Order cancelled successfully' });
  });

  it('GET /orders returns 403 Forbidden for customer role and 200 for admin', async () => {
    await request(app.getHttpServer()).get('/orders').expect(403);

    mockAuthUser = { sub: 1, role: Role.admin, customerId: 1 };
    prismaMock.order.findMany.mockResolvedValueOnce([{ id: 200 }]);

    const res = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(res.body).toEqual([{ id: 200 }]);
  });

  it('PUT /orders/:id/status updates status for admin role', async () => {
    mockAuthUser = { sub: 1, role: Role.admin, customerId: 1 };
    prismaMock.order.findUnique
      .mockResolvedValueOnce({ id: 200, status: OrderStatus.pending })
      .mockResolvedValueOnce({ id: 200, status: OrderStatus.shipped });
    txMock.order.update.mockResolvedValueOnce({ id: 200, status: OrderStatus.shipped });

    const res = await request(app.getHttpServer())
      .put('/orders/200/status')
      .send({ status: OrderStatus.shipped })
      .expect(200);

    expect(res.body).toMatchObject({ id: 200, status: OrderStatus.shipped });
  });

  it('DELETE /orders/:id deletes order for owner role', async () => {
    mockAuthUser = { sub: 1, role: Role.owner, customerId: 1 };
    prismaMock.order.findUnique.mockResolvedValueOnce({ id: 200 });

    const res = await request(app.getHttpServer())
      .delete('/orders/200')
      .expect(200);

    expect(res.body).toEqual({ message: 'Order deleted successfully' });
  });
});
