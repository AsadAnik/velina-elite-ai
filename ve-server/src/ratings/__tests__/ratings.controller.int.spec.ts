import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { RatingsController } from '../ratings.controller';
import { RatingsService } from '../ratings.service';

let mockAuthUser: { sub: number; role: Role } = {
  sub: 10,
  role: Role.customer,
};

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = mockAuthUser;
    return true;
  }
}

const prismaMock = {
  customer: { findFirst: jest.fn() },
  orderItem: { findFirst: jest.fn() },
  rating: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  user: { findUnique: jest.fn(), create: jest.fn() },
  product: { findMany: jest.fn() },
};

describe('RatingsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [
        RatingsService,
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
    mockAuthUser = { sub: 10, role: Role.customer };
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /ratings returns 403 Forbidden for admin role and 201 for customer', async () => {
    mockAuthUser = { sub: 1, role: Role.admin };
    await request(app.getHttpServer())
      .post('/ratings')
      .send({ product_id: 5, stars: 5 })
      .expect(403);

    mockAuthUser = { sub: 10, role: Role.customer };
    prismaMock.customer.findFirst.mockResolvedValueOnce({ id: 50 });
    prismaMock.orderItem.findFirst.mockResolvedValueOnce({ id: 99 });
    prismaMock.rating.findUnique.mockResolvedValueOnce(null);
    prismaMock.rating.create.mockResolvedValueOnce({
      id: 1,
      customer_id: 50,
      product_id: 5,
      stars: 5,
    });

    const res = await request(app.getHttpServer())
      .post('/ratings')
      .send({ product_id: 5, stars: 5 })
      .expect(201);

    expect(res.body).toMatchObject({ id: 1, product_id: 5, stars: 5 });
  });

  it('GET /products/:productId/ratings returns ratings summary publicly', async () => {
    prismaMock.rating.findMany.mockResolvedValueOnce([{ stars: 5 }, { stars: 4 }]);

    const res = await request(app.getHttpServer())
      .get('/products/5/ratings')
      .expect(200);

    expect(res.body).toEqual({
      ratings: [{ stars: 5 }, { stars: 4 }],
      averageRating: 4.5,
      totalRatings: 2,
    });
  });

  it('GET /admin/ratings returns 403 for customer and 200 for admin', async () => {
    await request(app.getHttpServer()).get('/admin/ratings').expect(403);

    mockAuthUser = { sub: 1, role: Role.admin };
    prismaMock.rating.findMany.mockResolvedValueOnce([{ id: 1, stars: 5 }]);

    const res = await request(app.getHttpServer()).get('/admin/ratings').expect(200);
    expect(res.body).toEqual([{ id: 1, stars: 5 }]);
  });

  it('PUT /admin/ratings/:id and DELETE /admin/ratings/:id work for admin', async () => {
    mockAuthUser = { sub: 1, role: Role.admin };
    prismaMock.rating.update.mockResolvedValueOnce({ id: 1, stars: 3 });
    prismaMock.rating.delete.mockResolvedValueOnce({ id: 1 });

    await request(app.getHttpServer())
      .put('/admin/ratings/1')
      .send({ stars: 3 })
      .expect(200);

    await request(app.getHttpServer()).delete('/admin/ratings/1').expect(200);
  });
});
