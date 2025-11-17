
import React, { useState, useRef, useCallback } from 'react';

interface SplitPaneProps {
  children: [React.ReactNode, React.ReactNode];
}

export const SplitPane: React.FC<SplitPaneProps> = ({ children }) => {
  const [split, setSplit] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newSplit = ((e.clientX - rect.left) / rect.width) * 100;
    if (newSplit > 10 && newSplit < 90) {
      setSplit(newSplit);
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      <div style={{ width: `${split}%` }} className="h-full pr-1">
        {children[0]}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className="w-2 h-full cursor-col-resize flex items-center justify-center group"
      >
        <div className="w-0.5 h-1/4 bg-gray-700 group-hover:bg-purple-500 rounded-full transition-colors"></div>
      </div>
      <div style={{ width: `${100 - split}%` }} className="h-full pl-1">
        {children[1]}
      </div>
    </div>
  );
};
