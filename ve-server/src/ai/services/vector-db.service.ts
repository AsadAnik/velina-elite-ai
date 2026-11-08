import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';

export interface SimilarProductResult {
  product_id: number;
  similarity: number;
}

@Injectable()
export class VectorDbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VectorDbService.name);
  private pool: Pool | null = null;
  private isConnected = false;

  async onModuleInit() {
    await this.initDatabase();
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('Disconnected from AI Vector Database.');
    }
  }

  /**
   * Initializes the dedicated AI Vector Database pool, enables pgvector,
   * and creates the schema and HNSW index if they do not exist.
   */
  async initDatabase() {
    const connectionString = process.env.AI_VECTOR_DATABASE_URL || 'postgresql://ai_vector_user:ai_vector_password@localhost:5433/velina_ai_vectors';

    try {
      const isSsl = connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') || process.env.NODE_ENV === 'production';

      this.pool = new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      });

      // Verify connection
      const client = await this.pool.connect();
      try {
        // 1. Enable pgvector extension
        await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

        // 2. Create product_embeddings table
        await client.query(`
          CREATE TABLE IF NOT EXISTS product_embeddings (
            id SERIAL PRIMARY KEY,
            product_id INTEGER UNIQUE NOT NULL,
            search_text TEXT NOT NULL,
            embedding vector(384) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // 3. Create HNSW Cosine Index for sub-millisecond similarity search
        await client.query(`
          CREATE INDEX IF NOT EXISTS product_embeddings_hnsw_idx 
          ON product_embeddings 
          USING hnsw (embedding vector_cosine_ops);
        `);

        this.isConnected = true;
        this.logger.log('Successfully connected and initialized Dedicated AI Vector Database (pgvector).');
      } finally {
        client.release();
      }
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(
        `Dedicated AI Vector Database unavailable at ${connectionString}. Vector search will gracefully fall back: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Searches product embeddings using Cosine Distance (<=> operator).
   * Similarity score = 1 - (embedding <=> query_vector).
   */
  // region SEARCH PRODUCTS
  async searchSimilarProducts(queryEmbedding: number[], limit = 6): Promise<SimilarProductResult[]> {
    if (!this.isConnected || !this.pool) {
      return [];
    }

    try {
      const vectorStr = `[${queryEmbedding.join(',')}]`;

      const result = await this.pool.query(
        `
        SELECT 
          product_id,
          1 - (embedding <=> $1::vector) AS similarity
        FROM product_embeddings
        ORDER BY embedding <=> $1::vector ASC
        LIMIT $2;
        `,
        [vectorStr, limit],
      );

      return result.rows.map((r) => ({
        product_id: Number(r.product_id),
        similarity: Number(r.similarity),
      }));
    } catch (error) {
      this.logger.error(`Vector similarity search query failed: ${error}`);
      return [];
    }
  }

  /**
   * Upserts an embedding for a specific product
   */
  // region UPSERT EMBEDDING
  async upsertProductEmbedding(productId: number, searchText: string, embedding: number[]): Promise<void> {
    if (!this.isConnected || !this.pool) return;

    try {
      const vectorStr = `[${embedding.join(',')}]`;

      await this.pool.query(
        `
        INSERT INTO product_embeddings (product_id, search_text, embedding, updated_at)
        VALUES ($1, $2, $3::vector, NOW())
        ON CONFLICT (product_id) DO UPDATE 
        SET search_text = EXCLUDED.search_text,
            embedding = EXCLUDED.embedding,
            updated_at = NOW();
        `,
        [productId, searchText, vectorStr],
      );
    } catch (error) {
      this.logger.error(`Failed to upsert product embedding for ID ${productId}: ${error}`);
    }
  }

  /**
   * Deletes an embedding if a product is removed
   */
  // region DELETE EMBEDDING
  async deleteProductEmbedding(productId: number): Promise<void> {
    if (!this.isConnected || !this.pool) return;

    try {
      await this.pool.query(
        `DELETE FROM product_embeddings WHERE product_id = $1`,
        [productId],
      );
    } catch (error) {
      this.logger.error(`Failed to delete product embedding for ID ${productId}: ${error}`);
    }
  }

  /**
   * Returns existing product IDs already embedded in vector DB
   */
  // region GET PRODUCT ID'S
  async getExistingProductIds(): Promise<Set<number>> {
    if (!this.isConnected || !this.pool) return new Set();

    try {
      const result = await this.pool.query(
        `SELECT product_id FROM product_embeddings;`,
      );
      return new Set(result.rows.map((r) => Number(r.product_id)));
    } catch {
      return new Set();
    }
  }

  /**
   * Count total embeddings stored
   */
  // region COUNT EMBEDDINGS
  async countEmbeddings(): Promise<number> {
    if (!this.isConnected || !this.pool) return 0;

    try {
      const result = await this.pool.query(
        `SELECT COUNT(*) FROM product_embeddings;`,
      );
      return Number(result.rows[0]?.count || 0);
    } catch {
      return 0;
    }
  }

  get isReady(): boolean {
    return this.isConnected;
  }
}

