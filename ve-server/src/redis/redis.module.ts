import { Global, Module, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
    imports: [
        CacheModule.registerAsync({
            useFactory: async () => {
                const logger = new Logger('RedisModule');
                const redisUrl = process.env.REDIS_URL;
                const redisHost = process.env.REDIS_HOST;
                const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

                try {
                    if (redisUrl) {
                        logger.log('Connecting to Redis via REDIS_URL...');
                        const store = await redisStore({
                            url: redisUrl,
                            ttl: 60 * 1000,
                        });
                        logger.log('Connected to Redis via REDIS_URL successfully.');
                        return { store };
                    } else if (redisHost) {
                        logger.log(`Connecting to Redis via ${redisHost}:${redisPort}...`);
                        const store = await redisStore({
                            socket: {
                                host: redisHost,
                                port: redisPort,
                            },
                            ttl: 60 * 1000,
                        });
                        logger.log('Connected to Redis successfully.');
                        return { store };
                    } else {
                        logger.warn('No REDIS_URL or REDIS_HOST configured. Using in-memory cache fallback.');
                        return { ttl: 60 * 1000 };
                    }
                } catch (error: any) {
                    logger.error(`Redis connection error (${error?.message || error}). Falling back to in-memory cache.`);
                    return { ttl: 60 * 1000 };
                }
            },
        }),
    ],
    exports: [CacheModule],
})
export class RedisModule {}

