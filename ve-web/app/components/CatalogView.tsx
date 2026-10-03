"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  X,
  ArrowUpDown,
  RotateCcw,
  Check,
  Search,
  Package,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { Product as ApiProduct } from "@/types/product";
import { Product as UiProduct } from "@/lib/data";
import { Category } from "@/types/category";
import { SubCategory } from "@/types/sub-category";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

type Props = {
  categoryId?: number;
  subCategoryId?: number;
  title?: string;
};

// Transform API product to UI product format
function transformApiToUiProduct(apiProduct: ApiProduct): UiProduct {
  const price = Number(apiProduct.regular_price ?? apiProduct.price ?? 0);
  const mrp = Number(apiProduct.mrp_price ?? price);
  const saving = Number(apiProduct.save_amount ?? Math.max(0, mrp - price));
  const percentage = Number(
    apiProduct.save_percentage ?? (mrp > price && mrp > 0 ? Math.round((saving / mrp) * 100) : 0)
  );

  return {
    id: apiProduct.id,
    name: apiProduct.title,
    brand: apiProduct.category?.name || "Velina Elite",
    category: apiProduct.category?.name?.toLowerCase() || "skin",
    subcategory: apiProduct.sub_category?.name?.toLowerCase() || "general",
    image: apiProduct.images_url?.[0] || "/placeholder.png",
    originalPrice: mrp,
    salePrice: price,
    discountPercent: percentage,
    rating:
      apiProduct.ratings && apiProduct.ratings.length > 0
        ? Number(
          (
            apiProduct.ratings.reduce((sum, r) => sum + r.stars, 0) /
            apiProduct.ratings.length
          ).toFixed(1)
        )
        : 5,
    reviewCount: apiProduct.ratings?.length || 1,
    isSale: mrp > price,
    isNew: false,
    isBestSeller: false,
    stockQuantity: apiProduct.stock_quantity ?? 100,
  };
}

// region CATELOG VIEW
export default function CatalogView({ categoryId, subCategoryId, title }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Categories & Subcategories
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [subCategoriesList, setSubCategoriesList] = useState<SubCategory[]>([]);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(categoryId);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | undefined>(subCategoryId);
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || searchParams.get("q") || ""
  );
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // Pagination & Infinite Loading
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // UI state
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [expandedCats, setExpandedCats] = useState<Record<number, boolean>>({});

  // Infinite Scroll Observer ref
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Sync URL search query changes
  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("q") || "";
    setSearchQuery(q);
  }, [searchParams]);

  // Load Categories & SubCategories
  useEffect(() => {
    async function loadTaxonomies() {
      try {
        const [cats, subCats] = await Promise.all([
          fetchApi<Category[]>("/categories"),
          fetchApi<SubCategory[]>("/sub-categories"),
        ]);
        if (Array.isArray(cats)) setCategoriesList(cats);
        if (Array.isArray(subCats)) setSubCategoriesList(subCats);
      } catch (err) {
        console.error("Failed to load catalog filters", err);
      }
    }
    loadTaxonomies();
  }, []);

  // Sync props changes
  useEffect(() => {
    if (categoryId !== undefined) {
      setSelectedCategory(categoryId);
      setExpandedCats((prev) => ({ ...prev, [categoryId]: true }));
    }
    if (subCategoryId !== undefined) {
      setSelectedSubCategory(subCategoryId);
    }
  }, [categoryId, subCategoryId]);

  // Fetch Products Chunk
  const fetchProductsChunk = useCallback(
    async (pageToFetch: number, isNewFilter: boolean = false) => {
      if (isNewFilter) {
        setInitialLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("page", pageToFetch.toString());
        params.set("limit", "12");
        params.set("status", "active");

        if (selectedCategory) params.set("category_id", selectedCategory.toString());
        if (selectedSubCategory) params.set("sub_category_id", selectedSubCategory.toString());
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (priceRange < 10000) params.set("max_price", priceRange.toString());
        if (sortBy) params.set("sort_by", sortBy);

        const res = await fetchApi<{
          data: ApiProduct[];
          meta: { total: number; page: number; limit: number; total_pages: number };
        }>(`/products?${params.toString()}`);

        const fetchedItems = res.data || [];
        const meta = res.meta || { total: fetchedItems.length, page: pageToFetch, total_pages: 1 };

        let filteredItems = fetchedItems;
        if (onlyInStock) {
          filteredItems = filteredItems.filter((p) => (p.stock_quantity ?? 0) > 0);
        }

        if (isNewFilter) {
          setProducts(filteredItems);
        } else {
          setProducts((prev) => [...prev, ...filteredItems]);
        }

        setTotalProducts(meta.total);
        setPage(pageToFetch);
        setHasMore(pageToFetch < meta.total_pages);
      } catch (err) {
        console.error("Error fetching products chunk", err);
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, selectedSubCategory, searchQuery, priceRange, sortBy, onlyInStock]
  );

  // Trigger initial fetch on filter change
  useEffect(() => {
    fetchProductsChunk(1, true);
  }, [fetchProductsChunk]);

  // Infinite Scroll Trigger with IntersectionObserver
  useEffect(() => {
    if (initialLoading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoading) {
          fetchProductsChunk(page + 1, false);
        }
      },
      { threshold: 0.1, rootMargin: "150px" }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, loadingMore, initialLoading, page, fetchProductsChunk]);

  const toggleCategoryExpand = (catId: number) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleSelectCategory = (catId?: number) => {
    setSelectedCategory(catId);
    setSelectedSubCategory(undefined);
    if (catId) {
      setExpandedCats((prev) => ({ ...prev, [catId]: true }));
    }
  };

  const handleSelectSubCategory = (subId?: number) => {
    setSelectedSubCategory(subId);
  };

  const resetAllFilters = () => {
    setSelectedCategory(undefined);
    setSelectedSubCategory(undefined);
    setPriceRange(10000);
    setSortBy("newest");
    setSearchQuery("");
    setOnlyInStock(false);
  };

  const activeCategoryObj = categoriesList.find((c) => c.id === selectedCategory);
  const activeSubCategoryObj = subCategoriesList.find((sc) => sc.id === selectedSubCategory);

  let displayTitle = "All Products";
  if (selectedSubCategory) {
    displayTitle = activeSubCategoryObj?.name || (title !== "All Products" ? title : undefined) || "Sub-Category Products";
  } else if (selectedCategory) {
    displayTitle = activeCategoryObj?.name || "Category Products";
  } else if (searchQuery.trim()) {
    displayTitle = `Search Results for "${searchQuery}"`;
  }

  // Sidebar Filter Content (Shared between desktop and mobile drawer)
  const FilterSidebarContent = () => (
    <div className="space-y-6">
      {/* Search Filter */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-muted mb-2">
          Search Products
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-velina-rose/20 focus:border-velina-rose text-foreground"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase tracking-wider text-muted">
            Max Price Filter
          </label>
          <span className="text-xs font-black text-velina-rose">৳{priceRange.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={100}
          max={10000}
          step={100}
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full accent-velina-rose cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted mt-1 font-semibold">
          <span>৳100</span>
          <span>৳10,000+</span>
        </div>
      </div>

      <hr className="border-zinc-100 dark:border-zinc-800" />

      {/* Categories & Subcategories Tree */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-black uppercase tracking-wider text-muted">
            Categories
          </label>
          {selectedCategory && (
            <button
              onClick={() => handleSelectCategory(undefined)}
              className="text-[10px] font-bold text-velina-rose hover:underline"
            >
              All Categories
            </button>
          )}
        </div>

        <div className="space-y-1">
          {/* All Categories Option */}
          <button
            type="button"
            onClick={() => handleSelectCategory(undefined)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${!selectedCategory
              ? "bg-velina-rose/10 text-velina-rose border border-velina-rose/20"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-surface"
              }`}
          >
            <span>All Products</span>
            {!selectedCategory && <Check size={13} />}
          </button>

          {categoriesList.map((cat) => {
            const isCatSelected = selectedCategory === cat.id;
            const isExpanded = expandedCats[cat.id] ?? false;
            const subCats = subCategoriesList.filter((sc) => sc.category_id === cat.id);

            return (
              <div key={cat.id} className="space-y-0.5">
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${isCatSelected
                    ? "bg-velina-rose/10 text-velina-rose border border-velina-rose/20"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-surface"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className="flex-1 text-left truncate"
                  >
                    {cat.name}
                  </button>

                  {subCats.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategoryExpand(cat.id);
                      }}
                      className="p-1 text-muted hover:text-foreground"
                    >
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                  )}
                </div>

                {/* Subcategories list */}
                {isExpanded && subCats.length > 0 && (
                  <div className="ml-3 pl-3 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-0.5 py-1">
                    {subCats.map((sub) => {
                      const isSubSelected = selectedSubCategory === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            handleSelectSubCategory(sub.id);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${isSubSelected
                            ? "bg-velina-peach/40 dark:bg-velina-rose/20 text-velina-rose font-black"
                            : "text-muted hover:text-foreground hover:bg-surface"
                            }`}
                        >
                          <span className="truncate">{sub.name}</span>
                          {isSubSelected && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <hr className="border-zinc-100 dark:border-zinc-800" />

      {/* Stock availability */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-foreground">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
            className="w-4 h-4 rounded-md accent-velina-rose cursor-pointer"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Reset Filter Button */}
      {(selectedCategory || selectedSubCategory || priceRange < 10000 || searchQuery || onlyInStock) && (
        <button
          type="button"
          onClick={resetAllFilters}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-black text-muted hover:text-foreground transition-all"
        >
          <RotateCcw size={13} />
          Reset All Filters
        </button>
      )}
    </div>
  );

  // region MAIN UI
  return (
    <main className="min-h-screen bg-background text-foreground py-6 md:py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Top Header & Breadcrumbs */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted font-medium mb-1">
              <Link href="/" className="hover:text-velina-rose transition-colors">
                Home
              </Link>
              <ChevronRight size={12} />
              <Link href="/products" className="hover:text-velina-rose transition-colors">
                Products
              </Link>
              {activeCategoryObj && (
                <>
                  <ChevronRight size={12} />
                  <span className="text-foreground font-semibold">{activeCategoryObj.name}</span>
                </>
              )}
              {activeSubCategoryObj && (
                <>
                  <ChevronRight size={12} />
                  <span className="text-velina-rose font-bold">{activeSubCategoryObj.name}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
              {displayTitle}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Showing {products.length} of {totalProducts} authentic beauty & skincare items
            </p>
          </div>

          {/* Right Controls: Sort and Mobile Filter Toggle */}
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface border border-zinc-200 dark:border-zinc-800 text-xs font-bold shadow-xs hover:border-velina-rose transition-colors"
            >
              <SlidersHorizontal size={14} className="text-velina-rose" />
              <span>Filters</span>
              {(selectedCategory || selectedSubCategory || searchQuery || priceRange < 10000) && (
                <span className="w-2 h-2 rounded-full bg-velina-rose" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-surface border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 py-2 shadow-xs text-xs font-bold">
              <ArrowUpDown size={14} className="text-muted shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-foreground focus:outline-none cursor-pointer pr-2"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout: Left Filter Sidebar + Right Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-velina-rose" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                    Filter Store
                  </h3>
                </div>
              </div>
              <FilterSidebarContent />
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <section className="lg:col-span-3 space-y-8">
            {/* Initial Loading Skeleton */}
            {initialLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <ProductCardSkeleton key={idx} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 px-4 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-surface space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-velina-rose/10 text-velina-rose flex items-center justify-center">
                  <Package size={32} />
                </div>
                <h3 className="text-lg font-black text-foreground">No Products Found</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  We could not find any active products matching your selected criteria. Try adjusting your filters or price range.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-velina-rose text-white text-xs font-black shadow-md hover:bg-rose-600 transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={transformApiToUiProduct(product)} />
                  ))}
                </div>

                {/* Loading More Chunk Skeletons */}
                {loadingMore && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 pt-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <ProductCardSkeleton key={`loading-${idx}`} />
                    ))}
                  </div>
                )}

                {/* Infinite Scroll Bottom Anchor */}
                <div ref={observerTarget} className="py-6 flex items-center justify-center">
                  {hasMore && !loadingMore && (
                    <button
                      type="button"
                      onClick={() => fetchProductsChunk(page + 1, false)}
                      className="px-6 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-foreground transition-colors shadow-xs"
                    >
                      Load More Products ({products.length} of {totalProducts})
                    </button>
                  )}

                  {!hasMore && products.length > 0 && (
                    <p className="text-xs font-bold text-muted uppercase tracking-wider">
                      ✓ You have reached the end of the catalog
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setMobileFilterOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer */}
          <div className="relative ml-auto w-full max-w-xs h-full bg-white dark:bg-zinc-900 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-velina-rose" />
                  <h3 className="text-sm font-black uppercase text-foreground">Filters</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 rounded-xl text-muted hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <FilterSidebarContent />
            </div>

            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 mt-6 flex gap-3">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-muted hover:text-foreground"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-velina-rose text-white text-xs font-bold shadow-md hover:bg-rose-600"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
