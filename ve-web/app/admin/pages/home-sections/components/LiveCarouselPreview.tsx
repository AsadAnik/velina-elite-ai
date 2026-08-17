"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Smartphone,
  Monitor,
  Eye,
  ExternalLink,
} from "lucide-react";
import { HomeSection, HomeSectionItem } from "@/types/home-section";

interface LiveCarouselPreviewProps {
  section: HomeSection;
}

export default function LiveCarouselPreview({ section }: LiveCarouselPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");

  const items = section.items || [];
  const slides = items.length > 0 ? items : [
    {
      id: 0,
      title: section.title || "Headline Title",
      subtitle: section.subtitle || "Offer Subtitle",
      description: section.description || "Promotional description copy",
      image_url: section.banner_image || "/1777982649615(1)(1).png",
      button_text: section.button_text || "SHOP NOW",
      link_url: section.button_url || "/products",
      bg_gradient: section.bg_gradient || "from-zinc-950 via-purple-950 to-black",
      tag: section.badge_text || "SPECIAL OFFER",
      tag_bg: "bg-velina-rose text-white",
    } as unknown as HomeSectionItem,
  ];

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const activeSlide = slides[currentSlide % slides.length];

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-md">
      {/* Preview Header & View Mode Switcher */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-velina-rose/10 text-velina-rose flex items-center justify-center font-bold">
            <Eye size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
              Live Carousel / Section Peeking Preview
            </h4>
            <p className="text-[10px] text-muted">
              Slide {currentSlide + 1} of {slides.length} • Real-time UI reflection
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-700/80 p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setDeviceView("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              deviceView === "desktop"
                ? "bg-white dark:bg-zinc-900 text-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Monitor size={13} />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceView("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              deviceView === "mobile"
                ? "bg-white dark:bg-zinc-900 text-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Smartphone size={13} />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Stage Container */}
      <div className="p-4 sm:p-6 bg-zinc-950 flex items-center justify-center overflow-hidden">
        <div
          className={`relative rounded-2xl overflow-hidden transition-all duration-300 shadow-2xl border border-white/10 ${
            deviceView === "mobile"
              ? "w-[340px] h-[400px]"
              : "w-full max-w-4xl h-[340px] sm:h-[380px]"
          }`}
        >
          {/* Peeking Carousel Slide Layout */}
          <div className="w-full h-full relative overflow-hidden bg-zinc-950">
            {/* Background Graphic / Image */}
            {activeSlide?.image_url ? (
              <Image
                src={activeSlide.image_url}
                alt={activeSlide.title || "Banner"}
                fill
                className="object-cover object-center brightness-90"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${
                  activeSlide?.bg_gradient || "from-purple-950 via-zinc-900 to-black"
                }`}
              />
            )}

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />

            {/* Overlay Text and CTA */}
            <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-center text-white z-10">
              <div className="max-w-md space-y-2.5">
                {activeSlide?.tag && (
                  <span
                    className={`inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-md ${
                      activeSlide.tag_bg || "bg-velina-rose text-white"
                    }`}
                  >
                    {activeSlide.tag}
                  </span>
                )}

                <h3 className="text-xl sm:text-3xl font-black uppercase tracking-tight leading-tight drop-shadow-md">
                  {activeSlide?.title}
                </h3>

                {activeSlide?.subtitle && (
                  <p className="text-sm sm:text-base font-bold text-velina-peach uppercase tracking-wide">
                    {activeSlide.subtitle}
                  </p>
                )}

                {activeSlide?.description && (
                  <p className="text-[11px] sm:text-xs text-zinc-300 line-clamp-2 max-w-sm font-medium">
                    {activeSlide.description}
                  </p>
                )}

                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 bg-white text-zinc-950 text-[11px] font-black tracking-widest px-5 py-2.5 rounded-full shadow-lg">
                    <span>{activeSlide?.button_text || "SHOP NOW"}</span>
                    <ArrowRight size={12} className="stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all z-20"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all z-20"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Progress Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentSlide === idx ? "w-6 bg-velina-rose" : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
