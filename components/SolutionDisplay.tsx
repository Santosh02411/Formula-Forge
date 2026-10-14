import React, { useState } from 'react';
import { marked } from 'marked';
import type { ThreadItem } from '../types';
import { canSpeak, speak, stopSpeaking } from '../utils/speech';

interface Props {
  thread: ThreadItem[];
  isLoading: boolean;
  onFollowUp: (q: string) => void;
  onPractice: () => void;
  onQuiz: () => void;
  quizLoading: boolean;
  onVisual: () => void;
  visualLoading: boolean;
  onVerify: () => void;
  verifyLoading: boolean;
  language: string;
}

// marked does not sanitize; strip scripts / event handlers / javascript: URLs from model output.
const toSafeHtml = (md: string): string => {
  const doc = new DOMParser().parseFromString(marked(md, { gfm: true, breaks: true }) as string, 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,link,meta,form').forEach((n) => n.remove());
  doc.body.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((a) => {
      if (a.name.startsWith('on') || (['href', 'src'].includes(a.name) && /^\s*javascript:/i.test(a.value))) el.removeAttribute(a.name);
    });
  });
  return doc.body.innerHTML;
};

const Loader = () => (
  <div className="flex flex-col items-center justify-center space-y-4 py-6">
    <div className="forge-loader"><span></span><span></span><span></span></div>
    <p className="text-sm text-forge-muted">Forging your solution…</p>
  </div>
);

const btn = 'px-3 py-1.5 text-xs font-medium rounded-lg border border-forge-border text-forge-muted hover:text-forge-ember hover:border-forge-ember/50 transition-all';

const SolutionDisplay: React.FC<Props> = ({ thread, isLoading, onFollowUp, onPractice, onQuiz, quizLoading, language, onVisual, visualLoading, onVerify, verifyLoading, verifyStatus, onWhatIf, whatIfLoading }) => {
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const toggleSpeak = () => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    setSpeaking(true);
    speak(thread[thread.length - 1]?.text ?? '', language, () => setSpeaking(false));
  };
  const fullText = thread.map((t) => `## ${t.label}\n\n${t.text}`).join('\n\n---\n\n');

  const copy = async () => {
    try { await navigator.clipboard.writeText(fullText); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([fullText], { type: 'text/markdown' }));
    a.download = 'formula-forge-solution.md';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const submit = () => { if (q.trim() && !isLoading) { onFollowUp(q.trim()); setQ(''); } };

  return (
    <div className="w-full mt-6 p-6 bg-forge-surface border border-forge-border rounded-2xl min-h-[200px]" aria-live="polite">
      {thread.length === 0 && !isLoading && (
        <div className="text-center text-forge-muted py-10">
          <p className="text-lg font-display font-medium text-forge-ink">Your solution will appear here</p>
          <p className="text-sm mt-1">Type, upload, or draw a problem — then choose Solve, Hint, or Check my work.</p>
        </div>
      )}
      {thread.map((t, i) => (
        <section key={i} className={i > 0 ? 'mt-6 pt-6 border-t border-forge-border' : ''}>
          {i === 0 && t.label === 'Solution' && (
            <p className={`inline-block text-xs px-2 py-1 mb-2 rounded-md border ${verifyStatus === 'verified' ? 'border-green-500 text-green-500' : verifyStatus === 'mismatch' ? 'border-forge-danger text-forge-danger' : 'border-forge-border text-forge-muted'}`}>
              {verifyStatus === 'verified' ? '✅ Final answer independently verified' : verifyStatus === 'mismatch' ? '⚠️ Independent check disagreed — review carefully' : 'AI-generated explanation · not independently verified (tap ✅ Verify answer)'}
            </p>
          )}
          <p className="text-xs uppercase tracking-wider text-forge-brass mb-2">{t.label}</p>
          <div className="forge-prose w-full max-w-none animate-fade-up" dangerouslySetInnerHTML={{ __html: toSafeHtml(t.text) }} />
        </section>
      ))}
      {isLoading && <Loader />}
      {thread.length > 0 && !isLoading && (
        <div className="mt-6 pt-4 border-t border-forge-border space-y-3 print:hidden">
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={onPractice}>Practice a similar problem</button>
            <button className={btn} onClick={onQuiz} disabled={quizLoading}>{quizLoading ? 'Making quiz…' : 'Quiz me'}</button>
            <button className={btn} onClick={onVisual} disabled={visualLoading}>{visualLoading ? 'Drawing…' : '📈 Visualize'}</button>
            <button className={btn} onClick={onVerify} disabled={verifyLoading}>{verifyLoading ? 'Checking…' : '✅ Verify answer'}</button>
            {canSpeak() && <button className={btn} onClick={toggleSpeak}>{speaking ? '■ Stop' : '🔊 Read aloud'}</button>}
            <button className={btn} onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
            <button className={btn} onClick={download}>Download .md</button>
            <button className={btn} onClick={() => window.print()}>Print / PDF</button>
          </div>
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Ask a follow-up, e.g. “Why did we use this formula?”"
              className="flex-1 px-3 py-2 bg-forge-void border border-forge-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-ember" />
            <button onClick={submit} className="px-4 py-2 rounded-lg bg-forge-ember text-white text-sm font-semibold disabled:opacity-50" disabled={!q.trim()}>Ask</button>
            <button onClick={() => { if (q.trim() && !whatIfLoading) { onWhatIf(q.trim()); setQ(''); } }} className="px-3 py-2 rounded-lg border border-forge-border text-forge-ink text-sm hover:border-forge-ember/60 disabled:opacity-50" disabled={!q.trim() || whatIfLoading} title="Type a what-if, e.g. What if gravity were half?">{whatIfLoading ? '…' : '🧪 What if'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolutionDisplay;
