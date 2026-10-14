import type { ImageData, SolveOptions } from '../types';

export const solveProblem = async (text: string, image: ImageData | null, opts: SolveOptions): Promise<string> => {
  let response: Response;
  try {
    response = await fetch('/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, image, ...opts }),
    });
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }
  let data: any = {};
  try { data = await response.json(); } catch { /* non-JSON error page */ }
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data.text as string;
};
