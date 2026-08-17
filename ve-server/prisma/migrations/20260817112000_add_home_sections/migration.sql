-- CreateTable
CREATE TABLE "HomeSection" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeSectionItem" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSectionItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HomeSectionItem" ADD CONSTRAINT "HomeSectionItem_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "HomeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeSectionItem" ADD CONSTRAINT "HomeSectionItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
