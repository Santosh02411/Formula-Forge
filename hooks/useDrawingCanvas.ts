import { useState, useRef, useEffect, useCallback } from 'react';

interface Point { x: number; y: number; }
interface Stroke { color: string; width: number; pts: Point[]; }

const PAPER = '#ffffff';

const paint = (ctx: CanvasRenderingContext2D, strokes: Stroke[], k = 1, dx = 0, dy = 0) => {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.width * k;
    const p = s.pts.map((q) => ({ x: (q.x - dx) * k, y: (q.y - dy) * k }));
    if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0].x, p[0].y, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); continue; }
    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i].x + p[i + 1].x) / 2, my = (p[i].y + p[i + 1].y) / 2;
      ctx.quadraticCurveTo(p[i].x, p[i].y, mx, my); // smooth the line
    }
    ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
    ctx.stroke();
  }
};

export const useDrawingCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [color, setColor] = useState('#1a1a1a');
  const [lineWidth, setLineWidth] = useState(4);
  const [count, setCount] = useState(0); // number of strokes (drives Undo enabled state)
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);

  const redraw = useCallback(() => {
    const c = canvasRef.current, ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, c.width, c.height);
    paint(ctx, strokes.current);
  }, [canvasRef]);

  useEffect(() => {
    const c = canvasRef.current;
    const box = c?.parentElement;
    if (!c || !box) return;
    // Make the on-screen size and the bitmap size identical (1 canvas px = 1 CSS px), so there is no scaling to go wrong.
    const resize = () => {
      const w = Math.max(1, Math.floor(box.clientWidth)), h = Math.max(1, Math.floor(box.clientHeight));
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    return () => ro.disconnect();
  }, [canvasRef, redraw]);

  // Map pointer position to canvas pixels, correcting for any CSS-vs-bitmap size difference (fixes the cursor offset).
  const pos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / (r.width || c.width)), y: (e.clientY - r.top) * (c.height / (r.height || c.height)) };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    current.current = { color, width: lineWidth, pts: [pos(e)] };
    strokes.current.push(current.current);
    redraw();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!current.current) return;
    current.current.pts.push(pos(e));
    redraw();
  };
  const onPointerUp = () => {
    if (!current.current) return;
    current.current = null;
    setCount(strokes.current.length);
  };

  const undo = useCallback(() => { strokes.current.pop(); setCount(strokes.current.length); redraw(); }, [redraw]);
  const clearCanvas = useCallback(() => { strokes.current = []; setCount(0); redraw(); }, [redraw]);

  // Re-render strokes (vector) cropped to the writing, at 2x, on white — much clearer for the AI to read than the screen bitmap.
  const getCanvasData = useCallback((): { base64: string; mimeType: string } | null => {
    const all = strokes.current;
    if (!all.length) return null;
    const xs = all.flatMap((s) => s.pts.map((p) => p.x)), ys = all.flatMap((s) => s.pts.map((p) => p.y));
    const pad = 30;
    const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
    const w = Math.max(...xs) + pad - x0, h = Math.max(...ys) + pad - y0;
    const k = Math.min(2.5, 1600 / Math.max(w, h));
    const o = document.createElement('canvas');
    o.width = Math.max(1, Math.round(w * k));
    o.height = Math.max(1, Math.round(h * k));
    const ctx = o.getContext('2d')!;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, o.width, o.height);
    paint(ctx, all, k, x0, y0);
    return { base64: o.toDataURL('image/png').split(',')[1], mimeType: 'image/png' };
  }, []);

  return { color, setColor, lineWidth, setLineWidth, onPointerDown, onPointerMove, onPointerUp, undo, clearCanvas, getCanvasData, canUndo: count > 0 };
};
