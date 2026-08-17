"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Sparkles,
  LayoutTemplate,
  Layers,
  ExternalLink,
  Eye,
  RefreshCw,
  HelpCircle,
  Download,
  X,
} from "lucide-react";
import { useHomeSections } from "./hooks/useHomeSections";
import { HomeSection } from "@/types/home-section";
import SectionCard from "./components/SectionCard";
import SectionModal from "./components/SectionModal";
import LiveCarouselPreview from "./components/LiveCarouselPreview";

export default function Home() {
  const {
    sections,
    products,
    categories,
    subCategories,
    loading,
    isSaving,
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
    toggleSectionActive,
    reorderSections,
    moveSection,
    addItem,
    addMultipleProducts,
    updateItem,
    deleteItem,
    reorderItems,
    moveItem,
    importDefaultSections,
  } = useHomeSections();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [previewSection, setPreviewSection] = useState<HomeSection | null>(null);

  // Drag and drop state for sections
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleOpenCreate = () => {
    setEditingSection(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (section: HomeSection) => {
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const handleSaveSection = async (formData: FormData) => {
    if (editingSection) {
      await updateSection(editingSection.id, formData);
    } else {
      await createSection(formData);
    }
  };

  // Section Drag and Drop Handlers
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

    const reordered = [...sections];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(dropIdx, 0, moved);

    setDraggedIdx(null);
    setDragOverIdx(null);

    await reorderSections(reordered);
  };

  const activeCount = sections.filter((s) => s.is_active).length;
  const heroSliderSection = sections.find((s) => s.section_type === "hero_slider");

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-[#2a1727] to-[#161d36] p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-velina-rose/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-velina-gold/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-velina-rose/20 text-pink-200 border border-velina-rose/40">
                Storefront Customizer
              </span>
              <span className="text-[10px] font-semibold text-zinc-400">
                {activeCount} Live Sections
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Dynamic Home Page & Hero Carousel
            </h2>
            <p className="mt-2 text-sm text-zinc-300 max-w-xl leading-relaxed">
              Design carousel slides, showcase catalog products, customize hero banners, and organize section display order with drag-and-drop or single-tap mobile buttons.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {sections.length === 0 && (
              <button
                type="button"
                onClick={importDefaultSections}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-velina-gold/20 hover:bg-velina-gold/30 text-amber-200 border border-amber-300/30 text-xs font-bold transition-all"
              >
                <Sparkles size={15} />
                Import Default Sections
              </button>
            )}

            {heroSliderSection && (
              <button
                type="button"
                onClick={() => setPreviewSection(heroSliderSection)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white border border-white/20 text-xs font-bold transition-all"
              >
                <Eye size={14} />
                Live Carousel Preview
              </button>
            )}

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white border border-white/20 text-xs font-bold transition-all"
            >
              <ExternalLink size={14} />
              View Storefront
            </Link>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-velina-rose hover:bg-rose-600 text-white font-black text-xs shadow-lg shadow-velina-rose/30 transition-all active:scale-95"
            >
              <Plus size={16} />
              Add New Section
            </button>
          </div>
        </div>
      </section>

      {/* Featured Live Carousel Peeking Preview if active */}
      {heroSliderSection && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Sparkles size={14} className="text-velina-gold" />
              Active Hero Slider Carousel ({heroSliderSection.items?.length || 0} slides)
            </h3>
            <button
              type="button"
              onClick={() => handleOpenEdit(heroSliderSection)}
              className="text-xs font-bold text-velina-rose hover:underline"
            >
              Edit Carousel Settings
            </button>
          </div>
          <LiveCarouselPreview section={heroSliderSection} />
        </div>
      )}

      {/* Reorder instructions alert */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-muted">
        <div className="flex items-center gap-2">
          <HelpCircle size={15} className="text-velina-rose shrink-0" />
          <span>
            <strong>Reorder Tip:</strong> Grab any section by the grip handle to drag, or use the <strong>▲ / ▼</strong> arrow buttons (ideal for mobile touchscreens).
          </span>
        </div>

        <div className="flex items-center gap-3">
          {sections.length > 0 && (
            <button
              type="button"
              onClick={importDefaultSections}
              disabled={isSaving}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Reset to Defaults
            </button>
          )}

          <button
            onClick={() => fetchSections()}
            className="flex items-center gap-1 text-xs font-bold text-muted hover:text-velina-rose transition-colors p-1 shrink-0"
            title="Refresh sections"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Sections List */}
      {loading && sections.length === 0 ? (
        <div className="py-16 text-center text-muted space-y-2">
          <div className="w-8 h-8 mx-auto border-3 border-velina-rose border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold">Loading home sections...</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-surface space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-velina-rose/10 text-velina-rose flex items-center justify-center">
            <LayoutTemplate size={28} />
          </div>
          <h3 className="text-base font-black text-foreground">No dynamic sections yet</h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            You can import the default store hero carousel, deals grid, and promotional banners with one click, or create a custom section from scratch.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={importDefaultSections}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs shadow-md transition-colors"
            >
              <Sparkles size={16} />
              Import Default Carousel & Sections
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-velina-rose text-white text-xs font-black shadow-md hover:bg-rose-600 transition-colors"
            >
              <Plus size={16} />
              Create Custom Section
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, idx) => (
            <SectionCard
              key={section.id}
              section={section}
              index={idx}
              totalSections={sections.length}
              products={products}
              categories={categories}
              subCategories={subCategories}
              onEdit={handleOpenEdit}
              onDelete={deleteSection}
              onToggleActive={toggleSectionActive}
              onMoveSection={moveSection}
              onAddItem={addItem}
              onAddMultipleProducts={addMultipleProducts}
              onUpdateItem={updateItem}
              onDeleteItem={deleteItem}
              onReorderItems={reorderItems}
              onMoveItem={moveItem}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={draggedIdx === idx}
              isDragOver={dragOverIdx === idx}
              isSaving={isSaving}
            />
          ))}
        </div>
      )}

      {/* Section Creation/Edit Modal */}
      <SectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        section={editingSection}
        products={products}
        categories={categories}
        subCategories={subCategories}
        onSave={handleSaveSection}
        onAddItem={addItem}
        onAddMultipleProducts={addMultipleProducts}
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
        onReorderItems={reorderItems}
        onMoveItem={moveItem}
        isSaving={isSaving}
      />

      {/* Standalone Carousel Preview Modal */}
      {previewSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-black text-foreground">
                Carousel Peeking Preview • {previewSection.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewSection(null)}
                className="p-1.5 rounded-xl text-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <LiveCarouselPreview section={previewSection} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
