import React from 'react';
import type { Mastery } from '../utils/mastery';
import { weakest, levelFor } from '../utils/mastery';

const ProgressPanel: React.FC<{ mastery: Mastery; onPractice: (topic: string) => void }> = ({ mastery, onPractice }) => {
  const topics = Object.entries(mastery).sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total);
  const weak = weakest(mastery);
  return (
    <details className="w-full mt-4 bg-forge-surface border border-forge-border rounded-2xl print:hidden">
      <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-forge-ink">My progress <span className="text-forge-muted">· mastery by topic (from quizzes)</span></summary>
      <div className="px-5 pb-4 space-y-3">
        {topics.length === 0 && <p className="text-sm text-forge-muted">Take a “Quiz me” after a solution and your mastery by topic will appear here.</p>}
        {topics.map(([t, v]) => {
          const pct = Math.round((v.right / v.total) * 100);
          return (
            <div key={t}>
              <div className="flex justify-between text-sm text-forge-ink"><span>{t}</span><span className="text-forge-muted">{pct}% · {v.right}/{v.total} · next level: {levelFor(v)}</span></div>
              <div className="h-2 mt-1 rounded bg-forge-border overflow-hidden"><div className={`h-full ${pct < 50 ? 'bg-forge-danger' : 'bg-forge-ember'}`} style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
        {weak && (
          <div className="pt-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-forge-ink">Recommended next: review <b>{weak}</b></span>
            <button onClick={() => onPractice(weak)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-forge-ember text-forge-ember hover:bg-forge-ember/10">Practice this topic</button>
          </div>
        )}
      </div>
    </details>
  );
};
export default ProgressPanel;
