"use client";

import { useEffect, useState, use, Suspense } from "react";
import Navbar from "@/app/components/Navbar";
import CatalogView from "@/app/components/CatalogView";
import Footer from "@/app/components/Footer";
import CartDrawer from "@/app/components/CartDrawer";
import StickyCartWidget from "@/app/components/StickyCartWidget";
import { fetchApi } from "@/lib/api";
import { SubCategory } from "@/types/sub-category";

// region SUB-CATEGORY
export default function SubCategoryPage({ params }: { params: Promise<{ slug: string; subslug: string }>; }) {
  const resolvedParams = use(params);
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);

  const rawCatId = Number(resolvedParams.slug.split("-")[0]);
  const parsedCatId = !isNaN(rawCatId) ? rawCatId : undefined;

  const rawSubId = Number(resolvedParams.subslug.split("-")[0]);
  const parsedSubId = !isNaN(rawSubId) ? rawSubId : undefined;

  useEffect(() => {
    async function loadSubCategory() {
      try {
        if (parsedSubId) {
          const res = await fetchApi<SubCategory>(`/sub-categories/${parsedSubId}`);
          setSubCategory(res);
        } else {
          const allSubs = await fetchApi<SubCategory[]>("/sub-categories");
          const found = allSubs.find(
            (s) => s.name.toLowerCase() === resolvedParams.subslug.toLowerCase() || String(s.id) === resolvedParams.subslug
          );
          if (found) setSubCategory(found);
        }
      } catch (err) {
        console.error("Could not load subcategory by ID, trying fallback search", err);
        try {
          const allSubs = await fetchApi<SubCategory[]>("/sub-categories");
          const found = allSubs.find(
            (s) => s.id === parsedSubId || s.name.toLowerCase() === resolvedParams.subslug.toLowerCase()
          );
          if (found) setSubCategory(found);
        } catch {}
      }
    }
    loadSubCategory();
  }, [resolvedParams.subslug, parsedSubId]);

  // region MAIN UI
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
          <CatalogView
            categoryId={subCategory?.category_id || parsedCatId}
            subCategoryId={subCategory?.id || parsedSubId}
            title={subCategory?.name || "Sub-Category Products"}
          />
        </Suspense>
      </div>

      <Footer />
      <StickyCartWidget />
      <CartDrawer />
    </div>
  );
}
