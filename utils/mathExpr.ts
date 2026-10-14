// Tiny safe math evaluator (no eval) + independent numerical checks of the final answer.
export type Vars = Record<string, number>;
export type Fn = (v: Vars) => number;
const FN: Record<string, (x: number) => number> = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, exp: Math.exp, ln: Math.log, log: Math.log10, sqrt: Math.sqrt, abs: Math.abs };
const CONST: Vars = { pi: Math.PI, e: Math.E };

export const compile = (src: string): Fn => {
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
    return (v) => (s in v ? v[s] : NaN);
  };
  const f = expr();
  if (i < t.length) throw new Error('parse');
  return f;
};

export interface VerifyResult { status: 'verified' | 'mismatch' | 'unverifiable'; text: string; }
const fmt = (n: number) => String(+n.toPrecision(6));
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(a), Math.abs(b));

export const verifyClaim = (c: any): VerifyResult => {
  const no = (text: string): VerifyResult => ({ status: 'unverifiable', text });
  try {
    if (!c || c.kind === 'none') return no(c?.reason || 'This answer type cannot be checked automatically.');
    const f = compile(String(c.expr)), ev = (x: number) => f({ x });
    let val: number;
    if (c.kind === 'definite_integral') {
      const a = +c.a, b = +c.b, n = 2000, h = (b - a) / n; let s = ev(a) + ev(b);
      for (let k = 1; k < n; k++) s += ev(a + k * h) * (k % 2 ? 4 : 2);
      val = (s * h) / 3;
    } else if (c.kind === 'derivative') { const h = 1e-5, x = +c.at; val = (ev(x + h) - ev(x - h)) / (2 * h); }
    else if (c.kind === 'evaluate') val = f({});
    else if (c.kind === 'roots') {
      const rs: number[] = (c.answers || []).map(Number);
      if (!rs.length || rs.some((r) => !isFinite(ev(r)))) return no('Could not substitute the claimed roots.');
      const ok = rs.every((r) => Math.abs(ev(r)) < 1e-5 * Math.max(1, Math.abs(r) ** 3));
      return { status: ok ? 'verified' : 'mismatch', text: ok ? `Substituting each claimed solution (${rs.map(fmt).join(', ')}) gives 0, so they satisfy the equation.` : `At least one claimed solution (${rs.map(fmt).join(', ')}) does not satisfy the equation when substituted.` };
    } else return no('This answer type cannot be checked automatically.');
    if (!isFinite(val)) return no('The expression could not be evaluated numerically.');
    const ok = close(val, +c.answer);
    return { status: ok ? 'verified' : 'mismatch', text: `Independent numerical calculation gives ${fmt(val)}; the solution states ${fmt(+c.answer)}.` };
  } catch { return no('The expression could not be parsed for checking.'); }
};
