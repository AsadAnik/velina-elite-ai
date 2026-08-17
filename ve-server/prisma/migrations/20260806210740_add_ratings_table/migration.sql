-- CreateTable
CREATE TABLE "Rating" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rating_customer_id_product_id_key" ON "Rating"("customer_id", "product_id");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
