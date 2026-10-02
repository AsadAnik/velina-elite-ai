import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateProductDto, ProductStatus } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { buildPricingSummary } from './pricing.util';
import { ProductsQueryDto } from './dto/products-query.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService, private readonly cloudinaryService: CloudinaryService, @Inject(CACHE_MANAGER) private readonly cache: Cache) { }

  /**
   * Build a unique cache key from query params.
   * e.g. "products:list:page=1&limit=10&category_id=5"
   * @param query 
   * @returns 
   */
  // region LIST CACHE-KEY
  private buildListCacheKey(query: ProductsQueryDto): string {
    const parts = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `products:list:${parts}`;
  }

  /**
   * Cache key for a single product: "products:details:42"
   * @param id 
   * @returns 
   */
  // region DETAILS CACHE-KEY
  private buildDetailsCacheKey(id: number): string {
    return `products:detail:${id}`;
  }

  /**
   * Invalidate ALL product caches.
   * Called after create/update/delete to keep data fresh.
   */
  // region INVALIDATE CACHE
  private async invalidateProductCaches(productId?: number): Promise<void> {
    // 1. Delete the specific product cache
    if (productId) {
      await this.cache.del(this.buildDetailsCacheKey(productId));
    }

    // 2. Delete all list/related caches (they might contain stale data)
    const store = (this.cache as any).stores?.[0] ?? (this.cache as any).store;
    if (store?.keys) {
      const keys: string[] = await store.keys('products:*');
      for (const key of keys) {
        await this.cache.del(key);
      }
    }
  }

  /**
   * CREATE PRODUCT SERVICE
   * @param dto createProductDto
   * @returns Object
   */
  // region Create Product
  async createProduct(dto: CreateProductDto) {
    const { images, ...data } = dto;
    const regularPrice = Number(dto.regular_price ?? dto.price ?? 0);
    const mrpPrice = Number(dto.mrp_price ?? regularPrice);
    const pricingSummary = buildPricingSummary({ regularPrice, mrpPrice });

    const product = await this.prisma.product.create({
      data: {
        ...data,
        price: regularPrice,
        regular_price: regularPrice,
        mrp_price: mrpPrice,
        save_amount: pricingSummary.saveAmount,
        save_percentage: pricingSummary.savePercentage,
        currency_symbol: dto.currency_symbol ?? '৳',
        description: dto.description || '',
      },
      include: {
        category: true,
        sub_category: true,
      },
    });

    // 🗑️ Invalidate list caches (new product should appear in lists)
    await this.invalidateProductCaches();

    return product;
  }

  /**
   * UPDATE PRODUCT SERVICE
   * @param id product_id
   * @param dto updateProductDto
   */
  // region Update Product
  async updateProduct(id: number, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        sub_category: true,
      },
    });

    if (!product) throw new NotFoundException(`Product #${id} not found`);

    // Detect images that were removed and delete them from Cloudinary
    if (dto.images_url !== undefined) {
      const newImageUrls = Array.isArray(dto.images_url) ? dto.images_url : dto.images_url ? [dto.images_url as string] : [];
      const oldImageUrls = product.images_url || [];

      const removedImages = oldImageUrls.filter((url) => !newImageUrls.includes(url));
      if (removedImages.length > 0) {
        await this.cloudinaryService.deleteMultipleFiles(removedImages);
      }
    }

    const regularPrice = dto.regular_price ?? dto.price ?? product.regular_price ?? product.price ?? 0;
    const mrpPrice = dto.mrp_price ?? product.mrp_price ?? regularPrice;
    const pricingSummary = buildPricingSummary({ regularPrice: Number(regularPrice), mrpPrice: Number(mrpPrice) });

    await this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        price: Number(regularPrice),
        regular_price: Number(regularPrice),
        mrp_price: Number(mrpPrice),
        save_amount: pricingSummary.saveAmount,
        save_percentage: pricingSummary.savePercentage,
        currency_symbol: dto.currency_symbol ?? product.currency_symbol,
      },
      include: {
        category: true,
        sub_category: true,
      },
    });

    // 🗑️ Invalidate this product + all lists
    await this.invalidateProductCaches(id);
  }

  /**
   * UPDATE PRODUCT STATUS SERVICE
   * @param id product_id
   * @param status product_status
   */
  // region Update Status
  async updateProductStatus(id: number, status: ProductStatus) {
    await this.findOne(id);
    await this.prisma.product.update({
      where: { id },
      data: { status },
    });

    // 🗑️ Invalidate
    await this.invalidateProductCaches(id);

    return { message: `Product #${id} is updated successfully!` };
  }

  /**
   * FIND ONE PRODUCT SERVICE — ⚡ CACHED!
   * @param id product_id
   */
  // region Find One Product
  async findOne(id: number) {
    const cacheKey = this.buildDetailsCacheKey(id);

    // 1️⃣ Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return cached;
    }

    // 2️⃣ Cache miss — query DB
    console.log(`❌ Cache MISS: ${cacheKey}`);
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        sub_category: true,
        ratings: { select: { stars: true } },
      },
    });

    if (!product) throw new NotFoundException(`Product #${id} not found`);

    // 3️⃣ Store in cache (TTL: 5 minutes = 300,000ms)
    await this.cache.set(cacheKey, product, 300_000);

    return product;
  }

  /**
   * FIND ALL PRODUCT SERVICE — ⚡ CACHED!
   * @param page page_number
   * @param limit limit_number
   * @returns Object
   */
  // region Find All Products
  async findAll({ page = 1, limit = 10, category_id, sub_category_id, status, search, min_price, max_price, sort_by }: ProductsQueryDto = {}) {
    const cacheKey = this.buildListCacheKey({ page, limit, category_id, sub_category_id, status, search, min_price, max_price, sort_by });

    // 1️⃣ Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return cached;
    }

    // 2️⃣ Cache miss — run the full query
    console.log(`❌ Cache MISS: ${cacheKey}`);
    const skip = (page - 1) * limit;

    const priceFilter: { gte?: number; lte?: number } = {};
    if (min_price !== undefined && min_price !== null) priceFilter.gte = Number(min_price);
    if (max_price !== undefined && max_price !== null) priceFilter.lte = Number(max_price);

    const where: any = {
      ...(category_id ? { category_id: Number(category_id) } : {}),
      ...(sub_category_id ? { sub_category_id: Number(sub_category_id) } : {}),
      ...(status ? { status } : {}),
      ...(Object.keys(priceFilter).length > 0 ? { price: priceFilter } : {}),
      ...(search && search.trim() !== ''
        ? {
          OR: [
            { title: { contains: search.trim(), mode: 'insensitive' } },
            { description: { contains: search.trim(), mode: 'insensitive' } },
            { category: { name: { contains: search.trim(), mode: 'insensitive' } } },
            { sub_category: { name: { contains: search.trim(), mode: 'insensitive' } } },
          ],
        }
        : {}),
    };

    let orderBy: any = { created_at: 'desc' };
    if (sort_by === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort_by === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort_by === 'newest') {
      orderBy = { created_at: 'desc' };
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        skip,
        take: limit,
        where,
        include: {
          category: true,
          sub_category: true,
          ratings: { select: { stars: true } },
        },
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const result = {
      data: products,
      meta: {
        total,
        page,
        limit,
        total_pages: totalPages,
      },
    };

    // 3️⃣ Store in cache (TTL: 60 seconds for lists — shorter because lists change often)
    await this.cache.set(cacheKey, result, 60_000);

    return result;
  }

  /**
   * SEARCH PRODUCTS SERVICE (Live Autocomplete / Dropdown) — ⚡ CACHED!
   * @param query search keyword
   * @param limit maximum items to return
   */
  // region Search Products
  async search(query?: string, limit: number = 8) {
    const q = (query || '').trim();
    if (!q) {
      return [];
    }

    const safeLimit = Math.min(Math.max(1, limit), 20);
    const normalizedQuery = q.toLowerCase();
    const cacheKey = `products:search:${normalizedQuery}:limit=${safeLimit}`;

    // 1️⃣ Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return cached;
    }

    // 2️⃣ Cache miss - query DB
    console.log(`❌ Cache MISS: ${cacheKey}`);
    const products = await this.prisma.product.findMany({
      where: {
        status: 'active',
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
          { sub_category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: safeLimit,
      include: {
        category: true,
        sub_category: true,
        ratings: { select: { stars: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    // 3️⃣ Store in cache (TTL: 60 seconds)
    await this.cache.set(cacheKey, products, 60_000);

    return products;
  }

  /**
   * FIND RELATED PRODUCTS SERVICE — ⚡ CACHED!
   * @param id product_id
   * @param limit number of products
   */
  // region Find Related Products
  async findRelated(id: number, limit: number = 4) {
    const cacheKey = `products:related:${id}:limit=${limit}`;

    // 1️⃣ Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return cached;
    }

    // 2️⃣ Cache miss
    console.log(`❌ Cache MISS: ${cacheKey}`);
    const product = await this.findOne(id);

    const related = await this.prisma.product.findMany({
      where: {
        category_id: (product as any).category_id,
        id: { not: id },
        status: 'active',
      },
      take: limit,
      include: {
        category: true,
        sub_category: true,
        ratings: { select: { stars: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    // 3️⃣ Store in cache (TTL: 2 minutes = 120,000ms)
    await this.cache.set(cacheKey, related, 120_000);

    return related;
  }

  /**
   * REMOVE PRODUCT SERVICE
   * @param id product_id
   * @returns Object
   */
  // region Remove Product
  async remove(id: number) {
    const product = await this.findOne(id);

    // Delete all associated images from Cloudinary
    if ((product as any).images_url && (product as any).images_url.length > 0) {
      await this.cloudinaryService.deleteMultipleFiles((product as any).images_url);
    }

    await this.prisma.product.delete({ where: { id } });

    // 🗑️ Invalidate
    await this.invalidateProductCaches(id);

    return { message: `Product #${id} is deleted successfully!` };
  }
}
