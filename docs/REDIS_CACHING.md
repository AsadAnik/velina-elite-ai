# Redis Caching — Velina Elite Backend

> **High-performance caching layer** for the Velina Elite product catalogue.  
> Built with **Redis Stack**, **NestJS Cache Manager**, and **cache-manager-redis-yet** — containerised via **Docker Compose** with an automatic **in-memory fallback** when Redis is unavailable.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [How It Works — Cache-Aside Pattern](#how-it-works--cache-aside-pattern)
- [Cached Endpoints](#cached-endpoints)
- [Cache Key Strategy](#cache-key-strategy)
- [Cache Invalidation](#cache-invalidation)
- [Infrastructure](#infrastructure)
- [Environment Variables](#environment-variables)
- [Module Structure](#module-structure)
- [Redis Insight — Web UI](#redis-insight--web-ui)
- [Quick Start](#quick-start)
- [Extending Caching to Other Modules](#extending-caching-to-other-modules)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Redis caching system accelerates product-related API responses by storing frequently queried data in-memory. It follows the **Cache-Aside** (Lazy Loading) pattern:

- **Read endpoints** check Redis first → return instantly on cache hit → query PostgreSQL on miss → store result in Redis
- **Write endpoints** (create/update/delete) automatically **invalidate** stale cache entries so users always see fresh data
- **Graceful fallback** — if Redis is unavailable, the system silently falls back to an in-memory cache with the same TTL strategy

---

## Architecture

```
                    ┌──────────────────────────────────┐
                    │          NestJS App               │
                    │                                    │
  HTTP Request ───► │  Controller → ProductsService     │
                    │       │                            │
                    │       ▼                            │
                    │  ┌─────────┐    ┌──────────────┐ │
                    │  │  Cache  │◄──►│ Redis Stack  │ │
                    │  │ Manager │    │  (port 6379) │ │
                    │  └────┬────┘    └──────────────┘ │
                    │       │ cache miss                 │
                    │       ▼                            │
                    │  ┌──────────────────────────────┐ │
                    │  │   Prisma ORM → PostgreSQL    │ │
                    │  └──────────────────────────────┘ │
                    └──────────────────────────────────┘

  Flow:
  1️⃣  Request hits ProductsService
  2️⃣  Service checks Redis cache (by computed cache key)
  3️⃣  Cache HIT  → return instantly (sub-millisecond)
  4️⃣  Cache MISS → query PostgreSQL via Prisma
  5️⃣  Store result in Redis with TTL
  6️⃣  Return response to client
```

---

## Tech Stack

| Component | Technology | Version |
|---|---|---|
| Cache Store | Redis Stack | `latest` (Docker) |
| NestJS Integration | `@nestjs/cache-manager` | ^3.1.3 |
| Cache Manager | `cache-manager` | ^7.2.9 |
| Redis Adapter | `cache-manager-redis-yet` | ^5.1.5 |
| Redis Client | `redis` (node-redis) | ^6.2.1 |
| Web UI | Redis Insight | Built into Redis Stack |

---

## How It Works — Cache-Aside Pattern

The system implements the **Cache-Aside** (Lazy Loading) pattern — the most common and safest caching strategy for read-heavy workloads:

```
┌─────────┐         ┌───────┐         ┌────────────┐
│  Client  │────────►│ Cache │         │  Database  │
└─────────┘         └───┬───┘         └──────┬─────┘
                        │                     │
            ┌───── HIT? ┤                     │
            │           │                     │
         YES│        NO │                     │
            │           │                     │
            ▼           ▼                     │
        Return      Query DB ────────────────►│
        cached      Store result in cache     │
        data        Return fresh data ◄───────┘
```

### Read Flow (findOne, findAll, findRelated, search)

```typescript
// 1️⃣ Build a deterministic cache key
const cacheKey = this.buildDetailsCacheKey(id);

// 2️⃣ Try cache first
const cached = await this.cache.get(cacheKey);
if (cached) return cached;  // ⚡ ~0.1ms

// 3️⃣ Cache miss — query database
const product = await this.prisma.product.findUnique({ where: { id } });

// 4️⃣ Store in cache with TTL
await this.cache.set(cacheKey, product, 300_000); // 5 minutes

return product;
```

### Write Flow (create, update, delete)

```typescript
// 1️⃣ Perform the write operation
await this.prisma.product.update({ where: { id }, data: dto });

// 2️⃣ Invalidate all product caches
await this.invalidateProductCaches(id);
```

---

## Cached Endpoints

| Endpoint | Method | Cache Key Pattern | TTL | Reason |
|---|---|---|---|---|
| `GET /products` | `findAll` | `products:list:page=1&limit=10&...` | **60 sec** | Lists change often; short TTL keeps them fresh |
| `GET /products/:id` | `findOne` | `products:detail:{id}` | **5 min** | Individual products change less frequently |
| `GET /products/:id/related` | `findRelated` | `products:related:{id}:limit={n}` | **2 min** | Related products are semi-stable |
| `GET /products/search` | `search` | `products:search:{query}:limit={n}` | **60 sec** | Search results should stay current |

### Cache Invalidation Triggers

| Endpoint | Method | Action |
|---|---|---|
| `POST /products` | `createProduct` | Invalidate all `products:*` keys |
| `PATCH /products/:id` | `updateProduct` | Invalidate `products:detail:{id}` + all lists |
| `PATCH /products/:id/status` | `updateProductStatus` | Invalidate `products:detail:{id}` + all lists |
| `DELETE /products/:id` | `remove` | Invalidate `products:detail:{id}` + all lists |

---

## Cache Key Strategy

Cache keys follow a **namespaced, deterministic** format to avoid collisions and enable targeted invalidation:

```
products:list:category_id=5&limit=10&page=1&sort_by=newest
products:detail:42
products:related:42:limit=4
products:search:moisturizer:limit=8
```

### Key Design Principles

1. **Namespace prefix** — All keys start with `products:` for easy pattern‑matching during invalidation
2. **Sorted query params** — List cache keys sort query parameters alphabetically so `?page=1&limit=10` and `?limit=10&page=1` produce the same key
3. **Null filtering** — Undefined/null params are excluded, so default queries produce shorter keys
4. **Deterministic** — Same input always produces the same key

### Key Builder Methods

```typescript
// List cache key — sorts and joins all non‑null query params
private buildListCacheKey(query: ProductsQueryDto): string {
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `products:list:${parts}`;
}

// Detail cache key — simple id‑based
private buildDetailsCacheKey(id: number): string {
  return `products:detail:${id}`;
}
```

---

## Cache Invalidation

The `invalidateProductCaches` method handles cache busting after any write operation:

```typescript
private async invalidateProductCaches(productId?: number): Promise<void> {
  // 1. Delete the specific product detail cache
  if (productId) {
    await this.cache.del(this.buildDetailsCacheKey(productId));
  }

  // 2. Delete ALL product list/related/search caches
  const store = (this.cache as any).stores?.[0] ?? (this.cache as any).store;
  if (store?.keys) {
    const keys: string[] = await store.keys('products:*');
    for (const key of keys) {
      await this.cache.del(key);
    }
  }
}
```

### Invalidation Strategy

| Scenario | What Gets Invalidated | Why |
|---|---|---|
| Product created | All `products:*` keys | New product might appear in any list query |
| Product updated | `products:detail:{id}` + all lists | Updated data must be fresh everywhere |
| Product status changed | `products:detail:{id}` + all lists | Status filters would show stale results |
| Product deleted | `products:detail:{id}` + all lists | Deleted product must disappear from lists |

> ⚠️ The current strategy uses `KEYS products:*` for pattern matching. This is fine for small‑to‑medium catalogues (< 10,000 cached keys). For high‑traffic production, consider switching to Redis `SCAN` or a **tag‑based invalidation** approach.

---

## Infrastructure

### Docker Compose Service

The Redis instance is defined in `docker-compose.yaml`:

```yaml
# region REDIS & REDIS/STACK
redis:
  image: redis/redis-stack:latest
  container_name: velina-redis
  restart: always
  ports:
    - '6379:6379'   # Redis Server Port
    - '8001:8001'   # Redis Insight Web UI
  volumes:
    - redis_data:/data
  healthcheck:
    test: ['CMD', 'redis-cli', 'ping']
    interval: 5s
    timeout: 3s
    retries: 5
```

**Why Redis Stack?** — Includes Redis Insight (web UI on port 8001), RedisJSON, RediSearch, and RedisTimeSeries out of the box.

### App Service Dependencies

The `app` service depends on Redis:

```yaml
app:
  environment:
    - REDIS_HOST=redis
    - REDIS_PORT=6379
  depends_on:
    redis:
      condition: service_started
```

---

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `REDIS_URL` | — | No | Full Redis connection URL (takes priority over HOST/PORT) |
| `REDIS_HOST` | `localhost` | No | Redis server hostname |
| `REDIS_PORT` | `6379` | No | Redis server port |

**Connection priority:** `REDIS_URL` → `REDIS_HOST:REDIS_PORT` → in‑memory fallback

```env
# .env.local — Docker Compose (service name as host)
REDIS_HOST=redis
REDIS_PORT=6379

# Production — Use REDIS_URL for managed Redis (e.g., Upstash, Redis Cloud)
# REDIS_URL=redis://default:password@host:6379
```

---

## Module Structure

### Redis Module (`src/redis/redis.module.ts`)

The `RedisModule` is a **global module** — imported once in `AppModule`, available everywhere:

```typescript
@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        const logger = new Logger('RedisModule');

        if (process.env.REDIS_URL) {
          // Production: connect via URL
          const store = await redisStore({ url: process.env.REDIS_URL, ttl: 60_000 });
          return { store };
        } else if (process.env.REDIS_HOST) {
          // Docker: connect via host/port
          const store = await redisStore({
            socket: { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || '6379') },
            ttl: 60_000,
          });
          return { store };
        } else {
          // Fallback: in-memory cache
          logger.warn('No Redis configured. Using in-memory cache.');
          return { ttl: 60_000 };
        }
      },
    }),
  ],
  exports: [CacheModule],  // ← CRITICAL: must export for other modules to inject CACHE_MANAGER
})
export class RedisModule {}
```

### Service Integration (`src/products/products.service.ts`)

Cache Manager is injected via the `CACHE_MANAGER` token:

```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly cloudinaryService: CloudinaryService,
  @Inject(CACHE_MANAGER) private readonly cache: Cache,
) {}
```

---

## Redis Insight — Web UI

When running with Docker Compose, **Redis Insight** is available at:

```
http://localhost:8001
```

Use it to:
- Browse all cached keys and their values
- Monitor real‑time Redis commands
- Inspect TTLs on individual keys
- Debug cache hit/miss behaviour
- View memory usage statistics

---

## Quick Start

### 1. Start the Stack

```bash
make up
# or
docker compose up -d
```

### 2. Verify Redis is Running

```bash
docker exec velina-redis redis-cli ping
# → PONG
```

### 3. Test Cache Behaviour

```bash
# First request — cache MISS (hits PostgreSQL)
curl http://localhost:8080/products/1

# Second request — cache HIT (served from Redis, ~0.1ms)
curl http://localhost:8080/products/1

# Check server logs for cache HIT/MISS indicators
docker compose logs app | grep -E "Cache (HIT|MISS)"
```

### 4. Browse Cached Keys

Open [http://localhost:8001](http://localhost:8001) → Redis Insight → Browse keys starting with `products:*`

---

## Extending Caching to Other Modules

To add Redis caching to another module (e.g., `CategoriesService`):

### 1. Inject Cache Manager

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}
}
```

> No module imports needed — `RedisModule` is `@Global()`.

### 2. Add Cache‑Aside to Read Methods

```typescript
async findAll() {
  const cacheKey = 'categories:list';

  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;

  const categories = await this.prisma.category.findMany();
  await this.cache.set(cacheKey, categories, 300_000); // 5 min TTL

  return categories;
}
```

### 3. Add Invalidation to Write Methods

```typescript
async create(dto: CreateCategoryDto) {
  const category = await this.prisma.category.create({ data: dto });

  // Invalidate category caches
  const store = (this.cache as any).stores?.[0] ?? (this.cache as any).store;
  if (store?.keys) {
    const keys = await store.keys('categories:*');
    for (const key of keys) await this.cache.del(key);
  }

  return category;
}
```

### TTL Guidelines

| Data Type | Recommended TTL | Reason |
|---|---|---|
| Listings / search results | 30–60 sec | Change frequently with new products |
| Individual records | 2–5 min | More stable, less churn |
| Configuration / settings | 10–30 min | Rarely changes |
| Static content | 1–24 hours | Almost never changes |

---

## Troubleshooting

### Redis Connection Failed — Falling Back to In‑Memory

```
[RedisModule] Redis connection error (...). Falling back to in-memory cache.
```

**Fix:** Ensure Redis is running: `docker compose up redis -d`

### CACHE_MANAGER Provider Not Found

```
Nest can't resolve dependencies of ProductsService (?, CloudinaryService, ?).
```

**Fix:** Ensure `RedisModule` exports `CacheModule`:
```typescript
exports: [CacheModule]  // NOT exports: []
```

### Cache Not Being Hit (Always MISS)

Possible causes:
1. **TTL too short** — increase TTL values
2. **Different cache keys** — check that query params produce the same key (order matters → use sorted key builder)
3. **Redis not connected** — check `docker compose logs redis`
4. **Write operations invalidating too aggressively** — review invalidation patterns

### Viewing Cache Keys

```bash
# List all product cache keys
docker exec velina-redis redis-cli KEYS "products:*"

# Get a specific cached value
docker exec velina-redis redis-cli GET "products:detail:1"

# Check TTL remaining on a key
docker exec velina-redis redis-cli TTL "products:detail:1"

# Flush all caches (development only!)
docker exec velina-redis redis-cli FLUSHALL
```

---

## Related Files

| File | Purpose |
|---|---|
| `src/redis/redis.module.ts` | Global Redis cache module with connection + fallback logic |
| `src/products/products.service.ts` | Product caching implementation (cache‑aside + invalidation) |
| `src/app.module.ts` | Root module — imports `RedisModule` |
| `docker-compose.yaml` | Redis Stack service definition |
| `.env.local` | Redis connection variables (local development) |

---

*Built with ❤️ for Velina Elite*