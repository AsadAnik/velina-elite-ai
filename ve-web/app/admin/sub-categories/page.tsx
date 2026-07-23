"use client";

import { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { SubCategory, CreateSubCategoryDto } from "@/types/sub-category";
import { Category } from "@/types/category";

export default function SubCategoriesPage() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subCatData, catData] = await Promise.all([
        fetchApi<SubCategory[]>("/sub-categories"),
        fetchApi<Category[]>("/categories")
      ]);
      setSubCategories(subCatData);
      setCategories(catData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (subCategory?: SubCategory) => {
    if (subCategory) {
      setEditingId(subCategory.id);
      setName(subCategory.name);
      setCategoryId(subCategory.category_id);
    } else {
      setEditingId(null);
      setName("");
      setCategoryId("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setName("");
    setCategoryId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || categoryId === "") return;
    
    setIsSubmitting(true);
    try {
      const payload: CreateSubCategoryDto = { 
        name, 
        category_id: Number(categoryId) 
      };
      
      if (editingId) {
        await fetchApi(`/sub-categories/${editingId}`, {
          method: "PUT",
          data: payload,
        });
      } else {
        await fetchApi("/sub-categories", {
          method: "POST",
          data: payload,
        });
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save sub-category:", error);
      alert("Failed to save sub-category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this sub-category?")) return;
    try {
      await fetchApi(`/sub-categories/${id}`, { method: "DELETE" });
      await loadData();
    } catch (error) {
      console.error("Failed to delete sub-category:", error);
      alert("Failed to delete sub-category");
    }
  };

  const getCategoryName = (id: number) => {
    return categories.find(c => c.id === id)?.name || `Unknown ID: ${id}`;
  };

  return (
    <AdminShell title="Sub-Categories" subtitle="Manage your product sub-categories">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-velina-rose to-velina-magenta px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-velina-rose/25 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Add Sub-Category
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface/50 text-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Parent Category</th>
                  <th className="px-6 py-4 font-semibold">Created At</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted">
                      Loading sub-categories...
                    </td>
                  </tr>
                ) : subCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted">
                      No sub-categories found.
                    </td>
                  </tr>
                ) : (
                  subCategories.map((subCategory) => (
                    <tr key={subCategory.id} className="hover:bg-surface/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-muted">{subCategory.id}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{subCategory.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-velina-rose/10 px-2.5 py-0.5 text-xs font-semibold text-velina-rose">
                          {getCategoryName(subCategory.category_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {new Date(subCategory.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(subCategory)}
                            className="p-2 text-muted hover:text-velina-rose hover:bg-velina-rose/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(subCategory.id)}
                            className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl w-full max-w-md border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">
                {editingId ? "Edit Sub-Category" : "Add Sub-Category"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-surface"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-foreground">
                    Sub-Category Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
                    placeholder="e.g. Cleansers"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-semibold text-foreground">
                    Parent Category
                  </label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all appearance-none"
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-bold text-muted hover:text-foreground transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || categoryId === ""}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-velina-rose to-velina-magenta px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-velina-rose/25 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save Sub-Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
