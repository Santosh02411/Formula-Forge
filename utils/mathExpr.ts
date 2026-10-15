// Tiny safe math evaluator (no eval) + independent numerical checks of the final answer.
export type Vars = Record<string, number>;
export type Fn = (v: Vars) => number;
const FN: Record<string, (x: number) => number> = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, exp: Math.exp, ln: Math.log, log: Math.log10, sqrt: Math.sqrt, abs: Math.abs };
const CONST: Vars = { pi: Math.PI, e: Math.E };

export const compile = (src: string, allowed?: string[]): Fn => {
  const t = src.replace(/\*\*/g, '^').replace(/×/g, '*').replace(/[−–]/g, '-').match(/\d+\.?\d*|\.\d+|[A-Za-z_]\w*|[-+*/^(),]/g) || [];
  let i = 0;
  const isStart = (s?: string) => !!s && (/^[\d.A-Za-z_]/.test(s) || s === '(');
  const expr = (): Fn => {
    let l = term();
    while (t[i] === '+' || t[i] === '-') { const op = t[i++], a = l, r = term(); l = op === '+' ? (v) => a(v) + r(v) : (v) => a(v) - r(v); }
    return l;
  };
  const term = (): Fn => {
    let l = unary();
    while (t[i] === '*' || t[i] === '/' || isStart(t[i])) {
      const op = (t[i] === '*' || t[i] === '/') ? t[i++] : '*', a = l, r = unary();
      l = op === '*' ? (v) => a(v) * r(v) : (v) => a(v) / r(v);
    }
    return l;
  };
  const unary = (): Fn => {
    if (t[i] === '-') { i++; const u = unary(); return (v) => -u(v); }
    if (t[i] === '+') { i++; return unary(); }
    const b = atom();
    if (t[i] === '^') { i++; const e = unary(); return (v) => Math.pow(b(v), e(v)); }
    return b;
  };
  const atom = (): Fn => {
    const s = t[i++];
    if (s === undefined) throw new Error('parse');
    if (s === '(') { const e = expr(); if (t[i++] !== ')') throw new Error('parse'); return e; }
    if (/^[\d.]/.test(s)) { const n = parseFloat(s); return () => n; }
    if (t[i] === '(' && FN[s]) { i++; const a = expr(); if (t[i++] !== ')') throw new Error('parse'); const f = FN[s]; return (v) => f(a(v)); }
    if (s in CONST) return () => CONST[s];
    if (allowed && !allowed.includes(s)) throw new Error('unknown symbol ' + s);
    return (v) => (s in v ? v[s] : NaN);
  };
  const f = expr();
  if (i < t.length) throw new Error('parse');
  return f;
};

export interface VerifyResult { status: 'verified' | 'partial' | 'mismatch' | 'unverifiable'; text: string; }
const fmt = (n: number) => String(+n.toPrecision(6));
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(a), Math.abs(b));

// Fit polynomial coefficients (descending) by finite differences + Vandermonde solve; null if not a polynomial of degree <= 6.
const polyCoeffs = (f: (x: number) => number): number[] | null => {
  const vals = Array.from({ length: 10 }, (_, i) => f(i));
  if (vals.some((v) => !isFinite(v))) return null;
  const scale = Math.max(1, ...vals.map(Math.abs));
  let d = -2, diffs = vals;
  for (let k = 0; k <= 7; k++) {
    if (diffs.every((v) => Math.abs(v) < 1e-7 * scale)) { d = k - 1; break; }
    const prev = diffs; diffs = prev.slice(1).map((v, i) => v - prev[i]);
  }
  if (d < 0) return null;
  const A = Array.from({ length: d + 1 }, (_, i) => [...Array.from({ length: d + 1 }, (_, j) => i ** j), vals[i]]);
  for (let i = 0; i <= d; i++) {
    let m = i; for (let r = i + 1; r <= d; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
    [A[i], A[m]] = [A[m], A[i]];
    for (let r = 0; r <= d; r++) if (r !== i) { const k = A[r][i] / A[i][i]; for (let c = i; c <= d + 1; c++) A[r][c] -= k * A[i][c]; }
  }
  return A.map((row, i) => row[d + 1] / row[i]).reverse();
};

const checkRoots = (expr: string, roots: number[]): VerifyResult => {
  const f = compile(expr, ['x']), ev = (x: number) => f({ x });
  if (!roots.length || roots.some((r) => !isFinite(ev(r)))) return { status: 'unverifiable', text: 'Could not substitute the claimed solutions.' };
  const list = [...new Set(roots)].map(fmt).join(', ');
  if (roots.some((r) => Math.abs(ev(r)) > 1e-5 * Math.max(1, Math.abs(r) ** 3))) return { status: 'mismatch', text: `At least one claimed solution (${list}) does not satisfy the equation when substituted.` };
  let q = polyCoeffs(ev);
  if (!q) return { status: 'partial', text: `Each claimed solution (${list}) satisfies the equation (checked by substitution). Completeness — that no other solutions exist — could not be checked for this kind of equation.` };
  const deg = q.length - 1;
  for (const r of new Set(roots)) {
    for (;;) {
      if (q.length < 2) break;
      const b = [q[0]]; for (let i = 1; i < q.length; i++) b.push(q[i] + r * b[i - 1]);
      if (Math.abs(b[b.length - 1]) > 1e-6 * Math.max(1, ...q.map(Math.abs))) break;
      q = b.slice(0, -1);
    }
  }
  const m = q.length - 1, base = `Degree-${deg} polynomial: every claimed solution (${list}) satisfies the equation (substitution), and dividing them out `;
  if (m === 0) return { status: 'verified', text: base + 'leaves no other roots, so the solution set is complete.' };
  if (m === 1) return { status: 'mismatch', text: base + `leaves another real root at x ≈ ${fmt(-q[1] / q[0])} that the solution missed.` };
  if (m === 2) {
    const disc = q[1] ** 2 - 4 * q[0] * q[2];
    if (disc < -1e-9) return { status: 'verified', text: base + 'leaves only complex roots, so the real solution set is complete.' };
    const rt = Math.sqrt(Math.max(disc, 0)); return { status: 'mismatch', text: base + `leaves more real roots (x ≈ ${fmt((-q[1] + rt) / (2 * q[0]))}, ${fmt((-q[1] - rt) / (2 * q[0]))}) that the solution missed.` };
  }
  const R = 1 + Math.max(...q.slice(1).map((c) => Math.abs(c / q[0]))), ph = (x: number) => q.reduce((a, c) => a * x + c, 0);
  for (let i = 0; i < 4000; i++) { const x0 = -R + (2 * R * i) / 4000, x1 = -R + (2 * R * (i + 1)) / 4000; if (ph(x0) * ph(x1) <= 0) return { status: 'mismatch', text: base + `leaves another real root near x ≈ ${fmt(x0)} that the solution missed.` }; }
  return { status: 'partial', text: base + 'shows no further real roots by numerical scan, but completeness is not proven for this degree.' };
};

export const verifyClaim = (c: any): VerifyResult => {
  const no = (text: string): VerifyResult => ({ status: 'unverifiable', text });
  try {
    if (!c || c.kind === 'none') return no(c?.reason || 'This answer type cannot be checked automatically.');
    const f = compile(String(c.expr), ['x']), ev = (x: number) => f({ x });
    let val: number;
    if (c.kind === 'definite_integral') {
      const a = +c.a, b = +c.b, n = 2000, h = (b - a) / n; let s = ev(a) + ev(b);
      for (let k = 1; k < n; k++) s += ev(a + k * h) * (k % 2 ? 4 : 2);
      val = (s * h) / 3;
    } else if (c.kind === 'derivative') { const h = 1e-5, x = +c.at; val = (ev(x + h) - ev(x - h)) / (2 * h); }
    else if (c.kind === 'evaluate') val = f({});
    else if (c.kind === 'roots') return checkRoots(String(c.expr), (c.answers || []).map(Number));
    else return no('This answer type cannot be checked automatically.');
    if (!isFinite(val)) return no('The expression could not be evaluated numerically.');
    const ok = close(val, +c.answer);
    return { status: ok ? 'verified' : 'mismatch', text: `Independent numerical calculation gives ${fmt(val)}; the solution states ${fmt(+c.answer)}.` };
  } catch { return no('The expression could not be parsed for checking.'); }
};
