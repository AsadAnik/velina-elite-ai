-- CreateTable
CREATE TABLE "ShippingCost" (
    "id" SERIAL NOT NULL,
    "inside_dhaka_cost" DECIMAL(10,2) NOT NULL,
    "outside_dhaka_cost" DECIMAL(10,2) NOT NULL,
    "currency_symbol" TEXT NOT NULL DEFAULT '৳',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingCost_pkey" PRIMARY KEY ("id")
);
