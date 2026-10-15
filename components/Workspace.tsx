import React, { useState, useEffect } from 'react';
import type { ThreadItem } from '../types';
import { toSafeHtml } from '../utils/safeHtml';
import { canSpeak, speak, stopSpeaking } from '../utils/speech';

type Tab = 'solution' | 'visualize' | 'verify' | 'practice';
const TABS: { id: Tab; label: string }[] = [{ id: 'solution', label: 'Solution' }, { id: 'visualize', label: 'Visualize' }, { id: 'verify', label: 'Verify' }, { id: 'practice', label: 'Practice' }];
type VS = 'verified' | 'partial' | 'mismatch' | 'unverifiable' | null;

interface Props {
  thread: ThreadItem[]; isLoading: boolean; status: string; language: string; verifyStatus: VS;
  onFollowUp: (q: string) => void; onPractice: () => void; onQuiz: () => void; onVisual: () => void; onVerify: () => void; onWhatIf: (q: string) => void; onMark: () => void;
  quizLoading: boolean; visualLoading: boolean; verifyLoading: boolean; whatIfLoading: boolean; markLoading: boolean; canMark: boolean;
  voiceMode: boolean; onVoiceToggle: () => void; onInterrupt: () => void;
  hasVisual: boolean; hasVerify: boolean; hasQuiz: boolean;
  visualNode: React.ReactNode; verifyNode: React.ReactNode; quizNode: React.ReactNode; markNode: React.ReactNode;
}

const isPractice = (t: ThreadItem) => /^(Practice problem|Targeted practice)/.test(t.label);
const finalAnswer = (md: string): string | null => {
  const m = md.match(/final answer\W*([^\n]*\S[^\n]*)/i);
  const t = m?.[1].replace(/[*`>_]/g, '').trim();
  return t && t.length <= 160 ? t : null;
};
const chipFor = (s: VS): [string, string] =>
  s === 'verified' ? ['✅ Verified', 'border-green-500 text-green-500'] : s === 'partial' ? ['🟡 Partially verified', 'border-yellow-500 text-yellow-500']
  : s === 'mismatch' ? ['⚠️ Check disagreed — review', 'border-forge-danger text-forge-danger'] : ['AI-generated · not independently verified', 'border-forge-border text-forge-muted'];

const btn = 'px-3 py-1.5 text-xs font-medium rounded-lg border border-forge-border text-forge-muted hover:text-forge-ember hover:border-forge-ember/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const field = 'flex-1 min-w-[10rem] px-3 py-2 bg-forge-void border border-forge-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-ember';
const Spinner = () => <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full border-2 border-forge-ember border-t-transparent animate-spin" />;

const Items: React.FC<{ items: ThreadItem[] }> = ({ items }) => (
  <>
    {items.map((t, i) => (
      <section key={i} className={i > 0 ? 'mt-6 pt-6 border-t border-forge-border' : ''}>
        <p className="text-xs uppercase tracking-wider text-forge-brass mb-2">{t.label}</p>
        <div className="forge-prose w-full max-w-none animate-fade-up" dangerouslySetInnerHTML={{ __html: toSafeHtml(t.text) }} />
      </section>
    ))}
  </>
);

const Workspace: React.FC<Props> = (p) => {
  const [tab, setTab] = useState<Tab>('solution');
  const [q, setQ] = useState(''), [w, setW] = useState('');
  const [copied, setCopied] = useState(false), [speaking, setSpeaking] = useState(false);
  const practice = p.thread.filter(isPractice), main = p.thread.filter((t) => !isPractice(t));
  const isSolution = p.thread[0]?.label === 'Solution';
  const fa = isSolution ? finalAnswer(p.thread[0].text) : null;
  const [chipText, chipCls] = chipFor(p.verifyStatus);
  const fullText = p.thread.map((t) => `## ${t.label}\n\n${t.text}`).join('\n\n---\n\n');

  useEffect(() => { setTab('solution'); }, [p.thread[0]?.text]);
  useEffect(() => { if (p.hasVisual) setTab('visualize'); }, [p.hasVisual]);
  useEffect(() => { if (p.hasVerify) setTab('verify'); }, [p.hasVerify]);
  useEffect(() => { if (p.hasQuiz) setTab('practice'); }, [p.hasQuiz]);
  useEffect(() => { if (practice.length) setTab('practice'); }, [practice.length]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = TABS.findIndex((t) => t.id === tab), n = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    setTab(n.id); document.getElementById(`ws-tab-${n.id}`)?.focus(); e.preventDefault();
  };
  const copy = async () => { try { await navigator.clipboard.writeText(fullText); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ } };
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([fullText], { type: 'text/markdown' })); a.download = 'formula-forge-solution.md'; a.click(); URL.revokeObjectURL(a.href); };
  const toggleSpeak = () => { if (speaking) { stopSpeaking(); setSpeaking(false); return; } setSpeaking(true); speak(main[main.length - 1]?.text ?? '', p.language, () => setSpeaking(false)); };
  const busy = (t: Tab) => (t === 'visualize' && (p.visualLoading || p.whatIfLoading)) || (t === 'verify' && p.verifyLoading) || (t === 'practice' && p.quizLoading);

  const statusBar = (
    <div role="status" aria-live="polite" className={p.status ? 'flex items-center gap-2 text-sm text-forge-ink bg-forge-surface-2 border border-forge-border rounded-xl px-4 py-2 mb-3' : 'sr-only'}>
      {p.status && <><Spinner /><span>{p.status}</span></>}
    </div>
  );

  if (!p.thread.length) return (
    <div className="w-full mt-6">
      {statusBar}
      <div className="p-6 bg-forge-surface border border-forge-border rounded-2xl min-h-[160px] text-center text-forge-muted py-10">
        <p className="text-lg font-display font-medium text-forge-ink">Your workspace will appear here</p>
        <p className="text-sm mt-1">Enter a problem above. You’ll get a Solution, plus Visualize, Verify and Practice tools.</p>
      </div>
    </div>
  );

  return (
    <div className="w-full mt-6">
      {statusBar}
      <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
        {isSolution && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 pt-4">
            <p className="text-sm text-forge-ink min-w-0 break-words">{fa ? <><span className="text-xs uppercase tracking-wider text-forge-brass mr-2">Final answer</span><b>{fa}</b></> : <span className="text-forge-muted">Final answer shown in the solution below</span>}</p>
            <button onClick={() => setTab('verify')} className={`text-xs px-2 py-1 rounded-md border ${chipCls}`} aria-label={`Verification status: ${chipText}. Open the Verify tab.`}>{chipText}</button>
          </div>
        )}
        <div role="tablist" aria-label="Workspace sections" onKeyDown={onKey} className="flex gap-1 px-3 sm:px-5 pt-3 border-b border-forge-border overflow-x-auto print:hidden">
          {TABS.map((t) => (
            <button key={t.id} role="tab" id={`ws-tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`ws-panel-${t.id}`} aria-busy={busy(t.id)} tabIndex={tab === t.id ? 0 : -1} onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 sm:px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all ${tab === t.id ? 'border-forge-ember text-forge-ember' : 'border-transparent text-forge-muted hover:text-forge-ink'}`}>
              {t.label}{busy(t.id) && <> <Spinner /></>}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="ws-panel-solution" aria-labelledby="ws-tab-solution" hidden={tab !== 'solution'} className="p-4 sm:p-6">
          <Items items={main} />
          {p.isLoading && <p className="mt-4 text-sm text-forge-muted">{p.status || 'Working…'}</p>}
          {p.markNode}
          {!p.isLoading && (
            <div className="mt-6 pt-4 border-t border-forge-border space-y-3 print:hidden">
              <div className="flex flex-wrap gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) { p.onFollowUp(q.trim()); setQ(''); } }} aria-label="Ask a follow-up question" placeholder="Ask a follow-up, e.g. “Why did we use this formula?”" className={field} />
                <button onClick={() => { p.onFollowUp(q.trim()); setQ(''); }} disabled={!q.trim()} className="px-4 py-2 rounded-lg bg-forge-ember text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Ask</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.canMark && <button className={btn} onClick={p.onMark} disabled={p.markLoading}>{p.markLoading ? 'Marking…' : '📍 Mark my mistakes'}</button>}
                <button className={btn} onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
                <button className={btn} onClick={download}>Download .md</button>
                <button className={btn} onClick={() => window.print()}>Print / PDF</button>
                {canSpeak() && <button className={btn} onClick={toggleSpeak} aria-pressed={speaking}>{speaking ? '■ Stop reading' : '🔊 Read aloud'}</button>}
                <button className={btn} onClick={p.onVoiceToggle} aria-pressed={p.voiceMode}>🎙 Voice tutor: {p.voiceMode ? 'On' : 'Off'}</button>
                {p.voiceMode && <button className={btn} onClick={p.onInterrupt}>✋ Interrupt &amp; ask</button>}
              </div>
            </div>
          )}
        </div>

        <div role="tabpanel" id="ws-panel-visualize" aria-labelledby="ws-tab-visualize" hidden={tab !== 'visualize'} className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-forge-muted">See the problem as an interactive graph or labelled diagram, or turn it into an experiment.</p>
          <button className={btn} onClick={p.onVisual} disabled={p.visualLoading}>{p.visualLoading ? 'Drawing…' : '📈 Draw a visual explanation'}</button>
          <div className="flex flex-wrap gap-2">
            <input value={w} onChange={(e) => setW(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && w.trim() && !p.whatIfLoading) { p.onWhatIf(w.trim()); setW(''); } }} aria-label="What-if question" placeholder="What if gravity were half as strong?" className={field} />
            <button className={btn} onClick={() => { p.onWhatIf(w.trim()); setW(''); }} disabled={!w.trim() || p.whatIfLoading}>{p.whatIfLoading ? 'Running…' : '🧪 Run what-if'}</button>
          </div>
          {p.visualNode}
        </div>

        <div role="tabpanel" id="ws-panel-verify" aria-labelledby="ws-tab-verify" hidden={tab !== 'verify'} className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-forge-muted">A separate calculator in your browser re-checks the final answer. The AI is not used to judge itself.</p>
          <button className={btn} onClick={p.onVerify} disabled={p.verifyLoading}>{p.verifyLoading ? 'Checking…' : '✅ Verify answer'}</button>
          {p.verifyNode}
        </div>

        <div role="tabpanel" id="ws-panel-practice" aria-labelledby="ws-tab-practice" hidden={tab !== 'practice'} className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-forge-muted">Practise the same concept, or test yourself with a short quiz that updates your progress.</p>
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={p.onPractice} disabled={p.isLoading}>Practice a similar problem</button>
            <button className={btn} onClick={p.onQuiz} disabled={p.quizLoading}>{p.quizLoading ? 'Making quiz…' : 'Quiz me'}</button>
          </div>
          <Items items={practice} />
          {p.quizNode}
        </div>
      </div>
    </div>
  );
};

export default Workspace;
