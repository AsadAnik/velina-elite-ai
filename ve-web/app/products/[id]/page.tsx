"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ShoppingCart, AlertCircle } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import CartDrawer from "@/app/components/CartDrawer";
import StickyCartWidget from "@/app/components/StickyCartWidget";
import { fetchApi } from "@/lib/api";
import { Product as ApiProduct } from "@/types/product";
import { Product as UiProduct } from "@/lib/data";
import { useStore } from "@/lib/store";

// Transform API product to UI product format
function transformApiToUiProduct(apiProduct: ApiProduct): UiProduct {
  const price = Number(apiProduct.regular_price ?? apiProduct.price);
  const mrp = Number(apiProduct.mrp_price ?? price);
  const saving = Number(apiProduct.save_amount ?? Math.max(0, mrp - price));
  const percentage = Number(apiProduct.save_percentage ?? (mrp ? Math.round(saving / mrp * 100) : 0));

  return {
    id: apiProduct.id,
    name: apiProduct.title,
    brand: apiProduct.category?.name || "Velina",
    category: apiProduct.category?.name?.toLowerCase() || "skin",
    subcategory: apiProduct.sub_category?.name?.toLowerCase() || "general",
    image: apiProduct.images_url[0] || "/placeholder.png",
    originalPrice: mrp,
    salePrice: price,
    discountPercent: percentage,
    rating: 4.5,
    reviewCount: 100,
    isSale: mrp > price,
    isNew: false,
    isBestSeller: false,
    stockQuantity: apiProduct.stock_quantity,
  };
}

export default function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
  const { addToCart, toggleWishlist, isInWishlist, cart } = useStore();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [stockError, setStockError] = useState<string | null>(null);
  useEffect(() => { params.then(({ id }) => fetchApi<ApiProduct>(`/products/${id}`).then(setProduct)); }, [params]);
  if (!product) return <><Navbar /><main className="p-8">Loading product…</main></>;
  const price = Number(product.regular_price ?? product.price); const mrp = Number(product.mrp_price ?? price); const saving = Number(product.save_amount ?? Math.max(0, mrp - price)); const percentage = Number(product.save_percentage ?? (mrp ? Math.round(saving / mrp * 100) : 0));

  const uiProduct = transformApiToUiProduct(product);
  const inWishlist = isInWishlist(product.id);
  
  const cartItem = cart.find(item => item.product.id === product.id);
  const currentQuantity = cartItem?.quantity || 0;
  const isOutOfStock = product.stock_quantity <= 0;
  const isAtStockLimit = currentQuantity >= product.stock_quantity;

  const handleWishlistClick = () => {
    toggleWishlist(uiProduct);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      setStockError("Sorry, this product is out of stock");
      return;
    }
    
    if (isAtStockLimit) {
      setStockError(`You can only add ${product.stock_quantity} item(s) to cart`);
      return;
    }

    setStockError(null);
    addToCart(uiProduct);
  };

  return <><Navbar /><main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2 lg:gap-12"><div><div className="group relative aspect-square overflow-hidden rounded-2xl bg-surface">{product.images_url[selectedImage] && <Image src={product.images_url[selectedImage]} alt={product.title} fill priority className="object-cover transition-transform duration-500 group-hover:scale-125" />}<button onClick={handleWishlistClick} className={`absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${inWishlist ? "bg-velina-rose text-white scale-110" : "bg-white/90 dark:bg-zinc-900/90 text-zinc-400 hover:text-velina-rose"}`} aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}><Heart size={18} className={inWishlist ? "fill-white" : ""} /></button></div>{product.images_url.length > 1 && <div className="mt-3 flex gap-3 overflow-x-auto pb-1">{product.images_url.map((image, index) => <button key={image} onClick={() => setSelectedImage(index)} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${selectedImage === index ? "border-velina-rose" : "border-transparent"}`}><Image src={image} alt={`${product.title} ${index + 1}`} fill className="object-cover" /></button>)}</div>}</div><section><p className="text-sm text-muted">{product.category?.name} {product.sub_category && `› ${product.sub_category.name}`}</p><h1 className="mt-2 text-3xl font-black">{product.title}</h1><div className="mt-5 flex flex-wrap items-end gap-3"><p className="text-3xl font-black text-velina-rose">{product.currency_symbol ?? "৳"}{price.toLocaleString()}</p>{mrp > price && <p className="text-lg text-muted line-through">{product.currency_symbol ?? "৳"}{mrp.toLocaleString()}</p>}{percentage > 0 && <span className="rounded-full bg-velina-rose/10 px-3 py-1 text-sm font-black text-velina-rose">{percentage}% OFF</span>}</div>{saving > 0 && <p className="mt-2 font-bold text-emerald-600 dark:text-emerald-400">You save {product.currency_symbol ?? "৳"}{saving.toLocaleString()}</p>}{product.size && <p className="mt-5">Size: {product.size} {product.size_unit}</p>}<p className="mt-3">{product.stock_quantity > 0 ? `In stock (${product.stock_quantity} available)` : "Out of stock"}</p><p className="mt-6 whitespace-pre-line text-muted">{product.description}</p>{stockError && <div className="mt-4 text-sm text-red-500 flex items-center gap-2"><AlertCircle size={16} />{stockError}</div>}<div className="mt-8 flex gap-4"><button onClick={handleAddToCart} disabled={isOutOfStock || isAtStockLimit} className={`flex-1 flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition-colors duration-200 ${isOutOfStock || isAtStockLimit ? "bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed" : "bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-velina-rose hover:bg-velina-rose"}`}><ShoppingCart size={18} />{isOutOfStock ? "OUT OF STOCK" : isAtStockLimit ? "STOCK LIMIT REACHED" : "ADD TO CART"}</button></div><Link className="mt-4 inline-block font-bold text-velina-rose" href={`/category/${product.category_id}`}>View all products</Link></section></main><StickyCartWidget /><CartDrawer /></>;
}
