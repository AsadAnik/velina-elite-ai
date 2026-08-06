import { Product as ApiProduct } from "@/types/product";
import ProductCard from "@/app/components/ProductCard";

export default function RelatedProducts({ products }: { products: ApiProduct[] }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-16 mb-8">
      <h2 className="text-2xl font-black mb-6">Related Products</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {products.map((product) => {
          const price = Number(product.regular_price ?? product.price);
          const mrp = Number(product.mrp_price ?? price);
          const saving = Number(product.save_amount ?? Math.max(0, mrp - price));
          const percentage = Number(
            product.save_percentage ?? (mrp ? Math.round((saving / mrp) * 100) : 0)
          );
          
          const uiProduct = {
            id: product.id,
            name: product.title,
            brand: product.category?.name || "Velina",
            category: product.category?.name?.toLowerCase() || "skin",
            subcategory: product.sub_category?.name?.toLowerCase() || "general",
            image: product.images_url[0] || "/placeholder.png",
            originalPrice: mrp,
            salePrice: price,
            discountPercent: percentage,
            rating: product.ratings && product.ratings.length > 0
              ? Number((product.ratings.reduce((sum, r) => sum + r.stars, 0) / product.ratings.length).toFixed(1))
              : 0,
            reviewCount: product.ratings?.length || 0,
            isSale: mrp > price,
            isNew: false,
            isBestSeller: false,
            stockQuantity: product.stock_quantity,
          };
          
          return <ProductCard key={product.id} product={uiProduct} />;
        })}
      </div>
    </div>
  );
}
