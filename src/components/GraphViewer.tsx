import React, { useEffect, useRef, useState, useMemo } from 'react';
import mermaid from 'mermaid';
import { parseMermaidGraph, findConnections } from '../utils/graphParser';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
});

interface GraphViewerProps {
  code: string;
}

export const GraphViewer: React.FC<GraphViewerProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Parse graph structure for interactivity
  const graphData = useMemo(() => parseMermaidGraph(code), [code]);

  // Render Mermaid SVG
  useEffect(() => {
    let isMounted = true;
    const renderGraph = async () => {
      try {
        if (!code.trim()) {
            setSvgContent('');
            setError(null);
            return;
        }

        const id = 'mermaid-graph-' + Date.now();
        const { svg } = await mermaid.render(id, code);

        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Mermaid Render Error:", err);
          setError("Syntax Error: Please check your mermaid code.");
        }
      }
    };

    const timeout = setTimeout(renderGraph, 500);
    return () => {
        isMounted = false;
        clearTimeout(timeout);
    };
  }, [code]);

  // Handle Node Clicks & Highlighting
  useEffect(() => {
      if (!containerRef.current || !svgContent) return;

      const svgElement = containerRef.current.querySelector('svg') as SVGElement;
      if (!svgElement) return;

      svgElement.style.width = '100%';
      svgElement.style.height = '100%';
      svgElement.style.overflow = 'visible';

      const nodes = svgElement.querySelectorAll('.node');

      const handleNodeClick = (e: Event) => {
          e.stopPropagation();
          const nodeGroup = (e.target as Element).closest('.node');
          if (!nodeGroup) return;

          const fullId = nodeGroup.id;

          let foundId = null;
          const sortedNodeIds = Array.from(graphData.nodes.keys()).sort((a, b) => b.length - a.length);

          for (const id of sortedNodeIds) {
              if (fullId.includes(`-${id}-`) || fullId.endsWith(`-${id}`)) {
                  foundId = id;
                  break;
              }
          }

          if (foundId) {
              setSelectedNode(prev => prev === foundId ? null : foundId);
          } else {
              console.warn("Could not match SVG node to Graph ID:", fullId);
          }
      };

      nodes.forEach(n => {
          (n as SVGElement).style.cursor = 'pointer';
          n.addEventListener('click', handleNodeClick);
      });

      const handleBgClick = () => setSelectedNode(null);
      containerRef.current.addEventListener('click', handleBgClick);

      return () => {
          nodes.forEach(n => n.removeEventListener('click', handleNodeClick));
          containerRef.current?.removeEventListener('click', handleBgClick);
      };
  }, [svgContent, graphData]);

  // Apply Styles based on Selection
  useEffect(() => {
      if (!containerRef.current) return;
      const svg = containerRef.current.querySelector('svg');
      if (!svg) return;

      const allNodes = svg.querySelectorAll('.node');
      const allEdges = svg.querySelectorAll('.edgePaths path, .edgeLabels');

      const setOpacity = (els: NodeListOf<Element>, op: string) => {
          els.forEach((el: Element) => {
              (el as SVGElement).style.opacity = op;
              (el as SVGElement).style.transition = 'opacity 0.3s ease, filter 0.3s ease';
          });
      };

      const colorNode = (id: string, colorClass: string) => {
           allNodes.forEach((node: Element) => {
              if (node.id.includes(`-${id}-`) || node.id.endsWith(`-${id}`)) {
                  node.classList.add(colorClass);
                  node.classList.remove('node-dimmed');
              }
           });
      };

      allNodes.forEach(n => n.classList.remove('node-dimmed', 'node-selected', 'node-dependency', 'node-dependent'));
      allEdges.forEach(e => e.classList.remove('edge-dimmed', 'edge-dependency', 'edge-dependent'));

      if (!selectedNode) {
          setOpacity(allNodes, '1');
          setOpacity(allEdges, '1');
          return;
      }

      setOpacity(allNodes, '0.1');
      setOpacity(allEdges, '0.05');

      colorNode(selectedNode, 'node-selected');

      const { dependencies, dependents } = findConnections(selectedNode, graphData.adjacency);
      dependencies.forEach(id => colorNode(id, 'node-dependency'));
      dependents.forEach(id => colorNode(id, 'node-dependent'));

  }, [selectedNode, graphData]);

  // Pan & Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const scale = 1 - e.deltaY * 0.001;
          setZoom(z => Math.max(0.1, Math.min(5, z * scale)));
      } else {
         setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
      isDragging.current = false;
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none"
         onWheel={handleWheel}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
    >
        {/* Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button className="p-2 bg-slate-800 text-slate-200 rounded shadow hover:bg-slate-700" onClick={() => setZoom(z => Math.min(5, z + 0.1))}><ZoomIn size={20}/></button>
            <button className="p-2 bg-slate-800 text-slate-200 rounded shadow hover:bg-slate-700" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}><ZoomOut size={20}/></button>
            <button className="p-2 bg-slate-800 text-slate-200 rounded shadow hover:bg-slate-700" onClick={() => { setZoom(1); setPan({x:0, y:0}); setSelectedNode(null); }}><RotateCcw size={20}/></button>
        </div>

        {error && (
            <div className="absolute top-4 left-4 z-10 bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded">
                {error}
            </div>
        )}

        <div
            ref={containerRef}
            className="w-full h-full origin-top-left transition-transform duration-75 ease-out"
            style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />

        <style>{`
            .node { transition: opacity 0.3s; }
            .node-selected rect, .node-selected circle, .node-selected polygon, .node-selected path {
                stroke: #fff !important;
                stroke-width: 4px !important;
                filter: drop-shadow(0 0 8px rgba(255,255,255,0.5));
                opacity: 1 !important;
            }

            .node-dependency rect, .node-dependency circle, .node-dependency polygon, .node-dependency path {
                stroke: #f97316 !important; /* orange-500 */
                stroke-width: 3px !important;
                opacity: 1 !important;
            }
            .node-dependency .nodeLabel { fill: #f97316 !important; font-weight: bold; }

            .node-dependent rect, .node-dependent circle, .node-dependent polygon, .node-dependent path {
                stroke: #10b981 !important; /* emerald-500 */
                stroke-width: 3px !important;
                opacity: 1 !important;
            }
            .node-dependent .nodeLabel { fill: #10b981 !important; font-weight: bold; }

            .node-dimmed { opacity: 0.1; }
        `}</style>
    </div>
  );
};
