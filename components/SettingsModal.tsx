
import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  currentName: string;
  currentDescription: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentName,
  currentDescription,
}) => {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setDescription(currentDescription);
    }
  }, [isOpen, currentName, currentDescription]);

  const handleSave = () => {
    onSave(name, description);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="settings-modal-title" className="text-xl font-bold mb-4">Project Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-300 mb-1">
              Project Description
            </label>
            <textarea
              id="projectDescription"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
