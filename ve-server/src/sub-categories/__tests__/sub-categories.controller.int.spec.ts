import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SubCategoriesController } from '../sub-categories.controller';
import { SubCategoriesService } from '../sub-categories.service';

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
  subCategory: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('SubCategoriesController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubCategoriesController],
      providers: [
        SubCategoriesService,
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

  it('GET /sub-categories and GET /sub-categories/:id work publicly', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };
    prismaMock.subCategory.findMany.mockResolvedValueOnce([{ id: 1, name: 'Serums' }]);
    prismaMock.subCategory.findUnique.mockResolvedValueOnce({ id: 1, name: 'Serums' });

    const listRes = await request(app.getHttpServer()).get('/sub-categories').expect(200);
    expect(listRes.body).toEqual([{ id: 1, name: 'Serums' }]);

    await request(app.getHttpServer()).get('/sub-categories/abc').expect(400);
    const oneRes = await request(app.getHttpServer()).get('/sub-categories/1').expect(200);
    expect(oneRes.body).toEqual({ id: 1, name: 'Serums' });
  });

  it('POST /sub-categories returns 403 for customer and 201 for admin', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };
    await request(app.getHttpServer())
      .post('/sub-categories')
      .send({ name: 'Toners', category_id: 1 })
      .expect(403);

    mockAuthUser = { sub: 1, role: Role.admin };
    prismaMock.subCategory.findFirst.mockResolvedValueOnce(null);
    prismaMock.subCategory.create.mockResolvedValueOnce({ id: 3, name: 'Toners', category_id: 1 });

    const res = await request(app.getHttpServer())
      .post('/sub-categories')
      .send({ name: 'Toners', category_id: 1 })
      .expect(201);

    expect(res.body).toEqual({ id: 3, name: 'Toners', category_id: 1 });
  });

  it('PUT /sub-categories/:id and DELETE /sub-categories/:id work for admin', async () => {
    prismaMock.subCategory.update.mockResolvedValueOnce({ id: 3, name: 'Updated', category_id: 1 });
    prismaMock.subCategory.delete.mockResolvedValueOnce({ id: 3 });

    const putRes = await request(app.getHttpServer())
      .put('/sub-categories/3')
      .send({ name: 'Updated', category_id: 1 })
      .expect(200);
    expect(putRes.body).toMatchObject({ id: 3, name: 'Updated' });

    await request(app.getHttpServer()).delete('/sub-categories/3').expect(200);
  });
});
