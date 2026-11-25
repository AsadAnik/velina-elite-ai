import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SiteSettingsController } from '../site-settings.controller';
import { SiteSettingsService } from '../site-settings.service';

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
  siteSetting: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const cloudinaryMock = {
  uploadFile: jest.fn(),
};

describe('SiteSettingsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiteSettingsController],
      providers: [
        SiteSettingsService,
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

  it('GET /site-settings returns settings publicly', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };
    prismaMock.siteSetting.findFirst.mockResolvedValueOnce({
      id: 1,
      site_name: 'Velina Elite',
    });

    const res = await request(app.getHttpServer()).get('/site-settings').expect(200);
    expect(res.body).toMatchObject({ id: 1, site_name: 'Velina Elite' });
  });

  it('PUT /site-settings returns 403 Forbidden for customer role', async () => {
    mockAuthUser = { sub: 99, role: Role.customer };

    await request(app.getHttpServer())
      .put('/site-settings')
      .send({ site_name: 'Hacked' })
      .expect(403);
  });

  it('PUT /site-settings uploads logo_file to Cloudinary and updates settings', async () => {
    cloudinaryMock.uploadFile.mockResolvedValueOnce({
      secure_url: 'https://cdn.example.com/logo.png',
    });
    prismaMock.siteSetting.findFirst.mockResolvedValueOnce({ id: 1 });
    prismaMock.siteSetting.update.mockResolvedValueOnce({
      id: 1,
      site_name: 'Velina Pro',
      site_logo: 'https://cdn.example.com/logo.png',
    });

    const res = await request(app.getHttpServer())
      .put('/site-settings')
      .field('site_name', 'Velina Pro')
      .attach('logo_file', Buffer.from('logo-bytes'), 'logo.png')
      .expect(200);

    expect(cloudinaryMock.uploadFile).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject({
      site_name: 'Velina Pro',
      site_logo: 'https://cdn.example.com/logo.png',
    });
  });

  it('PATCH /site-settings updates settings via JSON for owner', async () => {
    mockAuthUser = { sub: 1, role: Role.owner };
    prismaMock.siteSetting.findFirst.mockResolvedValueOnce({ id: 1 });
    prismaMock.siteSetting.update.mockResolvedValueOnce({
      id: 1,
      is_whatsapp_active: false,
    });

    const res = await request(app.getHttpServer())
      .patch('/site-settings')
      .send({ is_whatsapp_active: false })
      .expect(200);

    expect(res.body).toMatchObject({ is_whatsapp_active: false });
  });
});
