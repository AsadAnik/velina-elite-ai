import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HomeSectionsController } from '../home-sections.controller';
import { HomeSectionsService } from '../home-sections.service';

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
  homeSection: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  homeSectionItem: {
    findUnique: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(async (ops: Promise<any>[]) => Promise.all(ops)),
};

const cloudinaryMock = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

describe('HomeSectionsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeSectionsController],
      providers: [
        HomeSectionsService,
        RolesGuard,
        Reflector,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CloudinaryService, useValue: cloudinaryMock },
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

  it('GET /home-sections/public returns active sliced sections without requiring admin role', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };
    prismaMock.homeSection.findMany.mockResolvedValueOnce([
      { id: 1, title: 'Deals', max_items: 1, items: [{ id: 10 }, { id: 11 }] },
    ]);

    const res = await request(app.getHttpServer())
      .get('/home-sections/public')
      .expect(200);

    expect(res.body[0].items).toHaveLength(1);
  });

  it('GET /home-sections returns 403 Forbidden for customer role', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };

    await request(app.getHttpServer()).get('/home-sections').expect(403);
  });

  it('GET /home-sections/:id rejects invalid id with 400 and returns 404 when missing', async () => {
    await request(app.getHttpServer()).get('/home-sections/abc').expect(400);

    prismaMock.homeSection.findUnique.mockResolvedValueOnce(null);
    await request(app.getHttpServer()).get('/home-sections/99').expect(404);
  });

  it('POST /home-sections uploads banner_file to Cloudinary and creates section', async () => {
    cloudinaryMock.uploadFile.mockResolvedValueOnce({
      secure_url: 'https://cdn.example.com/banner.png',
    });
    prismaMock.homeSection.aggregate.mockResolvedValueOnce({ _max: { order_index: 0 } });
    prismaMock.homeSection.create.mockResolvedValueOnce({
      id: 2,
      title: 'Eid Collection',
      banner_image: 'https://cdn.example.com/banner.png',
      order_index: 1,
      items: [],
    });

    const res = await request(app.getHttpServer())
      .post('/home-sections')
      .field('title', 'Eid Collection')
      .attach('banner_file', Buffer.from('png-bytes'), 'banner.png')
      .expect(201);

    expect(cloudinaryMock.uploadFile).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject({
      id: 2,
      title: 'Eid Collection',
      banner_image: 'https://cdn.example.com/banner.png',
    });
  });

  it('PATCH /home-sections/reorder reorders sections for admin', async () => {
    prismaMock.homeSection.update.mockResolvedValue({});
    prismaMock.homeSection.findMany.mockResolvedValueOnce([{ id: 2, order_index: 0 }]);

    const res = await request(app.getHttpServer())
      .patch('/home-sections/reorder')
      .send({ items: [{ id: 2, order_index: 0 }] })
      .expect(200);

    expect(res.body).toEqual([{ id: 2, order_index: 0 }]);
  });

  it('POST /home-sections/:id/items uploads image_file and creates item', async () => {
    prismaMock.homeSection.findUnique.mockResolvedValueOnce({ id: 2, items: [] });
    cloudinaryMock.uploadFile.mockResolvedValueOnce({
      secure_url: 'https://cdn.example.com/item.png',
    });
    prismaMock.homeSectionItem.aggregate.mockResolvedValueOnce({ _max: { order_index: 0 } });
    prismaMock.homeSectionItem.create.mockResolvedValueOnce({
      id: 10,
      section_id: 2,
      title: 'Lipstick Deal',
      image_url: 'https://cdn.example.com/item.png',
    });

    const res = await request(app.getHttpServer())
      .post('/home-sections/2/items')
      .field('title', 'Lipstick Deal')
      .attach('image_file', Buffer.from('img-bytes'), 'item.png')
      .expect(201);

    expect(cloudinaryMock.uploadFile).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject({
      id: 10,
      title: 'Lipstick Deal',
      image_url: 'https://cdn.example.com/item.png',
    });
  });

  it('DELETE /home-sections/items/:itemId deletes item and its Cloudinary image', async () => {
    prismaMock.homeSectionItem.findUnique.mockResolvedValueOnce({
      id: 10,
      image_url: 'https://cdn.example.com/item.png',
    });
    prismaMock.homeSectionItem.delete.mockResolvedValueOnce({ id: 10 });

    await request(app.getHttpServer())
      .delete('/home-sections/items/10')
      .expect(200);

    expect(cloudinaryMock.deleteFile).toHaveBeenCalledWith(
      'https://cdn.example.com/item.png',
    );
  });
});
