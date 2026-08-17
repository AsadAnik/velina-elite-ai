"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import Navbar from "@/app/components/Navbar";
import CatalogView from "@/app/components/CatalogView";
import Footer from "@/app/components/Footer";
import CartDrawer from "@/app/components/CartDrawer";
import StickyCartWidget from "@/app/components/StickyCartWidget";
import { fetchApi } from "@/lib/api";
import { Category } from "@/types/category";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    async function loadCategory() {
      try {
        const catId = Number(resolvedParams.slug.split("-")[0]);
        if (!isNaN(catId)) {
          const res = await fetchApi<Category>(`/categories/${catId}`);
          setCategory(res);
        } else {
          // Look up by slug
          const allCats = await fetchApi<Category[]>("/categories");
          const found = allCats.find(
            (c) => c.name.toLowerCase() === resolvedParams.slug.toLowerCase()
          );
          if (found) setCategory(found);
        }
      } catch (err) {
        console.error("Could not load category", err);
      }
    }
    loadCategory();
  }, [resolvedParams.slug]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-velina-rose selection:text-white transition-colors duration-300">
      <Navbar />

      <div className="flex-grow">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs font-bold text-muted">
              Loading Products...
            </div>
          }
        >
          <CatalogView categoryId={category?.id} title={category?.name || "Category Products"} />
        </Suspense>
      </div>

      <Footer />
      <StickyCartWidget />
      <CartDrawer />
    </div>
  );
}
