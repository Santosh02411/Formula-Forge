import React, { useState, useEffect, useRef } from 'react';
import type { QuizQuestion } from '../types';

const QuizCard: React.FC<{ questions: QuizQuestion[]; onClose: () => void; onFinish: (r: { topic: string; correct: boolean }[]) => void }> = ({ questions, onClose, onFinish }) => {
  const [sel, setSel] = useState<(number | null)[]>(questions.map(() => null));
  const score = sel.filter((s, i) => s === questions[i].answer).length;
  const done = sel.every((s) => s !== null);
  const reported = useRef(false);
  useEffect(() => {
    if (done && !reported.current) { reported.current = true; onFinish(questions.map((q, i) => ({ topic: q.topic || 'General', correct: sel[i] === q.answer }))); }
  }, [done]);
  return (
    <div className="w-full mt-6 p-6 bg-forge-surface border border-forge-border rounded-2xl print:hidden">
      <div className="flex justify-between items-center mb-4">
        <p className="font-display font-semibold text-forge-ink">Quick quiz</p>
        <button onClick={onClose} className="text-xs text-forge-muted hover:text-forge-ember">Close</button>
      </div>
      {questions.map((q, i) => (
        <div key={i} className="mb-5">
          <p className="text-sm font-medium text-forge-ink mb-2">{i + 1}. {q.q}</p>
          <div className="space-y-2">
            {q.options.map((o, j) => {
              const chosen = sel[i] !== null, right = j === q.answer, mine = sel[i] === j;
              const cls = !chosen ? 'border-forge-border hover:border-forge-ember/60' : right ? 'border-green-500 bg-green-500/10' : mine ? 'border-forge-danger bg-forge-danger/10' : 'border-forge-border opacity-60';
              return <button key={j} disabled={chosen} onClick={() => setSel((s) => s.map((v, k) => (k === i ? j : v)))}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg border text-forge-ink transition-all ${cls}`}>{o}</button>;
            })}
          </div>
          {sel[i] !== null && <p className="text-xs text-forge-muted mt-2">{sel[i] === q.answer ? '✓ Correct. ' : '✗ Not quite. '}{q.why}</p>}
        </div>
      ))}
      {done && <p className="text-center font-display font-semibold text-forge-ember">Score: {score} / {questions.length}</p>}
    </div>
  );
};
export default QuizCard;
