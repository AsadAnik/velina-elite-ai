import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/velina_elite_db?schema=public',
  }),
});

async function seedRatings() {
  console.log('🌱 Starting ratings seeding script...');

  const sampleCustomers = [
    { fname: 'Nusrat', lname: 'Jahan', email: 'nusrat.jahan@gmail.com', username: 'nusrat-jahan' },
    { fname: 'Ayesha', lname: 'Rahman', email: 'ayesha.rahman@gmail.com', username: 'ayesha-r' },
    { fname: 'Tanjila', lname: 'Akter', email: 'tanjila.akter@gmail.com', username: 'tanjila-a' },
    { fname: 'Sultana', lname: 'Parvin', email: 'sultana.parvin@gmail.com', username: 'sultana-p' },
    { fname: 'Farhana', lname: 'Islam', email: 'farhana.islam@gmail.com', username: 'farhana-i' },
    { fname: 'Sadia', lname: 'Chowdhury', email: 'sadia.chowdhury@gmail.com', username: 'sadia-c' },
    { fname: 'Mehzabin', lname: 'Ahmed', email: 'mehzabin.ahmed@gmail.com', username: 'mehzabin-a' },
    { fname: 'Tasnim', lname: 'Kazi', email: 'tasnim.kazi@gmail.com', username: 'tasnim-k' },
    { fname: 'Anika', lname: 'Tabassum', email: 'anika.tabassum@gmail.com', username: 'anika-t' },
    { fname: 'Sharmin', lname: 'Sultana', email: 'sharmin.sultana@gmail.com', username: 'sharmin-s' },
    { fname: 'Humayra', lname: 'Zerin', email: 'humayra.zerin@gmail.com', username: 'humayra-z' },
    { fname: 'Tamanna', lname: 'Yeasmin', email: 'tamanna.yeasmin@gmail.com', username: 'tamanna-y' },
    { fname: 'Mariya', lname: 'Hossain', email: 'mariya.hossain@gmail.com', username: 'mariya-h' },
    { fname: 'Nabila', lname: 'Khan', email: 'nabila.khan@gmail.com', username: 'nabila-k' },
    { fname: 'Rafi', lname: 'Ahmed', email: 'rafi.ahmed@gmail.com', username: 'rafi-ahmed' },
  ];

  const reviewComments = [
    "100% authentic product! Loved the texture and results on my skin.",
    "Extremely satisfied with the purchase! Delivery was fast and quality is top notch.",
    "Super hydrating and gentle. Will definitely reorder again from Velina Elite!",
    "Great value for money. Smells wonderful and feels very premium.",
    "Highly recommended! Visible improvements within a few days of use.",
    "Original product, fast delivery, packaging was amazing.",
    "Very nice product! Fits my skin type perfectly.",
    "Simply awesome! My go-to daily beauty staple now.",
    "Loved it so much! 5 stars without any doubt.",
    "Good product overall. Works really well and gentle on skin.",
    "Best beauty purchase this month! Really pleased with the outcome.",
    "Smooth finish and long lasting effect. Definitely genuine product.",
    "Bought it for the second time. Super happy with Velina Elite service!",
    "Five stars! Smooth application and non-sticky feel."
  ];

  // 1. Ensure sample customers exist
  const customerRecords: Array<{ id: number; user_id: number; fname: string; lname: string }> = [];
  for (const sc of sampleCustomers) {
    let user = await prisma.user.findUnique({
      where: { email: sc.email },
      include: { customer: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: sc.username,
          email: sc.email,
          password: '$2a$10$w09u.Hk0/d4nBqC45Y268.mX9sH1sY5S4mQ8P.g7H2aP5M1s6A5K6',
          role: Role.customer,
          customer: {
            create: {
              fname: sc.fname,
              lname: sc.lname,
              phone: `+88017${Math.floor(10000000 + Math.random() * 90000000)}`,
              gender: Math.random() > 0.1 ? 'female' : 'male',
            },
          },
        },
        include: { customer: true },
      });
    }

    if (user.customer) {
      customerRecords.push(user.customer);
    }
  }

  console.log(`👤 Found/created ${customerRecords.length} sample customer profiles.`);

  // 2. Fetch all products
  const products = await prisma.product.findMany();
  console.log(`📦 Found ${products.length} products to seed ratings for.`);

  if (products.length === 0) {
    console.log('❌ No products found in database.');
    return;
  }

  let seededCount = 0;

  // 3. For each product, seed 8 to 10 ratings
  for (const product of products) {
    const targetCount = Math.floor(Math.random() * 3) + 8; // 8, 9, or 10 ratings per product
    const shuffled = [...customerRecords].sort(() => 0.5 - Math.random());
    const selectedCustomers = shuffled.slice(0, Math.min(targetCount, customerRecords.length));

    for (const customer of selectedCustomers) {
      const stars = Math.random() < 0.75 ? 5 : 4; // 75% 5-star, 25% 4-star -> Avg ~4.75 stars
      const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];

      const randomDaysAgo = Math.floor(Math.random() * 60);
      const createdDate = new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000);

      try {
        await prisma.rating.upsert({
          where: {
            customer_id_product_id: {
              customer_id: customer.id,
              product_id: product.id,
            },
          },
          update: {
            stars,
            comment,
          },
          create: {
            customer_id: customer.id,
            product_id: product.id,
            stars,
            comment,
            created_at: createdDate,
          },
        });
        seededCount++;
      } catch (err) {
        // Ignore duplicate edge cases
      }
    }
  }

  console.log(`✨ Successfully seeded ${seededCount} total ratings across ${products.length} products!`);
}

seedRatings()
  .catch((e) => {
    console.error('❌ Error seeding ratings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
