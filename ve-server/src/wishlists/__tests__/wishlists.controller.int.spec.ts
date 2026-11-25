import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { WishlistsController } from '../wishlists.controller';
import { WishlistsService } from '../wishlists.service';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { sub: 10, customerId: 50 };
    return true;
  }
}

const prismaMock = {
  wishlist: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
};

describe('WishlistsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistsController],
      providers: [
        WishlistsService,
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /wishlists returns customer wishlist products', async () => {
    const product = { id: 10, title: 'Lip Oil' };
    prismaMock.wishlist.findMany.mockResolvedValueOnce([{ id: 1, product }]);

    const res = await request(app.getHttpServer()).get('/wishlists').expect(200);
    expect(res.body).toEqual([product]);
  });

  it('POST /wishlists/:productId adds product and returns 409 if already added', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 10 });
    prismaMock.wishlist.findUnique.mockResolvedValueOnce(null);
    prismaMock.wishlist.create.mockResolvedValueOnce({ id: 1 });

    const res = await request(app.getHttpServer()).post('/wishlists/10').expect(201);
    expect(res.body).toEqual({ message: 'Added to wishlist' });

    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 10 });
    prismaMock.wishlist.findUnique.mockResolvedValueOnce({ id: 1 });
    await request(app.getHttpServer()).post('/wishlists/10').expect(409);
  });

  it('DELETE /wishlists/:productId removes product and returns 204', async () => {
    prismaMock.wishlist.findUnique.mockResolvedValueOnce({ id: 1 });
    prismaMock.wishlist.delete.mockResolvedValueOnce({ id: 1 });

    await request(app.getHttpServer()).delete('/wishlists/10').expect(204);
    expect(prismaMock.wishlist.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
