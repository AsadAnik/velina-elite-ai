"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import CartDrawer from "@/app/components/CartDrawer";
import StickyCartWidget from "@/app/components/StickyCartWidget";
import { fetchApi } from "@/lib/api";
import { Product as ApiProduct } from "@/types/product";
import { Product as UiProduct } from "@/lib/data";
import { useStore } from "@/lib/store";
import ProductRatings from "./components/ProductRatings";
import RelatedProducts from "./components/RelatedProducts";
import { ProductRatingsSummary } from "@/types/rating";

export default function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist, cart, showToast, setBuyNow } = useStore();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [ratings, setRatings] = useState<ProductRatingsSummary | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ApiProduct[]>([]);

  useEffect(() => {
    params.then(({ id }) => {
      fetchApi<ApiProduct>(`/products/${id}`).then(setProduct);
      fetchApi<ProductRatingsSummary>(`/products/${id}/ratings`).then(setRatings).catch(() => {});
      fetchApi<ApiProduct[]>(`/products/${id}/related`).then(setRelatedProducts).catch(() => {});
    });
  }, [params]);

  if (!product)
    return (
      <>
        <Navbar />
        <main className="p-8">Loading product…</main>
      </>
    );

  const price = Number(product.regular_price ?? product.price);
  const mrp = Number(product.mrp_price ?? price);
  const saving = Number(product.save_amount ?? Math.max(0, mrp - price));
  const percentage = Number(
    product.save_percentage ?? (mrp ? Math.round((saving / mrp) * 100) : 0)
  );

  const uiProduct: UiProduct = {
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

  const inWishlist = isInWishlist(product.id);
  const cartItem = cart.find((item) => item.product.id === product.id);
  const currentQuantity = cartItem?.quantity || 0;
  const isOutOfStock = product.stock_quantity <= 0;
  const isAtStockLimit = currentQuantity >= product.stock_quantity;

  const handleWishlistClick = () => toggleWishlist(uiProduct);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      showToast("Sorry, this product is out of stock", "error");
      return;
    }
    if (isAtStockLimit) {
      showToast(`You can only add ${product.stock_quantity} item(s) to cart`, "error");
      return;
    }
    addToCart(uiProduct);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      showToast("Sorry, this product is out of stock", "error");
      return;
    }
    setBuyNow(uiProduct, 1);
    router.push("/checkout");
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2 lg:gap-12">
        {/* Image gallery */}
        <div>
          <div className="group relative aspect-square overflow-hidden rounded-2xl bg-surface">
            {product.images_url[selectedImage] && (
              <Image
                src={product.images_url[selectedImage]}
                alt={product.title}
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-125"
              />
            )}
            <button
              onClick={handleWishlistClick}
              className={`absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
                inWishlist
                  ? "bg-velina-rose text-white scale-110"
                  : "bg-white/90 dark:bg-zinc-900/90 text-zinc-400 hover:text-velina-rose"
              }`}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={18} className={inWishlist ? "fill-white" : ""} />
            </button>
          </div>
          {product.images_url.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {product.images_url.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${
                    selectedImage === index ? "border-velina-rose" : "border-transparent"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <section>
          <p className="text-sm text-muted">
            {product.category?.name}
            {product.sub_category && ` › ${product.sub_category.name}`}
          </p>
          <h1 className="mt-2 text-3xl font-black">{product.title}</h1>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-black text-velina-rose">
              {product.currency_symbol ?? "৳"}
              {price.toLocaleString()}
            </p>
            {mrp > price && (
              <p className="text-lg text-muted line-through">
                {product.currency_symbol ?? "৳"}
                {mrp.toLocaleString()}
              </p>
            )}
            {percentage > 0 && (
              <span className="rounded-full bg-velina-rose/10 px-3 py-1 text-sm font-black text-velina-rose">
                {percentage}% OFF
              </span>
            )}
          </div>

          {saving > 0 && (
            <p className="mt-2 font-bold text-emerald-600 dark:text-emerald-400">
              You save {product.currency_symbol ?? "৳"}
              {saving.toLocaleString()}
            </p>
          )}
          {product.size && (
            <p className="mt-5">
              Size: {product.size} {product.size_unit}
            </p>
          )}
          <p className="mt-3">
            {product.stock_quantity > 0
              ? `In stock (${product.stock_quantity} available)`
              : "Out of stock"}
          </p>
          <p className="mt-6 whitespace-pre-line text-muted">{product.description}</p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAtStockLimit}
              className={`flex-1 flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-colors duration-200 ${
                isOutOfStock || isAtStockLimit
                  ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-900 dark:bg-zinc-700 text-white hover:bg-velina-rose dark:hover:bg-velina-rose"
              }`}
            >
              <ShoppingCart size={18} />
              {isOutOfStock
                ? "OUT OF STOCK"
                : isAtStockLimit
                ? "STOCK LIMIT REACHED"
                : "ADD TO CART"}
            </button>

            {/* Buy Now */}
            {!isOutOfStock && (
              <button
                onClick={handleBuyNow}
                className="flex-1 flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl bg-velina-rose text-white hover:bg-velina-magenta transition-colors duration-200 shadow-md shadow-velina-rose/30"
              >
                <Zap size={18} />
                BUY NOW
              </button>
            )}
          </div>

          <Link
            className="mt-4 inline-block font-bold text-velina-rose hover:underline"
            href={`/category/${product.category_id}`}
          >
            View all category products
          </Link>
        </section>
      </main>

      <div className="mx-auto max-w-6xl px-4">
        {ratings && <ProductRatings data={ratings} />}
        {relatedProducts.length > 0 && <RelatedProducts products={relatedProducts} />}
      </div>

      <StickyCartWidget />
      <CartDrawer />
    </>
  );
}
