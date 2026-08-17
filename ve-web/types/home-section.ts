import { Product } from "./product";

export type HomeSectionType =
  | "hero_slider"
  | "deals_grid"
  | "promo_banner"
  | "banner_grid"
  | "product_showcase";

export type HomeSectionBgType = "gradient" | "color" | "image";

export interface HomeSectionItem {
  id: number;
  section_id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  tag?: string | null;
  tag_bg?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  button_text?: string | null;
  bg_gradient?: string | null;
  bg_color?: string | null;
  product_id?: number | null;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  product?: Product | null;
}

export interface HomeSection {
  id: number;
  title: string;
  subtitle?: string | null;
  badge_text?: string | null;
  description?: string | null;
  section_type: HomeSectionType | string;
  bg_type: HomeSectionBgType | string;
  bg_color?: string | null;
  bg_gradient?: string | null;
  bg_image?: string | null;
  banner_image?: string | null;
  banner_url?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  order_index: number;
  is_active: boolean;
  max_items: number;
  items: HomeSectionItem[];
  created_at?: string;
  updated_at?: string;
}
