"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { SubCategory } from "@/types/sub-category";

export function useProducts() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 1,
  });

  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (category !== "All") {
        const selectedCat = categories.find((c) => c.name === category);
        if (selectedCat) {
          params.set("category_id", selectedCat.id.toString());
        }
      }

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const [prodsResponse, cats, subCats] = await Promise.all([
        fetchApi<{
          data: Product[];
          meta: { total: number; page: number; limit: number; total_pages: number };
        }>(`/products?${params.toString()}`),
        categories.length > 0 ? Promise.resolve(categories) : fetchApi<Category[]>("/categories"),
        subCategories.length > 0
          ? Promise.resolve(subCategories)
          : fetchApi<SubCategory[]>("/sub-categories"),
      ]);

      const items = Array.isArray(prodsResponse.data) ? prodsResponse.data : [];
      setRawProducts(items);

      if (prodsResponse.meta) {
        setMeta(prodsResponse.meta);
      } else {
        setMeta({
          total: items.length,
          page,
          limit,
          total_pages: Math.ceil(items.length / limit) || 1,
        });
      }

      if (Array.isArray(cats)) setCategories(cats);
      if (Array.isArray(subCats)) setSubCategories(subCats);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, category, statusFilter, categories, subCategories]);

  useEffect(() => {
    loadData();
  }, [page, limit, category, statusFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  return {
    products: rawProducts,
    categories: categories.map((c) => c.name),
    rawCategories: categories,
    rawSubCategories: subCategories,
    search,
    setSearch,
    category,
    setCategory: (c: string) => {
      setCategory(c);
      setPage(1);
    },
    statusFilter,
    setStatusFilter: (s: string) => {
      setStatusFilter(s);
      setPage(1);
    },
    page,
    setPage,
    limit,
    setLimit: (l: number) => {
      setLimit(l);
      setPage(1);
    },
    meta,
    totalCount: meta.total,
    loading,
    refreshData: loadData,
  };
}
