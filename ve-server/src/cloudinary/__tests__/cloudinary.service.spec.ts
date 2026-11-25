import { Test, TestingModule } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';
import { PassThrough } from 'stream';
import { CloudinaryService } from '../cloudinary.service';

const streamifier = require('streamifier');

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    config: jest.fn(),
  },
}));

describe('CloudinaryService (unit)', () => {
  let service: CloudinaryService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  // ---------- uploadFile ----------
  describe('uploadFile', () => {
    it('streams file buffer to cloudinary and resolves with upload result', async () => {
      const mockFile = { buffer: Buffer.from('fake-image-bytes') } as Express.Multer.File;
      const mockResult = { secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/velina-elite/abc.jpg' };
      const mockStream = new PassThrough();
      const createReadStreamSpy = jest.spyOn(streamifier, 'createReadStream');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_opts, cb) => {
        cb(null, mockResult);
        return mockStream;
      });

      const result = await service.uploadFile(mockFile);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'velina-elite' },
        expect.any(Function),
      );
      expect(createReadStreamSpy).toHaveBeenCalledWith(mockFile.buffer);
      expect(result).toEqual(mockResult);
    });

    it('rejects when cloudinary returns an upload error', async () => {
      const mockFile = { buffer: Buffer.from('fake-image-bytes') } as Express.Multer.File;
      const mockStream = new PassThrough();
      const uploadError = new Error('Cloudinary upload failed');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_opts, cb) => {
        cb(uploadError, undefined);
        return mockStream;
      });

      await expect(service.uploadFile(mockFile)).rejects.toThrow('Cloudinary upload failed');
    });

    it('rejects with Unknown upload error when both error and result are missing', async () => {
      const mockFile = { buffer: Buffer.from('fake-image-bytes') } as Express.Multer.File;
      const mockStream = new PassThrough();

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_opts, cb) => {
        cb(undefined, undefined);
        return mockStream;
      });

      await expect(service.uploadFile(mockFile)).rejects.toThrow('Unknown upload error');
    });
  });

  // ---------- deleteFile ----------
  describe('deleteFile', () => {
    it('extracts public_id from URL and calls cloudinary.uploader.destroy', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValueOnce({ result: 'ok' });

      await service.deleteFile(
        'https://res.cloudinary.com/demo/image/upload/v1700000000/abc123.jpg',
      );

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('velina-elite/abc123');
    });

    it('logs error and does not throw if cloudinary destroy fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.deleteFile('https://res.cloudinary.com/demo/image/upload/v1/broken.png'),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // ---------- deleteMultipleFiles ----------
  describe('deleteMultipleFiles', () => {
    it('deletes all provided image URLs', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await service.deleteMultipleFiles([
        'https://res.cloudinary.com/demo/image/upload/v1/img1.jpg',
        'https://res.cloudinary.com/demo/image/upload/v2/img2.webp',
      ]);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(2);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('velina-elite/img1');
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('velina-elite/img2');
    });

    it('handles an empty array without calling destroy', async () => {
      await service.deleteMultipleFiles([]);

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });
  });
});
