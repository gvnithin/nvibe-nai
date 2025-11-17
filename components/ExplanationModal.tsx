
import React from 'react';
import { NVibeIcon } from './Icons';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isLoading: boolean;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({ isOpen, onClose, content, isLoading }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="explanation-modal-title"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-gray-700 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="explanation-modal-title" className="text-xl font-bold mb-4 text-gray-100">Code Explanation</h2>
        
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 text-gray-300">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
               <NVibeIcon className="w-12 h-12 text-purple-400 animate-pulse" />
               <p className="mt-4 text-lg">AI is thinking...</p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{content}</pre>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
