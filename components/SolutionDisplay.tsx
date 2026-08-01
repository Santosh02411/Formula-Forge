
import React from 'react';
import { marked } from 'marked';

interface SolutionDisplayProps {
  solution: string | null;
  isLoading: boolean;
}

const Loader = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
        <div className="forge-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="text-sm text-forge-muted">Forging your solution…</p>
    </div>
);

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ solution, isLoading }) => {
  const getHtml = () => {
    if (!solution) return '';
    return marked(solution, { gfm: true, breaks: true });
  };
    
  return (
    <div className="w-full mt-6 p-6 bg-forge-surface border border-forge-border rounded-2xl min-h-[200px] flex justify-center items-center">
      {isLoading ? (
        <Loader />
      ) : solution ? (
        <div
          className="forge-prose w-full max-w-none animate-fade-up"
          dangerouslySetInnerHTML={{ __html: getHtml() }}
        />
      ) : (
        <div className="text-center text-forge-muted">
          <p className="text-lg font-display font-medium text-forge-ink">Your solution will appear here</p>
          <p className="text-sm mt-1">Choose an input method and provide a problem to get started.</p>
        </div>
      )}
    </div>
  );
};

export default SolutionDisplay;
