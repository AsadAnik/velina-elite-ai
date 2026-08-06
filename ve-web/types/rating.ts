export interface Rating {
  id: number;
  customer_id: number;
  product_id: number;
  stars: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    user: {
      username: string;
    };
  };
  product?: {
    title: string;
    images_url: string[];
  };
}

export interface ProductRatingsSummary {
  ratings: Rating[];
  averageRating: number;
  totalRatings: number;
}
