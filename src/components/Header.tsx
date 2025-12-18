import React from 'react';
import { Search, X } from 'lucide-react';

interface HeaderProps {
  onLoadExample: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadExample,
  searchTerm,
  onSearchChange,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between text-white gap-4">
      {/* Left side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
          Mermaid Dependency Viewer
        </h1>
      </div>

      {/* Middle - Search */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={20}
          />
          <input
            type="text"
            placeholder="Search for a node..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-md pl-10 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-colors"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex gap-4 flex-shrink-0">
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
