
import React from 'react';
import { InputMode } from '../types';

interface InputTabsProps {
  activeMode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

const TextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 13a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);
const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
  </svg>
);
const DrawIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
  </svg>
);

const InputTabs: React.FC<InputTabsProps> = ({ activeMode, onModeChange }) => {
  const tabs = [
    { mode: InputMode.TEXT, label: 'Type', icon: <TextIcon /> },
    { mode: InputMode.IMAGE, label: 'Upload', icon: <ImageIcon /> },
    { mode: InputMode.DRAW, label: 'Draw', icon: <DrawIcon /> },
  ];

  return (
    <div className="flex justify-center">
      <div className="inline-flex space-x-1 bg-forge-void p-1 rounded-xl border border-forge-border">
        {tabs.map(({ mode, label, icon }) => {
          const isActive = activeMode === mode;
          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`flex items-center justify-center px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out
                ${isActive
                  ? 'bg-gradient-to-b from-forge-ember to-forge-ember-deep text-white shadow-ember'
                  : 'text-forge-muted hover:bg-forge-surface-2 hover:text-forge-ink'
                }`}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InputTabs;
