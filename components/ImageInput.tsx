
import React, { useState, useCallback, useEffect } from 'react';
import { fileToImageData } from '../utils/image';
import type { ImageData } from '../types';

interface ImageInputProps {
  setImageData: (data: ImageData | null) => void;
}

const UploadIcon = () => (
    <svg className="mx-auto h-10 w-10 text-forge-muted" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);


const ImageInput: React.FC<ImageInputProps> = ({ setImageData }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const { preview, ...data } = await fileToImageData(file);
      setPreview(preview);
      setImageData(data);
    } catch { /* ignore unreadable image */ }
  }, [setImageData]);

  // Paste a screenshot straight from the clipboard (Ctrl+V)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files || []).find((x) => x.type.startsWith('image/'));
      if (f) handleFile(f);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFile(event.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleFile(event.target.files[0]);
    }
  };
  
  const clearImage = () => {
    setPreview(null);
    setImageData(null);
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative group animate-fade-up">
          <img src={preview} alt="Problem preview" className="w-full max-h-72 object-contain rounded-xl border border-forge-border bg-forge-void" />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-2 bg-forge-danger text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`flex justify-center px-6 pt-8 pb-8 border-2 border-dashed rounded-xl transition-all duration-200 ${
            isDragging ? 'border-forge-ember bg-forge-ember/5 scale-[1.01]' : 'border-forge-border hover:border-forge-border-strong'
          }`}
        >
          <div className="space-y-2 text-center">
            <UploadIcon />
            <div className="flex text-sm text-forge-muted">
              <label htmlFor="file-upload" className="relative cursor-pointer font-medium text-forge-ember hover:text-forge-brass focus-within:outline-none px-1 transition-colors">
                <span>Upload a file</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-forge-muted/70">PNG, JPG, WEBP — auto-compressed. You can also paste a screenshot (Ctrl+V).</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageInput;
