"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Product } from "@/types/product";

type Props = { categoryId?: number; subCategoryId?: number; title: string };

export default function CatalogView({ categoryId, subCategoryId, title }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams({ status: "active", limit: "100" });
    if (categoryId) query.set("category_id", String(categoryId));
    if (subCategoryId) query.set("sub_category_id", String(subCategoryId));
    fetchApi<{ data: Product[] }>(`/products?${query}`).then((result) => setProducts(result.data)).finally(() => setLoading(false));
  }, [categoryId, subCategoryId]);

  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
    <h1 className="mb-6 text-2xl font-black text-foreground">{title}</h1>
    {loading ? <p>Loading products…</p> : products.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => { const price = Number(product.regular_price ?? product.price); const mrp = Number(product.mrp_price ?? price); const saving = Number(product.save_amount ?? Math.max(0, mrp - price)); const percentage = Number(product.save_percentage ?? (mrp > 0 ? Math.round((saving / mrp) * 100) : 0)); return <Link key={product.id} href={`/products/${product.id}`} className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-lg dark:bg-zinc-900">
        <div className="relative aspect-square overflow-hidden bg-surface">{percentage > 0 && <span className="absolute left-3 top-3 z-10 rounded-full bg-velina-rose px-2.5 py-1 text-xs font-black text-white">{percentage}% OFF</span>}{product.images_url[0] && <Image src={product.images_url[0]} alt={product.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />}</div>
        <div className="p-4"><p className="line-clamp-2 min-h-10 text-sm font-bold">{product.title}</p><div className="mt-3 flex items-end gap-2"><p className="text-lg font-black text-velina-rose">{product.currency_symbol ?? "৳"}{price.toLocaleString()}</p>{mrp > price && <p className="pb-0.5 text-sm text-muted line-through">{product.currency_symbol ?? "৳"}{mrp.toLocaleString()}</p>}</div>{saving > 0 && <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">You save {product.currency_symbol ?? "৳"}{saving.toLocaleString()}</p>}</div>
      </Link>; })}
    </div> : <p>No active products found.</p>}
  </main>;
}
