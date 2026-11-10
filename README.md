# Velina Elite | E-Commerce & Autonomous AI Shopping Consultant

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-11.0-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Redis-Stack-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Next.js-16.2_(Turbopack)-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/pgvector-Cosine_HNSW-2E7D32?style=for-the-badge&logo=postgresql&logoColor=white" alt="pgvector" />
  <img src="https://img.shields.io/badge/Vector_RAG-In--Process-FF6F00?style=for-the-badge&logo=openai&logoColor=white" alt="Vector RAG" />
  <img src="https://img.shields.io/badge/HuggingFace-Transformers-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" alt="Hugging Face" />
</p>

<p align="center">
  <a href="https://velina-elite-bd.vercel.app" target="_blank"><strong>🌐 Live Storefront</strong></a> &nbsp;•&nbsp;
  <a href="https://velina-elite-bd.vercel.app/admin" target="_blank"><strong>🛡️ Live Admin Portal</strong></a> &nbsp;•&nbsp;
  <a href="https://velina-elite.onrender.com/api/docs" target="_blank"><strong>📘 Live Swagger API Docs</strong></a> &nbsp;•&nbsp;
  <a href="https://velina-elite.onrender.com" target="_blank"><strong>🟢 Backend Health Check</strong></a>
</p>

<p align="center">
  <a href="#-application-showcase"><strong>📸 App Showcase</strong></a> &nbsp;•&nbsp;
  <a href="#7-database-entity-relationship-diagram-erd"><strong>🗄️ Database ERD</strong></a> &nbsp;•&nbsp;
  <a href="#-architectural-highlight-in-process-vector-rag--ai-flow"><strong>🧠 Vector RAG Flow</strong></a>
</p>

---

## 📌 Executive Summary

**Velina Elite** is an enterprise-grade, fullstack luxury e-commerce platform and autonomous AI beauty shopping consultant tailored for original cosmetics, Korean skincare, and personal care routines.

Beyond standard storefronts, Velina Elite features a custom **in-process Vector RAG (Retrieval-Augmented Generation) pipeline** with **Server-Sent Events (SSE) typewriter streaming**. The assistant understands customer intent semantically (skin conditions, active ingredients, customized beauty routines) using 384-dimensional cosine similarity, zero external vector service costs, and an isolated dual-database architecture.

---

## 📸 Application Showcase

### 1. Storefront & Luxury Shopping Experience

| Desktop Storefront Experience | Instant Live Search Modal |
|:---:|:---:|
| <img src="readme_assets/home-desktop.png" alt="Desktop Storefront" width="100%"/> | <img src="readme_assets/search.png" alt="Live Instant Search" width="100%"/> |
| <sub>*Dynamic Hero Carousels, Curated Deals & Multi-Category Grids*</sub> | <sub>*High-speed modal search across categories, brands, and ingredients*</sub> |

---

### 2. Product Catalog & Advanced Faceted Filtering

| Light Mode Filtering | Dark Mode Filtering |
|:---:|:---:|
| <img src="readme_assets/products-filter-menu.png" alt="Products Filter Menu Light" width="100%"/> | <img src="readme_assets/products-filter-menu-dark.png" alt="Products Filter Menu Dark" width="100%"/> |
| <sub>*Multi-facet filtering: Category, Subcategory, Price Range & Stock Status*</sub> | <sub>*Full Theme Parity with seamless Dark Mode support across all UI elements*</sub> |

---

### 3. Velina AI Assistant (Streaming Vector RAG & Real-Time SSE)

| Desktop AI Consultant Modal | Live Customer Chat Logs Manager |
|:---:|:---:|
| <img src="readme_assets/ai-chat-desktop.png" alt="Desktop AI Chat Modal" width="100%"/> | <img src="readme_assets/chats-manager.png" alt="Admin Chat Sessions Manager" width="100%"/> |
| <sub>*Real-time token streaming with 3.5s keep-alive heartbeats & typewriter pacing*</sub> | <sub>*Centralized management of AI customer sessions with WhatsApp escalation*</sub> |

---

### 4. Mobile-First PWA Experience & Autonomous AI Chat

| Mobile Storefront Navigation | Mobile AI Beauty Advisor |
|:---:|:---:|
| <img src="readme_assets/home-mobile.png" alt="Mobile Storefront" width="320px"/> | <img src="readme_assets/ai-chat-mobile.png" alt="Mobile AI Chat" width="320px"/> |
| <sub>*Touch-optimized mobile browsing with floating action bar*</sub> | <sub>*Full-screen mobile conversational shopping with quick recommendation chips*</sub> |

---

### 5. Admin Management, Store Operations & CMS

| Executive Dashboard (Light Theme) | Executive Dashboard (Dark Theme) |
|:---:|:---:|
| <img src="readme_assets/dashboard-home.png" alt="Admin Dashboard Light" width="100%"/> | <img src="readme_assets/dashboard-home-dark.png" alt="Admin Dashboard Dark" width="100%"/> |
| <sub>*Sales analytics, order fulfillment status, inventory levels, and customer metrics*</sub> | <sub>*High-contrast dark mode for low-light administrative environments*</sub> |

| Dynamic Homepage Section Builder (CMS) | Role-Based Access Control (RBAC) Manager |
|:---:|:---:|
| <img src="readme_assets/home-customisations.png" alt="Homepage CMS Builder" width="100%"/> | <img src="readme_assets/admin-roles-manager.png" alt="Admin Roles Manager" width="100%"/> |
| <sub>*Drag-and-drop customization of banners, flash deals, and promotional grids*</sub> | <sub>*Granular administrative permissions (Admin, Owner, Staff) & security guards*</sub> |

---

### 6. Interactive OpenAPI / Swagger API Documentation

<p align="center">
  <a href="https://velina-elite.onrender.com/api/docs" target="_blank">
    <img src="readme_assets/swagger-api-docs.png" alt="Swagger OpenAPI Documentation" width="100%"/>
  </a>
  <br>
  <em>🔗 <strong>Live Swagger API Docs:</strong> <a href="https://velina-elite.onrender.com/api/docs" target="_blank"><code>https://velina-elite.onrender.com/api/docs</code></a> (Interactive RESTful &amp; SSE specs for Web &amp; Mobile)</em>
  <br>
  <em>🟢 <strong>Live Backend Health Check:</strong> <a href="https://velina-elite.onrender.com" target="_blank"><code>https://velina-elite.onrender.com</code></a> (Returns 200 OK)</em>
</p>

---

### 7. Database Entity Relationship Diagram (ERD)

<p align="center">
  <img src="readme_assets/ER-Diagram.jpeg" alt="Entity Relationship Diagram" width="100%"/>
  <br>
  <em>Relational PostgreSQL schema &amp; dedicated AI Vector Database architecture modeling User, Customer, Orders, Products, Categories, CMS Sections &amp; Vector Embeddings</em>
</p>

---

## 🧠 Architectural Highlight: In-Process Vector RAG & AI Flow

Most AI integrations naively send the entire product database or simple SQL `LIKE` queries to third-party LLMs, causing high latency, token limit exhaustion, and hallucinations. 

Velina Elite solves this by decoupling semantic search into an **In-Process Vector Pipeline** backed by **`pgvector`** with sub-millisecond HNSW indexing:

<p align="center">
  <img src="readme_assets/ai-architecture-rag.jpeg" alt="AI Architecture & In-Process Vector RAG Pipeline" width="100%"/>
  <br>
  <em>In-Process Vector RAG Pipeline: 384-dimensional semantic embeddings, HNSW cosine index, dual-database isolation, and real-time SSE typewriter streaming</em>
</p>

---

## ⚡ Core Engineering Highlights & Technical Depth

### 1. Dual-Database Topology (Zero-Blast-Radius Architecture)
- **Problem**: Running heavy vector similarity math (`<=>` cosine operations) and HNSW index rebuilds on transactional e-commerce tables can lock rows and degrade checkout database performance.
- **Solution**: Decoupled the operational database (`db:5432` / Neon DB) from the AI vector sidecar (`ai_vector_db:5433` / dedicated Neon vector branch). Vector queries execute independently and hydrate from Prisma only after IDs are ranked.

### 2. Zero-Cost, In-Process Neural Embeddings
- **Technology**: Hugging Face `@xenova/transformers` running the `all-MiniLM-L6-v2` model in server RAM using WebAssembly/ONNX.
- **Feature Extraction**: Implements mean-pooling and unit-norm normalization ($\|\vec{v}\| = 1.0$) directly in Node.js.
- **Resilience**: Features an algorithmic deterministic vector hash fallback (`generateDeterministicVector`), ensuring search never fails or times out even if offline or under constrained memory.

### 3. Reactive Server-Sent Events (SSE) via RxJS Observables
- **Typewriter Pacing**: Emits parsed word tokens with natural human reading delays (25ms).
- **Connection Keep-Alive**: Dispatches automated heartbeat status events every 3.5s to prevent proxy/Docker gateway timeouts (`504 Gateway Timeout`) on long LLM completions.
- **Leak-Free Cancellation**: Utilizes RxJS teardown functions (`return () => { isCancelled = true; }`) so closing the chat modal immediately aborts backend loops, conserving server resources.

### 4. Permission-First Consultative AI Guardrails
- **Consultative Persona**: The AI functions as a certified beauty specialist. It diagnoses issues (e.g. skin barrier breakdown, hyperpigmentation) and explains active ingredient routines (Ceramides, Centella, Salicylic Acid) **first**.
- **User Consent Enforcement**: Product cards are **strictly held back** until the user explicitly requests recommendations (*"suggest products"*) or affirms (*"yes please"*). Non-product inquiries (shipping rates, order tracking) never trigger product cards.

### 5. Production Cloud Readiness (Neon DB & Render)
- **SSL Auto-Negotiation**: `VectorDbService` dynamically detects cloud endpoints and injects `ssl: { rejectUnauthorized: false }` to prevent cloud SSL handshake rejections.
- **Auto-Sync on Bootstrap**: `ProductVectorSyncService` monitors the catalog on startup, automatically detecting and embedding unindexed products in batches of 20.

---

## 🛠️ Complete Tech Stack

| Domain | Technologies |
|:---|:---|
| **Core Language** | TypeScript 5.0 (Strict Mode across Client & Server) |
| **Backend API** | NestJS 11, RxJS (Observables & SSE), Prisma 7.8, Swagger OpenAPI, class-validator |
| **Databases & ORM**| PostgreSQL 16 (Neon Cloud / Local Docker), Prisma ORM 7.8 (PgAdapter) |
| **Caching & In-Memory** | Redis Stack (Caching, Session Store & Rate-limiting) |
| **Frontend Web** | Next.js 16 (Turbopack, App Router), React 19, Tailwind CSS v4, Lucide Icons, Sonner |
| **AI / ML & Vector** | In-Process Vector RAG, `@xenova/transformers` (`all-MiniLM-L6-v2`), `pgvector:pg16`, HNSW Cosine Indexing, Pollinations AI |
| **Cloud, DevOps & CDN** | Docker, Docker Compose, Render Cloud Services, Cloudinary CDN, `pnpm` |

---

## 🚀 Getting Started & Local Development

### Prerequisites
- Node.js 20+ (LTS recommended)
- **`pnpm`** (v11+ mandatory — do not use `npm` or `yarn`)
- Docker & Docker Compose

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/velina-elite.git
cd velina-elite
```

### 2. Environment Configuration
Create environment files in `ve-server` and `ve-web`:

```bash
# ve-server/.env.local (or .env)
PORT=8080
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/velina_elite_db?schema=public
AI_VECTOR_DATABASE_URL=postgresql://ai_vector_user:ai_vector_password@localhost:5433/velina_ai_vectors
REDIS_HOST=localhost
REDIS_PORT=6379
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ve-web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Spin Up Infrastructure via Docker
```bash
cd ve-server
docker compose up -d
```
*This starts `db:5432` (PostgreSQL), `ai_vector_db:5433` (pgvector), and `redis:6379`.*

### 4. Database Setup & 500-Product Seeding
```bash
# In ve-server:
pnpm install
pnpm prisma migrate deploy
pnpm prisma generate

# Seed 500 realistic beauty products with internet images:
pnpm seed:products

# (Optional) Seed reviews & vector index manually:
pnpm seed:ratings
pnpm seed:ai-vectors
```

### 5. Start Backend & Frontend
```bash
# Terminal 1: Backend API (Port 8080)
cd ve-server
pnpm start:dev

# Terminal 2: Frontend Web (Port 3000)
cd ve-web
pnpm install
pnpm dev
```

Visit **`http://localhost:3000`** in your browser to experience Velina Elite, and test the AI Assistant in the bottom right corner!

### 🌐 Live Cloud Deployment
- **Live Storefront (Next.js 16 on Vercel)**: [`https://velina-elite-bd.vercel.app`](https://velina-elite-bd.vercel.app)
- **Live Admin Portal**: [`https://velina-elite-bd.vercel.app/admin`](https://velina-elite-bd.vercel.app/admin)
- **Live Swagger API Docs (NestJS on Render)**: [`https://velina-elite.onrender.com/api/docs`](https://velina-elite.onrender.com/api/docs)
- **Live Backend Base URL / Health Check**: [`https://velina-elite.onrender.com`](https://velina-elite.onrender.com)

---

## 📖 Deep-Dive Engineering Documentation

For deep technical studies, architectural diagrams, and protocol walkthroughs, review the `/docs` directory:

- 📘 [`docs/vector-db-and-observables-guide.md`](docs/vector-db-and-observables-guide.md) — Comprehensive guide to `pgvector` Cosine Math, HNSW indexing, and RxJS Observable streaming.
- 📙 [`docs/sse-streaming-guide.md`](docs/sse-streaming-guide.md) — Technical spec on Server-Sent Events, buffer controls, and mobile client consumption (Flutter, React Native).
- 📕 [`docs/vector-rag-implementation-plan.md`](docs/vector-rag-implementation-plan.md) — Architectural design document for dual-database zero-blast-radius deployment.
- 📗 [`docs/ai-feature-limitations.md`](docs/ai-feature-limitations.md) — Analysis of relational SQL vs. vector semantic search benchmarks.

---

## 📄 License
This project is proprietary and built for high-performance portfolio demonstration. All rights reserved.
