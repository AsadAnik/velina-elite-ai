"use client";
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import CatalogView from "@/app/components/CatalogView";
import CartDrawer from "@/app/components/CartDrawer";
import StickyCartWidget from "@/app/components/StickyCartWidget";
import { fetchApi } from "@/lib/api";
import { SubCategory } from "@/types/sub-category";
export default function SubcategoryPage({ params }: { params: Promise<{ slug: string; subslug: string }> }) {
 const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
 useEffect(() => { params.then(({subslug}) => fetchApi<SubCategory[]>("/sub-categories").then(items => setSubCategory(items.find(item => item.id === Number(subslug.split("-")[0])) ?? null))); }, [params]);
 return <><Navbar /><CatalogView categoryId={subCategory?.category_id} subCategoryId={subCategory?.id} title={subCategory?.name ?? "Sub-category"} /><StickyCartWidget /><CartDrawer /></>;
}
