"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Upload,
  Palette,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Settings,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  ArrowRight,
  Package,
} from "lucide-react";
import { HomeSection, HomeSectionItem } from "@/types/home-section";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { SubCategory } from "@/types/sub-category";
import { GRADIENT_PRESETS, SECTION_TYPES } from "../constants";
import ItemModal from "./ItemModal";
import ProductPickerModal from "./ProductPickerModal";
import LiveCarouselPreview from "./LiveCarouselPreview";

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: HomeSection | null;
  products?: Product[];
  categories?: Category[];
  subCategories?: SubCategory[];
  onSave: (data: FormData) => Promise<unknown>;
  onAddItem?: (sectionId: number, data: FormData) => Promise<unknown>;
  onAddMultipleProducts?: (sectionId: number, selected: Product[]) => Promise<unknown>;
  onUpdateItem?: (itemId: number, data: FormData) => Promise<unknown>;
  onDeleteItem?: (itemId: number) => Promise<unknown>;
  onReorderItems?: (sectionId: number, items: HomeSectionItem[]) => Promise<unknown>;
  onMoveItem?: (sectionId: number, itemIndex: number, direction: "up" | "down") => Promise<unknown>;
  isSaving: boolean;
}

export default function SectionModal({
  isOpen,
  onClose,
  section,
  products = [],
  categories = [],
  subCategories = [],
  onSave,
  onAddItem,
  onAddMultipleProducts,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onMoveItem,
  isSaving,
}: SectionModalProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "slides" | "preview">("settings");

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [description, setDescription] = useState("");
  const [sectionType, setSectionType] = useState("hero_slider");
  const [bgType, setBgType] = useState<"gradient" | "color" | "image">("gradient");
  const [bgGradient, setBgGradient] = useState("from-pink-600 to-rose-800");
  const [bgColor, setBgColor] = useState("#18181b");
  const [bannerUrl, setBannerUrl] = useState("");
  const [buttonText, setButtonText] = useState("SHOP NOW");
  const [buttonUrl, setButtonUrl] = useState("/products");
  const [maxItems, setMaxItems] = useState(4);
  const [isActive, setIsActive] = useState(true);

  // Files
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  // Slide Editor Modal state
  const [editingSlide, setEditingSlide] = useState<HomeSectionItem | null>(null);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  useEffect(() => {
    if (section) {
      setTitle(section.title || "");
      setSubtitle(section.subtitle || "");
      setBadgeText(section.badge_text || "");
      setDescription(section.description || "");
      setSectionType(section.section_type || "hero_slider");
      setBgType((section.bg_type as "gradient" | "color" | "image") || "gradient");
      setBgGradient(section.bg_gradient || "from-pink-600 to-rose-800");
      setBgColor(section.bg_color || "#18181b");
      setBannerUrl(section.banner_url || "");
      setButtonText(section.button_text || "SHOP NOW");
      setButtonUrl(section.button_url || "/products");
      setMaxItems(section.max_items || 4);
      setIsActive(section.is_active ?? true);
      setBannerPreview(section.banner_image || null);
      setBgPreview(section.bg_image || null);
      // If editing existing hero slider, default to slides tab for quick slide editing
      if (section.section_type === "hero_slider" && section.items?.length > 0) {
        setActiveTab("slides");
      } else {
        setActiveTab("settings");
      }
    } else {
      setTitle("");
      setSubtitle("");
      setBadgeText("");
      setDescription("");
      setSectionType("hero_slider");
      setBgType("gradient");
      setBgGradient("from-zinc-950 via-purple-950 to-black");
      setBgColor("#18181b");
      setBannerUrl("");
      setButtonText("SHOP NOW");
      setButtonUrl("/products");
      setMaxItems(5);
      setIsActive(true);
      setBannerPreview(null);
      setBgPreview(null);
      setActiveTab("settings");
    }
    setBannerFile(null);
    setBgFile(null);
  }, [section, isOpen]);

  if (!isOpen) return null;

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBgFile(file);
      setBgPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    if (subtitle) formData.append("subtitle", subtitle);
    if (badgeText) formData.append("badge_text", badgeText);
    if (description) formData.append("description", description);
    formData.append("section_type", sectionType);
    formData.append("bg_type", bgType);
    if (bgGradient) formData.append("bg_gradient", bgGradient);
    if (bgColor) formData.append("bg_color", bgColor);
    if (bannerUrl) formData.append("banner_url", bannerUrl);
    if (buttonText) formData.append("button_text", buttonText);
    if (buttonUrl) formData.append("button_url", buttonUrl);
    formData.append("max_items", maxItems.toString());
    formData.append("is_active", isActive ? "true" : "false");

    if (bannerFile) {
      formData.append("banner_file", bannerFile);
    } else if (bannerPreview && section?.banner_image) {
      formData.append("banner_image", section.banner_image);
    }

    if (bgFile) {
      formData.append("bg_file", bgFile);
    } else if (bgPreview && section?.bg_image) {
      formData.append("bg_image", section.bg_image);
    }

    await onSave(formData);
    onClose();
  };

  // Slide helpers
  const handleOpenAddSlide = () => {
    setEditingSlide(null);
    setIsSlideModalOpen(true);
  };

  const handleOpenEditSlide = (slide: HomeSectionItem) => {
    setEditingSlide(slide);
    setIsSlideModalOpen(true);
  };

  const handleSaveSlide = async (formData: FormData) => {
    if (!section) return;
    if (editingSlide && onUpdateItem) {
      await onUpdateItem(editingSlide.id, formData);
    } else if (onAddItem) {
      await onAddItem(section.id, formData);
    }
  };

  const items = section?.items || [];
  const isHero = sectionType === "hero_slider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-velina-rose/10 text-velina-rose flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {section
                  ? `Edit ${isHero ? "Hero Carousel Slider" : "Home Section"}`
                  : "Add New Section / Slider"}
              </h3>
              <p className="text-xs text-muted">
                Configure {isHero ? "individual slides, images, texts" : "layout, background & items"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        {section && (
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-100 dark:border-zinc-800 bg-surface text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("slides")}
              className={`flex items-center gap-2 pb-2.5 border-b-2 transition-all ${
                activeTab === "slides"
                  ? "border-velina-rose text-velina-rose font-black"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <Layers size={14} />
              <span>
                {isHero ? "Carousel Slides" : "Cards & Items"} ({items.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 pb-2.5 border-b-2 transition-all ${
                activeTab === "settings"
                  ? "border-velina-rose text-velina-rose font-black"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <Settings size={14} />
              <span>Section Settings & Limit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-2 pb-2.5 border-b-2 transition-all ${
                activeTab === "preview"
                  ? "border-velina-rose text-velina-rose font-black"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <Sparkles size={14} />
              <span>Live Peeking Preview</span>
            </button>
          </div>
        )}

        {/* TAB 1: INDIVIDUAL SLIDES / ITEMS MANAGER */}
        {section && activeTab === "slides" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Header bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sparkles size={14} className="text-velina-gold" />
                  {isHero ? "Individual Carousel Slides" : "Section Cards"} ({items.length} total)
                </h4>
                <p className="text-[11px] text-muted">
                  Click the <strong>Pencil (✏️)</strong> to edit each slide’s image, headline, and CTA.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {sectionType === "product_showcase" && (
                  <button
                    type="button"
                    onClick={() => setIsProductPickerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs hover:bg-zinc-800 transition-colors"
                  >
                    <Package size={13} className="text-velina-gold" />
                    + Add from Products
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenAddSlide}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-velina-rose text-white text-xs font-black shadow-xs hover:bg-rose-600 transition-colors"
                >
                  <Plus size={14} />
                  {isHero ? "Add New Slide" : "Add New Card"}
                </button>
              </div>
            </div>

            {/* Slides List */}
            {items.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-surface space-y-2">
                <Layers size={32} className="mx-auto text-muted opacity-50" />
                <p className="text-xs font-bold text-foreground">
                  No {isHero ? "slides" : "items"} added to this section yet
                </p>
                <p className="text-[11px] text-muted max-w-sm mx-auto">
                  Click the button below to add your first slide with custom banner image, headline, and link.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddSlide}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-velina-rose text-white text-xs font-bold shadow-xs"
                >
                  <Plus size={14} />
                  Add First Slide
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    {/* Left: Move buttons, number, thumbnail, details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Move Up/Down Buttons */}
                      <div className="flex flex-col items-center justify-center p-0.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => onMoveItem && onMoveItem(section.id, idx, "up")}
                          className="p-1 text-muted hover:text-velina-rose disabled:opacity-20 transition-colors"
                          title="Move slide up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <span className="text-[9px] font-black text-muted-subtle px-1">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          disabled={idx === items.length - 1}
                          onClick={() => onMoveItem && onMoveItem(section.id, idx, "down")}
                          className="p-1 text-muted hover:text-velina-rose disabled:opacity-20 transition-colors"
                          title="Move slide down"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      {/* Thumbnail Image */}
                      <div className="relative w-16 h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                        {slide.image_url ? (
                          <Image
                            src={slide.image_url}
                            alt={slide.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full bg-gradient-to-br ${
                              slide.bg_gradient || "from-pink-600 to-rose-800"
                            } flex items-center justify-center text-white text-[10px] font-bold`}
                          >
                            Slide
                          </div>
                        )}
                      </div>

                      {/* Slide Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {slide.tag && (
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                slide.tag_bg || "bg-velina-rose text-white"
                              }`}
                            >
                              {slide.tag}
                            </span>
                          )}
                          <span className="text-xs font-black text-foreground truncate">
                            {slide.title}
                          </span>
                        </div>
                        {slide.subtitle && (
                          <p className="text-[11px] text-velina-rose dark:text-pink-300 font-bold truncate">
                            {slide.subtitle}
                          </p>
                        )}
                        {slide.link_url && (
                          <p className="text-[10px] text-muted truncate">
                            Link: {slide.link_url}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSlide(slide)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-velina-peach/50 dark:bg-zinc-800 dark:hover:bg-velina-rose/20 text-xs font-bold text-foreground transition-colors"
                      >
                        <Edit2 size={13} className="text-velina-rose" />
                        <span>Edit Slide</span>
                      </button>

                      {onDeleteItem && (
                        <button
                          type="button"
                          onClick={() => onDeleteItem(slide.id)}
                          className="p-1.5 rounded-xl text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Delete slide"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GENERAL SETTINGS */}
        {(!section || activeTab === "settings") && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section Type */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-muted mb-2">
                Section Layout Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SECTION_TYPES.map((type) => {
                  const isSelected = sectionType === type.value;
                  return (
                    <button
                      type="button"
                      key={type.value}
                      onClick={() => setSectionType(type.value)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "border-velina-rose bg-velina-rose/5 dark:bg-velina-rose/10 ring-1 ring-velina-rose"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-surface"
                      }`}
                    >
                      <p className={`text-xs font-bold ${isSelected ? "text-velina-rose" : "text-foreground"}`}>
                        {type.label}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5 leading-snug">
                        {type.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Titles & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Section Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hero Banner Carousel / Special Selections"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-velina-rose/20 focus:border-velina-rose text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Subtitle / Headline
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Main Storefront Hero Showcase"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-velina-rose/20 focus:border-velina-rose text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Tag / Badge Text
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g. FEATURED HIGHLIGHTS / 50% OFF"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-velina-rose/20 focus:border-velina-rose text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  {sectionType === "hero_slider" ? "Max Slides to Show on Top" : "Max Display Items / Cards"}
                </label>
                <select
                  value={maxItems}
                  onChange={(e) => setMaxItems(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-velina-rose/20 focus:border-velina-rose text-foreground"
                >
                  <option value={1}>1 {sectionType === "hero_slider" ? "Slide" : "Item"}</option>
                  <option value={2}>2 {sectionType === "hero_slider" ? "Slides" : "Items"}</option>
                  <option value={3}>3 {sectionType === "hero_slider" ? "Slides" : "Items"}</option>
                  <option value={4}>4 {sectionType === "hero_slider" ? "Slides" : "Items"} (Default)</option>
                  <option value={5}>5 {sectionType === "hero_slider" ? "Slides" : "Items"}</option>
                  <option value={6}>6 {sectionType === "hero_slider" ? "Slides" : "Items"}</option>
                  <option value={8}>8 {sectionType === "hero_slider" ? "Slides" : "Items"}</option>
                  <option value={10}>10 {sectionType === "hero_slider" ? "Slides" : "Items"}</option>
                  <option value={12}>12 {sectionType === "hero_slider" ? "Slides" : "Items"}</option>
                  <option value={50}>All / Unlimited</option>
                </select>
              </div>
            </div>

            {/* Background Styling */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Palette size={14} className="text-velina-rose" />
                  Background Styling
                </label>
                <div className="flex gap-1 bg-zinc-200 dark:bg-zinc-700 p-0.5 rounded-lg text-xs font-bold">
                  {(["gradient", "color", "image"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBgType(t)}
                      className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                        bgType === t
                          ? "bg-white dark:bg-zinc-900 text-foreground shadow-xs"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {bgType === "gradient" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {GRADIENT_PRESETS.map((p) => {
                      const active = bgGradient === p.gradientClass;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setBgGradient(p.gradientClass)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            active
                              ? "border-velina-rose ring-2 ring-velina-rose/30 bg-white dark:bg-zinc-900"
                              : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg bg-gradient-to-br ${p.gradientClass} shrink-0 shadow-xs`}
                          />
                          <span className="text-[11px] font-bold truncate text-foreground">
                            {p.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {bgType === "color" && (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-zinc-300 dark:border-zinc-700 p-0.5"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-foreground"
                  />
                </div>
              )}

              {bgType === "image" && (
                <div>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-velina-rose transition-colors bg-white dark:bg-zinc-900">
                    {bgPreview ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden">
                        <Image src={bgPreview} alt="Background" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-muted">
                        <ImageIcon size={24} />
                        <span className="text-xs font-semibold">Upload Background Image</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleBgChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <div>
                <p className="text-xs font-bold text-foreground">Active on Storefront</p>
                <p className="text-[11px] text-muted">Toggle section visibility</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                  isActive ? "bg-velina-rose justify-end" : "bg-zinc-300 dark:bg-zinc-700 justify-start"
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-velina-rose text-white text-xs font-black shadow-md hover:bg-rose-600 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : section ? "Update Section" : "Create Section"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: LIVE PREVIEW */}
        {section && activeTab === "preview" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <LiveCarouselPreview section={section} />
          </div>
        )}
      </div>

      {/* Slide / Item Edit Modal */}
      {section && (
        <ItemModal
          isOpen={isSlideModalOpen}
          onClose={() => setIsSlideModalOpen(false)}
          item={editingSlide}
          sectionId={section.id}
          products={products}
          onSave={handleSaveSlide}
          isSaving={isSaving}
        />
      )}

      {/* Product Picker Modal */}
      {section && (
        <ProductPickerModal
          isOpen={isProductPickerOpen}
          onClose={() => setIsProductPickerOpen(false)}
          products={products}
          categories={categories}
          subCategories={subCategories}
          alreadyAddedProductIds={items
            .map((i) => i.product_id)
            .filter((id): id is number => typeof id === "number")}
          onAddProducts={(selected) =>
            onAddMultipleProducts ? onAddMultipleProducts(section.id, selected) : Promise.resolve()
          }
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
