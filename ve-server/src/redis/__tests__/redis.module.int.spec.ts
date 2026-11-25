import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisModule } from '../redis.module';

jest.mock('cache-manager-redis-yet', () => ({
  redisStore: jest.fn(),
}));

describe('RedisModule (integration)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('falls back to in-memory cache when REDIS_URL and REDIS_HOST are not set', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
    }).compile();

    const cache = module.get<Cache>(CACHE_MANAGER);
    await cache.set('test-key', 'hello', 5000);
    expect(await cache.get('test-key')).toBe('hello');
    expect(redisStore).not.toHaveBeenCalled();

    await module.close();
  });

  it('connects using REDIS_URL when configured', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    (redisStore as jest.Mock).mockResolvedValueOnce({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
    }).compile();

    expect(redisStore).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
      ttl: 60_000,
    });

    await module.close();
  });

  it('falls back to in-memory cache when redisStore throws a connection error', async () => {
    process.env.REDIS_HOST = '127.0.0.1';
    process.env.REDIS_PORT = '6379';
    (redisStore as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
    }).compile();

    const cache = module.get<Cache>(CACHE_MANAGER);
    await cache.set('fallback-key', 123, 5000);
    expect(await cache.get('fallback-key')).toBe(123);

    await module.close();
  });
});
