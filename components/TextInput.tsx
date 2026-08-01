
import React from 'react';

interface TextInputProps {
  problemText: string;
  setProblemText: (text: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ problemText, setProblemText }) => {
  return (
    <div className="w-full">
      <textarea
        value={problemText}
        onChange={(e) => setProblemText(e.target.value)}
        placeholder="Type your math, science, or engineering problem here… e.g. 'What is the integral of x^2 dx from 0 to 1?'"
        className="w-full h-48 p-4 bg-forge-void border border-forge-border rounded-xl text-forge-ink placeholder-forge-muted/70 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-forge-ember focus:border-forge-ember/50 transition-all duration-200 resize-none"
      />
    </div>
  );
};

export default TextInput;
