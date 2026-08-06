import { Category } from "./category";
import { SubCategory } from "./sub-category";

export type ProductSizeUnit = "ml" | "gm";

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  regular_price?: number;
  mrp_price?: number;
  save_amount?: number;
  save_percentage?: number;
  currency_symbol?: string;
  size?: number | null;
  size_unit?: ProductSizeUnit | null;
  stock_quantity: number;
  images_url: string[];
  status: "draft" | "active" | "inactive";
  category_id: number;
  sub_category_id: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  sub_category?: SubCategory;
  ratings?: {
    stars: number;
  }[];
}

export interface CreateProductDto {
  title: string;
  description?: string;
  price?: number;
  regular_price?: number;
  mrp_price?: number;
  currency_symbol?: string;
  size?: number;
  size_unit?: ProductSizeUnit;
  stock_quantity: number;
  images_url?: string[];
  status?: "draft" | "active" | "inactive";
  category_id: number;
  sub_category_id: number;
}
