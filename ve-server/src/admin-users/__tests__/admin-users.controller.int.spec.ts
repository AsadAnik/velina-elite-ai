import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUsersController } from '../admin-users.controller';
import { AdminUsersService } from '../admin-users.service';

// Configurable mock user injected by MockJwtAuthGuard so we can test RolesGuard & @CurrentUser
let mockAuthUser: { sub: number; email: string; role: Role } = {
  sub: 1,
  email: 'owner@velina.com',
  role: Role.owner,
};

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = mockAuthUser;
    return true;
  }
}

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

describe('AdminUsersController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        AdminUsersService,
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
    mockAuthUser = { sub: 1, email: 'owner@velina.com', role: Role.owner };
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /admin-users returns 403 Forbidden for customer role', async () => {
    mockAuthUser = { sub: 99, email: 'cust@velina.com', role: Role.customer };

    await request(app.getHttpServer()).get('/admin-users').expect(403);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it('GET /admin-users returns admin and owner list for authorized role', async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([
      {
        id: 1,
        username: 'owner-1',
        email: 'owner@velina.com',
        role: Role.owner,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        customer: { id: 10, fname: 'Jane', lname: 'Doe', phone: null, gender: 'female' },
      },
    ]);

    const res = await request(app.getHttpServer()).get('/admin-users').expect(200);

    expect(res.body).toEqual([
      expect.objectContaining({
        id: 1,
        email: 'owner@velina.com',
        role: Role.owner,
        fullName: 'Jane Doe',
      }),
    ]);
  });

  it('GET /admin-users/search-customers forwards query param to service', async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([]);

    const res = await request(app.getHttpServer())
      .get('/admin-users/search-customers?query=john')
      .expect(200);

    expect(res.body).toEqual([]);
    expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
  });

  it('POST /admin-users validates DTO and returns 400 on invalid input', async () => {
    await request(app.getHttpServer())
      .post('/admin-users')
      .send({
        fullName: 'A', // too short (MinLength 2)
        email: 'not-an-email',
        password: '123', // too short (MinLength 6)
        role: Role.admin,
      })
      .expect(400);

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('POST /admin-users creates admin user when DTO is valid', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: 15,
      username: 'new-admin-123',
      email: 'newadmin@velina.com',
      role: Role.admin,
      created_at: '2026-01-01T00:00:00.000Z',
      customer: {
        id: 25,
        fname: 'New',
        lname: 'Admin',
        phone: null,
        gender: 'other',
      },
    });

    const res = await request(app.getHttpServer())
      .post('/admin-users')
      .send({
        fullName: 'New Admin',
        email: 'newadmin@velina.com',
        password: 'StrongPassword123',
        role: Role.admin,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: 15,
      email: 'newadmin@velina.com',
      role: Role.admin,
      fullName: 'New Admin',
    });
  });

  it('PATCH /admin-users/:id/role returns 400 when id is not a number (ParseIntPipe)', async () => {
    await request(app.getHttpServer())
      .patch('/admin-users/abc/role')
      .send({ role: Role.admin })
      .expect(400);
  });

  it('PATCH /admin-users/:id/role updates role through service', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 3, role: Role.customer });
    prismaMock.user.update.mockResolvedValueOnce({
      id: 3,
      username: 'user-3',
      email: 'user3@velina.com',
      role: Role.admin,
      updated_at: '2026-01-01T00:00:00.000Z',
      customer: { fname: 'Alex', lname: 'Ray' },
    });

    const res = await request(app.getHttpServer())
      .patch('/admin-users/3/role')
      .send({ role: Role.admin })
      .expect(200);

    expect(res.body).toMatchObject({
      id: 3,
      role: Role.admin,
      fullName: 'Alex Ray',
    });
  });

  it('DELETE /admin-users/:id revokes admin using CurrentUser sub', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 4,
      role: Role.admin,
      customer: null,
    });
    prismaMock.user.update.mockResolvedValueOnce({ id: 4, role: Role.customer });

    const res = await request(app.getHttpServer())
      .delete('/admin-users/4?action=revoke')
      .expect(200);

    expect(res.body).toMatchObject({ actionTaken: 'revoked' });
  });

  it('DELETE /admin-users/:id prevents self-removal (400 Bad Request)', async () => {
    mockAuthUser = { sub: 4, email: 'admin4@velina.com', role: Role.admin };

    await request(app.getHttpServer())
      .delete('/admin-users/4')
      .expect(400);
  });
});
