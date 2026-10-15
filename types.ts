export enum InputMode {
  TEXT = 'text',
  IMAGE = 'image',
  DRAW = 'draw',
}

export interface ImageData {
  base64: string;
  mimeType: string;
}

export type Action = 'solve' | 'hint' | 'check';
export type Level = 'beginner' | 'standard' | 'advanced';

export interface SolveOptions {
  mode: Action | 'practice' | 'followup' | 'transcribe' | 'quiz' | 'visual' | 'verify' | 'whatif' | 'markup';
  language?: string;
  level: Level;
  subject: string;
}

export interface ThreadItem {
  label: string;
  text: string;
}

export interface HistoryItem {
  id: string; ts: number; title: string; thread: ThreadItem[];
  problem?: string; // full original problem text (or a placeholder when it was an image)
  meta?: { mode: string; action: string; level: string; subject: string; language: string };
}
export interface QuizQuestion { topic?: string; q: string; options: string[]; answer: number; why: string; }
