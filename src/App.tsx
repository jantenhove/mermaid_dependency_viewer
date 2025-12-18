import { useState } from 'react';
import { Header } from './components/Header';
import { HelpGuide } from './components/HelpGuide';
import { GraphViewer } from './components/GraphViewer';
import { EXAMPLE_GRAPH } from './constants';

function App() {
  const [input, setInput] = useState(EXAMPLE_GRAPH);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      <Header onLoadExample={() => setInput(EXAMPLE_GRAPH)} />

      <main className="flex-1 flex flex-col-reverse lg:flex-row overflow-hidden">
        {/* Left Panel: Editor */}
        <div className="w-full lg:w-1/3 flex flex-col border-t lg:border-t-0 lg:border-r border-slate-800 bg-slate-900/50">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="font-semibold text-slate-100">Editor</h2>
            <span className="text-xs text-slate-500">Auto-updates</span>
          </div>
          {/* Use a fixed height for the text area on mobile and flex-grow on desktop */}
          <textarea
            className="w-full bg-slate-950 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 h-48 lg:flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste your mermaid graph here..."
          />
          <div className="p-4 border-t border-slate-800 overflow-y-auto max-h-64">
            <HelpGuide />
          </div>
        </div>

        {/* Right Panel: Graph */}
        <div className="w-full lg:w-2/3 bg-slate-950 relative overflow-hidden flex flex-col flex-1">
          {/* Set a min-height for mobile to ensure the graph is visible */}
          <div className="relative flex-1 min-h-[50vh] lg:min-h-0">
             <GraphViewer code={input} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
