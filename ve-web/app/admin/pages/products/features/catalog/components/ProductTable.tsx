import { Edit, Trash2 } from "lucide-react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";

const statusStyles = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  draft: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  inactive: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const statusLabels = {
  active: "Active",
  draft: "Draft",
  inactive: "Inactive",
};

type ProductTableProps = {
  products: Product[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
};

export default function ProductTable({ products, categories, onEdit, onDelete }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900/50 p-12 text-center shadow-sm">
        <p className="text-sm font-bold text-muted">No products found.</p>
      </div>
    );
  }

  const getCategoryName = (id: number) => {
    return categories.find(c => c.id === id)?.name || "Unknown";
  };

  // Desktop table view
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block rounded-2xl border border-border bg-white dark:bg-zinc-900/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                {["Image", "Product", "Category", "Price", "Stock", "Status", "Actions"].map((col) => (
                  <th
                    key={col}
                    className={`px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-subtle ${col === 'Actions' ? 'text-right' : ''}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-border-subtle last:border-0 hover:bg-surface/60 transition-colors"
                >
                  <td className="px-5 py-4">
                    {product.images_url && product.images_url.length > 0 ? (
                      <img 
                        src={product.images_url[0]} 
                        alt={product.title} 
                        className="w-10 h-10 rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border">
                        <span className="text-[10px] text-muted font-bold">N/A</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-bold text-foreground">{product.title}</p>
                      <p className="text-[10px] font-bold text-muted-subtle mt-0.5">ID: {product.id}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted">{getCategoryName(product.category_id)}</td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <p className="font-bold text-velina-rose">
                        {(product.currency_symbol || "৳")}{Number(product.regular_price ?? product.price ?? 0).toFixed(2)}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Save {product.save_percentage ?? 0}%
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium">{product.stock_quantity}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusStyles[product.status] || statusStyles.draft}`}
                    >
                      {statusLabels[product.status] || "Unknown"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(product)}
                        aria-label="Edit product"
                        className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-velina-rose transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        aria-label="Delete product"
                        className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="border border-border bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm p-4 space-y-4"
          >
            {/* Product Image and Title */}
            <div className="flex gap-4 items-start">
              {product.images_url && product.images_url.length > 0 ? (
                <img 
                  src={product.images_url[0]} 
                  alt={product.title} 
                  className="w-16 h-16 rounded-lg object-cover border border-border shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center border border-border shrink-0">
                  <span className="text-[10px] text-muted font-bold">N/A</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{product.title}</p>
                <p className="text-[10px] font-bold text-muted-subtle mt-1">ID: {product.id}</p>
                <p className="text-[10px] text-muted mt-1">{getCategoryName(product.category_id)}</p>
              </div>
            </div>

            {/* Price and Discount */}
            <div className="bg-surface/50 rounded-lg p-3 space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-subtle">Price</p>
              <p className="font-bold text-velina-rose text-base">
                {(product.currency_symbol || "৳")}{Number(product.regular_price ?? product.price ?? 0).toFixed(2)}
              </p>
              <p className="text-[10px] font-bold uppercase text-emerald-600">
                Save {product.save_percentage ?? 0}%
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-subtle">Stock</p>
                <p className="font-semibold text-foreground">{product.stock_quantity}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-subtle">Size</p>
                <p className="font-semibold text-foreground text-sm">
                  {product.size ? `${product.size} ${product.size_unit?.toUpperCase() || 'gm'}` : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-subtle">Status</p>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyles[product.status] || statusStyles.draft}`}
                >
                  {statusLabels[product.status] || "Unknown"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={() => onEdit(product)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-velina-rose/10 text-velina-rose hover:bg-velina-rose/20 transition-colors font-semibold text-sm"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900 transition-colors font-semibold text-sm"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
