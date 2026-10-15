import React, { useState, useCallback, useEffect } from 'react';
import { fileToImageData } from '../utils/image';
import type { ImageData } from '../types';

interface ImageInputProps { setImageData: (data: ImageData | null) => void; }

const OK_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_MB = 15;
const mb = (b: number) => (b / 1048576).toFixed(1);
const kb = (b: number) => (b >= 1048576 ? `${mb(b)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

const ImageInput: React.FC<ImageInputProps> = ({ setImageData }) => {
  const [info, setInfo] = useState<{ preview: string; name: string; size: number; sent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!OK_TYPES.includes(file.type)) {
      const heic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
      setError(heic ? 'HEIC/HEIF photos are not supported. Use a JPG or PNG (iPhone: Settings → Camera → Formats → Most Compatible).' : `“${file.name}” is not a supported image. Please use PNG, JPG, WEBP or GIF.`);
      return;
    }
    if (file.size > MAX_MB * 1048576) { setError(`That image is ${mb(file.size)} MB. Please use one under ${MAX_MB} MB, or crop it to just the problem.`); return; }
    setBusy(true);
    try {
      const { preview, ...data } = await fileToImageData(file);
      setInfo({ preview, name: file.name && file.name !== 'image.png' ? file.name : 'Pasted screenshot', size: file.size, sent: Math.round(data.base64.length * 0.75) });
      setImageData(data);
    } catch {
      setError('This image could not be read. It may be corrupted. Try another file or a screenshot.');
    } finally { setBusy(false); }
  }, [setImageData]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => { const f = Array.from(e.clipboardData?.files || []).find((x) => x.type.startsWith('image/')); if (f) handleFile(f); };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFile]);

  const stop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const remove = () => { setInfo(null); setError(null); setImageData(null); };
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => { handleFile(e.target.files?.[0]); e.target.value = ''; };
  const btn = 'px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-all';

  return (
    <div className="w-full">
      {info ? (
        <div className="animate-fade-up rounded-xl border border-green-500/60 bg-forge-void p-3">
          <p className="text-xs text-green-500 mb-2">✓ Image ready — it will be sent with your problem</p>
          <img src={info.preview} alt="Preview of your uploaded problem" className="w-full max-h-64 object-contain rounded-lg border border-forge-border" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-forge-ink truncate max-w-[16rem]" title={info.name}>{info.name}</p>
              <p className="text-xs text-forge-muted">{kb(info.size)}{info.sent < info.size ? ` → ${kb(info.sent)} after compression` : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className={`${btn} border-forge-border text-forge-ink hover:border-forge-ember/60`}>Replace
                <input type="file" accept="image/*" className="sr-only" onChange={pick} />
              </label>
              <button onClick={remove} className={`${btn} border-forge-danger/60 text-forge-danger hover:bg-forge-danger/10`}>Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <div onDrop={(e) => { stop(e); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); }} onDragOver={stop} onDragEnter={(e) => { stop(e); setIsDragging(true); }} onDragLeave={(e) => { stop(e); setIsDragging(false); }}
          className={`px-4 py-8 border-2 border-dashed rounded-xl text-center transition-all duration-200 ${isDragging ? 'border-forge-ember bg-forge-ember/5' : 'border-forge-border hover:border-forge-border-strong'}`}>
          {busy ? <p className="text-sm text-forge-muted">Reading image…</p> : (
            <div className="space-y-3">
              <p className="text-sm text-forge-muted">Drag and drop an image here, or</p>
              <div className="flex flex-wrap justify-center gap-2">
                <label className={`${btn} border-forge-ember text-forge-ember hover:bg-forge-ember/10`}>Choose a file
                  <input type="file" accept="image/*" className="sr-only" onChange={pick} />
                </label>
                <label className={`${btn} border-forge-border text-forge-ink hover:border-forge-ember/60`}>📷 Take a photo
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick} />
                </label>
              </div>
              <p className="text-xs text-forge-muted/70">PNG, JPG, WEBP or GIF up to {MAX_MB} MB. You can also paste a screenshot (Ctrl+V).</p>
            </div>
          )}
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-forge-danger bg-forge-danger/10 border border-forge-danger/30 rounded-lg py-2 px-3">{error}</p>}
    </div>
  );
};

export default ImageInput;
