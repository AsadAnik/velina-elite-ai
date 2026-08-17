import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.ensureTablesExist();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureTablesExist() {
    try {
      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "HomeSection" (
          "id" SERIAL NOT NULL,
          "title" TEXT NOT NULL,
          "subtitle" TEXT,
          "badge_text" TEXT,
          "description" TEXT,
          "section_type" TEXT NOT NULL DEFAULT 'deals_grid',
          "bg_type" TEXT NOT NULL DEFAULT 'gradient',
          "bg_color" TEXT,
          "bg_gradient" TEXT,
          "bg_image" TEXT,
          "banner_image" TEXT,
          "banner_url" TEXT,
          "button_text" TEXT,
          "button_url" TEXT,
          "order_index" INTEGER NOT NULL DEFAULT 0,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "max_items" INTEGER NOT NULL DEFAULT 4,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "HomeSection_pkey" PRIMARY KEY ("id")
        );

        CREATE TABLE IF NOT EXISTS "HomeSectionItem" (
          "id" SERIAL NOT NULL,
          "section_id" INTEGER NOT NULL,
          "title" TEXT NOT NULL,
          "subtitle" TEXT,
          "description" TEXT,
          "tag" TEXT,
          "tag_bg" TEXT,
          "image_url" TEXT,
          "link_url" TEXT,
          "button_text" TEXT,
          "bg_gradient" TEXT,
          "bg_color" TEXT,
          "product_id" INTEGER,
          "order_index" INTEGER NOT NULL DEFAULT 0,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "HomeSectionItem_pkey" PRIMARY KEY ("id")
        );

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'HomeSectionItem_section_id_fkey'
          ) THEN
            ALTER TABLE "HomeSectionItem"
              ADD CONSTRAINT "HomeSectionItem_section_id_fkey"
              FOREIGN KEY ("section_id") REFERENCES "HomeSection"("id")
              ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'HomeSectionItem_product_id_fkey'
          ) THEN
            ALTER TABLE "HomeSectionItem"
              ADD CONSTRAINT "HomeSectionItem_product_id_fkey"
              FOREIGN KEY ("product_id") REFERENCES "Product"("id")
              ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ HomeSection & HomeSectionItem tables verified/initialized in PostgreSQL.');
    } catch (err) {
      console.error('Warning during table auto-initialization in PrismaService:', err);
    }
  }
}
