"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { HomeSection, HomeSectionItem } from "@/types/home-section";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { SubCategory } from "@/types/sub-category";
import { toast } from "sonner";

export function useHomeSections() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi<HomeSection[]>("/home-sections");
      setSections(data || []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load sections";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDependencies = useCallback(async () => {
    try {
      const [prodData, catData, subCatData] = await Promise.allSettled([
        fetchApi<{ products: Product[] } | Product[]>("/products?limit=100"),
        fetchApi<Category[]>("/categories"),
        fetchApi<SubCategory[]>("/sub-categories"),
      ]);

      if (prodData.status === "fulfilled") {
        const val = prodData.value;
        if (Array.isArray(val)) {
          setProducts(val);
        } else if (val && Array.isArray(val.products)) {
          setProducts(val.products);
        }
      }

      if (catData.status === "fulfilled" && Array.isArray(catData.value)) {
        setCategories(catData.value);
      }

      if (subCatData.status === "fulfilled" && Array.isArray(subCatData.value)) {
        setSubCategories(subCatData.value);
      }
    } catch (err) {
      console.error("Failed to load dependency data for builder", err);
    }
  }, []);

  useEffect(() => {
    fetchSections();
    fetchDependencies();
  }, [fetchSections, fetchDependencies]);

  // Create section
  const createSection = async (data: FormData | Partial<HomeSection>) => {
    try {
      setIsSaving(true);
      const res = await fetchApi<HomeSection>("/home-sections", {
        method: "POST",
        data,
      });
      toast.success("Section created successfully");
      await fetchSections();
      return res;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create section";
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Update section
  const updateSection = async (id: number, data: FormData | Partial<HomeSection>) => {
    try {
      setIsSaving(true);
      const res = await fetchApi<HomeSection>(`/home-sections/${id}`, {
        method: "PUT",
        data,
      });
      toast.success("Section updated successfully");
      await fetchSections();
      return res;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update section";
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete section
  const deleteSection = async (id: number) => {
    try {
      setIsSaving(true);
      await fetchApi(`/home-sections/${id}`, {
        method: "DELETE",
      });
      toast.success("Section deleted successfully");
      setSections((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete section";
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active status
  const toggleSectionActive = async (id: number, currentStatus: boolean) => {
    try {
      const updatedStatus = !currentStatus;
      // Optimistic update
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: updatedStatus } : s))
      );
      await fetchApi<HomeSection>(`/home-sections/${id}`, {
        method: "PUT",
        data: { is_active: updatedStatus },
      });
      toast.success(`Section ${updatedStatus ? "activated" : "hidden"}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to toggle status";
      toast.error(errorMsg);
      await fetchSections(); // Rollback
    }
  };

  // Reorder sections
  const reorderSections = async (newSections: HomeSection[]) => {
    try {
      const updatedList = newSections.map((s, idx) => ({ ...s, order_index: idx }));
      setSections(updatedList);

      const items = updatedList.map((s, idx) => ({ id: s.id, order_index: idx }));
      await fetchApi<HomeSection[]>("/home-sections/reorder", {
        method: "PATCH",
        data: { items },
      });
      toast.success("Sections order saved");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save order";
      toast.error(errorMsg);
      await fetchSections();
    }
  };

  // Touch & button friendly move section
  const moveSection = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    await reorderSections(newSections);
  };

  // Add Item to Section
  const addItem = async (sectionId: number, data: FormData | Partial<HomeSectionItem>) => {
    try {
      setIsSaving(true);
      const res = await fetchApi<HomeSectionItem>(`/home-sections/${sectionId}/items`, {
        method: "POST",
        data,
      });
      toast.success("Item added successfully");
      await fetchSections();
      return res;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to add item";
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Batch Add Multiple Products as Showcase Items
  const addMultipleProducts = async (sectionId: number, selectedProducts: Product[]) => {
    try {
      setIsSaving(true);
      for (const prod of selectedProducts) {
        const formData = new FormData();
        formData.append("title", prod.title);
        formData.append("subtitle", `৳${prod.regular_price ?? prod.price}`);
        if (prod.description) formData.append("description", prod.description);
        if (prod.save_percentage && prod.save_percentage > 0) {
          formData.append("tag", `${prod.save_percentage}% OFF`);
          formData.append("tag_bg", "bg-rose-500 text-white");
        }
        if (prod.images_url?.[0]) {
          formData.append("image_url", prod.images_url[0]);
        }
        formData.append("link_url", `/products/${prod.id}`);
        formData.append("button_text", "BUY NOW");
        formData.append("product_id", prod.id.toString());
        formData.append("bg_gradient", "from-zinc-900 via-stone-900 to-neutral-950");
        formData.append("is_active", "true");

        await fetchApi(`/home-sections/${sectionId}/items`, {
          method: "POST",
          data: formData,
        });
      }
      toast.success(`Added ${selectedProducts.length} product(s) to showcase`);
      await fetchSections();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to add products";
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Update Item
  const updateItem = async (itemId: number, data: FormData | Partial<HomeSectionItem>) => {
    try {
      setIsSaving(true);
      const res = await fetchApi<HomeSectionItem>(`/home-sections/items/${itemId}`, {
        method: "PUT",
        data,
      });
      toast.success("Item updated successfully");
      await fetchSections();
      return res;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update item";
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Item
  const deleteItem = async (itemId: number) => {
    try {
      setIsSaving(true);
      await fetchApi(`/home-sections/items/${itemId}`, {
        method: "DELETE",
      });
      toast.success("Item deleted successfully");
      await fetchSections();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete item";
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Reorder Items within a section
  const reorderItems = async (sectionId: number, newItems: HomeSectionItem[]) => {
    try {
      const updatedItems = newItems.map((item, idx) => ({ ...item, order_index: idx }));
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, items: updatedItems } : s
        )
      );

      const items = updatedItems.map((item, idx) => ({ id: item.id, order_index: idx }));
      await fetchApi<HomeSection>(`/home-sections/${sectionId}/items/reorder`, {
        method: "PATCH",
        data: { items },
      });
      toast.success("Items order saved");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to reorder items";
      toast.error(errorMsg);
      await fetchSections();
    }
  };

  // Move item with buttons (touch & mobile friendly)
  const moveItem = async (sectionId: number, itemIndex: number, direction: "up" | "down") => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec || !sec.items) return;

    const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= sec.items.length) return;

    const newItems = [...sec.items];
    const [moved] = newItems.splice(itemIndex, 1);
    newItems.splice(targetIndex, 0, moved);

    await reorderItems(sectionId, newItems);
  };

  // Import default store carousel & sections
  const importDefaultSections = async () => {
    try {
      setIsSaving(true);
      const { DEFAULT_STORE_SECTIONS } = await import("../defaultSectionsData");
      for (const secData of DEFAULT_STORE_SECTIONS) {
        const secRes = await fetchApi<HomeSection>("/home-sections", {
          method: "POST",
          data: {
            title: secData.title,
            subtitle: secData.subtitle,
            badge_text: secData.badge_text,
            description: secData.description,
            section_type: secData.section_type,
            bg_type: secData.bg_type,
            bg_gradient: secData.bg_gradient,
            bg_color: (secData as { bg_color?: string }).bg_color,
            button_text: secData.button_text,
            button_url: secData.button_url,
            max_items: secData.max_items,
            is_active: secData.is_active,
            order_index: secData.order_index,
          },
        });

        if (secData.items && secData.items.length > 0) {
          for (const item of secData.items) {
            await fetchApi(`/home-sections/${secRes.id}/items`, {
              method: "POST",
              data: item,
            });
          }
        }
      }

      toast.success("Default store carousel and sections imported!");
      await fetchSections();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to import default sections";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    sections,
    products,
    categories,
    subCategories,
    loading,
    isSaving,
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
    toggleSectionActive,
    reorderSections,
    moveSection,
    addItem,
    addMultipleProducts,
    updateItem,
    deleteItem,
    reorderItems,
    moveItem,
    importDefaultSections,
  };
}
