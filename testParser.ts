import { parseMermaidGraph, findConnections } from './src/utils/graphParser';

const testGraph = `
graph TD mongo[(mongo)] otel[otel] rabbitmq[rabbitmq] assets[assets]

inventory-service[inventory-service]
reset-service[reset-service]
shuttle-service[shuttle-service]
workflow-service[workflow-service]
tmissionmanagement-service[tmissionmanagement-service]
mission-management[mission-management]

StorageReservation[Tmhls.StorageReservation]
StorageLayout[Tmhls.StorageLayout]
Layout[Tmhls.Layout]
LayoutAdapter[Tmhls.LayoutAdapter]
LocationGroup[Tmhls.LocationGroup]

%% StorageReservation dependencies
StorageReservation --> mongo
StorageReservation --> otel
StorageReservation --> rabbitmq
StorageReservation --> StorageLayout
StorageReservation --> inventory-service

%% StorageReservation dependents
reset-service --> StorageReservation
shuttle-service --> StorageReservation
workflow-service --> StorageReservation
`;

console.log("Parsing test graph...");
const data = parseMermaidGraph(testGraph);

console.log(`Nodes found: ${data.nodes.size}`);
console.log(`Edges found: ${data.edges.length}`);

// Test StorageReservation
const targetId = 'StorageReservation';
console.log(`\nAnalyzing node: ${targetId}`);
const connections = findConnections(targetId, data.adjacency);

console.log('Dependencies (Outgoing from node):', connections.dependencies);
console.log('Dependents (Incoming to node):', connections.dependents);

// Expected Dependencies of StorageReservation:
// mongo, otel, rabbitmq, StorageLayout, inventory-service
// AND recursive dependencies of StorageLayout etc.

// StorageLayout dependencies: mongo, otel, rabbitmq.
// So dependencies list should definitely include mongo, otel, rabbitmq, StorageLayout, inventory-service.

// Expected Dependents of StorageReservation:
// reset-service, shuttle-service, workflow-service.

if (connections.dependencies.includes('mongo') && connections.dependencies.includes('StorageLayout')) {
    console.log("SUCCESS: Dependencies found.");
} else {
    console.error("FAILURE: Dependencies missing.");
}

if (connections.dependents.includes('workflow-service')) {
    console.log("SUCCESS: Dependents found.");
} else {
    console.error("FAILURE: Dependents missing.");
}
