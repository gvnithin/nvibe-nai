
import React, { useState } from 'react';
import { NVibeIcon, ShareIcon, SettingsIcon, CheckIcon, SavingIcon, SpeechToTextIcon, PlusCircleIcon, DesktopIcon, TabletIcon, MobileIcon } from './Icons';
import type { DeviceView } from '../types';

interface HeaderProps {
    onOpenSettings: () => void;
    onOpenTranscription: () => void;
    onNewProject: () => void;
    saveStatus: 'idle' | 'saving' | 'saved';
    deviceView: DeviceView;
    onSetDeviceView: (view: DeviceView) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenSettings, 
  onOpenTranscription, 
  onNewProject, 
  saveStatus,
  deviceView,
  onSetDeviceView,
}) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    });
  };
  
  const renderSaveStatus = () => {
    switch (saveStatus) {
        case 'saving':
            return (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <SavingIcon className="w-4 h-4 animate-spin"/>
                    <span>Saving...</span>
                </div>
            );
        case 'saved':
            return (
                <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckIcon className="w-4 h-4"/>
                    <span>All changes saved</span>
                </div>
            );
        default:
            return <div className="h-5"></div>; // Placeholder to prevent layout shift
    }
  }

  return (
    <header className="flex items-center justify-between p-4 bg-gray-900/50 border-b border-gray-700/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <NVibeIcon className="w-8 h-8 text-purple-400" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
          N Vibe
        </h1>
      </div>
       <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
          <div className="hidden lg:flex items-center p-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
            {(['desktop', 'tablet', 'mobile'] as const).map((view) => {
              const Icon = { desktop: DesktopIcon, tablet: TabletIcon, mobile: MobileIcon }[view];
              return (
                <button
                  key={view}
                  onClick={() => onSetDeviceView(view)}
                  className={`p-1.5 rounded-md transition-colors ${
                    deviceView === view
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={`${view.charAt(0).toUpperCase() + view.slice(1)} View`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
          <div>
            {renderSaveStatus()}
          </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onNewProject}
          title="New Project"
          className="p-2 rounded-md text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
        >
          <PlusCircleIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenTranscription}
          title="Live Transcription"
          className="p-2 rounded-md text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
        >
          <SpeechToTextIcon className="w-5 h-5" />
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 px-3 py-2 rounded-md transition-colors"
        >
          {shareStatus === 'copied' ? (
             <span className="text-green-400 text-sm">Copied!</span>
          ) : (
            <>
                <ShareIcon className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">Share</span>
            </>
          )}
        </button>
        <button
          onClick={onOpenSettings}
          title="Project Settings"
          className="p-2 rounded-md text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
