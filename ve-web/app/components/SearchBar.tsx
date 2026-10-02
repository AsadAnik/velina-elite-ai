"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ChevronRight, Tag, Sparkles, ArrowRight } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { Product } from "@/types/product";

interface SearchBarProps {
  placeholder?: string;
  isMobile?: boolean;
  className?: string;
  onNavigate?: () => void;
}

export default function SearchBar({
  placeholder = "Search products, brands, concerns...",
  isMobile = false,
  className = "",
  onNavigate,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeReqId = useRef(0);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);
    setSelectedIndex(-1);

    const curReqId = ++activeReqId.current;
    const timer = setTimeout(async () => {
      try {
        const data = await fetchApi<Product[]>(
          `/products/search?q=${encodeURIComponent(trimmed)}&limit=7`
        );
        if (curReqId === activeReqId.current) {
          setResults(Array.isArray(data) ? data : []);
          setIsLoading(false);
        }
      } catch (err) {
        if (curReqId === activeReqId.current) {
          console.error("Live search failed", err);
          setResults([]);
          setIsLoading(false);
        }
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProduct = useCallback(
    (product: Product) => {
      setIsOpen(false);
      onNavigate?.();
      router.push(`/products/${product.id}`);
    },
    [router, onNavigate]
  );

  const handleSearchSubmit = useCallback(
    (customTerm?: string) => {
      const term = (customTerm ?? query).trim();
      if (!term) return;
      setIsOpen(false);
      onNavigate?.();
      router.push(`/products?search=${encodeURIComponent(term)}`);
    },
    [query, router, onNavigate]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearchSubmit();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectProduct(results[selectedIndex]);
        } else {
          handleSearchSubmit();
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const currencySymbol = "৳";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          placeholder={placeholder}
          value={query}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 focus:border-velina-rose dark:focus:border-velina-rose focus:bg-white dark:focus:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-full transition-all duration-200 outline-none ${
            isMobile
              ? "py-2 pl-4 pr-16 text-xs"
              : "py-2.5 pl-5 pr-20 text-sm shadow-xs focus:shadow-md"
          }`}
        />

        {/* Action icons inside input */}
        <div className="absolute right-2 sm:right-3 flex items-center gap-1">
          {isLoading && (
            <Loader2
              size={isMobile ? 14 : 16}
              className="text-velina-rose animate-spin shrink-0 mr-1"
            />
          )}

          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Clear search"
            >
              <X size={isMobile ? 14 : 16} />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSearchSubmit()}
            className={`p-1.5 rounded-full text-white bg-velina-rose hover:bg-rose-600 shadow-xs transition-all active:scale-95 flex items-center justify-center`}
            aria-label="Submit search"
          >
            <Search size={isMobile ? 13 : 15} />
          </button>
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[70] transition-all animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Sparkles size={12} className="text-velina-gold" />
              {isLoading
                ? "Searching catalog..."
                : results.length > 0
                ? `${results.length} Product${results.length > 1 ? "s" : ""} Found`
                : "Search Suggestions"}
            </span>
            <span className="hidden sm:inline-block text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              Use ↑↓ to browse, ↵ to select
            </span>
          </div>

          {/* Skeletons while loading */}
          {isLoading && (
            <div className="p-2 space-y-2">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/30 animate-pulse border border-zinc-100/50 dark:border-zinc-800/50"
                >
                  <div className="w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                    <div className="h-3.5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                  <div className="w-14 h-4 bg-zinc-200 dark:bg-zinc-800 rounded shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Search Results List */}
          {!isLoading && results.length > 0 && (
            <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-1.5">
              {results.map((product, idx) => {
                const regularPrice = Number(product.regular_price ?? product.price ?? 0);
                const mrpPrice = Number(product.mrp_price ?? regularPrice);
                const discount = product.save_percentage && product.save_percentage > 0
                  ? product.save_percentage
                  : mrpPrice > regularPrice
                  ? Math.round(((mrpPrice - regularPrice) / mrpPrice) * 100)
                  : 0;
                const imageSrc = product.images_url?.[0] || "/placeholder-product.png";
                const isSelected = selectedIndex === idx;

                return (
                  <div
                    key={product.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectProduct(product)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 cursor-pointer group ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-zinc-800/90 ring-1 ring-velina-rose/30"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    {/* Thumbnail with optional discount badge */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200/70 dark:border-zinc-700/60 group-hover:border-velina-rose/40 transition-colors">
                      <Image
                        src={imageSrc}
                        alt={product.title}
                        fill
                        sizes="56px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {discount > 0 && (
                        <span className="absolute top-1 left-1 bg-velina-rose text-white text-[9px] font-black px-1 py-0.2 rounded-sm shadow-xs leading-tight">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 pr-1">
                      {/* Category & Subcategory line */}
                      {(product.category?.name || product.sub_category?.name) && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-velina-gold uppercase tracking-wider truncate mb-0.5">
                          {product.category?.name && <span>{product.category.name}</span>}
                          {product.category?.name && product.sub_category?.name && (
                            <span className="text-zinc-300 dark:text-zinc-600">•</span>
                          )}
                          {product.sub_category?.name && <span>{product.sub_category.name}</span>}
                        </div>
                      )}

                      {/* Title */}
                      <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-velina-rose transition-colors leading-tight">
                        {product.title}
                      </h4>

                      {/* Stock indicator & Size */}
                      <div className="flex items-center gap-2 mt-1">
                        {product.stock_quantity > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                            Out of Stock
                          </span>
                        )}

                        {product.size && (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            • {product.size} {product.size_unit || ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price column */}
                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white">
                        {currencySymbol}
                        {regularPrice.toLocaleString()}
                      </div>
                      {mrpPrice > regularPrice && (
                        <div className="text-[10px] font-medium text-zinc-400 line-through">
                          {currencySymbol}
                          {mrpPrice.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Arrow action */}
                    <ChevronRight
                      size={16}
                      className="text-zinc-300 dark:text-zinc-600 group-hover:text-velina-rose group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-6 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <Search size={22} />
              </div>
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                No products found
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                We couldn&apos;t find anything matching &ldquo;
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {query}
                </span>
                &rdquo;.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
                <span className="text-zinc-400">Popular:</span>
                {["Cleanser", "Centella", "Cream", "Sunscreen"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setQuery(tag);
                      inputRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-velina-rose/10 hover:text-velina-rose transition-colors font-medium"
                  >
                    <Tag size={10} />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom "View all results" Action */}
          {query.trim().length >= 2 && (
            <button
              type="button"
              onClick={() => handleSearchSubmit()}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-50/90 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 text-xs font-bold text-velina-rose hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors group cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>View all results for &ldquo;{query.trim()}&rdquo;</span>
                {results.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-velina-rose/10 text-velina-rose text-[10px] font-extrabold">
                    {results.length}+
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                Go to Catalog <ArrowRight size={13} />
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
