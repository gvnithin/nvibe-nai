import React, { useState, useRef } from 'react';
import { SparklesIcon, EditIcon, StopIcon } from './Icons';

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  onStop: () => void;
  isLoading: boolean;
  isEditing: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onGenerate, onStop, isLoading, isEditing }) => {
  const [prompt, setPrompt] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !prompt.trim()) return;
    onGenerate(prompt);
    setPrompt(''); // Clear prompt after submission
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.altKey && e.key === 'Enter') {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const buttonBaseClasses = "w-full md:w-auto flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-all";
  const generateClasses = "bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 disabled:cursor-not-allowed disabled:text-gray-400";
  const stopClasses = "bg-red-600 hover:bg-red-700";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center gap-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
            isEditing 
            ? "Describe the changes... (Alt+Enter to submit)" 
            : "Describe the web app you want to build... (Alt+Enter to submit)"
        }
        className="w-full flex-grow bg-gray-800 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all resize-none"
        rows={2}
        disabled={isLoading}
      />
      <button
        type={isLoading ? "button" : "submit"}
        onClick={isLoading ? onStop : undefined}
        disabled={!isLoading && !prompt}
        className={`${buttonBaseClasses} ${isLoading ? stopClasses : generateClasses}`}
      >
        {isLoading ? (
          <>
            <StopIcon className="w-5 h-5" />
            Stop
          </>
        ) : (
          isEditing ? (
            <>
                <EditIcon className="w-5 h-5" />
                Update App
            </>
          ) : (
            <>
                <SparklesIcon className="w-5 h-5" />
                Generate
            </>
          )
        )}
      </button>
    </form>
  );
};
