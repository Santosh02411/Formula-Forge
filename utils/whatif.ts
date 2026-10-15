import { compile } from './mathExpr';

interface Formula { name: string; outcome: string; unit: string; expr: string; vars: string[]; }
// Known formulas: when the AI picks one of these, the prediction and graph are computed here, not by the AI.
export const FORMULAS: Record<string, Formula> = {
  projectile_range: { name: 'Projectile range', outcome: 'range', unit: 'm', expr: 'v^2*sin(2*a*pi/180)/g', vars: ['v', 'a', 'g'] },
  projectile_max_height: { name: 'Projectile maximum height', outcome: 'max height', unit: 'm', expr: 'v^2*sin(a*pi/180)^2/(2*g)', vars: ['v', 'a', 'g'] },
  free_fall_time: { name: 'Free-fall time', outcome: 'time', unit: 's', expr: 'sqrt(2*h/g)', vars: ['h', 'g'] },
  free_fall_speed: { name: 'Free-fall impact speed', outcome: 'speed', unit: 'm/s', expr: 'sqrt(2*g*h)', vars: ['h', 'g'] },
  pendulum_period: { name: 'Pendulum period', outcome: 'period', unit: 's', expr: '2*pi*sqrt(L/g)', vars: ['L', 'g'] },
  spring_period: { name: 'Spring-mass period', outcome: 'period', unit: 's', expr: '2*pi*sqrt(m/k)', vars: ['m', 'k'] },
  kinetic_energy: { name: 'Kinetic energy', outcome: 'energy', unit: 'J', expr: '0.5*m*v^2', vars: ['m', 'v'] },
  ohms_current: { name: "Ohm's law current", outcome: 'current', unit: 'A', expr: 'V/R', vars: ['V', 'R'] },
  electric_power: { name: 'Electrical power', outcome: 'power', unit: 'W', expr: 'V^2/R', vars: ['V', 'R'] },
  gravitational_force: { name: 'Gravitational force', outcome: 'force', unit: 'N', expr: '0.00000000006674*m1*m2/r^2', vars: ['m1', 'm2', 'r'] },
  ideal_gas_pressure: { name: 'Ideal gas pressure', outcome: 'pressure', unit: 'Pa', expr: '8.314*n*T/V', vars: ['n', 'T', 'V'] },
  newton_acceleration: { name: "Newton's second law acceleration", outcome: 'acceleration', unit: 'm/s²', expr: 'F/m', vars: ['F', 'm'] },
  dilution_concentration: { name: 'Dilution concentration', outcome: 'concentration', unit: 'mol/L', expr: 'C1*V1/V2', vars: ['C1', 'V1', 'V2'] },
};
const fmt = (n: number) => String(+n.toPrecision(4));

export const runWhatIf = (r: any): { prediction: string; plot: any } | null => {
  try {
    const F = FORMULAS[String(r?.formula)];
    if (!F) return null;
    const given: Record<string, number> = {}, change: Record<string, number> = {};
    Object.entries(r.given || {}).forEach(([k, v]) => { given[k] = Number(v); });
    Object.entries(r.change || {}).forEach(([k, v]) => { if (F.vars.includes(k)) change[k] = Number(v); });
    const now = { ...given, ...change };
    if (!Object.keys(change).length || !F.vars.every((v) => isFinite(given[v]) && isFinite(now[v]))) return null;
    const f = compile(F.expr, F.vars), before = f(given), after = f(now);
    if (!isFinite(before) || !isFinite(after)) return null;
    const vary = F.vars.includes(r.vary) ? r.vary : Object.keys(change)[0];
    const lo = Math.min(given[vary], now[vary]), hi = Math.max(given[vary], now[vary]);
    const xmin = lo > 0 ? lo / 4 : 0, xmax = hi > 0 ? hi * 2 : 1;
    const params = F.vars.filter((v) => v !== vary).map((v) => ({ name: v, min: +(now[v] * 0.25).toPrecision(3), max: +(now[v] * 3 || 1).toPrecision(3), value: now[v] }));
    const ratio = before !== 0 ? ` (${fmt(after / before)}× the original)` : '';
    return {
      prediction: `${F.name}: originally ${F.outcome} = ${fmt(before)} ${F.unit}. After the change (${Object.entries(change).map(([k, v]) => `${k} = ${v}`).join(', ')}) it becomes ${fmt(after)} ${F.unit}${ratio}. Formula used: ${F.expr}. The graph shows ${F.outcome} as ${vary} varies.`,
      plot: { type: 'plot', expr: F.expr.replace(new RegExp(`\\b${vary}\\b`, 'g'), 'x'), xmin, xmax, shade: null, params },
    };
  } catch { return null; }
};
