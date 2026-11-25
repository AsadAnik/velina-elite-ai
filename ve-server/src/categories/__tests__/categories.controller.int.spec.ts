import { CanActivate, ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesController } from '../categories.controller';
import { CategoriesService } from '../categories.service';

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
  category: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('CategoriesController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        CategoriesService,
        RolesGuard,
        Reflector,
        { provide: PrismaService, useValue: prismaMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockAuthUser = { sub: 1, role: Role.admin };
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /categories returns all categories with no-cache headers', async () => {
    const categories = [{ id: 1, name: 'Skincare', sub_categories: [], _count: { products: 3 } }];
    prismaMock.category.findMany.mockResolvedValueOnce(categories);

    const res = await request(app.getHttpServer()).get('/categories').expect(200);

    expect(res.headers['cache-control']).toContain('no-store');
    expect(res.body).toEqual(categories);
  });

  it('GET /categories/:id validates numeric param with ParseIntPipe', async () => {
    await request(app.getHttpServer()).get('/categories/abc').expect(400);
  });

  it('GET /categories/:id returns a single category', async () => {
    const category = { id: 2, name: 'Makeup', sub_categories: [], products: [] };
    prismaMock.category.findUnique.mockResolvedValueOnce(category);

    const res = await request(app.getHttpServer()).get('/categories/2').expect(200);

    expect(res.body).toEqual(category);
    expect(prismaMock.category.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 } }),
    );
  });

  it('POST /categories returns 403 Forbidden for customer role', async () => {
    mockAuthUser = { sub: 10, role: Role.customer };

    await request(app.getHttpServer())
      .post('/categories')
      .send({ name: 'Serums' })
      .expect(403);
    expect(prismaMock.category.create).not.toHaveBeenCalled();
  });

  it('POST /categories returns 400 when category already exists', async () => {
    prismaMock.category.findFirst.mockResolvedValueOnce({ id: 1, name: 'Skincare' });

    await request(app.getHttpServer())
      .post('/categories')
      .send({ name: 'Skincare' })
      .expect(400);
  });

  it('POST /categories creates category for admin/owner', async () => {
    prismaMock.category.findFirst.mockResolvedValueOnce(null);
    prismaMock.category.create.mockResolvedValueOnce({ id: 5, name: 'Serums' });

    const res = await request(app.getHttpServer())
      .post('/categories')
      .send({ name: 'Serums' })
      .expect(201);

    expect(res.body).toEqual({ id: 5, name: 'Serums' });
  });

  it('PUT /categories/:id returns 403 Forbidden for customer role', async () => {
    mockAuthUser = { sub: 10, role: Role.customer };

    await request(app.getHttpServer())
      .put('/categories/5')
      .send({ name: 'Updated' })
      .expect(403);
  });

  it('PUT /categories/:id updates category for admin', async () => {
    prismaMock.category.update.mockResolvedValueOnce({ id: 5, name: 'Updated' });

    const res = await request(app.getHttpServer())
      .put('/categories/5')
      .send({ name: 'Updated' })
      .expect(200);

    expect(res.body).toEqual({ id: 5, name: 'Updated' });
    expect(prismaMock.category.update).toHaveBeenCalledTimes(1);
  });

  it('DELETE /categories/:id returns 403 Forbidden for customer role', async () => {
    mockAuthUser = { sub: 10, role: Role.customer };

    await request(app.getHttpServer()).delete('/categories/5').expect(403);
  });

  it('DELETE /categories/:id deletes category for admin', async () => {
    prismaMock.category.delete.mockResolvedValueOnce({ id: 5, name: 'Updated' });

    const res = await request(app.getHttpServer()).delete('/categories/5').expect(200);

    expect(res.body).toEqual({ id: 5, name: 'Updated' });
    expect(prismaMock.category.delete).toHaveBeenCalledTimes(1);
  });
});
