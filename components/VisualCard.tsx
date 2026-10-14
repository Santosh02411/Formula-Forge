import React, { useEffect, useRef, useState } from 'react';
import { compile } from '../utils/mathExpr';
import type { VerifyResult } from '../utils/mathExpr';

const PlotView: React.FC<{ spec: any }> = ({ spec }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries((spec.params || []).map((p: any) => [p.name, +p.value])));
  const [err, setErr] = useState(false);
  useEffect(() => {
    const c = ref.current, g = c?.getContext('2d');
    if (!c || !g) return;
    try {
      const W = 640, H = 360, f = compile(String(spec.expr)), x0 = +spec.xmin, x1 = +spec.xmax, N = 500;
      if (!(x1 > x0)) throw new Error('range');
      const xs = Array.from({ length: N + 1 }, (_, k) => x0 + ((x1 - x0) * k) / N), ys = xs.map((x) => f({ ...vals, x }));
      const fin = ys.filter(isFinite).sort((a, b) => a - b);
      if (fin.length < 5) throw new Error('data');
      let lo = Math.min(fin[Math.floor(fin.length * 0.02)], 0), hi = Math.max(fin[Math.ceil(fin.length * 0.98) - 1], 0);
      if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
      const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
      const X = (x: number) => ((x - x0) / (x1 - x0)) * W, Y = (y: number) => H - ((y - lo) / (hi - lo)) * H;
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#9ca3af'; g.lineWidth = 1.5; g.beginPath();
      const ax = x0 < 0 && x1 > 0 ? X(0) : 0, ay = lo < 0 && hi > 0 ? Y(0) : H;
      g.moveTo(0, ay); g.lineTo(W, ay); g.moveTo(ax, 0); g.lineTo(ax, H); g.stroke();
      g.fillStyle = '#6b7280'; g.font = '12px sans-serif';
      g.fillText(String(+x0.toPrecision(3)), 4, H - 4); g.fillText(String(+x1.toPrecision(3)), W - 34, H - 4);
      if (Array.isArray(spec.shade)) {
        const [a, b] = spec.shade.map(Number); g.fillStyle = 'rgba(255,122,61,0.30)'; g.beginPath(); g.moveTo(X(a), Y(0));
        xs.forEach((x, k) => { if (x >= a && x <= b && isFinite(ys[k])) g.lineTo(X(x), Y(ys[k])); }); g.lineTo(X(b), Y(0)); g.closePath(); g.fill();
      }
      g.strokeStyle = '#c2410c'; g.lineWidth = 3; g.beginPath(); let pen = false;
      ys.forEach((y, k) => { if (!isFinite(y) || y < lo - (hi - lo) || y > hi + (hi - lo)) { pen = false; return; } pen ? g.lineTo(X(xs[k]), Y(y)) : g.moveTo(X(xs[k]), Y(y)); pen = true; });
      g.stroke();
      g.fillStyle = '#1d4ed8';
      for (let k = 1; k < ys.length; k++) if (isFinite(ys[k]) && isFinite(ys[k - 1]) && ys[k - 1] * ys[k] < 0) {
        const r = xs[k - 1] - (ys[k - 1] * (xs[k] - xs[k - 1])) / (ys[k] - ys[k - 1]); g.beginPath(); g.arc(X(r), Y(0), 5, 0, 7); g.fill();
      }
      setErr(false);
    } catch { setErr(true); }
  }, [spec, vals]);
  if (err) return <p className="text-sm text-forge-muted">Could not plot this expression.</p>;
  return (
    <div>
      <canvas ref={ref} width={640} height={360} className="w-full rounded-lg border border-forge-border" />
      <p className="text-xs text-forge-muted mt-1">Blue dots mark where the curve crosses zero{spec.shade ? '; the shaded area is the integral.' : '.'}</p>
      {(spec.params || []).map((p: any) => (
        <label key={p.name} className="flex items-center gap-3 mt-2 text-sm text-forge-ink">
          <span className="w-24 font-mono">{p.name} = {+vals[p.name]?.toFixed(2)}</span>
          <input type="range" min={p.min} max={p.max} step={(p.max - p.min) / 100} value={vals[p.name]} onChange={(e) => setVals((v) => ({ ...v, [p.name]: +e.target.value }))} className="flex-1 accent-forge-ember" />
        </label>
      ))}
    </div>
  );
};

const cleanSvg = (raw: string): string | null => {
  const doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
  const svg = doc.documentElement;
  if (doc.querySelector('parsererror') || svg.nodeName.toLowerCase() !== 'svg') return null;
  svg.querySelectorAll('script,foreignObject,image,iframe,style').forEach((n) => n.remove());
  [svg, ...Array.from(svg.querySelectorAll('*'))].forEach((el) => Array.from(el.attributes).forEach((a) => { if (a.name.startsWith('on') || a.name.includes('href')) el.removeAttribute(a.name); }));
  return svg.outerHTML;
};

export const VisualCard: React.FC<{ spec: any; onClose: () => void }> = ({ spec, onClose }) => {
  const svg = spec.type === 'svg' ? cleanSvg(String(spec.svg || '')) : null;
  return (
    <div className="w-full mt-6 p-6 bg-forge-surface border border-forge-border rounded-2xl print:hidden">
      <div className="flex justify-between items-center mb-3">
        <p className="font-display font-semibold text-forge-ink">Visual explanation{spec.title ? `: ${spec.title}` : ''}</p>
        <button onClick={onClose} className="text-xs text-forge-muted hover:text-forge-ember">Close</button>
      </div>
      {spec.note && <p className="text-sm text-forge-ink mb-3">{spec.note}</p>}
      {spec.type === 'plot' ? <PlotView spec={spec} /> : svg ? <div className="text-forge-ink [&>svg]:w-full [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="text-sm text-forge-muted">Could not draw this diagram. Try again.</p>}
      {spec.type === 'svg' && <p className="text-xs text-forge-muted mt-2">AI-generated diagram — check labels against the problem.</p>}
    </div>
  );
};

export const VerifyBadge: React.FC<{ r: VerifyResult }> = ({ r }) => {
  const m = { verified: ['✅ Independently verified', 'border-green-500 bg-green-500/10'], mismatch: ['⚠️ Needs review — the check disagrees', 'border-forge-danger bg-forge-danger/10'], unverifiable: ['ℹ️ Not auto-checkable', 'border-forge-border'] }[r.status];
  return (
    <div className={`w-full mt-6 p-4 rounded-2xl border print:hidden ${m[1]}`}>
      <p className="font-display font-semibold text-forge-ink text-sm">{m[0]}</p>
      <p className="text-sm text-forge-muted mt-1">{r.text}</p>
      <p className="text-xs text-forge-muted mt-1">Checked by a separate numerical calculator in your browser, not by the AI.</p>
    </div>
  );
};
