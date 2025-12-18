import React from 'react';
import { Info } from 'lucide-react';

export const HelpGuide: React.FC = () => {
  return (
    <div id="help" className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-slate-300 space-y-4">
      <div className="flex items-center gap-2 text-white">
        <Info className="w-5 h-5" />
        <h2 className="text-lg font-semibold">How to use</h2>
      </div>
      <p>
        Paste your Mermaid <code>graph TD</code> code in the editor. The viewer automatically analyzes the dependencies.
      </p>
      <div className="space-y-2">
        <h3 className="text-white font-medium">Interactivity</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><span className="text-white font-bold">Click a node</span> to focus on it.</li>
          <li><span className="text-orange-400 font-bold">Orange</span> nodes/edges are <span className="font-semibold">Dependencies</span> (Upstream / Needs).</li>
          <li><span className="text-emerald-400 font-bold">Green</span> nodes/edges are <span className="font-semibold">Dependents</span> (Downstream / Needed by).</li>
          <li>Click the background to reset the view.</li>
        </ul>
      </div>
      <div className="space-y-2">
        <h3 className="text-white font-medium">Supported Format</h3>
        <pre className="bg-slate-950 p-3 rounded text-xs overflow-x-auto border border-slate-800">
{`graph TD
  ServiceA[Service A]
  ServiceB[Service B]
  Database[(DB)]

  ServiceA --> ServiceB
  ServiceB --> Database`}
        </pre>
      </div>
    </div>
  );
};
