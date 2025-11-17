import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GeneratedFile } from '../types';
import { downloadCodeAsZip } from '../utils/fileUtils';
import { CopyIcon, DownloadIcon, CodeBracketIcon, EyeIcon, UndoIcon, RedoIcon, QuestionMarkCircleIcon, FilePlusIcon, WandIcon } from './Icons';

declare global {
  interface Window {
    Prism: any;
    prettier: any;
    prettierPlugins: any;
  }
}

const getLanguage = (path: string) => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js': return 'javascript';
        case 'jsx': return 'jsx';
        case 'ts': return 'typescript';
        case 'tsx': return 'tsx';
        case 'css': return 'css';
        case 'json': return 'json';
        case 'html': return 'markup'; // Prism uses 'markup' for HTML
        default: return 'clike'; // A generic default
    }
};

interface CodeEditorProps {
  files: GeneratedFile[];
  projectName: string;
  activeFile: string;
  onActiveFileChange: (path: string) => void;
  onFileContentChange: (path: string, newContent: string) => void;
  onAddFile: (path: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExplainCode: (path: string, content: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
    files, 
    projectName, 
    activeFile,
    onActiveFileChange,
    onFileContentChange,
    onAddFile,
    onUndo, 
    onRedo, 
    canUndo, 
    canRedo, 
    onExplainCode 
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [isCodeEditable, setIsCodeEditable] = useState<boolean>(false);
  
  const preRef = useRef<HTMLPreElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const currentFileContent = files.find(f => f.path === activeFile)?.content || '';
  const language = getLanguage(activeFile);
  
  useEffect(() => {
    if (window.Prism) {
        window.Prism.highlightAll();
    }
  }, [currentFileContent, activeFile]);

  // Sync scrolling between textarea and pre
  useEffect(() => {
    const preElement = preRef.current;
    const textAreaElement = textAreaRef.current;

    if (isCodeEditable && preElement && textAreaElement) {
      const syncScroll = () => {
        preElement.scrollTop = textAreaElement.scrollTop;
        preElement.scrollLeft = textAreaElement.scrollLeft;
      };
      textAreaElement.addEventListener('scroll', syncScroll);
      return () => textAreaElement.removeEventListener('scroll', syncScroll);
    }
  }, [isCodeEditable]);


  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(currentFileContent).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  }, [currentFileContent]);

  const handleDownload = useCallback(() => {
    downloadCodeAsZip(files, projectName);
  }, [files, projectName]);
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onFileContentChange(activeFile, e.target.value);
  };

  const handleExplain = useCallback(() => {
    if (activeFile && currentFileContent) {
      onExplainCode(activeFile, currentFileContent);
    }
  }, [activeFile, currentFileContent, onExplainCode]);
  
  const handleAddFileClick = () => {
    const newFilePath = window.prompt("Enter new file name/path (e.g., components/Button.tsx):");
    if (newFilePath && newFilePath.trim() !== "") {
      onAddFile(newFilePath.trim());
    }
  };

  const handleFormatCode = () => {
    if (!window.prettier || !window.prettierPlugins?.babel || !window.prettierPlugins?.html || !window.prettierPlugins?.css) {
        alert("Code formatter is not available or is still loading.");
        return;
    }

    const extension = activeFile.split('.').pop()?.toLowerCase();
    let parser: string;

    switch (extension) {
        case 'tsx':
        case 'ts':
        case 'jsx':
        case 'js':
        case 'json':
            parser = 'babel';
            break;
        case 'html':
            parser = 'html';
            break;
        case 'css':
            parser = 'css';
            break;
        default:
            console.log(`No formatter for file type: ${extension}`);
            return; // Don't format unsupported file types
    }

    try {
        const formattedCode = window.prettier.format(currentFileContent, {
            parser: parser,
            plugins: window.prettierPlugins,
            semi: true,
            singleQuote: true,
            trailingComma: 'es5',
            printWidth: 80,
            tabWidth: 2,
        });
        onFileContentChange(activeFile, formattedCode);
    } catch (error) {
        console.error("Prettier formatting error:", error);
        alert(`Could not format code. There might be a syntax error in the file.\n\n${(error as Error).message}`);
    }
  };


  // Keyboard shortcuts for Editor actions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts if a modal is open or if user is typing in an input/textarea
      if (document.querySelector('[role="dialog"]') || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'e':
            event.preventDefault();
            handleExplain();
            break;
          case 'c':
            event.preventDefault();
            handleCopy();
            break;
          case 's':
            event.preventDefault();
            handleDownload();
            break;
          case 'm':
            event.preventDefault();
            setIsCodeEditable(prev => !prev);
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [handleExplain, handleCopy, handleDownload]);


  if (!files || files.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg h-full flex items-center justify-center text-gray-500">
        <p>Code will appear here once generated.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
      <div className="flex justify-between items-center bg-gray-900/30 p-2 border-b border-gray-700/50">
        <div className="flex items-center gap-1 overflow-x-auto">
          {files.map(file => (
            <button
              key={file.path}
              onClick={() => onActiveFileChange(file.path)}
              className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${
                activeFile === file.path
                  ? 'bg-purple-600/50 text-white'
                  : 'bg-transparent text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              {file.path}
            </button>
          ))}
          <button
              onClick={handleAddFileClick}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
              title="Add New File"
            >
              <FilePlusIcon className="w-5 h-5 text-gray-400" />
            </button>
        </div>
        <div className="flex items-center gap-2 pl-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <UndoIcon className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <RedoIcon className="w-5 h-5 text-gray-400" />
            </button>

            <div className="w-px h-5 bg-gray-700/50 mx-1"></div>

            <button
              onClick={handleExplain}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
              title="Explain Code (Alt+E)"
            >
              <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={handleFormatCode}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
              title="Format Code"
            >
              <WandIcon className="w-5 h-5 text-gray-400" />
            </button>
            <button 
              onClick={() => setIsCodeEditable(!isCodeEditable)} 
              className="p-2 rounded-md hover:bg-gray-700 transition-colors" 
              title={isCodeEditable ? "Disable Editing (Alt+M)" : "Enable Manual Editing (Alt+M)"}
            >
              {isCodeEditable ? <EyeIcon className="w-5 h-5 text-purple-400" /> : <CodeBracketIcon className="w-5 h-5 text-gray-400" />}
            </button>
            <button onClick={handleCopy} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Copy Code (Alt+C)">
               {copyStatus === 'copied' ? <span className="text-green-400 text-xs">Copied!</span> : <CopyIcon className="w-5 h-5 text-gray-400" />}
            </button>
            <button onClick={handleDownload} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Download ZIP (Alt+S)">
                <DownloadIcon className="w-5 h-5 text-gray-400" />
            </button>
        </div>
      </div>
      <div className="flex-grow overflow-hidden bg-gray-900/80 relative">
        <pre ref={preRef} className="line-numbers h-full overflow-auto p-4" style={{ tabSize: 4, MozTabSize: 4 }}>
          <code className={`language-${language}`}>{currentFileContent}</code>
        </pre>
        {isCodeEditable && (
             <textarea
                ref={textAreaRef}
                value={currentFileContent}
                onChange={handleContentChange}
                spellCheck="false"
                className="absolute top-0 left-0 w-full h-full border-0 outline-none resize-none overflow-auto p-4 bg-transparent"
                style={{
                  fontFamily: "'Fira Code', 'Dank Mono', 'Operator Mono', monospace",
                  fontSize: '14px',
                  lineHeight: '21px', // Match Prism's line height
                  tabSize: 4,
                  MozTabSize: 4,
                  paddingLeft: '3.8em', // Match line-numbers padding
                  color: 'transparent',
                  caretColor: 'white',
                }}
            />
        )}
      </div>
    </div>
  );
};