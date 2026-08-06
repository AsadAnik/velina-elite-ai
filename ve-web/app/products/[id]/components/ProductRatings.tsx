import { Star } from "lucide-react";
import { ProductRatingsSummary } from "@/types/rating";

export default function ProductRatings({ data }: { data: ProductRatingsSummary }) {
  if (!data || data.totalRatings === 0) {
    return (
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-black">Customer Reviews</h2>
        <p className="mt-4 text-muted">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-black">Customer Reviews</h2>
      
      <div className="mt-6 flex items-center gap-4 bg-surface p-6 rounded-2xl shadow-sm">
        <div className="text-5xl font-black text-velina-rose">{data.averageRating}</div>
        <div>
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={20} fill={star <= Math.round(data.averageRating) ? "currentColor" : "none"} />
            ))}
          </div>
          <p className="text-sm text-muted mt-1">Based on {data.totalRatings} review{data.totalRatings > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {data.ratings.map((rating) => (
          <div key={rating.id} className="border-b pb-6 last:border-0 hover:bg-surface/50 p-4 rounded-xl transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-velina-rose text-white flex items-center justify-center font-bold text-sm">
                  {(rating.customer?.user?.username || 'A')[0].toUpperCase()}
                </div>
                {rating.customer?.user?.username || 'Anonymous'}
              </div>
              <div className="text-sm text-muted">{new Date(rating.created_at).toLocaleDateString()}</div>
            </div>
            <div className="flex text-yellow-400 my-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} fill={star <= rating.stars ? "currentColor" : "none"} />
              ))}
            </div>
            {rating.comment && <p className="text-muted mt-2 text-sm leading-relaxed">{rating.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
