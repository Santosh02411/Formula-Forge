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
    <div className="min-h-screen bg-brand-primary text-brand-light">
      <Header />
      <main className="container mx-auto max-w-4xl p-4 md:p-8">
        <div className="bg-brand-secondary/50 p-6 rounded-xl shadow-2xl border border-brand-accent/20">
          <InputTabs activeMode={activeMode} onModeChange={handleModeChange} />
          
          <div className="mt-4">
            {/* Additional text input for image and draw modes */}
            {(activeMode === InputMode.IMAGE || activeMode === InputMode.DRAW) && (
              <TextInput 
                problemText={problemText} 
                setProblemText={setProblemText}
              />
            )}
            <div className="mt-4">
              {renderInputComponent()}
            </div>
          </div>
          
          {error && <p className="mt-4 text-center text-red-400">{error}</p>}

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSolve}
              disabled={isLoading}
              className="px-8 py-3 bg-brand-accent text-white font-bold rounded-lg shadow-lg hover:bg-blue-500 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100 flex items-center"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Solving...
                    </>
                ) : (
                    'Solve with Gemini'
                )}
            </button>
          </div>
        </div>

        <SolutionDisplay solution={solution} isLoading={isLoading} />
      </main>
    </div>
  );
};

export default App;
