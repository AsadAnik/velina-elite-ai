import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

interface RatingModalProps {
  productId: number;
  productTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RatingModal({ productId, productTitle, onClose, onSuccess }: RatingModalProps) {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) {
      toast.error('Please select a star rating');
      return;
    }
    
    setLoading(true);
    try {
      await fetchApi('/ratings', {
        method: 'POST',
        data: {
          product_id: productId,
          stars,
          comment: comment.trim() || undefined,
        },
      });
      toast.success('Thank you for your rating!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
          <h2 className="text-xl font-bold">Rate Product</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="font-medium text-center mb-6">{productTitle}</p>
          
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 focus:outline-none"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setStars(star)}
              >
                <Star
                  size={40}
                  className={`${
                    star <= (hoveredStar || stars)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-zinc-300 dark:text-zinc-700'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Review Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border rounded-xl dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-velina-rose outline-none resize-none"
              rows={4}
              placeholder="Tell us what you think about this product..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || stars === 0}
              className="flex-1 py-3 rounded-xl bg-velina-rose text-white font-bold hover:bg-velina-magenta transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
