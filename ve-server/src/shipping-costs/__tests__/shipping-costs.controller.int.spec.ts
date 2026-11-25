import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ShippingCostsController } from '../shipping-costs.controller';
import { ShippingCostsService } from '../shipping-costs.service';

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

const prismaMock = {
  shippingCost: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ShippingCostsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingCostsController],
      providers: [
        ShippingCostsService,
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

  it('GET /shipping-costs returns defaults publicly', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };
    prismaMock.shippingCost.findFirst.mockResolvedValueOnce(null);

    const res = await request(app.getHttpServer()).get('/shipping-costs').expect(200);
    expect(res.body).toMatchObject({ inside_dhaka_cost: 70, outside_dhaka_cost: 120 });
  });

  it('POST /shipping-costs returns 403 for customer and 201 for admin', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };
    await request(app.getHttpServer())
      .post('/shipping-costs')
      .send({ inside_dhaka_cost: 60, outside_dhaka_cost: 120 })
      .expect(403);

    mockAuthUser = { sub: 1, role: Role.admin };
    prismaMock.shippingCost.findFirst.mockResolvedValueOnce(null);
    prismaMock.shippingCost.create.mockResolvedValueOnce({
      id: 1,
      inside_dhaka_cost: 60,
      outside_dhaka_cost: 120,
      currency_symbol: '৳',
    });

    const res = await request(app.getHttpServer())
      .post('/shipping-costs')
      .send({ inside_dhaka_cost: 60, outside_dhaka_cost: 120 })
      .expect(201);

    expect(res.body).toMatchObject({ id: 1, inside_dhaka_cost: 60 });
  });

  it('PUT /shipping-costs/:id rejects non-numeric id and updates for admin', async () => {
    await request(app.getHttpServer())
      .put('/shipping-costs/abc')
      .send({ inside_dhaka_cost: 80 })
      .expect(400);

    prismaMock.shippingCost.findUnique.mockResolvedValueOnce({ id: 1 });
    prismaMock.shippingCost.update.mockResolvedValueOnce({ id: 1, inside_dhaka_cost: 80 });

    const res = await request(app.getHttpServer())
      .put('/shipping-costs/1')
      .send({ inside_dhaka_cost: 80 })
      .expect(200);

    expect(res.body).toEqual({ id: 1, inside_dhaka_cost: 80 });
  });

  it('DELETE /shipping-costs/:id deletes config for owner', async () => {
    mockAuthUser = { sub: 1, role: Role.owner };
    prismaMock.shippingCost.findUnique.mockResolvedValueOnce({ id: 1 });
    prismaMock.shippingCost.delete.mockResolvedValueOnce({ id: 1 });

    await request(app.getHttpServer()).delete('/shipping-costs/1').expect(200);
  });
});
