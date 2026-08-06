"use client";

import { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { Trash2, Star, Edit2, X } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { Rating } from "@/types/rating";

export default function RatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Rating[]>("/admin/ratings");
      setRatings(data);
    } catch (error) {
      console.error("Failed to load ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this rating?")) return;
    try {
      await fetchApi(`/admin/ratings/${id}`, { method: "DELETE" });
      await loadRatings();
    } catch (error) {
      console.error("Failed to delete rating:", error);
      alert("Failed to delete rating");
    }
  };

  const handleOpenModal = (rating: Rating) => {
    setEditingId(rating.id);
    setComment(rating.comment || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setComment("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setIsSubmitting(true);
    try {
      await fetchApi(`/admin/ratings/${editingId}`, {
        method: "PUT",
        data: { comment },
      });
      await loadRatings();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to update rating:", error);
      alert("Failed to update rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminShell title="Ratings & Reviews" subtitle="Manage product reviews from customers">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface/50 text-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Rating</th>
                  <th className="px-6 py-4 font-semibold">Review</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted">
                      Loading ratings...
                    </td>
                  </tr>
                ) : ratings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted">
                      No ratings found.
                    </td>
                  </tr>
                ) : (
                  ratings.map((rating) => (
                    <tr key={rating.id} className="hover:bg-surface/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          {rating.product?.images_url[0] && (
                            <img src={rating.product.images_url[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          )}
                          <span className="truncate max-w-[150px] block" title={rating.product?.title}>
                            {rating.product?.title || `Product #${rating.product_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {rating.customer?.user?.username || `Customer #${rating.customer_id}`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={14} fill={star <= rating.stars ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted max-w-xs truncate" title={rating.comment || "No comment"}>
                        {rating.comment || <span className="italic text-muted/50">No comment</span>}
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(rating)}
                            className="p-2 text-muted hover:text-velina-rose hover:bg-velina-rose/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(rating.id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl w-full max-w-md border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Edit Review</h3>
              <button
                onClick={handleCloseModal}
                className="text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-surface"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all resize-none"
                  rows={4}
                  placeholder="Review comment..."
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
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-velina-rose to-velina-magenta px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-velina-rose/25 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
