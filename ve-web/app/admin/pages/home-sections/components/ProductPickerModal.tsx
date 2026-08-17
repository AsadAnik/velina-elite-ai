"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  X,
  Search,
  CheckSquare,
  Square,
  Package,
  Layers,
  Filter,
  Sparkles,
} from "lucide-react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { SubCategory } from "@/types/sub-category";

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
  alreadyAddedProductIds: number[];
  onAddProducts: (selectedProducts: Product[]) => Promise<unknown>;
  isSaving: boolean;
}

export default function ProductPickerModal({
  isOpen,
  onClose,
  products,
  categories,
  subCategories,
  alreadyAddedProductIds,
  onAddProducts,
  isSaving,
}: ProductPickerModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | "">("");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Filtered sub-categories based on selected category
  const filteredSubCategories = useMemo(() => {
    if (!selectedCategoryId) return subCategories;
    return subCategories.filter((sc) => sc.category_id === selectedCategoryId);
  }, [subCategories, selectedCategoryId]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategoryId !== "" && p.category_id !== selectedCategoryId) {
        return false;
      }
      // Subcategory filter
      if (selectedSubCategoryId !== "" && p.sub_category_id !== selectedSubCategoryId) {
        return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [products, selectedCategoryId, selectedSubCategoryId, search]);

  if (!isOpen) return null;

  const toggleSelectProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredProducts.map((p) => p.id);
    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleDeselectAll = () => {
    setSelectedProductIds([]);
  };

  const handleSubmit = async () => {
    if (selectedProductIds.length === 0) return;
    const selected = products.filter((p) => selectedProductIds.includes(p.id));
    await onAddProducts(selected);
    setSelectedProductIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-velina-rose/10 text-velina-rose flex items-center justify-center font-bold">
              <Package size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                Select Showcase Products
              </h3>
              <p className="text-xs text-muted">
                Filter by category & subcategory, check products, and add to showcase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 bg-surface space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or keywords..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-velina-rose/20 focus:border-velina-rose"
            />
          </div>

          {/* Category & Subcategory dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1 flex items-center gap-1">
                <Layers size={12} />
                Filter by Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : "";
                  setSelectedCategoryId(val);
                  setSelectedSubCategoryId("");
                }}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-foreground"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1 flex items-center gap-1">
                <Filter size={12} />
                Filter by Sub-Category
              </label>
              <select
                value={selectedSubCategoryId}
                onChange={(e) =>
                  setSelectedSubCategoryId(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-foreground"
              >
                <option value="">All Sub-Categories</option>
                {filteredSubCategories.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Selection Actions */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="font-bold text-muted">
              Found {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-velina-rose font-bold hover:underline"
              >
                Select All Filtered
              </button>
              {selectedProductIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-muted hover:text-foreground font-medium"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Checklist List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">No products match your filters</p>
              <p className="text-[11px] mt-0.5">Try searching with a different keyword or category.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = selectedProductIds.includes(product.id);
              const isAlreadyAdded = alreadyAddedProductIds.includes(product.id);
              const imgUrl = product.images_url?.[0] || "/placeholder.png";

              return (
                <div
                  key={product.id}
                  onClick={() => toggleSelectProduct(product.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? "border-velina-rose bg-velina-rose/5 dark:bg-velina-rose/10 ring-1 ring-velina-rose"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                  }`}
                >
                  {/* Left: Checkbox + Thumbnail + Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      className={`p-1 rounded-lg shrink-0 transition-colors ${
                        isSelected
                          ? "text-velina-rose"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>

                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                      <Image
                        src={imgUrl}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold text-foreground truncate">
                          {product.title}
                        </span>
                        {isAlreadyAdded && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-muted shrink-0">
                            Already in Section
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        <span className="font-bold text-velina-rose">
                          {product.currency_symbol || "৳"}
                          {product.regular_price ?? product.price}
                        </span>
                        {product.mrp_price && product.mrp_price > (product.regular_price ?? product.price) && (
                          <span className="line-through text-muted-subtle">
                            {product.currency_symbol || "৳"}
                            {product.mrp_price}
                          </span>
                        )}
                        {product.size && (
                          <span>• {product.size}{product.size_unit || "gm"}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-xs font-bold text-foreground">
            {selectedProductIds.length} product{selectedProductIds.length !== 1 ? "s" : ""} selected
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedProductIds.length === 0 || isSaving}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-velina-rose text-white text-xs font-black shadow-md hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              {isSaving
                ? "Adding..."
                : `Add Selected (${selectedProductIds.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
