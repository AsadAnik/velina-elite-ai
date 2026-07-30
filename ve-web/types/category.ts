export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  sub_categories?: Array<{ id: number; name: string; category_id: number; _count?: { products: number } }>;
  _count?: { products: number };
}

export interface CreateCategoryDto {
  name: string;
}
