import React from 'react';

interface Props { onSolve: () => void; onAnalyze: () => void; onExplore: () => void; }

const Hero: React.FC<Props> = ({ onSolve, onAnalyze, onExplore }) => (
  <section className="text-center pt-2 pb-5 sm:pt-4 sm:pb-7">
    <h1 className="font-display font-bold text-forge-ink text-2xl sm:text-4xl leading-tight">
      Understand the problem. <span className="text-forge-ember">See the solution.</span> Master the concept.
    </h1>
    <p className="mt-3 text-sm sm:text-base text-forge-muted max-w-2xl mx-auto">
      Type, upload, or draw a math or science problem. Get step-by-step help, hints, feedback on your own work, and interactive visuals, with answers you can check instead of just copy.
    </p>
    <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
      <button onClick={onSolve} className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-forge-ember to-forge-ember-deep text-white text-sm font-semibold shadow-ember hover:-translate-y-0.5 transition-all">Solve a Problem</button>
      <button onClick={onAnalyze} className="px-4 py-2.5 rounded-xl border border-forge-border text-forge-ink text-sm font-semibold hover:border-forge-ember/60 hover:text-forge-ember transition-all">Analyze My Work</button>
      <button onClick={onExplore} className="px-4 py-2.5 rounded-xl border border-forge-border text-forge-ink text-sm font-semibold hover:border-forge-ember/60 hover:text-forge-ember transition-all">Explore Visually</button>
    </div>
  </section>
);
export default Hero;
