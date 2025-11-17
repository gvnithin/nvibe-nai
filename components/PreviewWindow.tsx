
import React, { useMemo, useState, useCallback } from 'react';
import type { GeneratedFile, DeviceView } from '../types';
import { MaximizeIcon, MinimizeIcon, RefreshIcon } from './Icons';

interface PreviewWindowProps {
  files: GeneratedFile[];
  isMaximized: boolean;
  onToggleMaximize: () => void;
  deviceView: DeviceView;
}

export const PreviewWindow: React.FC<PreviewWindowProps> = ({ files, isMaximized, onToggleMaximize, deviceView }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const previewHtml = useMemo(() => {
    return files.find(f => f.path === 'preview.html')?.content || '<p class="p-4 text-gray-500">Preview not available.</p>';
  }, [files]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  const deviceWidths: Record<DeviceView, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  const iframeWidth = deviceWidths[deviceView];

  return (
    <div className="h-full flex flex-col bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
       <div className="flex items-center justify-end gap-1 bg-gray-900/30 py-1 px-2 border-b border-gray-700/50 flex-shrink-0">
          <button 
            onClick={handleRefresh} 
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" 
            title="Refresh Preview"
            aria-label="Refresh Preview"
          >
            <RefreshIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={onToggleMaximize} 
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" 
            title={isMaximized ? "Minimize Preview" : "Maximize Preview"}
            aria-label={isMaximized ? "Minimize Preview" : "Maximize Preview"}
          >
            {isMaximized ? <MinimizeIcon className="w-4 h-4" /> : <MaximizeIcon className="w-4 h-4" />}
          </button>
       </div>
       <div className="w-full flex-grow p-4 overflow-auto bg-gray-700/30 flex justify-center">
        <div
            className="bg-white shadow-2xl rounded-md transition-all duration-300 ease-in-out flex-shrink-0"
            style={{ width: iframeWidth, height: '100%' }}
        >
            <iframe
                key={refreshKey}
                srcDoc={previewHtml}
                title="App Preview"
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full border-0 rounded-md"
            />
        </div>
      </div>
    </div>
  );
};
