"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Package,
} from "lucide-react";
import { HomeSection, HomeSectionItem } from "@/types/home-section";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { SubCategory } from "@/types/sub-category";
import ItemModal from "./ItemModal";
import ProductPickerModal from "./ProductPickerModal";

interface ItemsManagerProps {
  section: HomeSection;
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
  onAddItem: (sectionId: number, data: FormData) => Promise<unknown>;
  onAddMultipleProducts: (sectionId: number, selectedProducts: Product[]) => Promise<unknown>;
  onUpdateItem: (itemId: number, data: FormData) => Promise<unknown>;
  onDeleteItem: (itemId: number) => Promise<unknown>;
  onReorderItems: (sectionId: number, items: HomeSectionItem[]) => Promise<unknown>;
  onMoveItem: (sectionId: number, itemIndex: number, direction: "up" | "down") => Promise<unknown>;
  isSaving: boolean;
}

export default function ItemsManager({
  section,
  products,
  categories,
  subCategories,
  onAddItem,
  onAddMultipleProducts,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onMoveItem,
  isSaving,
}: ItemsManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HomeSectionItem | null>(null);

  // Drag and drop state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const items = section.items || [];
  const alreadyAddedProductIds = items
    .map((i) => i.product_id)
    .filter((id): id is number => typeof id === "number");

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: HomeSectionItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (formData: FormData) => {
    if (editingItem) {
      await onUpdateItem(editingItem.id, formData);
    } else {
      await onAddItem(section.id, formData);
    }
  };

  // Drag-and-drop handlers
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = async (dropIdx: number) => {
    if (draggedIdx === null || draggedIdx === dropIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const reordered = [...items];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(dropIdx, 0, moved);

    setDraggedIdx(null);
    setDragOverIdx(null);

    await onReorderItems(section.id, reordered);
  };

  return (
    <div className="space-y-4">
      {/* Header bar with Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Sparkles size={14} className="text-velina-gold" />
            Section Cards & Products ({items.length} / {section.max_items} displayed)
          </h4>
          <p className="text-[11px] text-muted">
            Drag cards or use the up/down buttons to reorder.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsProductPickerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs hover:bg-zinc-800 dark:hover:bg-white transition-colors"
          >
            <Package size={14} className="text-velina-gold" />
            + Select from Store Products
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-velina-rose text-white text-xs font-bold shadow-xs hover:bg-rose-600 transition-colors"
          >
            <Plus size={14} />
            Custom Card
          </button>
        </div>
      </div>

      {/* Cards list */}
      {items.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-surface">
          <p className="text-xs font-bold text-foreground">No cards or products added yet</p>
          <p className="text-[11px] text-muted mt-0.5">
            Add offers, select catalog products, or add promo banners to display inside this section.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsProductPickerOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs"
            >
              + Select from Products
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-1.5 rounded-xl bg-velina-rose text-white text-xs font-bold shadow-xs"
            >
              + Add Custom Card
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {items.map((item, idx) => {
            const isDragging = draggedIdx === idx;
            const isOver = dragOverIdx === idx;
            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                className={`relative group rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                  isDragging
                    ? "opacity-40 scale-95 border-dashed border-velina-rose"
                    : isOver
                    ? "ring-2 ring-velina-rose scale-102 border-velina-rose"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md"
                }`}
              >
                {/* Top drag bar & quick actions + mobile move buttons */}
                <div className="flex items-center justify-between p-2 bg-zinc-50/80 dark:bg-zinc-800/80 border-b border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex items-center gap-1">
                    <div
                      className="cursor-grab active:cursor-grabbing text-muted hover:text-foreground p-0.5"
                      title="Drag to reorder"
                    >
                      <GripVertical size={16} />
                    </div>
                    <span className="text-[10px] font-black text-muted-subtle uppercase">
                      #{idx + 1}
                    </span>

                    {/* Touch & Mobile friendly Move Buttons */}
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => onMoveItem(section.id, idx, "up")}
                        className="p-1 rounded-md text-muted hover:text-velina-rose hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => onMoveItem(section.id, idx, "down")}
                        className="p-1 rounded-md text-muted hover:text-velina-rose hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 rounded-lg text-muted hover:text-velina-rose hover:bg-surface-2 transition-colors"
                      title="Edit card"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete card"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Card Visual Preview */}
                <div
                  className={`p-3.5 flex-1 rounded-b-2xl bg-gradient-to-br ${
                    item.bg_gradient || "from-blue-600 to-indigo-800"
                  } text-white flex flex-col justify-between min-h-[160px]`}
                >
                  <div>
                    {/* Tag badge & image */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {item.tag ? (
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs ${
                            item.tag_bg || "bg-cyan-400 text-slate-900"
                          }`}
                        >
                          {item.tag}
                        </span>
                      ) : (
                        <span />
                      )}

                      {item.image_url && (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/20 shrink-0 border border-white/20">
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-white/70 truncate">
                      {item.title}
                    </p>
                    <p className="text-sm font-black text-white leading-snug mt-0.5 line-clamp-2">
                      {item.subtitle || item.title}
                    </p>
                    {item.description && (
                      <p className="text-[10px] text-white/80 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Card Button */}
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-black text-white/90">
                    <span>{item.button_text || "SHOP DEALS"}</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={editingItem}
        sectionId={section.id}
        products={products}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Product Picker Modal */}
      <ProductPickerModal
        isOpen={isProductPickerOpen}
        onClose={() => setIsProductPickerOpen(false)}
        products={products}
        categories={categories}
        subCategories={subCategories}
        alreadyAddedProductIds={alreadyAddedProductIds}
        onAddProducts={(selected) => onAddMultipleProducts(section.id, selected)}
        isSaving={isSaving}
      />
    </div>
  );
}
