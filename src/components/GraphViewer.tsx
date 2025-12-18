import React, { useEffect, useRef, useState, useMemo } from 'react';
import mermaid from 'mermaid';
import { parseMermaidGraph, findConnections } from '../utils/graphParser';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  flowchart: {
      padding: 20
  }
});

interface GraphViewerProps {
  code: string;
  searchTerm: string;
}

export const GraphViewer: React.FC<GraphViewerProps> = ({ code, searchTerm }) => {
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
          // Clean up the SVG output to remove height/width attributes that mess with scaling
          const parser = new DOMParser();
          const doc = parser.parseFromString(svg, "image/svg+xml");
          const svgEl = doc.querySelector('svg');
          if (svgEl) {
            svgEl.removeAttribute('height');
            svgEl.removeAttribute('width');
            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
            setSvgContent(svgEl.outerHTML);
          } else {
             setSvgContent(svg);
          }
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Mermaid Render Error:", err);
          setError("Syntax Error: Please check your mermaid code.");
        }
      }
    };

    // Debounce render
    const timeout = setTimeout(renderGraph, 500);
    return () => {
        isMounted = false;
        clearTimeout(timeout);
    };
  }, [code]);

  // When searching, clear selection
  useEffect(() => {
    if (searchTerm) {
      setSelectedNode(null);
    }
  }, [searchTerm]);

  // Apply Styles based on Selection OR Search
  useEffect(() => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const allNodes = svg.querySelectorAll('.node');
    const allEdges = svg.querySelectorAll('.edgePaths .edgePath, .edgePaths path, .edgeLabels');

    const setOpacity = (els: NodeListOf<Element>, op: string) => {
        els.forEach((el: Element) => {
            (el as SVGElement).style.opacity = op;
            (el as SVGElement).style.transition = 'opacity 0.3s ease';
        });
    };

    const findNodeIdFromSvgId = (svgId: string, nodes: Map<string, any>): string | null => {
        const sortedNodeIds = Array.from(nodes.keys()).sort((a, b) => b.length - a.length);
        for (const id of sortedNodeIds) {
            if (svgId === id || svgId.includes(`-${id}-`) || svgId.endsWith(`-${id}`) || svgId.startsWith(`${id}-`)) {
                return id;
            }
        }
        return null;
    };

    const applyClassToNode = (nodeId: string, className: string) => {
        allNodes.forEach((nodeEl: Element) => {
            const foundId = findNodeIdFromSvgId(nodeEl.id, graphData.nodes);
            if (foundId === nodeId) {
                nodeEl.classList.add(className);
                (nodeEl as SVGElement).style.opacity = '1';
            }
        });
    };

    // Reset all styles first
    allNodes.forEach(n => {
        n.classList.remove('node-dimmed', 'node-selected', 'node-dependency', 'node-dependency-sub', 'node-dependent', 'node-dependent-sub', 'node-search-match');
    });
    allEdges.forEach(e => {
        e.classList.remove('edge-dimmed', 'edge-dependency', 'edge-dependency-sub', 'edge-dependent', 'edge-dependent-sub');
    });
    setOpacity(allNodes, '1');
    setOpacity(allEdges, '1');

    // Search logic takes precedence
    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const matchedNodeIds = new Set<string>();

        graphData.nodes.forEach((node, id) => {
            if (id.toLowerCase().includes(lowerCaseSearchTerm) || node.label.toLowerCase().includes(lowerCaseSearchTerm)) {
                matchedNodeIds.add(id);
            }
        });

        // Dim everything first
        setOpacity(allNodes, '0.1');
        setOpacity(allEdges, '0.05');

        if (matchedNodeIds.size === 0) return; // Nothing to highlight

        const nodesToHighlight = new Set<string>(matchedNodeIds);
        matchedNodeIds.forEach(id => {
            const connections = graphData.adjacency.get(id);
            connections?.incoming.forEach(inc => nodesToHighlight.add(inc));
            connections?.outgoing.forEach(out => nodesToHighlight.add(out));
        });

        allNodes.forEach((node: Element) => {
            const nodeId = findNodeIdFromSvgId(node.id, graphData.nodes);
            if (nodeId && nodesToHighlight.has(nodeId)) {
                (node as SVGElement).style.opacity = '1';
                if (matchedNodeIds.has(nodeId)) {
                    node.classList.add('node-search-match');
                }
            }
        });

        graphData.edges.forEach(edge => {
            if (nodesToHighlight.has(edge.source) && nodesToHighlight.has(edge.target)) {
                const selector = `.LS-${edge.source}.LE-${edge.target}`;
                svg.querySelectorAll(selector).forEach(el => {
                    (el as SVGElement).style.opacity = '1';
                });
            }
        });
    } else if (selectedNode) {
        // Dim all first
        setOpacity(allNodes, '0.1');
        setOpacity(allEdges, '0.05');

        applyClassToNode(selectedNode, 'node-selected');

        const { dependencies, dependents } = findConnections(selectedNode, graphData.adjacency);

        const directDependencies = graphData.adjacency.get(selectedNode)?.outgoing || [];
        const subDependencies = dependencies.filter(id => !directDependencies.includes(id) && id !== selectedNode);
        directDependencies.forEach(id => applyClassToNode(id, 'node-dependency'));
        subDependencies.forEach(id => applyClassToNode(id, 'node-dependency-sub'));

        const directDependents = graphData.adjacency.get(selectedNode)?.incoming || [];
        const subDependents = dependents.filter(id => !directDependents.includes(id) && id !== selectedNode);
        directDependents.forEach(id => applyClassToNode(id, 'node-dependent'));
        subDependents.forEach(id => applyClassToNode(id, 'node-dependent-sub'));

        const highlightedIds = new Set([selectedNode, ...dependencies, ...dependents]);
        graphData.edges.forEach(edge => {
            if (highlightedIds.has(edge.source) && highlightedIds.has(edge.target)) {
                const selector = `.LS-${edge.source}.LE-${edge.target}`;
                const els = svg.querySelectorAll(selector);
                let className = '';
                if (edge.source === selectedNode) className = 'edge-dependency';
                else if (dependencies.includes(edge.source) && dependencies.includes(edge.target)) className = 'edge-dependency-sub';
                else if (edge.target === selectedNode) className = 'edge-dependent';
                else if (dependents.includes(edge.source) && dependents.includes(edge.target)) className = 'edge-dependent-sub';

                if (className) {
                    els.forEach(el => {
                        el.classList.add(className);
                        (el as SVGElement).style.opacity = '1';
                    });
                }
            }
        });
    }
  }, [selectedNode, graphData, svgContent, searchTerm]);

  // Pan & Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const scale = 1 - e.deltaY * 0.001;
      setZoom(z => Math.max(0.1, Math.min(5, z * scale)));
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

  const handleClick = (e: React.MouseEvent) => {
      const target = e.target as Element;

      // Ignore clicks on controls (buttons)
      if (target.closest('button')) return;

      const nodeGroup = target.closest('.node');

      if (nodeGroup) {
          const fullId = nodeGroup.id;
          let foundId = null;
          // Sort by length descending to match longest possible ID first
          const sortedNodeIds = Array.from(graphData.nodes.keys()).sort((a, b) => b.length - a.length);

          for (const id of sortedNodeIds) {
              if (fullId === id ||
                  fullId.includes(`-${id}-`) ||
                  fullId.endsWith(`-${id}`) ||
                  fullId.startsWith(`${id}-`)) {
                  foundId = id;
                  break;
              }
          }

          if (foundId) {
              setSelectedNode(prev => prev === foundId ? null : foundId);
              return;
          }
      }

      // Background click
      setSelectedNode(null);
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none"
         onWheel={handleWheel}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
         onClick={handleClick}
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
            .node { transition: opacity 0.3s; cursor: pointer; }
            .node rect, .node circle, .node polygon, .node path { pointer-events: all; }

            span.nodeLabel {
                padding: 0 10px !important;
                display: inline-block;
            }

            /* Selected */
            .node-selected rect, .node-selected circle, .node-selected polygon, .node-selected path {
                stroke: #fff !important;
                stroke-width: 4px !important;
                filter: drop-shadow(0 0 8px rgba(255,255,255,0.5));
                opacity: 1 !important;
            }

            /* Search Match */
            .node-search-match rect, .node-search-match circle, .node-search-match polygon, .node-search-match path {
                stroke: #38bdf8 !important; /* light-blue-400 */
                stroke-width: 4px !important;
                opacity: 1 !important;
            }
            .node-search-match .nodeLabel { fill: #38bdf8 !important; font-weight: bold; }

            /* Direct Dependency (Darker Orange) */
            .node-dependency rect, .node-dependency circle, .node-dependency polygon, .node-dependency path {
                stroke: #ea580c !important; /* orange-600 */
                stroke-width: 3px !important;
                opacity: 1 !important;
            }
            .node-dependency .nodeLabel { fill: #ea580c !important; font-weight: bold; }

            /* Sub Dependency (Lighter Orange + Dashed) */
            .node-dependency-sub rect, .node-dependency-sub circle, .node-dependency-sub polygon, .node-dependency-sub path {
                stroke: #fdba74 !important; /* orange-300 */
                stroke-width: 3px !important;
                stroke-dasharray: 6 3;
                opacity: 1 !important;
            }
            .node-dependency-sub .nodeLabel { fill: #fdba74 !important; font-weight: bold; }

            /* Direct Dependent (Darker Green) */
            .node-dependent rect, .node-dependent circle, .node-dependent polygon, .node-dependent path {
                stroke: #059669 !important; /* emerald-600 */
                stroke-width: 3px !important;
                opacity: 1 !important;
            }
            .node-dependent .nodeLabel { fill: #059669 !important; font-weight: bold; }

            /* Sub Dependent (Lighter Green + Dashed) */
            .node-dependent-sub rect, .node-dependent-sub circle, .node-dependent-sub polygon, .node-dependent-sub path {
                stroke: #6ee7b7 !important; /* emerald-300 */
                stroke-width: 3px !important;
                stroke-dasharray: 6 3;
                opacity: 1 !important;
            }
            .node-dependent-sub .nodeLabel { fill: #6ee7b7 !important; font-weight: bold; }

            .node-dimmed { opacity: 0.1; }

            /* Edges */
            .edgePath path { transition: opacity 0.3s, stroke 0.3s, stroke-width 0.3s; }

            .edge-dependency {
                stroke: #ea580c !important;
                stroke-width: 2px !important;
                opacity: 1 !important;
            }

            .edge-dependency-sub {
                stroke: #fdba74 !important;
                stroke-width: 2px !important;
                stroke-dasharray: 6 3;
                opacity: 1 !important;
            }

            .edge-dependent {
                stroke: #059669 !important;
                stroke-width: 2px !important;
                opacity: 1 !important;
            }

            .edge-dependent-sub {
                stroke: #6ee7b7 !important;
                stroke-width: 2px !important;
                stroke-dasharray: 6 3;
                opacity: 1 !important;
            }

            .edge-dimmed { opacity: 0.05; }
        `}</style>
    </div>
  );
};
