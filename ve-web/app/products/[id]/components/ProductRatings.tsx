"use client";

import { useState } from "react";
import { Star, X, MessageSquare, ChevronRight } from "lucide-react";
import { ProductRatingsSummary } from "@/types/rating";

export default function ProductRatings({ data }: { data: ProductRatingsSummary }) {
  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);

  if (!data || data.totalRatings === 0) {
    return (
      <div className="mt-12 border-t border-border pt-8">
        <h2 className="text-2xl font-black">Customer Reviews</h2>
        <p className="mt-4 text-muted">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  // Only display the first 2 reviews on the product details page
  const visibleRatings = data.ratings.slice(0, 2);
  const remainingCount = data.totalRatings - 2;

  return (
    <div className="mt-12 border-t border-border pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Customer Reviews</h2>
        {data.totalRatings > 2 && (
          <button
            onClick={() => setIsAllReviewsModalOpen(true)}
            className="text-xs font-bold text-velina-rose hover:text-velina-magenta hover:underline flex items-center gap-1 transition-colors"
          >
            View all {data.totalRatings} reviews <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Rating summary bar */}
      <div className="mt-6 flex items-center gap-4 bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div className="text-5xl font-black text-velina-rose">{data.averageRating}</div>
        <div>
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                fill={star <= Math.round(data.averageRating) ? "currentColor" : "none"}
              />
            ))}
          </div>
          <p className="text-sm text-muted mt-1">
            Based on {data.totalRatings} review{data.totalRatings > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Visible 2 Reviews */}
      <div className="mt-8 space-y-4">
        {visibleRatings.map((rating) => (
          <div
            key={rating.id}
            className="border border-border/80 bg-surface/40 p-5 rounded-2xl hover:bg-surface/80 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="font-bold flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-velina-rose to-velina-gold text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {(rating.customer?.user?.username || "A")[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {rating.customer?.user?.username || "Verified Customer"}
                </span>
              </div>
              <div className="text-xs text-muted">
                {new Date(rating.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
            <div className="flex text-yellow-400 my-2.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={15}
                  fill={star <= rating.stars ? "currentColor" : "none"}
                />
              ))}
            </div>
            {rating.comment && (
              <p className="text-muted mt-1.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {rating.comment}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* "Show more" button when there are more than 2 reviews */}
      {remainingCount > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setIsAllReviewsModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-border bg-surface hover:bg-surface-2 text-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:border-velina-rose/40 transition-all hover:scale-[1.02]"
          >
            <MessageSquare size={15} className="text-velina-rose" />
            Show more reviews ({data.totalRatings} total)
          </button>
        </div>
      )}

      {/* ── ALL REVIEWS MODAL ── */}
      {isAllReviewsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsAllReviewsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col w-full max-w-2xl max-h-[85vh] bg-background border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border bg-surface flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-foreground">All Customer Reviews</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= Math.round(data.averageRating) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {data.averageRating}
                  </span>
                  <span className="text-xs text-muted">
                    ({data.totalRatings} review{data.totalRatings > 1 ? "s" : ""})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAllReviewsModalOpen(false)}
                className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Reviews List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {data.ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="p-4 rounded-2xl border border-border bg-surface/50 hover:bg-surface transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-velina-rose to-velina-gold text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {(rating.customer?.user?.username || "A")[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {rating.customer?.user?.username || "Verified Customer"}
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      {new Date(rating.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex text-yellow-400 my-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= rating.stars ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  {rating.comment && (
                    <p className="text-muted text-xs sm:text-sm leading-relaxed whitespace-pre-line mt-1">
                      {rating.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-surface flex justify-end">
              <button
                onClick={() => setIsAllReviewsModalOpen(false)}
                className="px-5 py-2.5 rounded-full bg-foreground text-background font-bold text-xs hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
