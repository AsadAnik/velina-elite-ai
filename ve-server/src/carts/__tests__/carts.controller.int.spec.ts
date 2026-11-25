import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { CartsController } from '../carts.controller';
import { CartsService } from '../carts.service';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { sub: 10, customerId: 50 };
    return true;
  }
}

const prismaMock = {
  cart: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
};

describe('CartsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartsController],
      providers: [
        CartsService,
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

  it('GET /carts returns customer cart items', async () => {
    const product = { id: 1, title: 'Cleanser', stock_quantity: 10 };
    prismaMock.cart.findMany.mockResolvedValueOnce([
      { id: 11, quantity: 2, product },
    ]);

    const res = await request(app.getHttpServer()).get('/carts').expect(200);

    expect(res.body).toEqual([{ id: 11, quantity: 2, product }]);
    expect(prismaMock.cart.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customer_id: 50 } }),
    );
  });

  it('POST /carts/:productId adds product with default quantity 1', async () => {
    const product = { id: 5, title: 'Toner', stock_quantity: 4 };
    prismaMock.product.findUnique.mockResolvedValueOnce(product);
    prismaMock.cart.findUnique.mockResolvedValueOnce(null);
    prismaMock.cart.create.mockResolvedValueOnce({
      id: 21,
      quantity: 1,
      product,
    });

    const res = await request(app.getHttpServer()).post('/carts/5').expect(201);

    expect(res.body).toEqual({ id: 21, quantity: 1, product });
    expect(prismaMock.cart.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { customer_id: 50, product_id: 5, quantity: 1 },
      }),
    );
  });

  it('POST /carts/:productId returns 409 Conflict when stock is insufficient', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({
      id: 5,
      title: 'Toner',
      stock_quantity: 1,
    });
    prismaMock.cart.findUnique.mockResolvedValueOnce(null);

    await request(app.getHttpServer())
      .post('/carts/5')
      .send({ quantity: 5 })
      .expect(409);
  });

  it('PUT /carts/:productId updates item quantity', async () => {
    const product = { id: 5, title: 'Toner', stock_quantity: 10 };
    prismaMock.cart.findUnique.mockResolvedValueOnce({ id: 21, product });
    prismaMock.cart.update.mockResolvedValueOnce({
      id: 21,
      quantity: 3,
      product,
    });

    const res = await request(app.getHttpServer())
      .put('/carts/5')
      .send({ quantity: 3 })
      .expect(200);

    expect(res.body).toEqual({ id: 21, quantity: 3, product });
  });

  it('DELETE /carts/:productId removes item and returns 204', async () => {
    prismaMock.cart.findUnique.mockResolvedValueOnce({ id: 21 });
    prismaMock.cart.delete.mockResolvedValueOnce({ id: 21 });

    await request(app.getHttpServer()).delete('/carts/5').expect(204);
    expect(prismaMock.cart.delete).toHaveBeenCalledWith({ where: { id: 21 } });
  });

  it('DELETE /carts clears customer cart and returns 204', async () => {
    prismaMock.cart.deleteMany.mockResolvedValueOnce({ count: 2 });

    await request(app.getHttpServer()).delete('/carts').expect(204);
    expect(prismaMock.cart.deleteMany).toHaveBeenCalledWith({
      where: { customer_id: 50 },
    });
  });
});
