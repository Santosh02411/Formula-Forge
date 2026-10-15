import React from 'react';
import type { Action, Level } from '../types';
import { LANGUAGES } from '../utils/speech';

interface Props {
  action: Action; setAction: (a: Action) => void;
  level: Level; setLevel: (l: Level) => void;
  subject: string; setSubject: (s: string) => void;
  language: string; setLanguage: (s: string) => void;
}

const ACTIONS: { id: Action; label: string; hint: string }[] = [
  { id: 'solve', label: 'Solve', hint: 'Full step-by-step solution' },
  { id: 'hint', label: 'Hint only', hint: 'Guided hints, no answer' },
  { id: 'check', label: 'Check my work', hint: 'Upload/type YOUR attempt for feedback' },
];
const SUBJECTS = ['auto', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering', 'Logic'];
const sel = 'bg-forge-void border border-forge-border rounded-lg px-2 py-1.5 text-sm text-forge-ink';

const OptionsBar: React.FC<Props> = ({ action, setAction, level, setLevel, subject, setSubject, language, setLanguage }) => (
  <div className="mt-4 space-y-3">
    <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="What do you want?">
      {ACTIONS.map((a) => (
        <button key={a.id} role="radio" aria-checked={action === a.id} title={a.hint} onClick={() => setAction(a.id)}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${action === a.id ? 'border-forge-ember text-forge-ember bg-forge-ember/10' : 'border-forge-border text-forge-muted hover:text-forge-ink'}`}>
          {a.label}
        </button>
      ))}
    </div>
    <p className="text-center text-xs text-forge-muted">{ACTIONS.find((a) => a.id === action)?.hint}</p>
    <div className="flex flex-wrap justify-center gap-3 text-sm text-forge-muted">
      <label className="flex items-center gap-2">Level
        <select className={sel} value={level} onChange={(e) => setLevel(e.target.value as Level)}>
          <option value="beginner">Beginner</option><option value="standard">Standard</option><option value="advanced">Advanced</option>
        </select>
      </label>
      <label className="flex items-center gap-2">Subject
        <select className={sel} value={subject} onChange={(e) => setSubject(e.target.value)}>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s === 'auto' ? 'Auto-detect' : s}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2">Explain in
        <select className={sel} value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>
    </div>
  </div>
);

export default OptionsBar;
