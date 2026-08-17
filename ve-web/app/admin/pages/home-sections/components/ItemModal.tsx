"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Upload, Sparkles, Tag, Link2, Package } from "lucide-react";
import { HomeSectionItem } from "@/types/home-section";
import { Product } from "@/types/product";
import { GRADIENT_PRESETS, TAG_BG_PRESETS } from "../constants";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: HomeSectionItem | null;
  sectionId: number;
  products: Product[];
  onSave: (data: FormData) => Promise<unknown>;
  isSaving: boolean;
}

export default function ItemModal({
  isOpen,
  onClose,
  item,
  products,
  onSave,
  isSaving,
}: ItemModalProps) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [tagBg, setTagBg] = useState("bg-cyan-400 text-slate-900");
  const [bgGradient, setBgGradient] = useState("from-blue-600 to-indigo-800");
  const [bgColor, setBgColor] = useState("#18181b");
  const [linkUrl, setLinkUrl] = useState("/products");
  const [buttonText, setButtonText] = useState("SHOP DEALS");
  const [productId, setProductId] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);

  // File upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title || "");
      setSubtitle(item.subtitle || "");
      setDescription(item.description || "");
      setTag(item.tag || "");
      setTagBg(item.tag_bg || "bg-cyan-400 text-slate-900");
      setBgGradient(item.bg_gradient || "from-blue-600 to-indigo-800");
      setBgColor(item.bg_color || "#18181b");
      setLinkUrl(item.link_url || "/products");
      setButtonText(item.button_text || "SHOP DEALS");
      setProductId(item.product_id ?? "");
      setIsActive(item.is_active ?? true);
      setImagePreview(item.image_url || null);
    } else {
      setTitle("");
      setSubtitle("");
      setDescription("");
      setTag("");
      setTagBg("bg-cyan-400 text-slate-900");
      setBgGradient("from-blue-600 to-indigo-800");
      setBgColor("#18181b");
      setLinkUrl("/products");
      setButtonText("SHOP DEALS");
      setProductId("");
      setIsActive(true);
      setImagePreview(null);
    }
    setImageFile(null);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProductSelect = (pId: string) => {
    if (!pId) {
      setProductId("");
      return;
    }
    const numId = Number(pId);
    setProductId(numId);
    const prod = products.find((p) => p.id === numId);
    if (prod) {
      if (!title) setTitle(prod.title);
      if (!subtitle && prod.mrp_price && prod.regular_price) {
        setSubtitle(`৳${prod.regular_price}`);
      }
      if (!imagePreview && prod.images_url?.[0]) {
        setImagePreview(prod.images_url[0]);
      }
      setLinkUrl(`/products/${prod.id}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    if (subtitle) formData.append("subtitle", subtitle);
    if (description) formData.append("description", description);
    if (tag) formData.append("tag", tag);
    if (tagBg) formData.append("tag_bg", tagBg);
    if (bgGradient) formData.append("bg_gradient", bgGradient);
    if (bgColor) formData.append("bg_color", bgColor);
    if (linkUrl) formData.append("link_url", linkUrl);
    if (buttonText) formData.append("button_text", buttonText);
    if (productId !== "") formData.append("product_id", productId.toString());
    formData.append("is_active", isActive ? "true" : "false");

    if (imageFile) {
      formData.append("image_file", imageFile);
    } else if (imagePreview && item?.image_url) {
      formData.append("image_url", item.image_url);
    }

    await onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-velina-gold/10 text-velina-gold flex items-center justify-center font-bold">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">
                {item ? "Edit Offer / Deal Card" : "Add Offer / Deal Card"}
              </h3>
              <p className="text-[11px] text-muted">
                Create a highlight deal card with custom colors and image
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Product Autofil */}
          {products.length > 0 && (
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                <Package size={14} className="text-velina-rose" />
                Optional: Link to Store Product
              </label>
              <select
                value={productId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-foreground"
              >
                <option value="">-- Custom Card (No linked product) --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (৳{p.regular_price ?? p.price})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Card Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. MEGA OFFERS"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-xs text-foreground"
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
                placeholder="e.g. UP TO 50% OFF"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Tag and Tag Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Badge Tag Text
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. 50% OFF / SAVE ৳100"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Tag Badge Theme
              </label>
              <select
                value={tagBg}
                onChange={(e) => setTagBg(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-xs text-foreground"
              >
                {TAG_BG_PRESETS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Short Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Top brands in skincare & hair treatments"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-xs text-foreground"
            />
          </div>

          {/* Card Gradient Theme */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-2">
              Card Background Theme
            </label>
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
                        ? "border-velina-rose ring-2 ring-velina-rose/30 bg-zinc-50 dark:bg-zinc-800"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg bg-gradient-to-br ${p.gradientClass} shrink-0 shadow-xs`}
                    />
                    <span className="text-[10px] font-bold truncate text-foreground">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Uploader */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Offer / Product Image
            </label>
            <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-velina-rose transition-colors bg-zinc-50/50 dark:bg-zinc-800/40">
              {imagePreview ? (
                <div className="relative w-full h-24 rounded-lg overflow-hidden">
                  <Image src={imagePreview} alt="Item preview" fill className="object-contain" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted py-2">
                  <Upload size={20} />
                  <span className="text-xs font-bold text-foreground">Click to upload image</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {/* Links & CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Button Text
              </label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="e.g. SHOP DEALS"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Target Link
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="e.g. /products?category=1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <div>
              <p className="text-xs font-bold text-foreground">Active Item</p>
              <p className="text-[10px] text-muted">Show this card inside the section</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
                isActive ? "bg-velina-rose justify-end" : "bg-zinc-300 dark:bg-zinc-700 justify-start"
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-velina-rose text-white text-xs font-black shadow-md hover:bg-rose-600 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : item ? "Update Card" : "Add Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
