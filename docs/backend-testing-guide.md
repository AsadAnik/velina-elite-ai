# Backend Unit & Integration Testing Guide (`ve-server`)

A practical engineering guide to automated testing in the **Velina Elite** NestJS backend (`ve-server`), covering test architecture, Jest configuration, commands, patterns, and how to write new unit and integration tests.

---

## 1. Testing Strategy & Architecture

We follow the **Testing Pyramid** tailored for NestJS + Prisma:

| Layer | Scope | Dependencies | Location | Speed |
|---|---|---|---|---|
| **Unit Tests** | Single service, guard, or utility function in isolation | Mocked (`PrismaService`, `JwtService`, `CloudinaryService`, `CACHE_MANAGER`, `bcrypt`) | `src/<module>/__tests__/*.spec.ts` | Milliseconds |
| **Integration Tests** | HTTP route → `JwtAuthGuard` / `RolesGuard` → `ValidationPipe` / `ParseIntPipe` → Controller → Service | Real NestJS HTTP pipeline (`supertest`), mocked DB/external services | `src/<module>/__tests__/*.controller.int.spec.ts` / `*.module.int.spec.ts` | Sub-second |
| **E2E Tests** | Full `AppModule` against a real PostgreSQL / Redis instance | Live test DB (`DATABASE_URL`) | `test/*.e2e-spec.ts` | Seconds |

### Why Both Unit & Integration Tests?
- **Unit tests** verify business rules fast (e.g., stock validation, discount clamping, ownership checks, `$transaction` rollbacks).
- **Integration tests** catch wiring bugs that unit tests miss: route paths, HTTP status codes (`201`, `204`, `400`, `401`, `403`, `404`, `409`), `RolesGuard` RBAC enforcement, `ValidationPipe` DTO rules, `ParseIntPipe`, and multipart file uploads.

---

## 2. Jest Configuration (`ve-server/package.json`)

Jest is configured under the `"jest"` key in `ve-server/package.json`:

- **`rootDir`: `"src"`** — Scans all source modules under `ve-server/src`.
- **`testRegex`: `".*\\.spec\\.ts$"`** — Discovers any `*.spec.ts` file, including inside module `__tests__/` folders.
- **`transform`: `{ "^.+\\.(t|j)s$": "ts-jest" }`** — Compiles TypeScript tests on the fly.
- **`moduleNameMapper`: `{ "^src/(.*)$": "<rootDir>/$1" }`** — Maps `tsconfig.json` `src/*` path aliases (e.g., `src/products/dto/create-product.dto`) so Jest resolves them cleanly.
- **`testEnvironment`: `"node"`** — Runs in Node.js.

---

## 3. Running Tests (`pnpm`)

> Always use `pnpm` in this workspace (never `npm` or `yarn`).

Run all commands from the `ve-server/` directory:

```bash
cd ve-server

# Run the entire unit + integration test suite
pnpm test

# Run tests for a single module
pnpm test src/orders/__tests__/

# Run a single test file
pnpm test src/products/__tests__/products.service.spec.ts

# Watch mode while developing
pnpm run test:watch

# Generate HTML & LCOV coverage report (output: ve-server/coverage/lcov-report/index.html)
pnpm run test:cov

# Clear Jest cache if module resolution or config changes aren't picked up
pnpm test -- --clearCache && pnpm test

# Run E2E tests (requires a running PostgreSQL test database)
pnpm run test:e2e
```

---

## 4. Current Backend Test Coverage Inventory

All core backend modules include dedicated `__tests__/` suites (**38 test suites, 270 tests**):

| Module | Unit Tests | Integration Tests |
|---|---|---|
| `app` | `src/app.controller.spec.ts` | — |
| `addresses` | `src/addresses/__tests__/addresses.service.spec.ts` | `addresses.controller.int.spec.ts`, `addresses.controller.int.more.spec.ts` |
| `admin-users` | `src/admin-users/__tests__/admin-users.service.spec.ts` | `admin-users.controller.int.spec.ts` |
| `auth` | `src/auth/auth.service.spec.ts`, `src/auth/__tests__/auth.service.spec.ts`, `guards.spec.ts` | `auth.controller.int.spec.ts` |
| `carts` | `src/carts/__tests__/carts.service.spec.ts` | `carts.controller.int.spec.ts` |
| `categories` | `src/categories/__tests__/categories.service.spec.ts` | `categories.controller.int.spec.ts` |
| `cloudinary` | `src/cloudinary/__tests__/cloudinary.service.spec.ts` | `cloudinary.module.int.spec.ts` |
| `customers` | `src/customers/__tests__/customers.service.spec.ts` | `customers.controller.int.spec.ts` |
| `dashboard` | `src/dashboard/__tests__/dashboard.service.spec.ts` | `dashboard.controller.int.spec.ts` |
| `home-sections` | `src/home-sections/__tests__/home-sections.service.spec.ts` | `home-sections.controller.int.spec.ts` |
| `orders` | `src/orders/__tests__/orders.service.spec.ts` | `orders.controller.int.spec.ts` |
| `products` | `src/products/__tests__/products.service.spec.ts`, `pricing.util.spec.ts` | `products.controller.int.spec.ts` |
| `ratings` | `src/ratings/__tests__/ratings.service.spec.ts` | `ratings.controller.int.spec.ts` |
| `redis` | — | `redis.module.int.spec.ts` |
| `shipping-costs` | `src/shipping-costs/__tests__/shipping-costs.service.spec.ts` | `shipping-costs.controller.int.spec.ts` |
| `site-settings` | `src/site-settings/__tests__/site-settings.service.spec.ts` | `site-settings.controller.int.spec.ts` |
| `sub-categories` | `src/sub-categories/__tests__/sub-categories.service.spec.ts` | `sub-categories.controller.int.spec.ts` |
| `wishlists` | `src/wishlists/__tests__/wishlists.service.spec.ts` | `wishlists.controller.int.spec.ts` |

---

## 5. How to Write a Unit Test

### Pattern: Service with Mocked `PrismaService`

```ts
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { MyService } from '../my.service';

const prismaMock = {
  myModel: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('MyService (unit)', () => {
  let service: MyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws NotFoundException when record is missing', async () => {
    prismaMock.myModel.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
```

### Mocking `prisma.$transaction`
For interactive transactions (`prisma.$transaction(async (tx) => ...)`), pass a `txMock` into the callback:

```ts
const txMock = {
  order: { create: jest.fn() },
  product: { update: jest.fn() },
};

const prismaMock = {
  $transaction: jest.fn(async (cb: (tx: typeof txMock) => Promise<any>) => cb(txMock)),
};
```

For batch array transactions (`prisma.$transaction([op1, op2])`), resolve the array with `Promise.all(ops)`:

```ts
$transaction: jest.fn(async (ops: Promise<any>[]) => Promise.all(ops)),
```

---

## 6. How to Write a Controller Integration Test

Use `supertest` with `Test.createTestingModule` so NestJS executes real routing, `RolesGuard`, `ValidationPipe`, `ParseIntPipe`, and multipart interceptors:

```ts
import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { MyController } from '../my.controller';
import { MyService } from '../my.service';

let mockAuthUser = { sub: 1, role: Role.admin, customerId: 50 };

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = mockAuthUser;
    return true;
  }
}

describe('MyController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyController],
      providers: [
        MyService,
        RolesGuard,
        Reflector,
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
    mockAuthUser = { sub: 1, role: Role.admin, customerId: 50 };
  });

  afterAll(async () => {
    await app.close();
  });

  it('enforces RolesGuard (403 for customer)', async () => {
    mockAuthUser = { sub: 99, role: Role.customer, customerId: 99 };
    await request(app.getHttpServer()).post('/my-route').expect(403);
  });
});
```

---

## 7. Troubleshooting Common Test Errors

1. **`Nest can't resolve dependencies of the JwtAuthGuard (?, PrismaService)`**
   - Your controller uses `@UseGuards(JwtAuthGuard)`, which depends on `JwtService`.
   - Fix: Override `JwtAuthGuard` with `.overrideGuard(JwtAuthGuard).useClass(MockJwtAuthGuard)` or import `JwtModule.register(...)` in the test module.
2. **`Cannot find module 'src/...'`**
   - Ensure `moduleNameMapper` is present in `ve-server/package.json` (`"^src/(.*)$": "<rootDir>/$1"`) and clear Jest's cache with `pnpm test -- --clearCache`.
3. **Multipart / File Upload tests returning `400 Bad Request`**
   - Check the controller's DTO (`class-validator` + `ValidationPipe` with `transform: true`). Multipart form fields arrive as strings, so `@Type(() => Number)` fields require all mandatory DTO properties to be sent via `.field(key, value)`.
4. **Mocks leaking across tests**
   - Always call `jest.clearAllMocks()` in `afterEach()` and reset any shared `mockAuthUser` state.
