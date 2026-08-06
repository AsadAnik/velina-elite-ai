"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Product as ApiProduct } from "@/types/product";
import { Product as UiProduct } from "@/lib/data";
import ProductCard from "./ProductCard";

type Props = { categoryId?: number; subCategoryId?: number; title: string };

// Transform API product to UI product format
function transformApiToUiProduct(apiProduct: ApiProduct): UiProduct {
  const price = Number(apiProduct.regular_price ?? apiProduct.price);
  const mrp = Number(apiProduct.mrp_price ?? price);
  const saving = Number(apiProduct.save_amount ?? Math.max(0, mrp - price));
  const percentage = Number(apiProduct.save_percentage ?? (mrp ? Math.round(saving / mrp * 100) : 0));

  return {
    id: apiProduct.id,
    name: apiProduct.title,
    brand: apiProduct.category?.name || "Velina",
    category: apiProduct.category?.name?.toLowerCase() || "skin",
    subcategory: apiProduct.sub_category?.name?.toLowerCase() || "general",
    image: apiProduct.images_url[0] || "/placeholder.png",
    originalPrice: mrp,
    salePrice: price,
    discountPercent: percentage,
    rating: apiProduct.ratings && apiProduct.ratings.length > 0
      ? Number((apiProduct.ratings.reduce((sum, r) => sum + r.stars, 0) / apiProduct.ratings.length).toFixed(1))
      : 0,
    reviewCount: apiProduct.ratings?.length || 0,
    isSale: mrp > price,
    isNew: false,
    isBestSeller: false,
    stockQuantity: apiProduct.stock_quantity,
  };
}

export default function CatalogView({ categoryId, subCategoryId, title }: Props) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams({ status: "active", limit: "100" });
    if (categoryId) query.set("category_id", String(categoryId));
    if (subCategoryId) query.set("sub_category_id", String(subCategoryId));
    fetchApi<{ data: ApiProduct[] }>(`/products?${query}`).then((result) => setProducts(result.data)).finally(() => setLoading(false));
  }, [categoryId, subCategoryId]);

  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
    <h1 className="mb-6 text-2xl font-black text-foreground">{title}</h1>
    {loading ? <p>Loading products…</p> : products.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => <ProductCard key={product.id} product={transformApiToUiProduct(product)} />)}
    </div> : <p>No active products found.</p>}
  </main>;
}
