import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { mediaApi } from '@/api/media';

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  required?: boolean;
}

export default function ImageUploadField({ label, value, onChange, folder, required }: Readonly<Props>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploading(true);
    try {
      const result = await mediaApi.uploadFile(file, folder);
      onChange(result.url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && ' *'}
      </label>

      {value ? (
        <div className="relative group">
          <img src={value} alt="Preview" className="w-full h-36 object-cover rounded border border-gray-200 bg-gray-100" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded shadow hover:bg-gray-50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded shadow hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => { if (!uploading) inputRef.current?.click(); }}
          className="w-full h-36 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
        >
          {uploading ? (
            <p className="text-sm text-gray-500">Uploading...</p>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">Click or drag an image</p>
            </>
          )}
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInputChange} />
    </div>
  );
}
