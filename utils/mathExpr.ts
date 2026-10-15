// Safe math evaluator (no eval) and independent checks of a tutor's final answer.
// Policy: reject anything not understood; use exact rational arithmetic for polynomials;
// only report "verified" when what was claimed was actually established, otherwise "partial".
export type Vars = Record<string, number>;
export type Fn = (v: Vars) => number;
const FN: Record<string, (x: number) => number> = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, exp: Math.exp, ln: Math.log, log: Math.log10, sqrt: Math.sqrt, abs: Math.abs };
const CONST: Vars = { pi: Math.PI, e: Math.E };
const MAX_LEN = 500, MAX_TOKENS = 300, MAX_DEPTH = 40, HUGE = 1e15;

const tokenize = (src: string): string[] => {
  if (src.length > MAX_LEN) throw new Error('expression too long');
  const s = src.replace(/×/g, '*').replace(/[−–]/g, '-');
  const re = /\s*(?:(\d+\.?\d*(?:[eE][-+]?\d+)?|\.\d+(?:[eE][-+]?\d+)?)|([A-Za-z_]\w*)|(\*\*|[-+*/^(),]))/y;
  const out: string[] = [];
  let pos = 0;
  while (pos < s.length) {
    re.lastIndex = pos;
    const m = re.exec(s);
    if (!m) { if (/^\s*$/.test(s.slice(pos))) break; throw new Error(`unexpected character "${s.slice(pos).trim()[0]}"`); }
    const t = m[0].trim();
    out.push(t === '**' ? '^' : t);
    pos = re.lastIndex;
    if (out.length > MAX_TOKENS) throw new Error('expression too long');
  }
  return out;
};

export const compile = (src: string, allowed: string[]): Fn => {
  const t = tokenize(src);
  let i = 0, depth = 0;
  const enter = () => { if (++depth > MAX_DEPTH) throw new Error('expression too deeply nested'); };
  const isStart = (s?: string) => !!s && (/^[A-Za-z_]/.test(s) || s === '('); // implicit multiplication only before a name or "("
  const expr = (): Fn => {
    enter();
    let l = term();
    while (t[i] === '+' || t[i] === '-') { const op = t[i++], a = l, r = term(); l = op === '+' ? (v) => a(v) + r(v) : (v) => a(v) - r(v); }
    depth--; return l;
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
    if (t[i] === '-') { i++; enter(); const u = unary(); depth--; return (v) => -u(v); }
    if (t[i] === '+') { i++; return unary(); }
    const b = atom();
    if (t[i] === '^') { i++; enter(); const e = unary(); depth--; return (v) => Math.pow(b(v), e(v)); }
    return b;
  };
  const atom = (): Fn => {
    const s = t[i++];
    if (s === undefined) throw new Error('unexpected end of expression');
    if (s === '(') { const e = expr(); if (t[i++] !== ')') throw new Error('missing ")"'); return e; }
    if (/^[\d.]/.test(s)) { const n = Number(s); if (!isFinite(n)) throw new Error('bad number'); return () => n; }
    if (s in FN) {
      if (t[i++] !== '(') throw new Error(`"${s}" needs parentheses`);
      const a = expr(); if (t[i++] !== ')') throw new Error('missing ")"');
      const f = FN[s]; return (v) => f(a(v));
    }
    if (s in CONST) return () => CONST[s];
    if (!/^[A-Za-z_]/.test(s) || !allowed.includes(s)) throw new Error(`unknown symbol "${s}"`);
    return (v) => (s in v ? v[s] : NaN);
  };
  const f = expr();
  if (i < t.length) throw new Error(`unexpected "${t[i]}"`);
  return f;
};

// ---------- exact rational arithmetic (BigInt) ----------
type Q = { n: bigint; d: bigint };
const B = BigInt, ZERO = B(0), ONE = B(1);
const gcd = (a: bigint, b: bigint): bigint => { a = a < ZERO ? -a : a; b = b < ZERO ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const q = (n: bigint, d: bigint = ONE): Q => { if (d < ZERO) { n = -n; d = -d; } const g = gcd(n, d) || ONE; return { n: n / g, d: d / g }; };
const qadd = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d);
const qmul = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d);
const qpow = (a: Q, k: number) => { let r = q(ONE); for (let i = 0; i < k; i++) r = qmul(r, a); return r; };
const qnum = (a: Q) => Number(a.n) / Number(a.d);
const qstr = (a: Q) => (a.d === ONE ? String(a.n) : `${a.n}/${a.d}`);
const toQ = (x: number): Q | null => {
  if (!isFinite(x) || Math.abs(x) > 1e9) return null;
  let h1 = ONE, h0 = ZERO, k1 = ZERO, k0 = ONE, y = x;
  for (let i = 0; i < 20; i++) {
    const a = Math.floor(y), A = B(a), h2 = A * h1 + h0, k2 = A * k1 + k0;
    h0 = h1; h1 = h2; k0 = k1; k1 = k2;
    if (k1 > B(10000)) return null;
    if (Math.abs(Number(h1) / Number(k1) - x) <= 1e-9 * Math.max(1, Math.abs(x))) return q(h1, k1);
    const fr = y - a; if (fr < 1e-12) break; y = 1 / fr;
  }
  return null;
};
const horner = (c: Q[], x: Q) => c.reduce((r, k) => qadd(qmul(r, x), k), q(ZERO));
const exactIntegral = (c: Q[], a: Q, b: Q) => c.reduce((s, k, i) => { const p = c.length - 1 - i; return qadd(s, qmul(k, qmul(qadd(qpow(b, p + 1), qmul(qpow(a, p + 1), q(B(-1)))), q(ONE, B(p + 1))))); }, q(ZERO));
const exactDerivativeAt = (c: Q[], x: Q) => c.reduce((s, k, i) => { const p = c.length - 1 - i; return p === 0 ? s : qadd(s, qmul(qmul(k, q(B(p))), qpow(x, p - 1))); }, q(ZERO));

// Fit a polynomial (descending coefficients, degree <= 6); null if the function is not a polynomial.
const polyCoeffs = (f: (x: number) => number): number[] | null => {
  const vals = Array.from({ length: 10 }, (_, i) => f(i));
  if (vals.some((v) => !isFinite(v) || Math.abs(v) > HUGE)) return null;
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
  const c = A.map((row, i) => row[d + 1] / row[i]).reverse();
  // Guard against functions that merely agree with a polynomial at the integers (e.g. sin(pi*x) + x^2): test off-grid points.
  for (const t of [0.5, -1.7, 3.3, 7.9]) {
    const y = f(t), p = c.reduce((a, k) => a * t + k, 0);
    if (!isFinite(y) || Math.abs(y - p) > 1e-8 * Math.max(1, Math.abs(y))) return null;
  }
  return c;
};
const coeffsQ = (c: number[] | null): Q[] | null => { if (!c) return null; const r = c.map(toQ); return r.every(Boolean) ? (r as Q[]) : null; };

export interface VerifyResult { status: 'verified' | 'partial' | 'mismatch' | 'unverifiable'; text: string; }
const fmt = (n: number) => String(+n.toPrecision(6));
const no = (text: string): VerifyResult => ({ status: 'unverifiable', text });

const compareNum = (val: number, claimed: number, how: string): VerifyResult => {
  const rel = Math.abs(val - claimed) / Math.max(1, Math.abs(val));
  if (rel <= 1e-6) return { status: 'verified', text: `${how} gives ${fmt(val)}, matching the stated ${fmt(claimed)} to about 6 digits.` };
  if (rel <= 5e-4) return { status: 'verified', text: `${how} gives ${fmt(val)}; the stated ${fmt(claimed)} matches after rounding.` };
  return { status: 'mismatch', text: `${how} gives ${fmt(val)} but the solution states ${fmt(claimed)}.` };
};
const compareExact = (v: Q, claimed: number, what: string): VerifyResult => {
  const ex = qnum(v), rel = Math.abs(ex - claimed) / Math.max(1, Math.abs(ex));
  if (rel <= 1e-9) return { status: 'verified', text: `Exact rational arithmetic gives ${what} = ${qstr(v)}, equal to the stated answer.` };
  if (rel <= 5e-4) return { status: 'verified', text: `Exact rational arithmetic gives ${what} = ${qstr(v)} (≈ ${fmt(ex)}); the stated ${fmt(claimed)} is a rounded form of it.` };
  return { status: 'mismatch', text: `Exact rational arithmetic gives ${what} = ${qstr(v)} (≈ ${fmt(ex)}) but the solution states ${fmt(claimed)}.` };
};

const simpson = (ev: (x: number) => number, a: number, b: number, n: number): number | null => {
  const h = (b - a) / n; let s = 0;
  for (let k = 0; k <= n; k++) { const y = ev(a + k * h); if (!isFinite(y) || Math.abs(y) > HUGE) return null; s += y * (k === 0 || k === n ? 1 : k % 2 ? 4 : 2); }
  return (s * h) / 3;
};

const checkRoots = (expr: string, roots: number[]): VerifyResult => {
  const f = compile(expr, ['x']), ev = (x: number) => f({ x });
  if (!roots.length || roots.some((r) => !isFinite(ev(r)) || Math.abs(ev(r)) > HUGE)) return no('Could not substitute the claimed solutions (undefined or too large).');
  const uniq = [...new Set(roots)], list = uniq.map(fmt).join(', ');
  const coeffs = polyCoeffs(ev), cq = coeffsQ(coeffs), rq = uniq.map(toQ);
  const exact = !!cq && rq.every(Boolean);
  if (exact ? rq.some((r) => horner(cq!, r!).n !== ZERO) : uniq.some((r) => Math.abs(ev(r)) > 1e-6 * Math.max(1, Math.abs(r) ** 3)))
    return { status: 'mismatch', text: `At least one claimed solution (${list}) does not satisfy the equation when substituted${exact ? ' (exact arithmetic)' : ''}.` };
  if (!coeffs) return { status: 'partial', text: `Each claimed solution (${list}) satisfies the equation (checked by substitution). Completeness — that no other solutions exist — can't be checked for this kind of equation.` };
  const deg = coeffs.length - 1;
  let qd: number[], disc: number | null = null;
  if (exact) {
    let Q = cq!;
    for (const r of rq as Q[]) for (;;) {
      if (Q.length < 2) break;
      const b: Q[] = [Q[0]]; for (let i = 1; i < Q.length; i++) b.push(qadd(Q[i], qmul(r, b[i - 1])));
      if (b[b.length - 1].n !== ZERO) break;
      Q = b.slice(0, -1);
    }
    qd = Q.map(qnum);
    if (Q.length === 3) { const dq = qadd(qmul(Q[1], Q[1]), qmul(q(B(-4)), qmul(Q[0], Q[2]))); disc = dq.n < ZERO ? -1 : 0.5; }
  } else {
    let Qf = coeffs;
    for (const r of uniq) for (;;) {
      if (Qf.length < 2) break;
      const b = [Qf[0]]; for (let i = 1; i < Qf.length; i++) b.push(Qf[i] + r * b[i - 1]);
      if (Math.abs(b[b.length - 1]) > 1e-6 * Math.max(1, ...Qf.map(Math.abs))) break;
      Qf = b.slice(0, -1);
    }
    qd = Qf;
    if (qd.length === 3) disc = qd[1] ** 2 - 4 * qd[0] * qd[2];
  }
  const m = qd.length - 1;
  const base = exact ? `Degree-${deg} polynomial, exact rational arithmetic: every claimed solution (${list}) is exactly a root, and dividing them out ` : `Degree-${deg} polynomial, floating-point (tolerance-based): each claimed solution (${list}) satisfies the equation, and dividing them out `;
  const done = (text: string): VerifyResult => (exact ? { status: 'verified', text: base + text } : { status: 'partial', text: base + text + ' (precision is limited because the coefficients or roots are not exact fractions).' });
  if (m === 0) return done('leaves no other roots, so the solution set is complete');
  if (m === 1) return { status: 'mismatch', text: base + `leaves another real root at x ≈ ${fmt(-qd[1] / qd[0])} that the solution missed.` };
  if (m === 2 && disc !== null) {
    if (disc < -1e-9) return done('leaves only complex roots, so the real solution set is complete');
    const rt = Math.sqrt(Math.max(qd[1] ** 2 - 4 * qd[0] * qd[2], 0));
    return { status: 'mismatch', text: base + `leaves more real roots (x ≈ ${fmt((-qd[1] + rt) / (2 * qd[0]))}, ${fmt((-qd[1] - rt) / (2 * qd[0]))}) that the solution missed.` };
  }
  const R = 1 + Math.max(...qd.slice(1).map((c) => Math.abs(c / qd[0]))), ph = (x: number) => qd.reduce((a, c) => a * x + c, 0);
  for (let i = 0; i < 4000; i++) { const x0 = -R + (2 * R * i) / 4000, x1 = -R + (2 * R * (i + 1)) / 4000; if (ph(x0) * ph(x1) <= 0) return { status: 'mismatch', text: base + `leaves another real root near x ≈ ${fmt(x0)} that the solution missed.` }; }
  return { status: 'partial', text: base + 'shows no further real roots in a numerical scan, but completeness is not proven for this degree.' };
};

export const verifyClaim = (c: any): VerifyResult => {
  try {
    if (!c || c.kind === 'none') return no(c?.reason || 'This answer type cannot be checked automatically.');
    if (c.kind === 'roots') return checkRoots(String(c.expr), (c.answers || []).map(Number));
    const f = compile(String(c.expr), ['x']), ev = (x: number) => f({ x }), claimed = Number(c.answer);
    if (!isFinite(claimed)) return no('The stated answer is not a finite number.');
    if (c.kind === 'evaluate') {
      const v = f({});
      return isFinite(v) && Math.abs(v) < HUGE ? compareNum(v, claimed, 'Direct calculation') : no('The expression could not be evaluated to a finite number.');
    }
    const cq = coeffsQ(polyCoeffs(ev));
    if (c.kind === 'definite_integral') {
      const a = Number(c.a), b = Number(c.b);
      if (!isFinite(a) || !isFinite(b)) return no('The integration limits are not finite numbers.');
      const A = toQ(a), Bq = toQ(b);
      if (cq && A && Bq) return compareExact(exactIntegral(cq, A, Bq), claimed, 'the integral');
      const s1 = simpson(ev, a, b, 2000), s2 = simpson(ev, a, b, 4000);
      if (s1 === null || s2 === null) return no('The function is undefined or blows up somewhere on the interval (for example a division by zero), so a numerical check is not reliable.');
      const err = Math.abs(s1 - s2);
      if (err > 1e-7 * Math.max(1, Math.abs(s2))) return { status: 'partial', text: `Numerical integration did not converge reliably (two resolutions differ by ${err.toExponential(1)}), possibly because of a sharp feature or discontinuity. Treat the answer as unchecked.` };
      return compareNum(s2, claimed, 'Converged numerical integration (Simpson, two resolutions agree)');
    }
    if (c.kind === 'derivative') {
      const x0 = Number(c.at);
      if (!isFinite(x0)) return no('The evaluation point is not a finite number.');
      const X = toQ(x0);
      if (cq && X) return compareExact(exactDerivativeAt(cq, X), claimed, `the derivative at x = ${fmt(x0)}`);
      const h = 1e-6 * Math.max(1, Math.abs(x0)), y0 = ev(x0), yp = ev(x0 + h), ym = ev(x0 - h);
      if (![y0, yp, ym].every((y) => isFinite(y) && Math.abs(y) < HUGE)) return no('The function is undefined near that point, so a numerical derivative is not reliable.');
      const right = (yp - y0) / h, left = (y0 - ym) / h;
      if (Math.abs(right - left) > 1e-3 * Math.max(1, Math.abs(right))) return { status: 'partial', text: 'The slopes from the left and right differ, so the function may not be differentiable at this point. Treat the answer as unchecked.' };
      const h2 = 1e-4 * Math.max(1, Math.abs(x0)), d1 = (ev(x0 + h2) - ev(x0 - h2)) / (2 * h2), d2 = (ev(x0 + h2 / 2) - ev(x0 - h2 / 2)) / h2;
      if (!isFinite(d1) || !isFinite(d2) || Math.abs(d1 - d2) > 1e-6 * Math.max(1, Math.abs(d1))) return { status: 'partial', text: 'The numerical derivative did not converge reliably, so the answer is unchecked.' };
      return compareNum(d2, claimed, 'Converged numerical derivative (two step sizes agree, both sides match)');
    }
    return no('This answer type cannot be checked automatically.');
  } catch (e) { return no(`The expression was rejected rather than guessed at (${e instanceof Error ? e.message : 'invalid'}), so nothing was checked.`); }
};
