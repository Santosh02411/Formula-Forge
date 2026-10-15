import React, { useEffect, useRef, useState } from 'react';
import { compile } from '../utils/mathExpr';
import { sanitizeSvg } from '../utils/sanitize';
import type { VerifyResult } from '../utils/mathExpr';

const PlotView: React.FC<{ spec: any }> = ({ spec }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries((spec.params || []).map((p: any) => [p.name, +p.value])));
  const [err, setErr] = useState(false);
  useEffect(() => {
    const c = ref.current, g = c?.getContext('2d');
    if (!c || !g) return;
    try {
      const W = 640, H = 360, f = compile(String(spec.expr), ['x', ...(spec.params || []).map((p: any) => p.name)]), x0 = +spec.xmin, x1 = +spec.xmax, N = 500;
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
          <span className="w-24 shrink-0 font-mono">{p.name} = {+vals[p.name]?.toFixed(2)}</span>
          <input type="range" min={p.min} max={p.max} step={(p.max - p.min) / 100} value={vals[p.name]} onChange={(e) => setVals((v) => ({ ...v, [p.name]: +e.target.value }))} className="flex-1 min-w-0 accent-forge-ember" />
        </label>
      ))}
    </div>
  );
};

export const VisualCard: React.FC<{ spec: any; onClose: () => void }> = ({ spec, onClose }) => {
  const svg = spec.type === 'svg' ? sanitizeSvg(String(spec.svg || '')) : null;
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
  const m = { verified: ['✅ Verified', 'border-green-500 bg-green-500/10'], partial: ['🟡 Partially verified', 'border-yellow-500 bg-yellow-500/10'], mismatch: ['⚠️ Needs review — the check disagrees', 'border-forge-danger bg-forge-danger/10'], unverifiable: ['ℹ️ Not auto-checkable', 'border-forge-border'] }[r.status];
  return (
    <div className={`w-full mt-6 p-4 rounded-2xl border print:hidden ${m[1]}`}>
      <p className="font-display font-semibold text-forge-ink text-sm">{m[0]}</p>
      <p className="text-sm text-forge-muted mt-1">{r.text}</p>
      <p className="text-xs text-forge-muted mt-1">Checked by a separate calculator in your browser, not by the AI. “Verified” is used only when everything claimed was actually checked.</p>
    </div>
  );
};

export const MarkupView: React.FC<{ src: string; steps: any[]; onClose: () => void }> = ({ src, steps, onClose }) => {
  const col: Record<string, string> = { ok: '#22c55e', error: '#ef4444', unclear: '#eab308' };
  const ok = (b: any) => Array.isArray(b) && b.length === 4 && b.every((n) => typeof n === 'number' && n >= 0 && n <= 1000) && b[2] > b[0] && b[3] > b[1];
  return (
    <div className="w-full mt-6 p-6 bg-forge-surface border border-forge-border rounded-2xl print:hidden">
      <div className="flex justify-between items-center mb-3">
        <p className="font-display font-semibold text-forge-ink">Your work, marked</p>
        <button onClick={onClose} className="text-xs text-forge-muted hover:text-forge-ember">Close</button>
      </div>
      <div className="relative inline-block max-w-full">
        <img src={src} alt="Your work" className="max-w-full rounded-lg border border-forge-border" />
        {steps.map((s, i) => ok(s.box) && (
          <div key={i} title={s.note} style={{ position: 'absolute', top: `${s.box[0] / 10}%`, left: `${s.box[1] / 10}%`, height: `${(s.box[2] - s.box[0]) / 10}%`, width: `${(s.box[3] - s.box[1]) / 10}%`, border: `3px solid ${col[s.status] || col.unclear}`, borderRadius: 6, background: `${col[s.status] || col.unclear}22` }}>
            <span style={{ position: 'absolute', top: -10, left: -10, background: col[s.status] || col.unclear, color: '#fff', fontSize: 11, borderRadius: 9, padding: '0 5px' }}>{i + 1}</span>
          </div>
        ))}
      </div>
      <ol className="mt-3 space-y-2 text-sm text-forge-ink">
        {steps.map((s, i) => (
          <li key={i}><b>{i + 1}. {s.status === 'ok' ? '✓' : s.status === 'error' ? '✗' : '?'}</b> <span className="font-mono">{s.text}</span>
            {s.note && <span className="text-forge-muted"> — {s.note}</span>}
            {!ok(s.box) && <span className="text-xs text-forge-muted"> (exact location uncertain, so not boxed)</span>}</li>
        ))}
      </ol>
      <p className="text-xs text-forge-muted mt-2">Box positions are AI estimates and may be slightly off.</p>
    </div>
  );
};
