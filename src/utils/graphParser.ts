export interface GraphNode {
  id: string;
  label?: string;
  type?: string; // e.g., "db" for [()]
}

export interface GraphEdge {
  source: string;
  target: string;
  type?: string; // e.g., "-->"
}

export interface GraphData {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  adjacency: Map<string, { incoming: string[]; outgoing: string[] }>;
}

export const parseMermaidGraph = (text: string): GraphData => {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const adjacency = new Map<string, { incoming: string[]; outgoing: string[] }>();

  // Helper to ensure adjacency entry exists
  const ensureAdjacency = (id: string) => {
    if (!adjacency.has(id)) {
      adjacency.set(id, { incoming: [], outgoing: [] });
    }
  };

  // Helper to add node if not exists
  const addNode = (id: string, label?: string, type?: string) => {
    if (!nodes.has(id)) {
      nodes.set(id, { id, label: label || id, type });
    } else {
        // Update label if it was previously just the ID but now has a label
        const existing = nodes.get(id)!;
        if (label && existing.label === existing.id) {
            existing.label = label;
        }
        if (type && !existing.type) {
            existing.type = type;
        }
    }
    ensureAdjacency(id);
  };

  const lines = text.split('\n');

  lines.forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('%%') || line.startsWith('graph ')) return;

    // Check for Edge
    if (line.includes('-->')) {
        const parts = line.split(/-->/);
        // Assuming binary connections for now: A --> B --> C
        for (let i = 0; i < parts.length - 1; i++) {
            const sourceRaw = parts[i].trim();
            const targetRaw = parts[i+1].trim();

            // Extract node info
            const sourceNode = parseNodeString(sourceRaw);
            const targetNode = parseNodeString(targetRaw);

            if (sourceNode && targetNode) {
                addNode(sourceNode.id, sourceNode.label, sourceNode.type);
                addNode(targetNode.id, targetNode.label, targetNode.type);

                edges.push({ source: sourceNode.id, target: targetNode.id });

                ensureAdjacency(sourceNode.id);
                ensureAdjacency(targetNode.id);

                adjacency.get(sourceNode.id)!.outgoing.push(targetNode.id);
                adjacency.get(targetNode.id)!.incoming.push(sourceNode.id);
            }
        }
    } else {
        // Might be a single node definition
        const node = parseNodeString(line);
        if (node) {
            addNode(node.id, node.label, node.type);
        }
    }
  });

  return { nodes, edges, adjacency };
};

const parseNodeString = (raw: string): { id: string; label: string; type?: string } | null => {
    // raw might be "id" or "id[label]" or "id[(label)]"
    // We need to identify the ID (first alphanumeric sequence) and the rest

    // Sanitize
    raw = raw.trim();
    if (!raw) return null;

    // Regex to match "ID" then optional "ShapeStart Label ShapeEnd"
    // ID: [a-zA-Z0-9_\-]+
    const match = raw.match(/^([a-zA-Z0-9_\-]+)(.*)$/);
    if (!match) return null;

    const id = match[1];
    let label = id; // Default label is ID
    let type = undefined;

    const rest = match[2].trim();
    if (rest) {
        // Check for brackets
        const firstChar = rest[0];
        const lastChar = rest[rest.length - 1];

        if ( (firstChar === '[' || firstChar === '(' || firstChar === '{') &&
             (lastChar === ']' || lastChar === ')' || lastChar === '}') ) {

             // Extract inner label.
             if (rest.startsWith('[(') && rest.endsWith(')]')) {
                 type = 'database';
                 label = rest.slice(2, -2);
             } else {
                 label = rest.slice(1, -1);
             }
        }
    }

    return { id, label, type };
}

export const findConnections = (
  startNodeId: string,
  adjacency: Map<string, { incoming: string[]; outgoing: string[] }>
) => {
    const dependencies = new Set<string>(); // Upstream (what I depend on) -> outgoing edges?

    const visitedUp = new Set<string>();
    const stackUp = [startNodeId];
    while (stackUp.length > 0) {
        const curr = stackUp.pop()!;
        if (visitedUp.has(curr)) continue;
        visitedUp.add(curr);

        if (curr !== startNodeId) dependencies.add(curr);

        const outgoing = adjacency.get(curr)?.outgoing || [];
        for (const next of outgoing) {
            stackUp.push(next);
        }
    }

    const dependents = new Set<string>(); // Downstream (what depends on me) -> incoming edges
    const visitedDown = new Set<string>();
    const stackDown = [startNodeId];
    while (stackDown.length > 0) {
        const curr = stackDown.pop()!;
        if (visitedDown.has(curr)) continue;
        visitedDown.add(curr);

        if (curr !== startNodeId) dependents.add(curr);

        const incoming = adjacency.get(curr)?.incoming || [];
        for (const next of incoming) {
            stackDown.push(next);
        }
    }

    return {
        dependencies: Array.from(dependencies),
        dependents: Array.from(dependents)
    };
};
