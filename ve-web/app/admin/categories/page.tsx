"use client";

import { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { Category, CreateCategoryDto } from "@/types/category";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Category[]>("/categories");
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      setName(category.name);
    } else {
      setEditingId(null);
      setName("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const payload: CreateCategoryDto = { name };
      if (editingId) {
        await fetchApi(`/categories/${editingId}`, {
          method: "PUT",
          data: payload,
        });
      } else {
        await fetchApi("/categories", {
          method: "POST",
          data: payload,
        });
      }
      await loadCategories();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await fetchApi(`/categories/${id}`, { method: "DELETE" });
      await loadCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category");
    }
  };

  return (
    <AdminShell title="Categories" subtitle="Manage your product categories">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-velina-rose to-velina-magenta px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-velina-rose/25 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface/50 text-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Created At</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted">
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-surface/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-muted">{category.id}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{category.name}</td>
                      <td className="px-6 py-4 text-muted">
                        {new Date(category.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(category)}
                            className="p-2 text-muted hover:text-velina-rose hover:bg-velina-rose/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
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
                {editingId ? "Edit Category" : "Add Category"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-surface"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-foreground">
                  Category Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
                  placeholder="e.g. Skincare"
                  required
                />
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
                  disabled={isSubmitting || !name.trim()}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-velina-rose to-velina-magenta px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-velina-rose/25 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
