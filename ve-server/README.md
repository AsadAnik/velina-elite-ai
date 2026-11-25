# ve-server — Velina Elite Backend API

> **RESTful backend for Velina Elite**, a full-featured e-commerce platform for beauty & personal-care products.  
> Built with **NestJS**, **Prisma ORM**, and **PostgreSQL** — containerised with **Docker**, backed by **Neon** serverless Postgres in production.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Models](#data-models)
- [API Modules](#api-modules)
- [Environment Setup](#environment-setup)
- [Getting Started](#getting-started)
- [Make Commands Reference](#make-commands-reference)
- [Database Migrations](#database-migrations)
- [Production Deployment](#production-deployment)
- [Database Backup](#database-backup)
- [API Documentation](#api-documentation)
- [Redis Caching](#redis-caching)
- [Project Structure](#project-structure)

---

## Overview

`ve-server` is the **Node.js / NestJS** backend powering the Velina Elite e-commerce store. It handles:

- JWT-based **authentication & role-based access control** (`customer` / `admin` / `owner`)
- Full **product catalogue** management with categories, sub-categories, and Cloudinary image uploads
- **Shopping cart**, **wishlist**, and **product ratings & reviews**
- **Order lifecycle** management with immutable order history tracking
- **Shipping cost** configuration (inside / outside Dhaka)
- Auto-generated **Swagger / OpenAPI** interactive documentation
- **Dockerised** development with hot-reload
- **Redis caching** for high-performance product catalogue queries
- **Multi-stage Docker build** for lean, optimised production images
- Automated **PostgreSQL backups** from the Neon production database

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 26 (Alpine) |
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| ORM | Prisma 7 |
| Database — Local | PostgreSQL 16 (Docker) |
| Database — Production | Neon (serverless PostgreSQL) |
| Authentication | JWT (`@nestjs/jwt`) |
| Image Storage | Cloudinary |
| Caching | Redis Stack + `cache-manager` |
| Validation | `class-validator` + `class-transformer` |
| API Docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Containerisation | Docker + Docker Compose |
| Package Manager | pnpm 11 |
| Testing | Jest + Supertest |

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                      NestJS App                        │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  Auth    │  │ Products │  │       Orders         │ │
│  │  Module  │  │  Module  │  │       Module         │ │
│  └──────────┘  └──────────┘  └──────────────────────┘ │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  Carts   │  │Wishlists │  │  Ratings / Addresses │ │
│  │  Module  │  │  Module  │  │       Modules        │ │
│  └──────────┘  └──────────┘  └──────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │            Prisma ORM  (type-safe client)        │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
          │ Local Dev                   │ Production
   ┌──────▼───────┐              ┌──────▼──────┐
   │  PostgreSQL  │              │    Neon     │
   │   (Docker)   │              │  Serverless │
   └──────────────┘              └─────────────┘
```

NestJS's **modular, layered architecture** is followed throughout:

- **Controllers** — map HTTP routes, handle request/response
- **Services** — encapsulate all business logic
- **DTOs** — strongly-typed, validated request/response shapes
- **Prisma** — type-safe, auto-generated database client

---

## Data Models

The Prisma schema (`prisma/schema.prisma`) defines these core entities:

| Model | Description |
|---|---|
| `User` | Auth identity — `username`, `email`, `password`, `role` |
| `Customer` | Customer profile linked 1-to-1 with a `User` |
| `Address` | Customer shipping addresses (multiple + default flag) |
| `Category` | Top-level product categories |
| `SubCategory` | Nested category hierarchy under `Category` |
| `Product` | Full product entity — pricing, stock, size, images, status |
| `Wishlist` | Saved products per customer (unique per customer + product) |
| `Cart` | Active cart items per customer (unique per customer + product) |
| `Order` | Order with payment method and full status lifecycle |
| `OrderItem` | Line items within an order (quantity + unit price) |
| `OrderHistory` | Immutable audit trail of every order status change |
| `ShippingCost` | Configurable delivery fees (inside / outside Dhaka) |
| `Rating` | Star rating + optional review comment (unique per customer + product) |

**Roles:** `customer` · `admin` · `owner`

**Order Status Flow:**
```
pending → confirmed → preparing → shipping → shipped
       → delivered → ready_for_receive → completed
       → cancelled (at any stage)
```

---

## API Modules

| Module | Route Prefix | Responsibility |
|---|---|---|
| Auth | `/auth` | Register, Login, JWT token issuance |
| Products | `/products` | CRUD + Cloudinary image upload |
| Categories | `/categories` | Top-level category management |
| Sub-Categories | `/sub-categories` | Nested category management |
| Orders | `/orders` | Place orders, update status, view history |
| Carts | `/carts` | Add / update / remove cart items |
| Wishlists | `/wishlists` | Save and manage wishlist items |
| Ratings | `/ratings` | Submit and retrieve product ratings |
| Addresses | `/addresses` | Customer address book |
| Shipping Costs | `/shipping-costs` | Admin delivery fee configuration |

Interactive documentation for all endpoints is available at [`/api/docs`](#api-documentation).

---

## Environment Setup

The project uses two environment files depending on the target environment:

| File | Purpose |
|---|---|
| `.env.local` | Local development — uses Docker PostgreSQL |
| `.env.production` | Production — uses Neon serverless PostgreSQL |

**Minimum required variables:**

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public

# JWT
JWT_SECRET=your_jwt_secret_here

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App
PORT=3000

# Redis (optional — falls back to in-memory cache if not set)
REDIS_HOST=redis
REDIS_PORT=6379
```

> ⚠️ Never commit `.env.*` files. Both are listed in `.gitignore`.

---

## Getting Started

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 11 | `npm install -g pnpm` |
| Docker Desktop | Latest | https://docs.docker.com/get-docker/ |
| PostgreSQL client tools | Any | Required for `make backup-prod` only |

### 1. Clone & Install

```bash
git clone <repo-url>
cd ve-server
pnpm install
```

> `postinstall` automatically runs `prisma generate` after install.

### 2. Configure Environment

```bash
# Copy and fill in your local values
cp .env.local.example .env.local
```

### 3. Start — Full Docker Stack (recommended)

```bash
make up
# App runs on http://localhost:8080
# PostgreSQL runs on localhost:5432
```

### 4. Start — Host Machine + Docker DB

```bash
make db-up        # Start only PostgreSQL in Docker
make run-local    # Run NestJS on host with hot-reload (.env.local)
```

---

## Make Commands Reference

All developer and operations workflows are wrapped in the [`Makefile`](./Makefile).

### 🔵 Local Development (Docker)

| Command | Description |
|---|---|
| `make up` | Start full stack — app + DB in Docker with `.env.local` |
| `make down` | Stop and remove all running containers |
| `make rebuild` | Force-rebuild Docker images and restart containers |
| `make logs` | Tail live logs from the `app` container |

### 🟢 DB-Only (for host-machine development)

| Command | Description |
|---|---|
| `make db-up` | Start only the PostgreSQL container |
| `make db-down` | Stop (not remove) the PostgreSQL container |

### 🟠 Host Machine Running

| Command | Description |
|---|---|
| `make run-local` | Run NestJS on host with hot-reload using `.env.local` (local DB) |
| `make run-neon` | Run NestJS on host with hot-reload using `.env.production` (Neon DB) |

### 🔴 Production

| Command | Description |
|---|---|
| `make compose-prod` | Build production image and start via `docker-compose.prod.yaml` |
| `make up-prod` | Build `ve-server:prod` image and run standalone container on port `3000` |

### 🗄️ Database Migrations

| Command | Description |
|---|---|
| `make migrate-local` | Run `prisma migrate dev` against the local Docker PostgreSQL |
| `make migrate-prod` | Run `prisma migrate deploy` against the Neon production database |

### 💾 Database Backup

| Command | Description |
|---|---|
| `make backup-prod` | `pg_dump` the production Neon DB → `backups/backup_YYYY-MM-DD.sql` |

---

## Database Migrations

Migrations are managed by **Prisma Migrate**. All migration files are committed to source control under `prisma/migrations/`.

```bash
# Create a new migration and apply it locally
make migrate-local

# Apply all pending migrations to production (safe, non-destructive)
make migrate-prod
```

> The production Docker image automatically runs `prisma migrate deploy` before the server starts.

---

## Production Deployment

The `Dockerfile` uses a **multi-stage build** to produce a minimal production image:

| Stage | Purpose |
|---|---|
| `builder` | Installs all dependencies, generates Prisma client, compiles TypeScript |
| `production` | Copies only compiled output + required files — no dev tooling |

On container start, `prisma migrate deploy` runs automatically, then `node dist/src/main` starts the server.

### Option A — Docker Compose *(recommended)*

```bash
make compose-prod
# Uses docker-compose.prod.yaml with .env.production
```

### Option B — Standalone Docker Container

```bash
make up-prod
# Builds ve-server:prod image and starts it on port 3000
```

---

## Database Backup

Production database backups are created using `pg_dump` against the Neon `DATABASE_URL` from `.env.production`.

```bash
make backup-prod
# ✅ Backup saved to backups/backup_2026-08-06.sql
```

- Backups are date-stamped and stored in `backups/`
- The `backups/` directory is **git-ignored** — backups are never committed

---

## API Documentation

When the server is running, **Swagger UI** is available at:

```
http://localhost:3000/api/docs
```

Includes:
- All endpoints grouped by module
- Full request/response schemas
- JWT Bearer authentication support (click **Authorize** to set your token)

---

## Redis Caching

The backend uses **Redis Stack** as a high-performance caching layer for the product catalogue. All product read endpoints (`findAll`, `findOne`, `findRelated`, `search`) implement the **cache-aside pattern** — checking Redis first and only querying PostgreSQL on a cache miss.

| Feature | Detail |
|---|---|
| Cache Store | Redis Stack (Docker) with in-memory fallback |
| Pattern | Cache-Aside (Lazy Loading) |
| Invalidation | Automatic on create / update / delete |
| Web UI | Redis Insight at `http://localhost:8001` |

> 📖 **Full documentation:** [`docs/REDIS_CACHING.md`](./docs/REDIS_CACHING.md) — architecture, cache key strategy, TTL guidelines, invalidation logic, extending to other modules, and troubleshooting.

---

## Project Structure

```
ve-server/
├── src/
│   ├── auth/               # JWT auth, guards, decorators
│   ├── products/           # Product CRUD + Cloudinary image upload
│   ├── categories/         # Top-level category management
│   ├── sub-categories/     # Sub-category management
│   ├── orders/             # Order placement & status lifecycle
│   ├── carts/              # Shopping cart management
│   ├── wishlists/          # Customer wishlist
│   ├── ratings/            # Product ratings & reviews
│   ├── addresses/          # Customer address book
│   ├── shipping-costs/     # Delivery fee configuration
│   ├── cloudinary/         # Cloudinary service wrapper
│   ├── redis/              # Global Redis cache module (cache-manager + fallback)
│   ├── prisma/             # PrismaService (singleton client)
│   ├── app.module.ts       # Root module
│   └── main.ts             # Bootstrap — Swagger, CORS, validation, port
├── prisma/
│   ├── schema.prisma       # All models, enums, relations
│   └── migrations/         # Migration history (committed)
├── backups/                # pg_dump output — git-ignored
├── docs/
│   └── REDIS_CACHING.md   # Full Redis caching documentation
├── Dockerfile              # Multi-stage build (builder → production)
├── docker-compose.yaml     # Local dev stack (app + PostgreSQL 16)
├── docker-compose.prod.yaml# Production compose config
├── Makefile                # All dev & ops commands
├── prisma.config.ts        # Prisma configuration
└── package.json            # Scripts, dependencies (pnpm 11)
```

---

## License

Private & Unlicensed — all rights reserved.
