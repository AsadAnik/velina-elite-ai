"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import { fetchApi } from "@/lib/api";
import { Product } from "@/types/product";

export default function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  useEffect(() => { params.then(({ id }) => fetchApi<Product>(`/products/${id}`).then(setProduct)); }, [params]);
  if (!product) return <><Navbar /><main className="p-8">Loading product…</main></>;
  const price = Number(product.regular_price ?? product.price); const mrp = Number(product.mrp_price ?? price); const saving = Number(product.save_amount ?? Math.max(0, mrp - price)); const percentage = Number(product.save_percentage ?? (mrp ? Math.round(saving / mrp * 100) : 0));
  return <><Navbar /><main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2 lg:gap-12"><div><div className="group relative aspect-square overflow-hidden rounded-2xl bg-surface">{product.images_url[selectedImage] && <Image src={product.images_url[selectedImage]} alt={product.title} fill priority className="object-cover transition-transform duration-500 group-hover:scale-125" />}</div>{product.images_url.length > 1 && <div className="mt-3 flex gap-3 overflow-x-auto pb-1">{product.images_url.map((image, index) => <button key={image} onClick={() => setSelectedImage(index)} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${selectedImage === index ? "border-velina-rose" : "border-transparent"}`}><Image src={image} alt={`${product.title} ${index + 1}`} fill className="object-cover" /></button>)}</div>}</div><section><p className="text-sm text-muted">{product.category?.name} {product.sub_category && `› ${product.sub_category.name}`}</p><h1 className="mt-2 text-3xl font-black">{product.title}</h1><div className="mt-5 flex flex-wrap items-end gap-3"><p className="text-3xl font-black text-velina-rose">{product.currency_symbol ?? "৳"}{price.toLocaleString()}</p>{mrp > price && <p className="text-lg text-muted line-through">{product.currency_symbol ?? "৳"}{mrp.toLocaleString()}</p>}{percentage > 0 && <span className="rounded-full bg-velina-rose/10 px-3 py-1 text-sm font-black text-velina-rose">{percentage}% OFF</span>}</div>{saving > 0 && <p className="mt-2 font-bold text-emerald-600 dark:text-emerald-400">You save {product.currency_symbol ?? "৳"}{saving.toLocaleString()}</p>}{product.size && <p className="mt-5">Size: {product.size} {product.size_unit}</p>}<p className="mt-3">{product.stock_quantity > 0 ? "In stock" : "Out of stock"}</p><p className="mt-6 whitespace-pre-line text-muted">{product.description}</p><Link className="mt-8 inline-block font-bold text-velina-rose" href={`/category/${product.category_id}`}>View all products</Link></section></main></>;
}
