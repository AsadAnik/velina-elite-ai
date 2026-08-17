"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  GripVertical,
  Edit2,
  Trash2,
  ChevronDown,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  Palette,
  ExternalLink,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { HomeSection, HomeSectionItem } from "@/types/home-section";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { SubCategory } from "@/types/sub-category";
import ItemsManager from "./ItemsManager";

interface SectionCardProps {
  section: HomeSection;
  index: number;
  totalSections: number;
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
  onEdit: (section: HomeSection) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, currentStatus: boolean) => void;
  onMoveSection: (index: number, direction: "up" | "down") => void;
  onAddItem: (sectionId: number, data: FormData) => Promise<unknown>;
  onAddMultipleProducts: (sectionId: number, selectedProducts: Product[]) => Promise<unknown>;
  onUpdateItem: (itemId: number, data: FormData) => Promise<unknown>;
  onDeleteItem: (itemId: number) => Promise<unknown>;
  onReorderItems: (sectionId: number, items: HomeSectionItem[]) => Promise<unknown>;
  onMoveItem: (sectionId: number, itemIndex: number, direction: "up" | "down") => Promise<unknown>;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  isDragging: boolean;
  isDragOver: boolean;
  isSaving: boolean;
}

export default function SectionCard({
  section,
  index,
  totalSections,
  products,
  categories,
  subCategories,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveSection,
  onAddItem,
  onAddMultipleProducts,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onMoveItem,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
  isSaving,
}: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
        isDragging
          ? "opacity-40 scale-[0.98] border-dashed border-velina-rose bg-velina-rose/5"
          : isDragOver
          ? "ring-2 ring-velina-rose scale-[1.01] border-velina-rose shadow-lg"
          : "border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Drag Handle, Mobile Move Buttons, Number, Info */}
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          {/* Drag Grip & Mobile Move Up/Down Buttons */}
          <div className="flex flex-col items-center justify-center p-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shrink-0">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMoveSection(index, "up")}
              className="p-1 text-muted hover:text-velina-rose disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="Move section up"
            >
              <ArrowUp size={13} />
            </button>

            <div
              className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-muted hover:text-foreground py-0.5"
              title="Drag to reorder"
            >
              <GripVertical size={16} />
              <span className="text-[9px] font-black text-muted-subtle mt-0.5">
                #{index + 1}
              </span>
            </div>

            <button
              type="button"
              disabled={index === totalSections - 1}
              onClick={() => onMoveSection(index, "down")}
              className="p-1 text-muted hover:text-velina-rose disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="Move section down"
            >
              <ArrowDown size={13} />
            </button>
          </div>

          {/* Banner / Color Thumbnail */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            {section.banner_image ? (
              <Image
                src={section.banner_image}
                alt={section.title}
                fill
                className="object-cover"
              />
            ) : section.bg_type === "image" && section.bg_image ? (
              <Image
                src={section.bg_image}
                alt={section.title}
                fill
                className="object-cover"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${
                  section.bg_gradient || "from-pink-600 to-rose-800"
                } flex items-center justify-center text-white`}
              >
                <Sparkles size={22} className="opacity-80" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-velina-rose/10 text-velina-rose border border-velina-rose/20">
                {section.section_type.replace("_", " ")}
              </span>
              {section.badge_text && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  {section.badge_text}
                </span>
              )}
              <span className="text-[10px] font-semibold text-muted">
                {section.items?.length || 0} card{section.items?.length !== 1 ? "s" : ""}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-foreground truncate">
              {section.title}
            </h3>
            {section.subtitle && (
              <p className="text-xs text-muted truncate mt-0.5">{section.subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Actions, Toggle, Expand */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100 dark:border-zinc-800">
          {/* Active Switch */}
          <button
            type="button"
            onClick={() => onToggleActive(section.id, section.is_active)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              section.is_active
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-zinc-100 dark:bg-zinc-800 text-muted border border-zinc-200 dark:border-zinc-700"
            }`}
            title="Toggle visibility on storefront"
          >
            {section.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>{section.is_active ? "Live" : "Hidden"}</span>
          </button>

          {/* Edit Section */}
          <button
            type="button"
            onClick={() => onEdit(section)}
            className="p-2 rounded-xl text-muted hover:text-velina-rose hover:bg-velina-peach/40 dark:hover:bg-velina-rose/10 transition-colors"
            title="Edit section details"
          >
            <Edit2 size={16} />
          </button>

          {/* Delete Section */}
          <button
            type="button"
            onClick={() => onDelete(section.id)}
            className="p-2 rounded-xl text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Delete section"
          >
            <Trash2 size={16} />
          </button>

          {/* Expand Items Accordion */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              isExpanded
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-xs"
                : "border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <Layers size={14} />
            <span>Manage Items ({section.items?.length || 0})</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Items Drawer */}
      {isExpanded && (
        <div className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-950/40">
          <ItemsManager
            section={section}
            products={products}
            categories={categories}
            subCategories={subCategories}
            onAddItem={onAddItem}
            onAddMultipleProducts={onAddMultipleProducts}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onReorderItems={onReorderItems}
            onMoveItem={onMoveItem}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
}
