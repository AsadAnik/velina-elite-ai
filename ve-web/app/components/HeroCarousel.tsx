"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { HomeSection, HomeSectionItem } from "@/types/home-section";

const defaultStaticSlides = [
  {
    type: "full-image-clean",
    src: "/1777982649615(1)(1).png",
    link: "/products",
  },
  {
    type: "concern-grid",
    title: "VELINA ELITE",
    subtitle: "SHOP BY CONCERN",
    bgClass: "bg-[#161412]",
    buttonText: "EXPLORE NOW",
    link: "/products",
    arches: [
      { src: "/banner_skincare.png", label: "Skin Radiance" },
      { src: "/banner_organic.png", label: "Herbal Elixirs" },
      { src: "/banner_makeup.png", label: "Glam Cosmetics" },
      { src: "/banner_skincare.png", label: "Acne Spot Care" },
      { src: "/banner_organic.png", label: "Hair Strength" },
      { src: "/banner_makeup.png", label: "Lip Colors" },
    ],
  },
  {
    type: "full-image",
    title: "RADIANCE REVEALED",
    desc: "Experience the Ultimate Glow with Our Premium Organic Skincare.",
    src: "/banner_skincare.png",
    buttonText: "SHOP SKINCARE",
    align: "left",
    link: "/products",
  },
  {
    type: "full-image",
    title: "LUXURY MAKEUP DEALS",
    desc: "Up to 50% Off on Premium Lipsticks, Foundations, and Face Palettes.",
    src: "/banner_makeup.png",
    buttonText: "SHOP COSMETICS",
    align: "right",
    link: "/products",
  },
  {
    type: "full-image",
    title: "ORGANIC ESSENTIALS",
    desc: "Clean Beauty Elixirs, Camomile Droppers, and Night Repair Creams.",
    src: "/banner_organic.png",
    buttonText: "SHOP ORGANIC",
    align: "left",
    link: "/products",
  },
];

// region HERO-CAROUSEL
export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dynamicSlides, setDynamicSlides] = useState<HomeSectionItem[] | null>(null);

  useEffect(() => {
    async function loadDynamicHero() {
      try {
        const sections = await fetchApi<HomeSection[]>("/home-sections/public");
        if (Array.isArray(sections)) {
          const heroSection = sections.find((s) => s.section_type === "hero_slider");
          if (heroSection) {
            if (heroSection.items && heroSection.items.length > 0) {
              const max = heroSection.max_items > 0 ? heroSection.max_items : heroSection.items.length;
              setDynamicSlides(heroSection.items.slice(0, max));
            } else if (heroSection.banner_image || heroSection.title) {
              setDynamicSlides([
                {
                  id: 0,
                  section_id: heroSection.id,
                  title: heroSection.title,
                  subtitle: heroSection.subtitle || "",
                  description: heroSection.description || "",
                  tag: heroSection.badge_text || "",
                  tag_bg: "bg-velina-rose text-white",
                  image_url: heroSection.banner_image || "/1777982649615(1)(1).png",
                  link_url: heroSection.button_url || "/products",
                  button_text: heroSection.button_text || "SHOP NOW",
                  bg_gradient: heroSection.bg_gradient || "from-purple-950 via-zinc-900 to-black",
                  bg_color: heroSection.bg_color,
                  product_id: null,
                  order_index: 0,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                } as HomeSectionItem,
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Could not load dynamic hero slides, using defaults", err);
      }
    }

    loadDynamicHero();
  }, []);

  const totalSlides = dynamicSlides ? dynamicSlides.length : defaultStaticSlides.length;

  // Auto-play feature
  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  // region MAIN UI
  // If dynamic slides exist from dashboard
  if (dynamicSlides && dynamicSlides.length > 0) {
    return (
      <section className="relative w-full overflow-hidden bg-zinc-950 h-[380px] sm:h-[440px] md:h-[500px]">
        {/* Slider Track */}
        <div
          className="w-full h-full flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {dynamicSlides.map((slide, i) => (
            <div key={slide.id || i} className="w-full h-full flex-shrink-0 relative overflow-hidden">
              {/* Background Graphic / Image */}
              {slide.image_url ? (
                <Image
                  src={slide.image_url}
                  alt={slide.title || "Hero banner"}
                  fill
                  sizes="100vw"
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
              <div className="absolute inset-0 max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-center text-white z-10">
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
        {dynamicSlides.length > 1 && (
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
              {dynamicSlides.map((_, idx) => (
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

  // Fallback: Default static slides
  return (
    <section className="relative w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 h-[380px] md:h-[480px]">
      {/* Slider Wrapper */}
      <div
        className="w-full h-full flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {defaultStaticSlides.map((slide, i) => (
          <div key={i} className="w-full h-full flex-shrink-0 relative">
            {/* Clean image slide with no text overlay */}
            {slide.type === "full-image-clean" && (
              <Link href={slide.link || "/products"} className="block w-full h-full relative cursor-pointer">
                <Image
                  src={slide.src || ""}
                  alt="Velina Elite Cover"
                  fill
                  sizes="100vw"
                  className="object-cover object-center"
                  priority
                />
              </Link>
            )}

            {/* Slide 2: Concerns Arche Grid */}
            {slide.type === "concern-grid" && (
              <div className={`w-full h-full ${slide.bgClass} flex flex-col justify-center relative px-6 md:px-12`}>
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between gap-4 z-10 relative overflow-hidden">
                  <div className="text-white max-w-sm shrink-0 z-20">
                    <p className="text-[11px] font-black tracking-widest text-velina-gold uppercase mb-1">
                      {slide.subtitle}
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight leading-none mb-3">
                      {slide.title}
                    </h2>
                    <Link
                      href={slide.link || "/products"}
                      className="inline-block bg-velina-rose hover:bg-rose-600 text-white text-xs font-black tracking-widest px-6 py-3 rounded-full shadow-lg transition-all"
                    >
                      {slide.buttonText}
                    </Link>
                  </div>

                  {slide.arches && (
                    <div className="hidden md:flex items-center gap-3 overflow-hidden">
                      {slide.arches.map((arch, aIdx) => (
                        <div
                          key={aIdx}
                          className="w-24 h-40 rounded-t-full bg-zinc-800 border border-white/10 relative overflow-hidden shadow-md group"
                        >
                          <Image src={arch.src} alt={arch.label} fill sizes="96px" className="object-cover opacity-80 group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                            <span className="text-[9px] font-bold text-white uppercase">{arch.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Standard full-image banner with overlay */}
            {slide.type === "full-image" && (
              <div className="w-full h-full relative">
                <Image
                  src={slide.src || ""}
                  alt={slide.title || "Banner"}
                  fill
                  sizes="100vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-center text-white z-10">
                  <div className="max-w-md space-y-2.5">
                    <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none">
                      {slide.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2">
                      {slide.desc}
                    </p>
                    <div className="pt-2">
                      <Link
                        href={slide.link || "/products"}
                        className="inline-flex items-center gap-2 bg-white text-zinc-950 hover:bg-velina-gold hover:text-white transition-all text-xs font-black tracking-widest px-6 py-3 rounded-full shadow-lg"
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prev / Next Arrows */}
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
        {defaultStaticSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? "w-7 bg-velina-rose" : "w-2 bg-white/50"
              }`}
          />
        ))}
      </div>
    </section>
  );
}
