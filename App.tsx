import React, { useState, useRef, useCallback } from 'react';
import Header from './components/Header';
import InputTabs from './components/InputTabs';
import TextInput from './components/TextInput';
import ImageInput from './components/ImageInput';
import DrawInput, { DrawInputHandles } from './components/DrawInput';
import SolutionDisplay from './components/SolutionDisplay';
import { solveProblem } from './services/geminiService';
import { InputMode } from './types';
import type { ImageData } from './types';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<InputMode>(InputMode.TEXT);
  const [problemText, setProblemText] = useState('');
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Correctly set up a ref to get data from the DrawInput component
  const drawInputRef = useRef<DrawInputHandles>(null);

  const handleModeChange = (mode: InputMode) => {
    setActiveMode(mode);
    // Clear inputs when changing mode to avoid confusion
    setProblemText('');
    setImageData(null);
    setError(null);
  };
  const handleSolve = async () => {
    setSolution(null);
    setError(null);
    setIsLoading(true);
    let currentImageData: ImageData | null = null;
    let currentText = problemText;
    if (activeMode === InputMode.IMAGE) {
      if (!imageData) {
        setError("Please upload an image first.");
        setIsLoading(false);
        return;
      }
      currentImageData = imageData;
    } else if (activeMode === InputMode.DRAW) {
      // FIX: Use the ref to get canvas data from the child component
      const drawnData = drawInputRef.current?.getCanvasData();
      if (!drawnData) {
        setError("Please draw something on the canvas.");
        setIsLoading(false);
        return;
      }
      currentImageData = drawnData;
    } else { // TEXT mode
        if (!problemText.trim()) {
            setError("Please type a problem to solve.");
            setIsLoading(false);
            return;
        }
    }

    try {
      const result = await solveProblem(currentText, currentImageData);
      setSolution(result);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      setSolution(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderInputComponent = () => {
    switch (activeMode) {
      case InputMode.IMAGE:
        return <ImageInput setImageData={setImageData} />;
      case InputMode.DRAW:
        // FIX: Pass the ref to the DrawInput component
        return <DrawInput ref={drawInputRef} />;
      case InputMode.TEXT:
      default:
        return <TextInput problemText={problemText} setProblemText={setProblemText} />;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-4xl p-4 md:p-8">
        <div className="animate-fade-up bg-forge-surface/60 p-5 md:p-7 rounded-2xl shadow-2xl border border-forge-border">
          <InputTabs activeMode={activeMode} onModeChange={handleModeChange} />
          
          <div className="mt-5">
            {/* Additional text input for image and draw modes */}
            {(activeMode === InputMode.IMAGE || activeMode === InputMode.DRAW) && (
              <div className="mb-4">
                <TextInput 
                  problemText={problemText} 
                  setProblemText={setProblemText}
                />
              </div>
            )}
            {renderInputComponent()}
          </div>
          
          {error && (
            <p className="mt-4 text-center text-sm text-forge-danger bg-forge-danger/10 border border-forge-danger/30 rounded-lg py-2 px-4">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSolve}
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-b from-forge-ember to-forge-ember-deep text-white font-display font-semibold rounded-xl shadow-ember hover:shadow-ember-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center"
            >
                {isLoading ? (
                    <>
                        <span className="forge-loader forge-loader--light mr-3 scale-75">
                          <span></span><span></span><span></span>
                        </span>
                        Solving…
                    </>
                ) : (
                    'Solve with Gemini'
                )}
            </button>
          </div>
        </div>

        <SolutionDisplay solution={solution} isLoading={isLoading} />

        <footer className="text-center text-xs text-forge-muted/70 mt-8 pb-4">
          Powered by Google Gemini
        </footer>
      </main>
    </div>
  );
};

export default App;
