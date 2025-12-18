import React from 'react';

interface HeaderProps {
  onLoadExample: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoadExample }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between text-white">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
          Mermaid Dependency Viewer
        </h1>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onLoadExample}
          className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md transition-colors"
        >
          Load Example
        </button>
        <a
          href="#help"
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-md transition-colors font-medium"
        >
          Help
        </a>
      </div>
    </header>
  );
};
