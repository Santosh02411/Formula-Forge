import React from 'react';
import type { HistoryItem } from '../types';

interface Props { items: HistoryItem[]; solved: number; onOpen: (h: HistoryItem) => void; onDelete: (id: string) => void; }

const HistoryPanel: React.FC<Props> = ({ items, solved, onOpen, onDelete }) => (
  <details className="w-full mt-6 bg-forge-surface border border-forge-border rounded-2xl print:hidden">
    <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-forge-ink">
      My history <span className="text-forge-muted">· {solved} problem{solved === 1 ? '' : 's'} solved</span>
    </summary>
    <div className="px-5 pb-4 space-y-2">
      {items.length === 0 && <p className="text-sm text-forge-muted">Your solved problems will appear here (saved only in this browser).</p>}
      {items.map((h) => (
        <div key={h.id} className="flex items-center gap-2 text-sm">
          <button onClick={() => onOpen(h)} className="flex-1 text-left truncate px-3 py-2 rounded-lg border border-forge-border text-forge-ink hover:border-forge-ember/60">
            {h.title} <span className="text-xs text-forge-muted">· {new Date(h.ts).toLocaleDateString()}</span>
          </button>
          <button onClick={() => onDelete(h.id)} aria-label={`Delete ${h.title} from history`} className="px-2 text-forge-muted hover:text-forge-danger">✕</button>
        </div>
      ))}
    </div>
  </details>
);
export default HistoryPanel;
