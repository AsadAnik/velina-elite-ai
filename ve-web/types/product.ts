import { Category } from "./category";
import { SubCategory } from "./sub-category";

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  stock_quantity: number;
  images_url: string[];
  status: "draft" | "active" | "inactive";
  category_id: number;
  sub_category_id: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  sub_category?: SubCategory;
}

export interface CreateProductDto {
  title: string;
  description?: string;
  price: number;
  stock_quantity: number;
  images_url?: string[];
  status?: "draft" | "active" | "inactive";
  category_id: number;
  sub_category_id: number;
}
