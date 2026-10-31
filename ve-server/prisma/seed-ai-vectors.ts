import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Deterministic vector generator for product embeddings (384 dimensions)
 */
function generateVector(text: string, dimensions = 384): number[] {
  const vector = new Array(dimensions).fill(0);
  const tokens = text.toLowerCase().split(/\s+/);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let hash = 0;
    for (let j = 0; j < token.length; j++) {
      hash = (hash << 5) - hash + token.charCodeAt(j);
      hash |= 0;
    }

    const index = Math.abs(hash) % dimensions;
    const weight = 1.0 / Math.sqrt(i + 1);
    vector[index] += weight;

    if (i > 0) {
      const bigram = `${tokens[i - 1]}_${token}`;
      let biHash = 0;
      for (let k = 0; k < bigram.length; k++) {
        biHash = (biHash << 5) - biHash + bigram.charCodeAt(k);
        biHash |= 0;
      }
      const biIndex = Math.abs(biHash) % dimensions;
      vector[biIndex] += weight * 0.5;
    }
  }

  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm) || 1.0;

  return vector.map((v) => v / norm);
}

async function main() {
  console.log('🚀 Starting AI Vector Seeder for Velina Elite...');

  // Normalize URLs so the script works both inside Docker and directly from Mac terminal
  let dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/velina_elite_db?schema=public';
  if (dbUrl.includes('@db:5432')) {
    dbUrl = dbUrl.replace('@db:5432', '@localhost:5432');
  }

  let vectorDbUrl =
    process.env.AI_VECTOR_DATABASE_URL ||
    'postgresql://ai_vector_user:ai_vector_password@localhost:5433/velina_ai_vectors';
  if (vectorDbUrl.includes('@ai_vector_db:5432')) {
    vectorDbUrl = vectorDbUrl.replace('@ai_vector_db:5432', '@localhost:5433');
  }

  console.log(`Connecting to Primary DB at: ${dbUrl}`);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: dbUrl,
    }),
  });

  console.log(`Connecting to AI Vector DB at: ${vectorDbUrl}`);
  const pool = new Pool({ connectionString: vectorDbUrl });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to AI Vector Database.');

    // 1. Ensure table and extension exist
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
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
    await client.query(`
      CREATE INDEX IF NOT EXISTS product_embeddings_hnsw_idx 
      ON product_embeddings 
      USING hnsw (embedding vector_cosine_ops);
    `);
    client.release();

    // 2. Fetch active products from Primary Database
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      include: { category: true, sub_category: true },
    });

    console.log(`Found ${products.length} active products in Primary Database.`);

    // 3. Generate embeddings and upsert
    let synced = 0;
    for (const p of products) {
      const parts = [
        `Product: ${p.title}`,
        p.category?.name ? `Category: ${p.category.name}` : '',
        p.sub_category?.name ? `SubCategory: ${p.sub_category.name}` : '',
        p.description ? `Description: ${p.description.slice(0, 300)}` : '',
      ].filter(Boolean);

      const searchText = parts.join('. ');
      const vector = generateVector(searchText, 384);
      const vectorStr = `[${vector.join(',')}]`;

      await pool.query(
        `
        INSERT INTO product_embeddings (product_id, search_text, embedding, updated_at)
        VALUES ($1, $2, $3::vector, NOW())
        ON CONFLICT (product_id) DO UPDATE 
        SET search_text = EXCLUDED.search_text,
            embedding = EXCLUDED.embedding,
            updated_at = NOW();
        `,
        [p.id, searchText, vectorStr],
      );

      synced++;
      process.stdout.write(`\rEmbedded [${synced}/${products.length}] products...`);
    }

    console.log(`\n🎉 Successfully synced and embedded ${synced} products into AI Vector Database!`);
  } catch (error) {
    console.error('❌ AI Vector Seeder encountered an error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

