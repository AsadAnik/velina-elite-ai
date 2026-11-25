import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  customer: {
    findUnique: jest.fn(),
  },
};

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: process.env.JWT_SECRET || 'velina-elite-dev-secret',
          signOptions: { expiresIn: '8h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtAuthGuard,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login returns 400 on invalid DTO', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bad-email', password: '123' })
      .expect(400);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('POST /auth/login returns 201 and real JWT for valid customer', async () => {
    const hashedPassword = await bcrypt.hash('Customer.1234', 10);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 22,
      email: 'customer@example.com',
      password: hashedPassword,
      role: Role.customer,
      customer: { id: 101 },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'customer@example.com', password: 'Customer.1234' })
      .expect(201);

    expect(res.body.access_token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({
      id: 22,
      email: 'customer@example.com',
      role: Role.customer,
      customerId: 101,
    });

    const decoded = jwtService.verify(res.body.access_token);
    expect(decoded).toMatchObject({
      sub: 22,
      email: 'customer@example.com',
      role: Role.customer,
      customerId: 101,
    });
  });

  it('POST /auth/admin/login returns 401 for customer account', async () => {
    const hashedPassword = await bcrypt.hash('Customer.1234', 10);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 22,
      email: 'customer@example.com',
      password: hashedPassword,
      role: Role.customer,
      customer: { id: 101 },
    });

    await request(app.getHttpServer())
      .post('/auth/admin/login')
      .send({ email: 'customer@example.com', password: 'Customer.1234' })
      .expect(401);
  });

  it('POST /auth/register creates customer and returns JWT', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: 30,
      email: 'newcust@example.com',
      role: Role.customer,
      customer: { id: 201 },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'New Customer',
        email: 'newcust@example.com',
        password: 'Customer.1234',
        confirmPassword: 'Customer.1234',
      })
      .expect(201);

    expect(res.body.access_token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      id: 30,
      email: 'newcust@example.com',
      role: Role.customer,
      customerId: 201,
    });
  });

  it('POST /auth/change-password returns 401 when no bearer token is provided', async () => {
    await request(app.getHttpServer())
      .post('/auth/change-password')
      .send({ currentPassword: 'oldPassword', newPassword: 'newPassword123' })
      .expect(401);
  });

  it('POST /auth/change-password succeeds with valid bearer token and current password', async () => {
    const token = jwtService.sign({
      sub: 22,
      email: 'customer@example.com',
      role: Role.customer,
      customerId: 101,
    });

    const currentHash = await bcrypt.hash('OldPassword123', 10);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 22,
      password: currentHash,
    });
    prismaMock.user.update.mockResolvedValueOnce({ id: 22 });

    const res = await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
      })
      .expect(201);

    expect(res.body).toEqual({ message: 'Password changed successfully' });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 22 },
      data: { password: expect.any(String) },
    });
  });
});
