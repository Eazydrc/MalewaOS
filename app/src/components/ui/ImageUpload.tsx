import { useRef, useState } from 'react';
import { api } from '@/lib/api';

interface ImageUploadProps {
  value?: string;           // URL actuelle
  onChange: (url: string) => void;
  shape?: 'square' | 'round' | 'wide';  // square=1:1, round=cercle, wide=cover 16:9
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  shape = 'square',
  placeholder = 'Ajouter une photo',
  size = 'md',
  label,
}: ImageUploadProps) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [preview, setPreview]   = useState<string | undefined>(value);

  // Sync preview when value prop changes externally
  if (value !== preview && !loading) {
    setPreview(value);
  }

  async function handleFile(file: File) {
    setError('');
    setLoading(true);

    // Aperçu local immédiat
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const form = new FormData();
      form.append('file', file);

      // api.post wraps JSON — use fetch directly for multipart
      const baseUrl = (import.meta as any).env.VITE_API_URL as string;
      const res = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Erreur upload');
      }

      const { url } = await res.json();
      setPreview(url);
      onChange(url);
    } catch (e: any) {
      setError(e.message ?? 'Erreur');
      setPreview(value); // rollback
    } finally {
      setLoading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // reset so same file can be re-selected
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const sizeClasses = {
    sm: shape === 'wide' ? 'h-24 w-full' : 'w-16 h-16',
    md: shape === 'wide' ? 'h-36 w-full' : 'w-24 h-24',
    lg: shape === 'wide' ? 'h-52 w-full' : 'w-32 h-32',
  }[size];

  const shapeClasses = {
    square: 'rounded-2xl',
    round:  'rounded-full',
    wide:   'rounded-2xl',
  }[shape];

  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-semibold text-text-2">{label}</p>}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        className={`relative ${sizeClasses} ${shapeClasses} overflow-hidden border-2 border-dashed border-border bg-surface-2 flex flex-col items-center justify-center gap-1.5 transition-all hover:border-accent/50 hover:bg-accent/5 active:scale-[0.98] no-tap group`}
      >
        {/* Image de fond */}
        {preview && (
          <img
            src={preview}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setPreview(undefined)}
          />
        )}

        {/* Overlay loading */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        )}

        {/* Overlay hover si image présente */}
        {preview && !loading && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-text">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span className="text-[10px] font-bold text-text">Changer</span>
            </div>
          </div>
        )}

        {/* Placeholder si pas d'image */}
        {!preview && !loading && (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-text-3">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {shape !== 'round' && (
              <p className="text-[10px] text-text-3 font-medium text-center px-2 leading-tight">{placeholder}</p>
            )}
          </>
        )}
      </button>

      {/* Supprimer */}
      {preview && !loading && (
        <button
          type="button"
          onClick={() => { setPreview(undefined); onChange(''); }}
          className="text-[10px] text-text-3 hover:text-red-500 transition-colors font-medium"
        >
          × Supprimer
        </button>
      )}

      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
