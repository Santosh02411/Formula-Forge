import React from 'react';
import ThemeToggle from './ThemeToggle';

const ForgeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-forge-ember animate-flicker" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 13.1a2 2 0 0 1-2.2 2.2l-2.5 1.3a.5.5 0 0 1-.7-.7l1.3-2.5a2 2 0 0 1 2.2-2.2l3.4-1.7a.5.5 0 0 1 .7.7l-1.7 3.4Z"/>
        <path d="m18 9 1-1c.5-.5.5-1.3 0-1.8L17.2.4a1.24 1.24 0 0 0-1.8 0l-1 1"/>
        <path d="M22 13h-2"/>
        <path d="M13 2v2"/>
        <path d="M13 22v-2"/>
        <path d="m3.5 8.5 1.4 1.4"/>
        <path d="m19.1 19.1-1.4-1.4"/>
        <path d="M2 13h2"/>
    </svg>
);

const EmberParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <span className="ember-particle animate-ember-rise" style={{ left: '18%', animationDelay: '0s' }} />
    <span className="ember-particle animate-ember-rise" style={{ left: '46%', animationDelay: '1.1s' }} />
    <span className="ember-particle animate-ember-rise" style={{ left: '72%', animationDelay: '2s' }} />
    <span className="ember-particle animate-ember-rise" style={{ left: '85%', animationDelay: '0.6s' }} />
  </div>
);

const Header: React.FC = () => {
  return (
    <header className="relative overflow-hidden bg-forge-surface/70 backdrop-blur-sm sticky top-0 z-20 border-b border-forge-border">
      <EmberParticles />
      <div className="relative container mx-auto max-w-4xl flex items-center justify-between px-4 md:px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-forge-void border border-forge-border">
            <ForgeIcon />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-forge-ink leading-none">
              Formula Forge
            </h1>
            <p className="text-xs md:text-sm text-forge-muted mt-1">Solve it. Step by step.</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
