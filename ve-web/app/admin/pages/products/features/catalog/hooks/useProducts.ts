"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { SubCategory } from "@/types/sub-category";

export function useProducts() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsResponse, cats, subCats] = await Promise.all([
        fetchApi<{ data: Product[]; meta: any }>("/products"),
        fetchApi<Category[]>("/categories"),
        fetchApi<SubCategory[]>("/sub-categories"),
      ]);
      setRawProducts(prodsResponse.data || []);
      setCategories(cats);
      setSubCategories(subCats);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const products = rawProducts.filter((product) => {
    const matchesSearch =
      search === "" ||
      product.title.toLowerCase().includes(search.toLowerCase());
    
    // In dummy data it was product.category === category
    // Let's assume category state holds the category name, or "All"
    let matchesCategory = true;
    if (category !== "All") {
      const cat = categories.find(c => c.id === product.category_id);
      if (cat) {
        matchesCategory = cat.name === category;
      } else {
        matchesCategory = false;
      }
    }
    
    return matchesSearch && matchesCategory;
  });

  return {
    products,
    categories: categories.map(c => c.name),
    rawCategories: categories,
    rawSubCategories: subCategories,
    search,
    setSearch,
    category,
    setCategory,
    totalCount: rawProducts.length,
    loading,
    refreshData: loadData,
  };
}
