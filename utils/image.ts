import type { ImageData } from '../types';

// Downscale + JPEG-compress so uploads stay well under Vercel's ~4.5MB request limit.
export const compressToImageData = (src: CanvasImageSource & { width?: number; height?: number }, max = 1600): ImageData & { preview: string } => {
  const w = (src as any).naturalWidth || (src as any).width;
  const h = (src as any).naturalHeight || (src as any).height;
  const scale = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, 0, 0, c.width, c.height);
  const url = c.toDataURL('image/jpeg', 0.85);
  return { base64: url.split(',')[1], mimeType: 'image/jpeg', preview: url };
};

export const fileToImageData = (file: File): Promise<ImageData & { preview: string }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(compressToImageData(img)); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
