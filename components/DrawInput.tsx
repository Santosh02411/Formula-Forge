import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { useDrawingCanvas } from '../hooks/useDrawingCanvas';
import type { ImageData } from '../types';

export interface DrawInputHandles {
  getCanvasData: () => ImageData | null;
}
interface Props { onRead?: () => void; reading?: boolean; }

const COLORS = ['#1a1a1a', '#c2410c', '#1d4ed8', '#15803d', '#b91c1c'];
const tool = 'px-3 py-1.5 text-xs font-semibold rounded-md border border-forge-border text-forge-ink hover:border-forge-ember/60 hover:text-forge-ember disabled:opacity-40 disabled:cursor-not-allowed transition-all';

const DrawInput = forwardRef<DrawInputHandles, Props>(({ onRead, reading }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const d = useDrawingCanvas(canvasRef);
  useImperativeHandle(ref, () => ({ getCanvasData: d.getCanvasData }));

  // Ctrl/Cmd+Z = undo last stroke
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && document.activeElement?.tagName !== 'TEXTAREA') { e.preventDefault(); d.undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [d.undo]);

  return (
    <div className="w-full flex flex-col items-center space-y-3">
      <div className="w-full h-56 sm:h-72 bg-white rounded-xl overflow-hidden border border-forge-border">
        <canvas ref={canvasRef} onPointerDown={d.onPointerDown} onPointerMove={d.onPointerMove} onPointerUp={d.onPointerUp}
          onPointerCancel={d.onPointerUp} className="block cursor-crosshair"  style={{ touchAction: "none" }} />
      </div>
      <p className="text-xs text-forge-muted">Tip: write large and clearly, one problem at a time. Use “Read my drawing” to check what the AI sees. (canvas v3)</p>
      <div className="flex flex-wrap items-center justify-between gap-3 w-full p-3 bg-forge-surface-2 rounded-xl border border-forge-border">
        <label className="flex items-center gap-2 text-xs font-medium text-forge-muted">Size
          <input type="range" min="2" max="14" value={d.lineWidth} onChange={(e) => d.setLineWidth(Number(e.target.value))}
            className="w-24 h-1.5 bg-forge-border rounded-lg appearance-none cursor-pointer accent-forge-ember" />
        </label>
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button key={c} onClick={() => d.setColor(c)} aria-label={`Select color ${c}`}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${d.color === c ? 'ring-2 ring-offset-2 ring-offset-forge-surface-2 ring-forge-ember' : ''}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={d.undo} disabled={!d.canUndo} className={tool} title="Undo last stroke (Ctrl+Z)">↶ Undo</button>
          <button onClick={d.clearCanvas} disabled={!d.canUndo} className={tool}>Clear</button>
          {onRead && <button onClick={onRead} disabled={!d.canUndo || reading} className={tool}>{reading ? 'Reading…' : 'Read my drawing'}</button>}
        </div>
      </div>
    </div>
  );
});

export default DrawInput;
