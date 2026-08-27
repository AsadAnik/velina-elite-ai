import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Global() // This will make Global Everywhere without importing in each module
@Module({
    imports: [
        CacheModule.registerAsync({
            useFactory: async () => ({
                store: await redisStore({
                    socket: {
                        host: process.env.REDIS_HOST || 'localhost',
                        port: parseInt(process.env.REDIS_PORT || '6379', 10),
                    },
                    // TTL in milliseconds (default: 60 seconds)
                    ttl: 60 * 1000,
                })
            })
        })
    ],
    exports: []
})

export class RedisModule {}
