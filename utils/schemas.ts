import { compile } from './mathExpr';
import type { QuizQuestion } from '../types';

// Strict validation of every JSON object produced by the model. Anything unexpected is rejected, never "fixed up".
const bad = (m: string): never => { throw new Error('Invalid model output: ' + m); };
const str = (v: unknown, max: number, name: string, req = true): string => { if (typeof v !== 'string') { if (req) bad(name); return ''; } return v.slice(0, max); };
const num = (v: unknown, name: string): number => { const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN; if (!Number.isFinite(n)) bad(name); return n; };
export const parseModelJson = (raw: string): any => { if (typeof raw !== 'string' || raw.length > 200000) bad('size'); return JSON.parse(raw.replace(/```json|```/g, '').trim()); };

export const parsePlot = (o: any) => {
  if (!o || typeof o !== 'object') bad('plot');
  const expr = str(o.expr, 300, 'expr'), xmin = num(o.xmin, 'xmin'), xmax = num(o.xmax, 'xmax');
  if (!(xmax > xmin) || xmax - xmin > 1e6) bad('range');
  const params = (Array.isArray(o.params) ? o.params : []).slice(0, 3).map((p: any) => {
    const name = str(p?.name, 16, 'param');
    if (!/^[A-Za-z_]\w*$/.test(name) || name === 'x') bad('param name');
    const min = num(p.min, 'min'), max = num(p.max, 'max');
    if (!(max > min)) bad('param range');
    return { name, min, max, value: Math.min(max, Math.max(min, num(p.value ?? min, 'value'))) };
  });
  compile(expr, ['x', ...params.map((p: { name: string }) => p.name)]); // throws on anything unsupported
  const shade = Array.isArray(o.shade) && o.shade.length === 2 ? [num(o.shade[0], 'shade'), num(o.shade[1], 'shade')] : null;
  return { type: 'plot' as const, title: str(o.title, 120, 'title', false), expr, xmin, xmax, shade, params };
};
export const parseVisual = (o: any) => {
  if (o?.type === 'plot') return parsePlot(o);
  if (o?.type === 'svg') return { type: 'svg' as const, title: str(o.title, 120, 'title', false), svg: str(o.svg, 60000, 'svg') };
  return bad('visual type');
};
export const parseQuiz = (a: any): QuizQuestion[] => {
  if (!Array.isArray(a) || !a.length) bad('quiz');
  return a.slice(0, 5).map((q: any) => {
    const options: string[] = Array.isArray(q?.options) ? q.options.slice(0, 6).map((o: unknown) => str(o, 200, 'option')) : bad('options');
    const answer = num(q.answer, 'answer');
    if (options.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) bad('answer');
    return { q: str(q.q, 400, 'question'), options, answer, why: str(q.why, 400, 'why', false), topic: str(q.topic, 60, 'topic', false) || 'General' };
  });
};
const KINDS = ['definite_integral', 'derivative', 'roots', 'evaluate', 'none'];
export const parseClaim = (o: any) => {
  if (!o || !KINDS.includes(o.kind)) bad('claim kind');
  if (o.kind === 'none') return { kind: 'none', reason: str(o.reason, 200, 'reason', false) };
  const c: any = { kind: o.kind, expr: str(o.expr, 300, 'expr') };
  if (o.kind === 'definite_integral') { c.a = num(o.a, 'a'); c.b = num(o.b, 'b'); c.answer = num(o.answer, 'answer'); }
  else if (o.kind === 'derivative') { c.at = num(o.at, 'at'); c.answer = num(o.answer, 'answer'); }
  else if (o.kind === 'evaluate') c.answer = num(o.answer, 'answer');
  else c.answers = (Array.isArray(o.answers) ? o.answers : bad('answers')).slice(0, 12).map((v: unknown) => num(v, 'root'));
  return c;
};
const numMap = (o: any, name: string): Record<string, number> => {
  const r: Record<string, number> = {};
  Object.entries(o && typeof o === 'object' ? o : {}).slice(0, 8).forEach(([k, v]) => { if (!/^[A-Za-z]\w{0,3}$/.test(k)) bad(name + ' key'); r[k] = num(v, name); });
  return r;
};
export const parseWhatIf = (o: any) => {
  if (!o || typeof o !== 'object') bad('what-if');
  let plot; try { plot = o.plot?.type === 'plot' ? parsePlot(o.plot) : undefined; } catch { plot = undefined; }
  return { formula: str(o.formula, 40, 'formula', false), given: numMap(o.given, 'given'), change: numMap(o.change, 'change'), vary: str(o.vary, 8, 'vary', false), prediction: str(o.prediction, 600, 'prediction', false), plot };
};
export const parseMarkup = (o: any) => {
  const a = Array.isArray(o?.steps) ? o.steps.slice(0, 40) : bad('steps');
  if (!a.length) bad('steps');
  return a.map((s: any) => ({
    text: str(s?.text, 300, 'text', false), note: str(s?.note, 400, 'note', false),
    status: ['ok', 'error', 'unclear'].includes(s?.status) ? (s.status as string) : 'unclear',
    box: Array.isArray(s?.box) && s.box.length === 4 && s.box.every((n: unknown) => typeof n === 'number' && n >= 0 && n <= 1000) && s.box[2] > s.box[0] && s.box[3] > s.box[1] ? (s.box as number[]) : null,
  }));
};
