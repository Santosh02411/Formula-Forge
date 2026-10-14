export type Mastery = Record<string, { right: number; total: number }>;
const K = 'ff_mastery';
export const loadMastery = (): Mastery => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch { return {}; } };
export const saveMastery = (m: Mastery) => { try { localStorage.setItem(K, JSON.stringify(m)); } catch { /* ignore */ } };
export const weakest = (m: Mastery): string | null =>
  Object.entries(m).filter(([, v]) => v.total >= 2).sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total)[0]?.[0] ?? null;
export const levelFor = (v?: { right: number; total: number }): 'beginner' | 'standard' | 'advanced' => {
  if (!v || v.total < 3) return 'standard';
  const r = v.right / v.total;
  return r >= 0.8 ? 'advanced' : r < 0.5 ? 'beginner' : 'standard';
};
