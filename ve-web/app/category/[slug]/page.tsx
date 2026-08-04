"use client";
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import CatalogView from "@/app/components/CatalogView";
import CartDrawer from "@/app/components/CartDrawer";
import StickyCartWidget from "@/app/components/StickyCartWidget";
import { fetchApi } from "@/lib/api";
import { Category } from "@/types/category";
export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
 const [category, setCategory] = useState<Category | null>(null);
 useEffect(() => { params.then(({slug}) => fetchApi<Category>(`/categories/${Number(slug.split("-")[0])}`).then(setCategory)); }, [params]);
 return <><Navbar /><CatalogView categoryId={category?.id} title={category?.name ?? "Category"} /><StickyCartWidget /><CartDrawer /></>;
}
