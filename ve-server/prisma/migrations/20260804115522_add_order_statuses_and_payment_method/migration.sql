-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cod');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'preparing';
ALTER TYPE "OrderStatus" ADD VALUE 'shipping';
ALTER TYPE "OrderStatus" ADD VALUE 'ready_for_receive';
ALTER TYPE "OrderStatus" ADD VALUE 'completed';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "note" TEXT,
ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL DEFAULT 'cod';

-- AlterTable
ALTER TABLE "Wishlist" ALTER COLUMN "customer_id" DROP DEFAULT;
