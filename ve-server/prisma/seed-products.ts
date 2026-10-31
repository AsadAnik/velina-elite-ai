import 'dotenv/config';
import { PrismaClient, ProductStatus, ProductSizeUnit } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// High resolution, authentic beauty, skincare, makeup and cosmetics images from Unsplash
const PRODUCT_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1608248597359-57779b90875c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1617897903246-719242758050?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1503236823255-94609f598e71?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515688594390-b649af70d282?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585232351009-aa87416fca90?w=800&auto=format&fit=crop&q=80',
];

const CATEGORIES_DATA = [
  {
    name: 'Skincare',
    subCategories: [
      'Face Serums & Ampoules',
      'Moisturizers & Creams',
      'Sunscreens & SPF',
      'Cleansers & Face Washes',
      'Toners & Essences',
      'Eye Care & Eye Creams',
      'Face Masks & Peels',
      'Acne & Blemish Treatments',
    ],
  },
  {
    name: 'Makeup',
    subCategories: [
      'Lipsticks & Lip Tints',
      'Foundations & BB Creams',
      'Eyeshadows & Eyeliners',
      'Concealers & Correctors',
      'Blushes & Highlighters',
      'Setting Powders & Sprays',
    ],
  },
  {
    name: 'Haircare',
    subCategories: [
      'Shampoos & Scalp Care',
      'Conditioners & Hair Masks',
      'Hair Serums & Oils',
      'Anti-Dandruff Treatments',
    ],
  },
  {
    name: 'Bath & Body',
    subCategories: [
      'Body Lotions & Butters',
      'Body Washes & Shower Gels',
      'Body Scrubs & Exfoliants',
      'Hand & Foot Creams',
    ],
  },
  {
    name: 'Fragrance',
    subCategories: [
      'Eau de Parfum (EDP)',
      'Body Mists & Sprays',
      'Roll-on Perfume Oils',
    ],
  },
  {
    name: 'Beauty Tools',
    subCategories: [
      'Facial Rollers & Gua Sha',
      'Makeup Brushes & Sponges',
      'Cleansing Accessories',
    ],
  },
];

const BRANDS = [
  'COSRX', 'Beauty of Joseon', 'Skin1004', 'Anua', 'The Ordinary',
  'CeraVe', 'La Roche-Posay', 'Laneige', 'Some By Mi', 'Axis-Y',
  'Haruharu Wonder', 'Klairs', 'Isntree', 'Round Lab', 'Torriden',
  'I’m From', 'Mediheal', 'Rom&nd', 'Etude House', 'Peripera',
  'Rare Beauty', 'Fenty Beauty', 'Focallure', 'Olaplex', 'Moroccanoil'
];

const INGREDIENTS = [
  'Centella Asiatica (Cica)', 'Niacinamide 10%', 'Hyaluronic Acid Multi-Complex',
  'Salicylic Acid (BHA 2%)', 'Glycolic Acid (AHA 7%)', 'Pure Vitamin C 15%',
  'Retinol 0.2% & Squalane', 'Ceramide NP Barrier Complex', 'Snail Secretion Filtrate 96%',
  'Heartleaf 77% Soothing Extract', 'Green Tea & Panthenol', 'Rice Bran & Alpha Arbutin',
  'Propolis & B5 Glow Complex', 'Peptide 9 Firming Complex', 'Mugwort Calming Essence',
  'Zinc PCA Oil Control', 'Rose Water & Aloe Barbadensis', 'Tea Tree Purifying Oil',
  'Bakuchiol Plant Retinol', 'Marine Collagen Hydro-Gel'
];

const BENEFITS = [
  'Deeply hydrates and restores compromised skin barriers for 48 hours.',
  'Visibly clears stubborn acne, calms redness, and controls excessive sebum.',
  'Brightens dark spots, hyperpigmentation, and creates a radiant glass skin glow.',
  'Provides broad-spectrum UV protection without any white cast or greasy residue.',
  'Soothes irritated, burning, and sensitive skin with instant cooling relief.',
  'Firms and plumps fine lines, promoting youthful skin elasticity and texture.',
  'Gently exfoliates dead skin cells, unclogs congested pores, and smooths rough patches.'
];

/**
 * Deterministic 384-dimensional vector embedding generator
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
  console.log('🚀 Starting 500 Products & Categories Seeder...');

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

  console.log(`Connecting to Primary DB: ${dbUrl}`);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: dbUrl,
    }),
  });

  console.log(`Connecting to AI Vector DB: ${vectorDbUrl}`);
  const pool = new Pool({ connectionString: vectorDbUrl });

  try {
    // 1. Ensure Categories and SubCategories exist
    console.log('📦 Seeding Categories and SubCategories...');
    const subCategoryMap: { [subCatName: string]: { subCatId: number; catId: number } } = {};
    const allSubCatList: { subCatName: string; catName: string; subCatId: number; catId: number }[] = [];

    for (const catData of CATEGORIES_DATA) {
      let category = await prisma.category.findFirst({
        where: { name: catData.name },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: catData.name },
        });
      }

      for (const subCatName of catData.subCategories) {
        let subCategory = await prisma.subCategory.findFirst({
          where: { name: subCatName, category_id: category.id },
        });

        if (!subCategory) {
          subCategory = await prisma.subCategory.create({
            data: {
              name: subCatName,
              category_id: category.id,
            },
          });
        }

        subCategoryMap[subCatName] = { subCatId: subCategory.id, catId: category.id };
        allSubCatList.push({
          subCatName,
          catName: catData.name,
          subCatId: subCategory.id,
          catId: category.id,
        });
      }
    }

    console.log(`✅ Ensured ${CATEGORIES_DATA.length} categories and ${allSubCatList.length} subcategories.`);

    // 2. Prepare AI Vector DB Table
    let isVectorDbAvailable = false;
    try {
      const vClient = await pool.connect();
      await vClient.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
      await vClient.query(`
        CREATE TABLE IF NOT EXISTS product_embeddings (
          id SERIAL PRIMARY KEY,
          product_id INTEGER UNIQUE NOT NULL,
          search_text TEXT NOT NULL,
          embedding vector(384) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await vClient.query(`
        CREATE INDEX IF NOT EXISTS product_embeddings_hnsw_idx 
        ON product_embeddings 
        USING hnsw (embedding vector_cosine_ops);
      `);
      vClient.release();
      isVectorDbAvailable = true;
      console.log('✅ AI Vector Database is initialized and ready for auto-indexing.');
    } catch (vErr) {
      console.warn('⚠️ Vector DB unavailable during seeding (will only populate Primary DB):', vErr);
    }

    // 3. Generate 500 Unique Authentic Beauty Products
    console.log('🌸 Creating 500 authentic beauty & skincare products...');
    const TARGET_COUNT = 500;
    let createdCount = 0;
    const batchSize = 50;

    for (let i = 1; i <= TARGET_COUNT; i++) {
      const subCat = allSubCatList[(i - 1) % allSubCatList.length];
      const brand = BRANDS[(i * 3) % BRANDS.length];
      const ingredient = INGREDIENTS[(i * 7) % INGREDIENTS.length];
      const benefit = BENEFITS[(i * 5) % BENEFITS.length];

      // Realistic product title
      const title = `${brand} ${ingredient} ${subCat.subCatName.replace(/s$/, '')} (#${i})`;

      // Dynamic authentic description
      const description = `The authentic ${brand} ${ingredient} is specially formulated for Velina Elite customers looking for genuine, luxury beauty solutions. Key Features:\n• Formulated with pure ${ingredient} for maximum bioavailability.\n• ${benefit}\n• Suitable for dry, sensitive, oily, and combination skin types.\n• 100% authentic imported guarantee with verified batch code.`;

      // Random realistic pricing in BDT
      const basePrice = 650 + ((i * 37) % 3200);
      const regularPrice = Math.round(basePrice * (1.15 + ((i % 10) * 0.02)));
      const mrpPrice = Math.round(regularPrice * 1.1);
      const saveAmount = regularPrice - basePrice;
      const savePercentage = Math.round((saveAmount / regularPrice) * 100);

      // Random image selections
      const img1 = PRODUCT_IMAGES[(i * 2) % PRODUCT_IMAGES.length];
      const img2 = PRODUCT_IMAGES[(i * 3 + 1) % PRODUCT_IMAGES.length];

      // Size
      const sizeUnits: ProductSizeUnit[] = [ProductSizeUnit.ml, ProductSizeUnit.gm];
      const unit = sizeUnits[i % 2];
      const sizes = [30, 50, 75, 100, 150, 200, 250];
      const size = sizes[i % sizes.length];

      const product = await prisma.product.create({
        data: {
          title,
          description,
          price: basePrice,
          regular_price: regularPrice,
          mrp_price: mrpPrice,
          save_amount: saveAmount,
          save_percentage: savePercentage,
          stock_quantity: 15 + (i % 85),
          images_url: [img1, img2],
          status: ProductStatus.active,
          category_id: subCat.catId,
          sub_category_id: subCat.subCatId,
          currency_symbol: '৳',
          size: size,
          size_unit: unit,
        },
      });

      // 4. Upsert vector into AI Vector DB
      if (isVectorDbAvailable) {
        const searchText = `Product: ${title}. Category: ${subCat.catName} > ${subCat.subCatName}. Description: ${description.slice(0, 300)}`;
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
          [product.id, searchText, vectorStr],
        );
      }

      createdCount++;
      if (createdCount % 50 === 0 || createdCount === TARGET_COUNT) {
        process.stdout.write(`\r✨ Created and embedded ${createdCount} / ${TARGET_COUNT} products...`);
      }
    }

    console.log(`\n\n🎉 Done! Successfully seeded ${createdCount} products into Primary DB and indexed in AI Vector DB!`);
  } catch (error) {
    console.error('❌ Seeder encountered an error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

