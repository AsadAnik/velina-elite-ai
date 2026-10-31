import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VectorDbService } from './vector-db.service';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class ProductVectorSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductVectorSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorDb: VectorDbService,
    private readonly embeddingService: EmbeddingService,
  ) { }

  async onApplicationBootstrap() {
    // Run sync in the background so it doesn't block server boot
    setTimeout(() => {
      this.syncAllProducts().catch((err) => {
        this.logger.warn(`Initial product vector sync encountered an error: ${err}`);
      });
    }, 3000);
  }

  /**
   * Generates a descriptive text chunk for embedding calculation
   */
  buildProductSearchText(product: {
    title: string;
    description?: string | null;
    category?: { name: string } | null;
    sub_category?: { name: string } | null;
  }): string {
    const parts = [
      `Product: ${product.title}`,
      product.category?.name ? `Category: ${product.category.name}` : '',
      product.sub_category?.name ? `SubCategory: ${product.sub_category.name}` : '',
      product.description ? `Description: ${product.description.slice(0, 300)}` : '',
    ].filter(Boolean);

    return parts.join('. ');
  }

  /**
   * Synchronizes all active products from the Primary DB into the Dedicated AI Vector DB
   */
  async syncAllProducts(): Promise<{ total: number; synced: number }> {
    if (!this.vectorDb.isReady) {
      this.logger.log('Vector DB is not connected yet, skipping initial vector sync.');
      return { total: 0, synced: 0 };
    }

    try {
      const activeProducts = await this.prisma.product.findMany({
        where: { status: 'active' },
        include: {
          category: true,
          sub_category: true,
        },
      });

      if (activeProducts.length === 0) {
        return { total: 0, synced: 0 };
      }

      const existingIds = await this.vectorDb.getExistingProductIds();
      const productsToSync = activeProducts.filter((p) => !existingIds.has(p.id));

      if (productsToSync.length === 0) {
        this.logger.log(`All ${activeProducts.length} products are already embedded in AI Vector DB.`);
        return { total: activeProducts.length, synced: 0 };
      }

      this.logger.log(`Syncing ${productsToSync.length} new/unindexed products to AI Vector DB...`);

      let count = 0;
      for (const p of productsToSync) {
        const searchText = this.buildProductSearchText(p);
        const embedding = await this.embeddingService.generateEmbedding(searchText);
        await this.vectorDb.upsertProductEmbedding(p.id, searchText, embedding);
        count++;
      }

      this.logger.log(`Successfully synced ${count} products to AI Vector DB.`);
      return { total: activeProducts.length, synced: count };
    } catch (error) {
      this.logger.error(`Product vector sync failed: ${error}`);
      return { total: 0, synced: 0 };
    }
  }

  /**
   * Synchronizes a single product after create/update in the store
   */
  async syncSingleProduct(productId: number): Promise<void> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { category: true, sub_category: true },
      });

      if (!product || product.status !== 'active') {
        await this.vectorDb.deleteProductEmbedding(productId);
        return;
      }

      const searchText = this.buildProductSearchText(product);
      const embedding = await this.embeddingService.generateEmbedding(searchText);
      await this.vectorDb.upsertProductEmbedding(productId, searchText, embedding);
      this.logger.log(`Updated AI vector embedding for product ID: ${productId}`);
    } catch (error) {
      this.logger.error(`Failed to sync product ID ${productId}: ${error}`);
    }
  }
}

