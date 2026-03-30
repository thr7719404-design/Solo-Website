import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { mediaApi } from '@/api/media';

const MAX_IMAGES = 5;

interface Props {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
}

export default function MultiImageUploadField({ label, values, onChange, folder }: Readonly<Props>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleFiles = async (files: FileList) => {
    const remaining = MAX_IMAGES - values.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const imageFiles = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining);

    if (imageFiles.length === 0) {
      toast.error('Please select image files');
      return;
    }

    setUploading(true);
    try {
      const results = await Promise.all(
        imageFiles.map((f) => mediaApi.uploadFile(f, folder)),
      );
      const newUrls = results.map((r) => r.url);
      onChange([...values, ...newUrls]);
      toast.success(`${newUrls.length} image${newUrls.length > 1 ? 's' : ''} uploaded`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const removeImage = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  // Drag-to-reorder
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...values];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    onChange(reordered);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label} ({values.length}/{MAX_IMAGES})
      </label>

      <div className="grid grid-cols-5 gap-2 mb-2">
        {values.map((url, idx) => (
          <div
            key={url}
            role="listitem"
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`relative group aspect-square rounded border cursor-grab ${
              dragIdx === idx ? 'border-indigo-500 opacity-50' : 'border-gray-200'
            } ${idx === 0 ? 'ring-2 ring-indigo-400' : ''}`}
          >
            <img
              src={url}
              alt={`Product ${idx + 1}`}
              className="w-full h-full object-cover rounded"
            />
            {idx === 0 && (
              <span className="absolute top-0.5 left-0.5 bg-indigo-600 text-white text-[9px] font-bold px-1 rounded">
                PRIMARY
              </span>
            )}
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              &times;
            </button>
            <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[9px] px-1 rounded">
              {idx + 1}
            </span>
          </div>
        ))}

        {values.length < MAX_IMAGES && (
          <button
            type="button"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => { if (!uploading) inputRef.current?.click(); }}
            className="aspect-square border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
          >
            {uploading ? (
              <span className="text-[10px] text-gray-500">Uploading...</span>
            ) : (
              <>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] text-gray-400 mt-0.5">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="text-[10px] text-gray-400">
        Drag to reorder. First image is the primary/thumbnail. Up to {MAX_IMAGES} images.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
