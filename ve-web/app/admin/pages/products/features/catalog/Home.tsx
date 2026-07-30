"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import ProductFilters from "./components/ProductFilters";
import ProductTable from "./components/ProductTable";
import ImageUploader from "./components/ImageUploader";
import { useProducts } from "./hooks";
import { fetchApi } from "@/lib/api";
import { Product } from "@/types/product";

export default function Home() {
  const {
    products,
    categories,
    rawCategories,
    rawSubCategories,
    search,
    setSearch,
    category,
    setCategory,
    totalCount,
    loading,
    refreshData,
  } = useProducts();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [mrpPrice, setMrpPrice] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("৳");
  const [size, setSize] = useState("");
  const [sizeUnit, setSizeUnit] = useState<"gm" | "ml">("gm");
  const [stockQuantity, setStockQuantity] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "inactive">("draft");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [subCategoryId, setSubCategoryId] = useState<number | "">("");
  const [imagesUrl, setImagesUrl] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Derived sub-categories based on selected category
  const availableSubCategories = rawSubCategories.filter(
    (sc) => sc.category_id === categoryId
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setTitle(product.title);
      setDescription(product.description || "");
      setRegularPrice((product.regular_price ?? product.price ?? 0).toString());
      setMrpPrice((product.mrp_price ?? product.regular_price ?? product.price ?? 0).toString());
      setCurrencySymbol(product.currency_symbol || "৳");
      setSize(product.size?.toString() || "");
      setSizeUnit((product.size_unit as "gm" | "ml") || "gm");
      setStockQuantity(product.stock_quantity.toString());
      setStatus(product.status);
      setCategoryId(product.category_id);
      setSubCategoryId(product.sub_category_id);
      setImagesUrl(product.images_url || []);
      setImageFiles([]);
    } else {
      setEditingId(null);
      setTitle("");
      setDescription("");
      setRegularPrice("");
      setMrpPrice("");
      setCurrencySymbol("৳");
      setSize("");
      setSizeUnit("gm");
      setStockQuantity("");
      setStatus("draft");
      setCategoryId("");
      setSubCategoryId("");
      setImagesUrl([]);
      setImageFiles([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !regularPrice || !mrpPrice || !size || !stockQuantity || categoryId === "" || subCategoryId === "") {
      toast.error("Please fill in all required fields");
      return;
    }

    const totalImages = imagesUrl.length + imageFiles.length;
    if (totalImages < 1 || totalImages > 3) {
      toast.error("A product must have between 1 and 3 images (uploaded or URLs).");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", regularPrice);
      formData.append("regular_price", regularPrice);
      formData.append("mrp_price", mrpPrice);
      formData.append("currency_symbol", currencySymbol);
      formData.append("size", size);
      formData.append("size_unit", sizeUnit);
      formData.append("stock_quantity", stockQuantity);
      formData.append("status", status);
      formData.append("category_id", categoryId.toString());
      formData.append("sub_category_id", subCategoryId.toString());
      
      imagesUrl.forEach((url) => formData.append("images_url", url));
      imageFiles.forEach((file) => formData.append("images", file));

      if (editingId) {
        await fetchApi(`/products/${editingId}`, {
          method: "PUT",
          data: formData,
        });
        toast.success("Product updated successfully!");
      } else {
        await fetchApi("/products", {
          method: "POST",
          data: formData,
        });
        toast.success("Product created successfully!");
      }
      await refreshData();
      handleCloseModal();
    } catch (error: any) {
      console.error("Failed to save product:", error);
      const errorMessage = error?.message || "Failed to save product";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetchApi(`/products/${id}`, { method: "DELETE" });
      await refreshData();
      toast.success("Product deleted successfully!");
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      const errorMessage = error?.message || "Failed to delete product";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">
            Product Catalog
          </p>
          <h2 className="text-xl font-black text-foreground mt-0.5">
            Manage your beauty inventory
          </h2>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-velina-rose to-velina-magenta px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-velina-rose/25 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      <ProductFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        categories={["All", ...categories]}
        totalCount={products.length}
      />

      {loading ? (
        <div className="py-12 text-center text-muted">Loading products...</div>
      ) : (
        <ProductTable
          products={products}
          categories={rawCategories}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      )}

      <p className="text-center text-xs text-muted">
        Showing {products.length} of {totalCount} products
      </p>

      {/* Modal for Add/Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-4">
          <div className="bg-white dark:bg-zinc-950 sm:rounded-2xl shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl border-0 sm:border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-border shrink-0">
              <h3 className="text-lg font-bold text-foreground truncate pr-4">
                {editingId ? "Edit Product" : "Add Product"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-surface shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-foreground">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-foreground">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Regular Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">MRP Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mrpPrice}
                    onChange={(e) => setMrpPrice(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Currency</label>
                  <select
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all appearance-none"
                  >
                    <option value="৳">BDT (৳)</option>
                    <option value="$">USD ($)</option>
                    <option value="€">EUR (€)</option>
                    <option value="¥">CNY (¥)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Size</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Size Unit</label>
                  <div className="flex rounded-xl border border-border bg-surface p-1">
                    {(["gm", "ml"] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setSizeUnit(unit)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${sizeUnit === unit ? "bg-velina-rose text-white" : "text-muted hover:text-foreground"}`}
                      >
                        {unit.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(Number(e.target.value));
                      setSubCategoryId(""); // reset sub category on change
                    }}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all appearance-none"
                    required
                  >
                    <option value="" disabled>Select Category</option>
                    {rawCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Sub-Category</label>
                  <select
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all appearance-none"
                    required
                    disabled={categoryId === ""}
                  >
                    <option value="" disabled>Select Sub-Category</option>
                    {availableSubCategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-foreground">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "draft" | "active" | "inactive")}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all appearance-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <ImageUploader 
                    imagesUrl={imagesUrl} 
                    setImagesUrl={setImagesUrl} 
                    imageFiles={imageFiles} 
                    setImageFiles={setImageFiles} 
                    maxImages={3}
                  />
                </div>
              </div>
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-border bg-white dark:bg-zinc-950 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 sm:px-5 py-2.5 text-sm font-bold text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-velina-rose to-velina-magenta px-4 sm:px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-velina-rose/25 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
