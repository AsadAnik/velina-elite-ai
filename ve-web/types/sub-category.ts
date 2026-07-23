import { Category } from "./category";

export interface SubCategory {
  id: number;
  name: string;
  category_id: number;
  created_at: string;
  updated_at: string;
  category?: Category; // If joined
}

export interface CreateSubCategoryDto {
  name: string;
  category_id: number;
}
