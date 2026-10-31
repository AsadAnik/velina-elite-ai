# AI Feature Architecture & Known Limitations

> **Document Version:** 1.0  
> **Last Updated:** October 2026  
> **Target Service:** `ve-server/src/ai` (Velina Assistant)

---

## 1. Overview
The current AI Assistant feature is built as a lightweight **Retrieval-Augmented Generation (RAG)** service designed to answer customer queries regarding beauty/skincare products, shipping policies, and store details for *Velina Elite BD*.

While functional for small-scale use cases, the current implementation relies on simple relational SQL queries, unauthenticated free public LLM endpoints, and heuristic parsing. This document outlines the existing limitations and technical debt to serve as a roadmap for future refactoring.

---

## 2. Product Search & Retrieval Limitations (Grounding)

### 2.1 Full-Table Scan Bottlenecks (SQL `ILIKE` Substring Matching)
* **Implementation:** Located in `AiService.searchProducts()` using Prisma:
  ```typescript
  { title: { contains: token, mode: 'insensitive' } }
  ```
* **Limitation:** In PostgreSQL, wildcards (`ILIKE '%token%'`) cannot leverage standard B-Tree indexes. Every query triggers a full-table scan across `title`, `description`, `category.name`, and `sub_category.name`.
* **Scalability Trade-off:** With $N$ tokens, the system executes $N \times 4$ combinatorial `OR` conditions. As the product catalog scales (thousands of items), this will cause high database CPU load and slow query execution times.

### 2.2 Lack of Semantic Search (Zero Meaning/Intent Understanding)
* **Keyword-Only Matching:** SQL matching checks exact character sequences.
  * **Synonyms fail:** Searching for *"pimples"* will never match a product titled *"Acne Clarifying Serum"*.
  * **Intent / Concept fails:** Searching for *"my face feels dehydrated and peeling"* will not associate with *"Intense Moisture Barrier Cream"*.
  * **Typos fail:** Minor typographical errors (e.g. *"brunes"* or *"sunscren"*) fail to match valid products.
* **Why Vector Search / Embeddings are Needed:**
  * Real customer queries are conversational, emotional, or symptom-based.
  * Vector embeddings (e.g., via `pgvector` or a dedicated vector database) map words into semantic coordinate space, matching user intent rather than strict substring characters.

### 2.3 Naive Tokenization & Stop-Word Filtering
* **Token Filter (`length > 2`):**
  * Discards critical short industry terms, acronyms, and formulas (e.g., `BB` cream, `CC` cream, `O2`, `UV`).
  * Retains useless 3-letter stop words (e.g., `for`, `the`, `and`, `can`, `you`, `who`), adding unnecessary `ILIKE` conditions to SQL queries.

### 2.4 Arbitrary Fallback Bias
* **Static Take Limit:** Hardcoded to `take: 6` products ordered by `created_at: 'desc'`.
* **Recency Bias:** Matches are sorted by most recent products rather than match relevance or popularity.
* **Irrelevant Context Fallback:** If zero keyword matches occur, the system fetches the 4 newest active products. If a user asks about hair care, the AI may be provided unrelated perfume or lipstick context.

---

## 3. LLM Provider & Reliability Limitations

### 3.1 Reliance on Free Public Endpoint (`Pollinations AI`)
* **Endpoint:** `https://text.pollinations.ai/`
* **Risks:**
  * No Service Level Agreement (SLA) or uptime guarantee.
  * Subject to undocumented rate limits, latency spikes, or sudden schema changes.
  * Not suitable for high-concurrency production e-commerce traffic.

### 3.2 Hard Abort Timeout (15 seconds)
* Configured with `AbortSignal.timeout(15000)`. Slow network hops or public endpoint queues frequently push the service into the local fallback generator (`generateLocalFallback()`).

### 3.3 Lack of Streaming (Server-Sent Events / WebSockets)
* The chat endpoint uses a blocking HTTP POST (`POST /api/ai/chat`).
* Customers must wait for the entire roundtrip (DB query + external LLM completion + entity hydration) before receiving any response (poor Time-To-First-Token / TTFT).

---

## 4. Context Window & Multi-Turn History

### 4.1 Shallow History Window
* **Implementation:** `dto.history.slice(-6)` keeps only the last 6 messages.
* Longer consultations (e.g., skin analysis progressing into routine recommendations and finally order inquiries) lose earlier context, causing the AI to forget user preferences.

### 4.2 In-Memory Prompt Injection Risk
* The catalog string is directly concatenated into the system prompt:
  ```text
  [ID: 12] "Product Title" | Price: ৳1450 | Category: Skincare
  ```
* As the catalog size increases, prompt size grows linearly, risking token context overflow and increased token consumption costs.

---

## 5. Structured Data Output & Parsing Fragility

### 5.1 Regex Tag-Based Recommendation
* **Implementation:** The model is instructed to output recommendations as `[RECOMMENDED_PRODUCTS: id1, id2]`, which is parsed via regular expressions.
* **Fragility:**
  * LLMs are probabilistic. Deviations like `[Recommended Products: 1, 2]`, markdown codeblocks, or missing tags cause recommendation extraction to fail.
  * Leaked internal identifiers (e.g., `(ID: 4)`) require regex cleaning heuristics to avoid exposing backend IDs in chat text.
* **Modern Alternative:** Structured Outputs (e.g., JSON Schema enforcement or LLM Function / Tool Calling).

---

## 6. Security, Rate Limiting & Persistence

* **No Rate Limiting:** The `/ai/chat` endpoint lacks throttling (per-IP or per-user rate limits), leaving it vulnerable to bot abuse and server resource exhaustion.
* **No Server-Side Persistence:** Chat sessions are not persisted in PostgreSQL; conversation history is maintained entirely on the client and re-transmitted on each request.
* **Prompt Injection Defense:** User messages are passed directly without sanitization filters against system prompt overrides.

---

## 7. Recommended Future Roadmap

| Priority | Upgrade Area | Proposed Solution |
| :--- | :--- | :--- |
| **High** | **Vector Search / RAG** | Enable PostgreSQL `pgvector` extension; store product description embeddings (e.g., OpenAI `text-embedding-3-small` or open-source embeddings) for semantic matching. |
| **High** | **Official LLM Provider** | Migrate from Pollinations to official API keys (OpenAI GPT-4o-mini, Anthropic Claude, or Google Gemini) with enterprise quotas. |
| **Medium** | **Streaming Responses** | Implement Server-Sent Events (SSE) in NestJS (`@Sse`) for real-time typewriter output. |
| **Medium** | **Function / Tool Calling** | Replace `[RECOMMENDED_PRODUCTS: ...]` regex with native LLM function/tool calling for 100% deterministic product IDs. |
| **Medium** | **Rate Limiting & Caching** | Add NestJS `@nestjs/throttler` with Redis backend, plus semantic caching for common store policy / delivery questions. |
| **Low** | **Conversation Persistence** | Store `ChatSession` and `ChatMessage` models in PostgreSQL for customer service continuity and analytics. |

