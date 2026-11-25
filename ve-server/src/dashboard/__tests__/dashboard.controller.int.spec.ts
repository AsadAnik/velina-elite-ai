import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardController } from '../dashboard.controller';
import { DashboardService } from '../dashboard.service';

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
  order: { findMany: jest.fn(), count: jest.fn() },
  customer: { count: jest.fn(), findMany: jest.fn() },
  product: { count: jest.fn(), findMany: jest.fn() },
  orderItem: { groupBy: jest.fn() },
  homeSection: { findMany: jest.fn() },
};

describe('DashboardController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        DashboardService,
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

  const setupEmptyDashboardMocks = () => {
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.order.count.mockResolvedValue(0);
    prismaMock.customer.count.mockResolvedValue(0);
    prismaMock.customer.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.orderItem.groupBy.mockResolvedValue([]);
    prismaMock.homeSection.findMany.mockResolvedValue([]);
  };

  it('GET /admin/dashboard/stats returns 403 Forbidden for customer role', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };

    await request(app.getHttpServer()).get('/admin/dashboard/stats').expect(403);
  });

  it('GET /admin/dashboard/stats returns 200 and dashboard payload for admin', async () => {
    setupEmptyDashboardMocks();

    const res = await request(app.getHttpServer())
      .get('/admin/dashboard/stats')
      .expect(200);

    expect(res.body).toHaveProperty('banner');
    expect(res.body).toHaveProperty('stats');
    expect(res.body).toHaveProperty('chart');
    expect(res.body).toHaveProperty('recentOrders');
    expect(res.body).toHaveProperty('topProducts');
    expect(res.body).toHaveProperty('activityFeed');
  });

  it('GET /admin/dashboard returns 200 for owner role', async () => {
    mockAuthUser = { sub: 1, role: Role.owner };
    setupEmptyDashboardMocks();

    const res = await request(app.getHttpServer())
      .get('/admin/dashboard')
      .expect(200);

    expect(res.body.stats).toHaveLength(4);
  });
});
