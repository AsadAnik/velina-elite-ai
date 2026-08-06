-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('cod');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterEnum (idempotent - only add values if they don't exist)
DO $$ BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'preparing';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'shipping';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ready_for_receive';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'completed';
EXCEPTION WHEN others THEN null; END $$;

-- AlterTable (idempotent)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "payment_method" "PaymentMethod" NOT NULL DEFAULT 'cod';

-- AlterTable (idempotent - only drop default if column exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Wishlist' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE "Wishlist" ALTER COLUMN "customer_id" DROP DEFAULT;
  END IF;
END $$;
