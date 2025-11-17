
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { CodeEditor } from './components/CodeEditor';
import { PreviewWindow } from './components/PreviewWindow';
import { SplitPane } from './components/SplitPane';
import { SettingsModal } from './components/SettingsModal';
import { ExplanationModal } from './components/ExplanationModal';
import { TranscriptionModal } from './components/TranscriptionModal';
import { generateAppCode, explainCode } from './services/geminiService';
import type { GeneratedFile, ProjectState, DeviceView } from './types';
import { initialFiles } from './constants';

const App: React.FC = () => {
  const [history, setHistory] = useState<ProjectState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeFile, setActiveFile] = useState<string>('');
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);
  const [explanationContent, setExplanationContent] = useState<string>('');
  const [isExplanationLoading, setIsExplanationLoading] = useState<boolean>(false);
  
  const [isTranscriptionOpen, setIsTranscriptionOpen] = useState<boolean>(false);

  const projectState = history[historyIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasGenerated = history.length > 1 || (projectState && projectState.files[0]?.content !== initialFiles[0].content);

  // Load from localStorage on initial mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('n-vibe-project');
      if (savedState) {
        const parsedState = JSON.parse(savedState) as ProjectState;
        setHistory([parsedState]);
        setHistoryIndex(0);
      } else {
        setHistory([{ files: initialFiles, projectName: 'Untitled Project', projectDescription: '' }]);
        setHistoryIndex(0);
      }
    } catch (e) {
      console.error("Failed to load project state from localStorage", e);
      setHistory([{ files: initialFiles, projectName: 'Untitled Project', projectDescription: '' }]);
      setHistoryIndex(0);
    }
  }, []);

  // Effect to manage the active file, ensuring it's always valid
  useEffect(() => {
    if (projectState && projectState.files.length > 0) {
      if (!projectState.files.some(f => f.path === activeFile)) {
        const preferredFile = projectState.files.find(f => f.path.toLowerCase().includes('app.tsx')) || projectState.files[0];
        setActiveFile(preferredFile.path);
      }
    } else {
      setActiveFile('');
    }
  }, [projectState?.files, activeFile]);


  // Centralized state update function
  const updateProjectState = useCallback((newState: ProjectState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Debounced auto-save with status indicator
  useEffect(() => {
    // Don't save on the initial undefined state or the very first default state
    if (!projectState || historyIndex < 1) return;

    setSaveStatus('saving');
    const handler = setTimeout(() => {
      localStorage.setItem('n-vibe-project', JSON.stringify(projectState));
      setSaveStatus('saved');
      const resetHandler = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(resetHandler);
    }, 1500); // 1.5-second debounce

    return () => {
      clearTimeout(handler);
    };
  }, [projectState, historyIndex]);


  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [canUndo, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [canRedo, historyIndex]);
  
  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isUndo = (isMac ? event.metaKey : event.ctrlKey) && event.key === 'z' && !event.shiftKey;
      const isRedo = (isMac ? event.metaKey : event.ctrlKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey));

      if (isUndo) {
        event.preventDefault();
        handleUndo();
      } else if (isRedo) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);


  const handleGenerate = useCallback(async (prompt: string) => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    setError(null);
    
    try {
      const files = await generateAppCode(prompt, hasGenerated ? projectState.files : undefined, controller.signal);
      const newState: ProjectState = { ...projectState, files };
      updateProjectState(newState);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log("Generation stopped by user.");
        setError(null); // It's a user action, not an error
      } else {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [hasGenerated, projectState, updateProjectState]);

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };
  
  const handleFileContentChange = (path: string, newContent: string) => {
    const newFiles = projectState.files.map(file => 
      file.path === path ? { ...file, content: newContent } : file
    );
    updateProjectState({ ...projectState, files: newFiles });
  };
  
  const handleAddFile = (path: string) => {
    if (projectState.files.some(f => f.path === path)) {
      alert(`File "${path}" already exists.`);
      return;
    }
    const newFile: GeneratedFile = { path, content: '' };
    const newFiles = [...projectState.files, newFile];
    updateProjectState({ ...projectState, files: newFiles });
    setActiveFile(path); // Set the new file as active
  };

  const handleSaveSettings = (newName: string, newDescription: string) => {
    const newState: ProjectState = { ...projectState, projectName: newName, projectDescription: newDescription };
    updateProjectState(newState);
    setIsSettingsOpen(false);
  };
  
  const handleExplainCode = async (path: string, content: string) => {
    setIsExplanationOpen(true);
    setIsExplanationLoading(true);
    setExplanationContent('');
    try {
      const explanation = await explainCode(content, path);
      setExplanationContent(explanation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setExplanationContent(`Sorry, an error occurred while explaining the code.\n\n${errorMessage}`);
    } finally {
      setIsExplanationLoading(false);
    }
  };

  const handleNewProject = useCallback(() => {
    const confirmed = window.confirm(
      'Are you sure you want to start a new project? Any unsaved changes will be lost.'
    );
    if (confirmed) {
      const newInitialState: ProjectState = {
        files: initialFiles,
        projectName: 'Untitled Project',
        projectDescription: '',
      };
      localStorage.removeItem('n-vibe-project');
      setHistory([newInitialState]);
      setHistoryIndex(0);
    }
  }, []);

  if (!projectState) {
    return <div className="bg-gray-900 h-screen flex items-center justify-center text-gray-400">Loading Project...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTranscription={() => setIsTranscriptionOpen(true)}
        onNewProject={handleNewProject}
        saveStatus={saveStatus}
        deviceView={deviceView}
        onSetDeviceView={setDeviceView}
      />
      <main className="flex-grow flex flex-col p-4 gap-4">
        <PromptInput onGenerate={handleGenerate} onStop={handleStopGeneration} isLoading={isLoading} isEditing={hasGenerated} />
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <div className="flex-grow min-h-0">
           {isPreviewMaximized ? (
             <div className="h-full w-full">
                <PreviewWindow 
                    files={projectState.files} 
                    isMaximized={isPreviewMaximized} 
                    onToggleMaximize={() => setIsPreviewMaximized(false)} 
                    deviceView={deviceView}
                />
             </div>
           ) : (
            <SplitPane>
              <CodeEditor 
                files={projectState.files.filter(f => f.path !== 'preview.html')} 
                projectName={projectState.projectName}
                activeFile={activeFile}
                onActiveFileChange={setActiveFile}
                onFileContentChange={handleFileContentChange}
                onAddFile={handleAddFile}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
                onExplainCode={handleExplainCode}
              />
              <PreviewWindow 
                files={projectState.files} 
                isMaximized={isPreviewMaximized} 
                onToggleMaximize={() => setIsPreviewMaximized(true)} 
                deviceView={deviceView}
              />
            </SplitPane>
           )}
        </div>
      </main>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentName={projectState.projectName}
        currentDescription={projectState.projectDescription || ''}
      />
      <ExplanationModal
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        content={explanationContent}
        isLoading={isExplanationLoading}
      />
      <TranscriptionModal
        isOpen={isTranscriptionOpen}
        onClose={() => setIsTranscriptionOpen(false)}
       />
    </div>
  );
};

export default App;
