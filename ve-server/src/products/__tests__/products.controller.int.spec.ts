import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsController } from '../products.controller';
import { ProductsService } from '../products.service';

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
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(async (ops: Promise<any>[]) => Promise.all(ops)),
};

const cloudinaryMock = {
  uploadFile: jest.fn(),
  deleteMultipleFiles: jest.fn().mockResolvedValue(undefined),
};

const cacheMock = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  stores: [{ keys: jest.fn().mockResolvedValue([]) }],
};

describe('ProductsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        RolesGuard,
        Reflector,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CloudinaryService, useValue: cloudinaryMock },
        { provide: CACHE_MANAGER, useValue: cacheMock },
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
    cacheMock.get.mockResolvedValue(null);
    mockAuthUser = { sub: 1, role: Role.admin };
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products returns paginated products publicly', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };
    prismaMock.product.findMany.mockResolvedValueOnce([{ id: 1, title: 'Serum' }]);
    prismaMock.product.count.mockResolvedValueOnce(1);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const res = await request(app.getHttpServer()).get('/products').expect(200);

    expect(res.body).toMatchObject({
      data: [{ id: 1, title: 'Serum' }],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    });
  });

  it('GET /products/:id rejects non-numeric id with 400 and returns 404 when missing', async () => {
    await request(app.getHttpServer()).get('/products/abc').expect(400);

    prismaMock.product.findUnique.mockResolvedValueOnce(null);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    await request(app.getHttpServer()).get('/products/999').expect(404);
  });

  it('POST /products returns 403 Forbidden for customer role', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };

    await request(app.getHttpServer())
      .post('/products')
      .send({ title: 'Serum' })
      .expect(403);
  });

  it('POST /products returns 400 when fewer than 1 or more than 3 images are provided', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .send({
        title: 'Serum',
        price: 500,
        stock_quantity: 5,
        category_id: 1,
        images_url: [],
      })
      .expect(400);
  });

  it('POST /products uploads multipart images to Cloudinary and creates product', async () => {
    cloudinaryMock.uploadFile.mockResolvedValueOnce({
      secure_url: 'https://cdn.example.com/prod1.jpg',
    });
    prismaMock.product.create.mockResolvedValueOnce({
      id: 10,
      title: 'Glow Cream',
      images_url: ['https://cdn.example.com/prod1.jpg'],
    });

    const res = await request(app.getHttpServer())
      .post('/products')
      .field('title', 'Glow Cream')
      .field('regular_price', '650')
      .field('mrp_price', '800')
      .field('stock_quantity', '10')
      .field('category_id', '1')
      .field('sub_category_id', '3')
      .attach('images', Buffer.from('img-bytes'), 'prod1.jpg')
      .expect(201);

    expect(cloudinaryMock.uploadFile).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject({
      id: 10,
      title: 'Glow Cream',
      images_url: ['https://cdn.example.com/prod1.jpg'],
    });
  });

  it('PATCH /products/status/:id updates status for admin', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 10 });
    prismaMock.product.update.mockResolvedValueOnce({ id: 10, status: 'inactive' });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const res = await request(app.getHttpServer())
      .patch('/products/status/10')
      .send({ status: 'inactive' })
      .expect(200);

    expect(res.body).toEqual({ message: 'Product #10 is updated successfully!' });
  });

  it('DELETE /products/:id deletes product and Cloudinary images for admin', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({
      id: 10,
      images_url: ['https://cdn.example.com/prod1.jpg'],
    });
    prismaMock.product.delete.mockResolvedValueOnce({ id: 10 });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const res = await request(app.getHttpServer())
      .delete('/products/10')
      .expect(200);

    expect(cloudinaryMock.deleteMultipleFiles).toHaveBeenCalledWith([
      'https://cdn.example.com/prod1.jpg',
    ]);
    expect(res.body).toEqual({ message: 'Product #10 is deleted successfully!' });
  });
});
