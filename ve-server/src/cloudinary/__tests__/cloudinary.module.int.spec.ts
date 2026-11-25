import { Test, TestingModule } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryModule } from '../cloudinary.module';
import { CloudinaryService } from '../cloudinary.service';

describe('CloudinaryModule (integration)', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [CloudinaryModule],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('provides CloudinaryService and CLOUDINARY config token', () => {
    const service = module.get<CloudinaryService>(CloudinaryService);
    const cloudinaryConfig = module.get('CLOUDINARY');

    expect(service).toBeInstanceOf(CloudinaryService);
    expect(cloudinaryConfig).toBeDefined();
    expect(cloudinary.config().cloud_name).toBeDefined();
  });
});
