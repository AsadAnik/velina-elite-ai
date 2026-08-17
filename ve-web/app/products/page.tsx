"use client";

import React, { Suspense } from "react";
import Navbar from "@/app/components/Navbar";
import CatalogView from "@/app/components/CatalogView";
import Footer from "@/app/components/Footer";
import CartDrawer from "@/app/components/CartDrawer";
import StickyCartWidget from "@/app/components/StickyCartWidget";

export default function ProductsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-velina-rose selection:text-white transition-colors duration-300">
      <Navbar />

      <div className="flex-grow">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs font-bold text-muted">
              Loading Products Catalog...
            </div>
          }
        >
          <CatalogView title="All Beauty & Skincare Products" />
        </Suspense>
      </div>

      <Footer />
      <StickyCartWidget />
      <CartDrawer />
    </div>
  );
}
