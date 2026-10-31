# Vector Database & Semantic RAG Implementation Plan
## (Isolated Dual-Database Architecture)

> **Document Version:** 2.0 (Dual-Database Isolated Architecture)  
> **Status:** Approved Architectural Roadmap  
> **Target Environment:** `ve-server` (NestJS 11, Prisma, PostgreSQL 16, pgvector, Pollinations AI)

---

## 1. Executive Summary & Goal

This document outlines the implementation plan to upgrade the **Velina AI Assistant** from brittle SQL substring matching (`ILIKE '%token%'`) to a **Semantic Vector Search (RAG)** pipeline using an **Isolated Dual-Database Architecture (Sidecar Pattern)**.

### Core Objectives:
1. **Solve Query Intent Failures**: Queries like *"solution of skin"*, *"face peeling from sunburn"*, or *"pimples"* will semantically match the appropriate skincare treatments, barrier creams, and serums even when exact keyword matches do not exist.
2. **Zero Risk to Primary E-Commerce Store**:
   - The primary e-commerce PostgreSQL database (`db:5432`) remains **100% untouched** (no new extensions, no table alterations, no risk to existing customer orders, payments, or Prisma schemas).
   - A dedicated sidecar database (`ai_vector_db:5433`) is introduced specifically for vector embeddings and similarity math.
3. **Zero Additional API Costs (100% Free Stack)**:
   - **Chat LLM**: Retains the current free open-source **Pollinations AI** model (`openai` / GPT-4o-mini equivalent).
   - **Embedding Engine**: Runs lightweight, open-source sentence embeddings locally in NestJS via `@xenova/transformers` (`all-MiniLM-L6-v2`), requiring **zero paid OpenAI API keys**.
4. **Compatibility**: Full compatibility with the existing `ve-server` stack, Prisma ORM, and mobile API endpoints.

---

## 2. Architecture: The Isolated Dual-Database Topology

To guarantee absolute data safety for customer transactions and orders, we decouple transactional e-commerce data from AI vector search:

```
┌───────────────────────────────────────────────┐     ┌───────────────────────────────────────────────┐
│        Primary E-Commerce Database            │     │           Dedicated AI Vector Database        │
│          Service: `db` (Port 5432)            │     │         Service: `ai_vector_db` (Port 5433)   │
│         Image: `postgres:16-alpine`           │     │            Image: `pgvector/pgvector:pg16`    │
│                                               │     │                                               │
│   • Users, Admins, Auth                       │     │   • Product ID (Foreign Key reference)        │
│   • Orders, Payments, Shipping Costs          │     │   • Text Chunk (Title + Category + Summary)   │
│   • Product Catalog, Stock, Reviews           │     │   • 384-Dimensional Embedding Vector          │
│   • 100% UNTOUCHED (Zero schema alterations)  │     │   • HNSW Cosine Similarity Index              │
└───────────────────────┬───────────────────────┘     └───────────────────────┬───────────────────────┘
                        │                                                     │
                        │ 2. Hydrate full product cards                       │ 1. Vector similarity search
                        │    (real-time stock, prices, images)                │    returns matched IDs: [12, 18, 25]
                        ▼                                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             ve-server                                               │
│                                                                                                     │
│   User Message: "solution of skin"                                                                  │
│         │                                                                                           │
│         ▼                                                                                           │
│   In-Process Embedding Engine (@xenova/transformers: all-MiniLM-L6-v2) ──► 384-Float Query Vector  │
│         │                                                                                           │
│         ▼                                                                                           │
│   Pollinations AI (Prompt injected with real matched products) ──► SSE Typewriter Stream            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Why This Approach is Superior for E-Commerce

| Feature | Single DB (Modifying Primary Postgres) | Dual-Database Sidecar Pattern (Selected) |
| :--- | :--- | :--- |
| **Risk to Store Data** | Small risk during raw migration of core `Product` table. | **Zero Risk**: Primary DB is 100% untouched. |
| **CPU / RAM Workload** | Heavy vector calculations share RAM with customer checkouts. | **Isolated**: Vector math runs in its own container (`ai_vector_db`). |
| **Re-indexing / Reset** | Altering vector indexes requires table locks on live products. | You can wipe, re-seed, or rebuild AI vectors at any time without downtime. |
| **Prisma Schema** | Requires `Unsupported("vector")` tricks in core Prisma schema. | Core Prisma schema stays pristine. AI vectors use a simple raw client or lightweight secondary client. |
| **Cloud Portability** | Requires primary production DB to support custom extensions. | You can host the vector sidecar anywhere (local docker, Neon, Qdrant, or Supabase). |

---

## 4. Step-by-Step Implementation Roadmap

### Phase 1: Docker Setup (Adding `ai_vector_db`)

In `ve-server/docker-compose.yaml`, keep `db` completely untouched and add the `ai_vector_db` service:

```yaml
services:
  # 1. PRIMARY E-COMMERCE DB (100% Unchanged)
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: velina_elite_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

  # 2. DEDICATED AI VECTOR DB (New Sidecar Container)
  ai_vector_db:
    image: pgvector/pgvector:pg16
    restart: always
    environment:
      POSTGRES_USER: ai_vector_user
      POSTGRES_PASSWORD: ai_vector_password
      POSTGRES_DB: velina_ai_vectors
    ports:
      - '5433:5432'
    volumes:
      - ai_vector_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ai_vector_user -d velina_ai_vectors']
      interval: 5s
      timeout: 5s
      retries: 5

  # API Server connects to both
  app:
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/velina_elite_db?schema=public
      - AI_VECTOR_DATABASE_URL=postgresql://ai_vector_user:ai_vector_password@ai_vector_db:5432/velina_ai_vectors
    depends_on:
      db:
        condition: service_healthy
      ai_vector_db:
        condition: service_healthy
```

---

### Phase 2: Schema Definition in `ai_vector_db`

The AI database only needs a single, ultra-simple table for search indexing:

```sql
-- Executed inside velina_ai_vectors database
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS product_embeddings (
  id SERIAL PRIMARY KEY,
  product_id INTEGER UNIQUE NOT NULL,      -- Refers to Product.id in Primary DB
  search_text TEXT NOT NULL,               -- Title + Category + Key Benefits
  embedding vector(384) NOT NULL,          -- 384-dimensions for all-MiniLM-L6-v2
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fast Approximate Nearest Neighbor (HNSW) Index
CREATE INDEX IF NOT EXISTS product_embeddings_hnsw_idx 
ON product_embeddings 
USING hnsw (embedding vector_cosine_ops);
```

---

### Phase 3: In-Process Embeddings (`@xenova/transformers`)

#### 3.1 Install Dependency
Run in `ve-server`:
```bash
pnpm add @xenova/transformers pg
pnpm add -D @types/pg
```

#### 3.2 Implement `EmbeddingService` (`ve-server/src/ai/services/embedding.service.ts`)
Runs locally inside NestJS using open-source ONNX weights (zero external API calls, ~20ms latency):

```typescript
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { pipeline, env } from '@xenova/transformers';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: any;

  async onModuleInit() {
    this.logger.log('Initializing local embedding model (Xenova/all-MiniLM-L6-v2)...');
    env.allowLocalModels = true;
    this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    this.logger.log('Embedding model ready in server memory.');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const output = await this.extractor(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  }
}
```

---

### Phase 4: Vector Repository & Product Sync

#### 4.1 Dedicated Vector DB Connection Pool (`VectorDbService`)
Connects cleanly to `ai_vector_db:5433` using a standard `pg.Pool`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class VectorDbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VectorDbService.name);
  private pool: Pool;

  async onModuleInit() {
    const connectionString =
      process.env.AI_VECTOR_DATABASE_URL ||
      'postgresql://ai_vector_user:ai_vector_password@localhost:5433/velina_ai_vectors';

    this.pool = new Pool({ connectionString });
    this.logger.log('Connected to Dedicated AI Vector Database.');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }
}
```

#### 4.2 Initial Sync Script (`prisma/seed-ai-vectors.ts`)
Reads active products from the Primary DB via Prisma, generates embeddings, and upserts them into `ai_vector_db`:

```typescript
// For each active product in Primary DB:
const searchText = `${p.title}. Category: ${p.category?.name || 'Skincare'}. Description: ${p.description || ''}`;
const vector = await embeddingService.generateEmbedding(searchText);

await vectorPool.query(`
  INSERT INTO product_embeddings (product_id, search_text, embedding, updated_at)
  VALUES ($1, $2, $3::vector, NOW())
  ON CONFLICT (product_id) DO UPDATE 
  SET search_text = EXCLUDED.search_text,
      embedding = EXCLUDED.embedding,
      updated_at = NOW();
`, [p.id, searchText, `[${vector.join(',')}]`]);
```

---

### Phase 5: Two-Step Grounded Retrieval in `AiService`

Replace the fragile SQL `ILIKE` in `AiService.searchProducts` with the two-step retrieval flow:

```typescript
private async searchProductsSemantic(query: string): Promise<MatchedProduct[]> {
  try {
    // Step 1: Embed user query in-memory (< 20ms)
    const queryVector = await this.embeddingService.generateEmbedding(query);
    const vectorStr = `[${queryVector.join(',')}]`;

    // Step 2: Query Dedicated AI Vector DB for Top 6 matching product IDs
    const result = await this.vectorDbService.getPool().query(`
      SELECT 
        product_id,
        1 - (embedding <=> $1::vector) AS similarity
      FROM product_embeddings
      ORDER BY embedding <=> $1::vector ASC
      LIMIT 6;
    `, [vectorStr]);

    if (result.rows.length === 0) {
      return this.getLatestActiveProducts(4);
    }

    const matchedIds = result.rows.map((r) => r.product_id);

    // Step 3: Hydrate real-time prices & stock from Primary E-Commerce DB via Prisma
    return await this.prisma.product.findMany({
      where: { id: { in: matchedIds }, status: 'active' },
      include: { category: true, sub_category: true, ratings: true },
    });
  } catch (err) {
    this.logger.error(`Semantic search failed, falling back to latest products: ${err}`);
    return this.getLatestActiveProducts(4);
  }
}
```

---

### Phase 6: Hardened Fallback Strategy

Update `generateLocalFallback()` in `ai.service.ts`:
If the external Pollinations LLM experiences a network spike or timeout, **never return a generic greeting for beauty/skin queries**. Return the retrieved product recommendations immediately:

```typescript
private generateLocalFallback(query: string, products: MatchedProduct[], shippingContext: string): string {
  const q = query.toLowerCase();
  const isBangla = /[\u0980-\u09FF]/.test(query);

  if (q.includes('delivery') || q.includes('shipping')) {
    return `📦 Velina Elite Delivery Information:\n${shippingContext}\nCash on Delivery available nationwide!`;
  }

  // If semantic search found matching products, always return them!
  if (products.length > 0) {
    const ids = products.slice(0, 3).map((p) => p.id).join(', ');
    return isBangla
      ? `আপনার ত্বক ও রূপচর্চার জন্য আমাদের সেরা কিছু সাজেস্টেড পণ্য নিচে দেওয়া হলো:\n[RECOMMENDED_PRODUCTS: ${ids}]`
      : `Here are our top recommended products for your skin and beauty routine:\n[RECOMMENDED_PRODUCTS: ${ids}]`;
  }

  return `Hello! I am Velina AI Assistant. How can I assist you with your beauty and skincare routine today?`;
}
```

---

## 5. Timeline & Task Checklist

| Step | Component | Description |
| :--- | :--- | :--- |
| **1** | `docker-compose.yaml` | Add `ai_vector_db` service on port `5433` (leave `db:5432` untouched). |
| **2** | `ve-server/package.json` | Add `@xenova/transformers` and `pg`. |
| **3** | `embedding.service.ts` | Initialize local in-process embedding engine. |
| **4** | `vector-db.service.ts` | Connect to `ai_vector_db:5433` via connection pool. |
| **5** | `seed-ai-vectors.ts` | Create one-click seed script to generate embeddings for all products. |
| **6** | `ai.service.ts` | Update `searchProducts` to two-step search & harden fallback. |
| **7** | Verification | Test `"solution of skin"` and confirm relevant products stream to UI. |

---

## 6. Verification Test Scenarios

| User Query | Expected Behavior |
| :--- | :--- |
| `"solution of skin"` | Matches barrier repair creams, soothing serums, and cleansers (no more generic greeting). |
| `"something for pimples"` | Matches Centella spot treatments and Salicylic acid cleansers. |
| `"face feels burned after sun"` | Matches Aloe Vera soothing gels and SPF 50 sunscreens. |
| `"তৈলাক্ত ত্বকের জন্য সিরাম"` | Matches Niacinamide sebum-control serums in natural Bangla. |
