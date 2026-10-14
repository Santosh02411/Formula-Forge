import type { HistoryItem } from '../types';
const K = 'ff_history', S = 'ff_solved';
export const loadHistory = (): HistoryItem[] => { try { return JSON.parse(localStorage.getItem(K) || '[]'); } catch { return []; } };
export const saveHistory = (l: HistoryItem[]) => { try { localStorage.setItem(K, JSON.stringify(l.slice(0, 15))); } catch { /* storage full/blocked */ } };
export const loadSolved = (): number => { try { return Number(localStorage.getItem(S) || 0); } catch { return 0; } };
export const saveSolved = (n: number) => { try { localStorage.setItem(S, String(n)); } catch { /* ignore */ } };
