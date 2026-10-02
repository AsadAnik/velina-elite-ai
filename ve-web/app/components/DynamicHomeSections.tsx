"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { HomeSection, HomeSectionItem } from "@/types/home-section";
import DealsSection from "./DealsSection";
import PromoBanners from "./PromoBanners";
import { useStore } from "@/lib/store";

// region DYNAMIC HOME
export default function DynamicHomeSections({ onHeroRendered }: { onHeroRendered?: (hasDynamicHero: boolean) => void; }) {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSections() {
      try {
        const data = await fetchApi<HomeSection[]>("/home-sections/public");
        if (Array.isArray(data) && data.length > 0) {
          setSections(data);
          const hasHero = data.some((s) => s.section_type === "hero_slider");
          onHeroRendered?.(hasHero);
        }
      } catch (err) {
        console.error("Could not load dynamic home sections", err);
      } finally {
        setLoading(false);
      }
    }

    loadSections();
  }, [onHeroRendered]);

  const nonHeroSections = sections.filter((s) => s.section_type !== "hero_slider");

  // Fallback to static default sections if no dynamic sections configured yet
  if (!loading && nonHeroSections.length === 0) {
    return (
      <div className="space-y-12 md:space-y-16 py-6 md:py-10">
        <DealsSection />
        <PromoBanners />
      </div>
    );
  }

  // region MAIN UI
  return (
    <div className="space-y-12 md:space-y-16 py-6 md:py-10">
      {nonHeroSections.map((section) => (
        <RenderSection key={section.id} section={section} />
      ))}
    </div>
  );
}

// region RENDER SECTION
function RenderSection({ section }: { section: HomeSection }) {
  // Determine background styling
  let bgStyle: React.CSSProperties = {};
  let bgClasses = "w-full transition-colors duration-300 ";

  if (section.bg_type === "gradient" && section.bg_gradient) {
    if (section.bg_gradient.startsWith("from-")) {
      bgClasses += `bg-gradient-to-br ${section.bg_gradient} `;
    } else {
      bgStyle.background = section.bg_gradient;
    }
  } else if (section.bg_type === "color" && section.bg_color) {
    bgStyle.backgroundColor = section.bg_color;
  } else if (section.bg_type === "image" && section.bg_image) {
    bgStyle.backgroundImage = `url(${section.bg_image})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  }

  // 1. Hero Slider
  if (section.section_type === "hero_slider") {
    return <DynamicHeroSlider section={section} />;
  }

  // 2. Product Showcase
  if (section.section_type === "product_showcase") {
    return <ProductShowcaseSection section={section} bgClasses={bgClasses} bgStyle={bgStyle} />;
  }

  // 3. Promo Banner
  if (section.section_type === "promo_banner") {
    return <PromoBannerSection section={section} bgClasses={bgClasses} bgStyle={bgStyle} />;
  }

  // 4. Banner Grid
  if (section.section_type === "banner_grid") {
    return <BannerGridSection section={section} bgClasses={bgClasses} bgStyle={bgStyle} />;
  }

  // 5. Deals Grid (default)
  return <DealsGridSection section={section} bgClasses={bgClasses} bgStyle={bgStyle} />;
}

// region HERO-SLIDER SECTION
// 1. Dynamic Hero Slider Carousel
function DynamicHeroSlider({ section }: { section: HomeSection }) {
  const items = section.items || [];
  const [currentSlide, setCurrentSlide] = useState(0);

  // If no items, but section has banner image, show single slide
  const slides = items.length > 0 ? items : [
    {
      id: 0,
      title: section.title,
      subtitle: section.subtitle,
      description: section.description,
      image_url: section.banner_image || "/1777982649615(1)(1).png",
      button_text: section.button_text || "EXPLORE NOW",
      link_url: section.button_url || "/products",
      bg_gradient: section.bg_gradient,
    } as unknown as HomeSectionItem,
  ];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative w-full overflow-hidden bg-zinc-950 h-[380px] sm:h-[440px] md:h-[500px]">
      {/* Slider Track */}
      <div
        className="w-full h-full flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={slide.id || i} className="w-full h-full flex-shrink-0 relative overflow-hidden">
            {/* Background Graphic / Image */}
            {slide.image_url ? (
              <Image
                src={slide.image_url}
                alt={slide.title || "Hero banner"}
                fill
                priority={i === 0}
                className="object-cover object-center brightness-90 dark:brightness-75"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${slide.bg_gradient || "from-purple-950 via-zinc-900 to-black"
                  }`}
              />
            )}

            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

            {/* Slide Content Overlay */}
            <div className="absolute inset-0 max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-center text-white z-10">
              <div className="max-w-xl space-y-3">
                {slide.tag && (
                  <span
                    className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md ${slide.tag_bg || "bg-velina-rose text-white"
                      }`}
                  >
                    {slide.tag}
                  </span>
                )}
                {slide.title && (
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-none drop-shadow-md">
                    {slide.title}
                  </h2>
                )}
                {slide.subtitle && (
                  <p className="text-base sm:text-xl font-bold text-velina-peach uppercase tracking-wide">
                    {slide.subtitle}
                  </p>
                )}
                {slide.description && (
                  <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2 max-w-md font-medium">
                    {slide.description}
                  </p>
                )}

                <div className="pt-2">
                  <Link
                    href={slide.link_url || "/products"}
                    className="inline-flex items-center gap-2 bg-white text-zinc-950 hover:bg-velina-gold hover:text-white transition-all text-xs font-black tracking-widest px-7 py-3.5 rounded-full shadow-xl hover:scale-105 active:scale-95"
                  >
                    <span>{slide.button_text || "SHOP NOW"}</span>
                    <ArrowRight size={14} className="stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prev / Next Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all z-20"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all z-20"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? "w-7 bg-velina-rose" : "w-2 bg-white/50"
                  }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// region PRODUCT-SHOWCASE SECTION
// 2. Product Showcase Grid Section
function ProductShowcaseSection({ section, bgClasses, bgStyle }: { section: HomeSection; bgClasses: string; bgStyle: React.CSSProperties; }) {
  const items = section.items || [];
  const { addToCart, toggleWishlist, isInWishlist } = useStore();

  return (
    <section className={`py-10 md:py-14 ${bgClasses}`} style={bgStyle}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          {section.badge_text && (
            <h2 className="text-[11px] font-black tracking-widest text-velina-rose dark:text-pink-300 uppercase">
              {section.badge_text}
            </h2>
          )}
          <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-1 uppercase tracking-wider">
            {section.title}
          </h3>
          {section.subtitle && (
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl mx-auto font-medium">
              {section.subtitle}
            </p>
          )}
          <div className="w-16 h-1 bg-velina-gold mx-auto mt-3 rounded-full" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => {
            const product = item.product;
            const targetLink =
              item.link_url ||
              (item.product_id ? `/products/${item.product_id}` : "/products");
            const inWishlist = item.product_id ? isInWishlist(item.product_id) : false;

            const regularPrice = product?.regular_price ?? product?.price;
            const mrpPrice = product?.mrp_price;
            const imgUrl = item.image_url || product?.images_url?.[0] || "/placeholder.png";

            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image area */}
                <div className="relative aspect-square overflow-hidden bg-zinc-50 dark:bg-zinc-800/60">
                  {item.tag && (
                    <span
                      className={`absolute top-3 left-3 z-10 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs ${item.tag_bg || "bg-velina-rose text-white"
                        }`}
                    >
                      {item.tag}
                    </span>
                  )}

                  <Image
                    src={imgUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Wishlist button */}
                  {product && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const regPrice = Number(product.regular_price ?? product.price ?? 0);
                        const mrp = Number(product.mrp_price ?? regPrice);
                        const disc = mrp > regPrice && mrp > 0 ? Math.round(((mrp - regPrice) / mrp) * 100) : 0;
                        toggleWishlist({
                          id: product.id,
                          name: product.title,
                          brand: "Velina Elite",
                          category: "Beauty",
                          subcategory: "General",
                          image: imgUrl,
                          originalPrice: mrp,
                          salePrice: regPrice,
                          discountPercent: disc,
                          rating: 5,
                          reviewCount: 1,
                          isSale: disc > 0,
                          stockQuantity: product.stock_quantity ?? 100,
                        });
                      }}
                      className={`absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${inWishlist
                        ? "bg-velina-rose text-white scale-110"
                        : "bg-white/90 dark:bg-zinc-900/90 text-zinc-400 hover:text-velina-rose"
                        }`}
                    >
                      <Heart size={15} className={inWishlist ? "fill-white" : ""} />
                    </button>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 leading-snug">
                      <Link href={targetLink} className="hover:text-velina-rose transition-colors">
                        {item.title}
                      </Link>
                    </h4>

                    {/* Price row */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm sm:text-base font-black text-velina-rose">
                        ৳{regularPrice ?? item.subtitle}
                      </span>
                      {mrpPrice && regularPrice && Number(mrpPrice) > Number(regularPrice) && (
                        <span className="text-xs text-muted line-through">
                          ৳{mrpPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart / Buy Button */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    <Link
                      href={targetLink}
                      className="flex-1 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground text-center text-xs font-bold transition-colors"
                    >
                      View Details
                    </Link>

                    {product && (
                      <button
                        onClick={() => {
                          const regPrice = Number(product.regular_price ?? product.price ?? 0);
                          const mrp = Number(product.mrp_price ?? regPrice);
                          const disc = mrp > regPrice && mrp > 0 ? Math.round(((mrp - regPrice) / mrp) * 100) : 0;
                          addToCart({
                            id: product.id,
                            name: product.title,
                            brand: "Velina Elite",
                            category: "Beauty",
                            subcategory: "General",
                            image: imgUrl,
                            originalPrice: mrp,
                            salePrice: regPrice,
                            discountPercent: disc,
                            rating: 5,
                            reviewCount: 1,
                            isSale: disc > 0,
                            stockQuantity: product.stock_quantity ?? 100,
                          });
                        }}
                        className="p-2 rounded-xl bg-velina-rose text-white hover:bg-rose-600 shadow-xs transition-colors"
                        title="Add to Cart"
                      >
                        <ShoppingCart size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// region DEALS-GRID SECTION
// 3. Deals Grid Section (Card based)
function DealsGridSection({ section, bgClasses, bgStyle }: { section: HomeSection; bgClasses: string; bgStyle: React.CSSProperties; }) {
  const items = section.items || [];

  return (
    <section className={`py-10 md:py-14 ${bgClasses}`} style={bgStyle}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          {section.badge_text && (
            <h2 className="text-[11px] font-black tracking-widest text-velina-rose dark:text-pink-300 uppercase">
              {section.badge_text}
            </h2>
          )}
          <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-1 uppercase tracking-wider">
            {section.title}
          </h3>
          {section.subtitle && (
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl mx-auto font-medium">
              {section.subtitle}
            </p>
          )}
          <div className="w-16 h-1 bg-velina-gold mx-auto mt-3 rounded-full" />
        </div>

        {/* Responsive Grid */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
            } gap-5 md:gap-6`}
        >
          {items.map((item) => {
            const cardBg = item.bg_gradient || "from-blue-600 to-indigo-800";
            const targetLink =
              item.link_url ||
              (item.product_id ? `/products/${item.product_id}` : "/products");

            return (
              <div
                key={item.id}
                className={`rounded-3xl bg-gradient-to-br ${cardBg} overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1.5`}
              >
                {/* Card Image Header */}
                <div className="relative w-full h-44 sm:h-48 bg-zinc-900/40 overflow-hidden flex items-center justify-center">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                    />
                  ) : (
                    <Sparkles size={36} className="text-white/40" />
                  )}

                  {item.tag && (
                    <span
                      className={`absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs ${item.tag_bg || "bg-cyan-400 text-slate-900"
                        }`}
                    >
                      {item.tag}
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-extrabold tracking-widest text-white/70 uppercase">
                      {item.title}
                    </h4>
                    <h5 className="text-xl font-black text-white mt-1 leading-tight">
                      {item.subtitle || item.title}
                    </h5>
                    {item.description && (
                      <p className="text-xs text-white/80 mt-2 font-medium line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <Link
                      href={targetLink}
                      className="w-full bg-white text-zinc-900 hover:bg-velina-gold hover:text-white transition-all text-xs font-black tracking-widest py-3 rounded-full flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {item.button_text || "SHOP DEALS"}
                      <ArrowRight size={14} className="stroke-[2.5]" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// region PROMO-BANNER SECTION
// 4. Wide Campaign Promo Banner Section
function PromoBannerSection({ section, bgClasses, bgStyle }: { section: HomeSection; bgClasses: string; bgStyle: React.CSSProperties; }) {
  const targetLink = section.button_url || section.banner_url || "/products";

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6">
      <div
        className={`w-full rounded-3xl overflow-hidden shadow-lg p-6 sm:p-8 md:p-12 relative flex flex-col md:flex-row items-center justify-between gap-8 text-white ${bgClasses}`}
        style={bgStyle}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full -ml-20 -mb-20 pointer-events-none" />

        <div className="z-10 text-center md:text-left flex-1 max-w-2xl">
          {section.badge_text && (
            <div className="inline-block bg-amber-400 text-zinc-950 font-black text-[10px] tracking-widest px-3.5 py-1 rounded-full uppercase mb-3 shadow-xs">
              {section.badge_text}
            </div>
          )}
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight uppercase">
            {section.title}
          </h3>
          {section.subtitle && (
            <h4 className="text-lg sm:text-xl font-bold text-velina-peach tracking-wide uppercase mt-1">
              {section.subtitle}
            </h4>
          )}
          {section.description && (
            <p className="text-xs sm:text-sm text-zinc-200 mt-2 font-medium leading-relaxed">
              {section.description}
            </p>
          )}
        </div>

        <div className="z-10 flex flex-col sm:flex-row items-center gap-4 shrink-0">
          {section.banner_image && (
            <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-md">
              <Image
                src={section.banner_image}
                alt={section.title}
                fill
                className="object-contain"
              />
            </div>
          )}

          <Link
            href={targetLink}
            className="bg-white text-zinc-950 hover:bg-velina-gold hover:text-white transition-all text-xs font-black tracking-widest px-8 py-3.5 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            {section.button_text || "EXPLORE DEALS"}
            <ArrowRight size={14} className="stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// region BANNER GRID SECTION
// 5. Banner Grid Section
function BannerGridSection({ section, bgClasses, bgStyle }: { section: HomeSection; bgClasses: string; bgStyle: React.CSSProperties; }) {
  const items = section.items || [];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6">
      {section.title && (
        <div className="text-center mb-8">
          {section.badge_text && (
            <h2 className="text-[11px] font-black tracking-widest text-velina-rose uppercase">
              {section.badge_text}
            </h2>
          )}
          <h3 className="text-2xl font-black text-foreground uppercase tracking-wider mt-1">
            {section.title}
          </h3>
          {section.subtitle && (
            <p className="text-xs text-muted mt-1">{section.subtitle}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const targetLink =
            item.link_url ||
            (item.product_id ? `/products/${item.product_id}` : "/products");

          return (
            <Link
              key={item.id}
              href={targetLink}
              className={`group relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br ${item.bg_gradient || "from-pink-600 to-rose-800"
                } text-white shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[200px] transform hover:-translate-y-1`}
            >
              <div className="z-10">
                {item.tag && (
                  <span
                    className={`inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2 ${item.tag_bg || "bg-white text-zinc-900"
                      }`}
                  >
                    {item.tag}
                  </span>
                )}
                <h4 className="text-xl font-black leading-tight uppercase">
                  {item.title}
                </h4>
                {item.subtitle && (
                  <p className="text-xs text-white/80 mt-1 font-medium">
                    {item.subtitle}
                  </p>
                )}
              </div>

              {item.image_url && (
                <div className="absolute right-3 bottom-3 w-28 h-28 opacity-80 group-hover:scale-110 transition-transform duration-500">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <div className="z-10 mt-6 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase text-white/90 group-hover:text-velina-peach transition-colors">
                <span>{item.button_text || "SHOP NOW"}</span>
                <ChevronRight size={14} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
