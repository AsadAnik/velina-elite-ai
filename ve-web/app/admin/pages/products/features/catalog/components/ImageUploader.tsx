import { useState, useRef, useEffect } from "react";
import { Plus, X, UploadCloud, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  imagesUrl: string[];
  setImagesUrl: (urls: string[]) => void;
  imageFiles: File[];
  setImageFiles: (files: File[]) => void;
  maxImages?: number;
}

export default function ImageUploader({
  imagesUrl,
  setImagesUrl,
  imageFiles,
  setImageFiles,
  maxImages = 3,
}: ImageUploaderProps) {
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track object URLs to revoke them when files change or component unmounts to prevent memory leaks
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  const totalCount = imagesUrl.length + imageFiles.length;
  const canAddMore = totalCount < maxImages;

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(",")) {
      const newUrls = val
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.startsWith("http"));
      
      const availableSlots = maxImages - totalCount;
      const urlsToAdd = newUrls.slice(0, availableSlots);
      
      if (urlsToAdd.length > 0) {
        setImagesUrl([...imagesUrl, ...urlsToAdd]);
      }
      setUrlInput("");
    } else {
      setUrlInput(val);
    }
  };

  const handleUrlInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && urlInput.trim().startsWith("http")) {
      e.preventDefault();
      if (canAddMore) {
        setImagesUrl([...imagesUrl, urlInput.trim()]);
        setUrlInput("");
      }
    }
  };

  const removeUrl = (indexToRemove: number) => {
    setImagesUrl(imagesUrl.filter((_, idx) => idx !== indexToRemove));
  };

  const removeFile = (indexToRemove: number) => {
    setImageFiles(imageFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const availableSlots = maxImages - totalCount;
      const filesToAdd = files.slice(0, availableSlots);
      if (filesToAdd.length > 0) {
        setImageFiles([...imageFiles, ...filesToAdd]);
      }
      
      // Reset input so the same file can be selected again if removed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4 col-span-1 md:col-span-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">
          Product Images
        </label>
        <span className="text-xs font-bold text-muted-subtle">
          {totalCount} / {maxImages} Uploaded
        </span>
      </div>

      {/* Previews */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Render URLs */}
        {imagesUrl.map((url, idx) => (
          <div
            key={`url-${idx}`}
            className="group relative aspect-square rounded-2xl border border-border bg-surface overflow-hidden shadow-sm"
          >
            <img
              src={url}
              alt={`URL preview ${idx}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1pbWFnZS1vZmYiPjxsaW5lIHgxPSIyIiB5MT0iMiIgeDI9IjIyIiB5Mj0iMjIiPjwvbGluZT48cGF0aCBkPSJNOC40IDIuNGMuMy0uMi43LS40IDEuMS0uNGgxMGMxLjEgMCAyIC45IDIgMnYxMmMwIC40LS4yLjgtLjQgMS4xIj48L3BhdGg+PHBhdGggZD0iTTIuNCA4LjRDMi4yIDguNyAyIDkuMSAyIDkuNXYxMGMwIDEuMS45IDIgMiAyaDEwYzQuNS0uMS45LS4zIDEuMy0uNSI+PC9wYXRoPjxwYXRoIGQ9Ik0yMSAxNWwtNC40LTQuNCI+PC9wYXRoPjxwb2x5Z29uIHBvaW50cz0iMTAgMjIgMiAxNCAyIDEwIDEwIDIyIj48L3BvbHlnb24+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjIiPjwvY2lyY2xlPjwvc3ZnPg=='; // fallback image
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center backdrop-blur-[2px]">
              <button
                type="button"
                onClick={() => removeUrl(idx)}
                className="rounded-full bg-white/20 p-2 text-white hover:bg-velina-rose transition-colors"
                title="Remove image"
              >
                <X size={20} />
              </button>
            </div>
            <div className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-1 backdrop-blur-md flex items-center gap-1 text-white">
               <LinkIcon size={12} />
               <span className="text-[10px] font-bold">URL</span>
            </div>
          </div>
        ))}

        {/* Render Files */}
        {previewUrls.map((url, idx) => (
          <div
            key={`file-${idx}`}
            className="group relative aspect-square rounded-2xl border border-border bg-surface overflow-hidden shadow-sm"
          >
            <img
              src={url}
              alt={`File preview ${idx}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center backdrop-blur-[2px]">
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="rounded-full bg-white/20 p-2 text-white hover:bg-velina-rose transition-colors"
                title="Remove image"
              >
                <X size={20} />
              </button>
            </div>
            <div className="absolute top-2 left-2 rounded-md bg-velina-rose/90 px-2 py-1 backdrop-blur-md flex items-center gap-1 text-white">
               <UploadCloud size={12} />
               <span className="text-[10px] font-bold">File</span>
            </div>
          </div>
        ))}

        {/* Upload Button Placeholder */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border hover:border-velina-rose hover:bg-velina-rose/5 transition-all text-muted hover:text-velina-rose"
          >
            <div className="rounded-full bg-surface p-3 shadow-sm group-hover:bg-velina-rose/10">
              <Plus size={24} />
            </div>
            <span className="text-xs font-bold">Add Image</span>
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={handleFileChange}
      />

      {canAddMore && (
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted">
            <LinkIcon size={16} />
          </div>
          <input
            type="text"
            value={urlInput}
            onChange={handleUrlInputChange}
            onKeyDown={handleUrlInputKeyDown}
            placeholder="Type URL and press Enter or comma..."
            className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
          />
        </div>
      )}
    </div>
  );
}
