-- CreateEnum
CREATE TYPE "ProductSizeUnit" AS ENUM ('ml', 'gm');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "currency_symbol" TEXT NOT NULL DEFAULT '৳',
ADD COLUMN     "mrp_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "regular_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "save_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "save_percentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "size" DECIMAL(10,2),
ADD COLUMN     "size_unit" "ProductSizeUnit",
ALTER COLUMN "price" SET DEFAULT 0;
