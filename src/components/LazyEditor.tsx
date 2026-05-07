import React, { Suspense, lazy } from 'react';

// Lazy load the Monaco Editor
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

interface LazyEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  defaultLanguage?: string;
  height?: string;
  theme?: string;
  options?: any;
}

const LazyEditor: React.FC<LazyEditorProps> = ({ language, defaultLanguage, ...rest }) => {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e] text-gray-500 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#D62828] border-t-transparent rounded-full animate-spin" />
          <span>Initializing Editor...</span>
        </div>
      </div>
    }>
      <MonacoEditor 
        language={language || defaultLanguage}
        {...rest}
        loading={<div className="text-gray-500">Loading Monaco...</div>}
      />
    </Suspense>
  );
};

export default LazyEditor;
