import { parseMermaidGraph, findConnections } from './graphParser';

const testGraph = `graph TD
  A[Node A] --> B[Node B]
  B --> C
  A --> D
  D --> E
`;

console.log("Testing Graph Parser...");

const graph = parseMermaidGraph(testGraph);

console.log("Nodes found:", Array.from(graph.nodes.keys()));
if (graph.nodes.has('A') && graph.nodes.has('B') && graph.nodes.has('E')) {
    console.log("PASS: Nodes identified correctly.");
} else {
    console.error("FAIL: Missing nodes.");
}

const connectionsA = findConnections('A', graph.adjacency);
console.log("Connections for A:", connectionsA);

const depsA = new Set(connectionsA.dependencies);
if (depsA.has('B') && depsA.has('D') && depsA.has('C') && depsA.has('E')) {
    console.log("PASS: Transitive dependencies correct.");
} else {
    console.error("FAIL: Incorrect dependencies for A.");
}

const connectionsC = findConnections('C', graph.adjacency);
console.log("Connections for C (dependents):", connectionsC.dependents);

const depsC = new Set(connectionsC.dependents);
if (depsC.has('B') && depsC.has('A')) {
    console.log("PASS: Transitive dependents correct.");
} else {
    console.error("FAIL: Incorrect dependents for C.");
}
