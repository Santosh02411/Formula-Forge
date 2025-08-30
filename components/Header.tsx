
import React from 'react';

const ForgeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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


const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-center p-6 bg-brand-secondary/50 backdrop-blur-sm sticky top-0 z-20 border-b border-brand-accent/20">
      <div className="flex items-center space-x-3">
        <ForgeIcon />
        <h1 className="text-4xl font-bold text-brand-light tracking-wider">Formula Forge</h1>
      </div>
    </header>
  );
};

export default Header;
