import type { AnimationStep, GraphEdge, GraphNode, GraphScene, StepResult } from '../animation-engine';

/**
 * Generates animation steps for Kruskal's MST algorithm on a fixed
 * 7-node weighted undirected graph.
 *
 * Steps:
 *   1. Sort all edges by weight
 *   2. Process edges in order — use union-find to accept or reject
 *   3. Accept edges that connect different components, reject cycles
 *
 * Returns { steps, initialScene } for the graph renderer.
 */

const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const NODE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 0.50, y: 0.08 }, // 0: A
  { x: 0.20, y: 0.30 }, // 1: B
  { x: 0.80, y: 0.30 }, // 2: C
  { x: 0.10, y: 0.62 }, // 3: D
  { x: 0.40, y: 0.62 }, // 4: E
  { x: 0.60, y: 0.62 }, // 5: F
  { x: 0.90, y: 0.62 }, // 6: G
];

const GRAPH_EDGES: GraphEdge[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 2, weight: 8 },
  { from: 1, to: 2, weight: 11 },
  { from: 1, to: 3, weight: 8 },
  { from: 1, to: 4, weight: 2 },
  { from: 2, to: 5, weight: 1 },
  { from: 2, to: 6, weight: 7 },
  { from: 3, to: 4, weight: 7 },
  { from: 4, to: 5, weight: 6 },
  { from: 5, to: 6, weight: 2 },
];

const GRAPH_NODES: GraphNode[] = NODE_LABELS.map((label, i) => ({
  id: i,
  label,
  x: NODE_POSITIONS[i].x,
  y: NODE_POSITIONS[i].y,
}));

function edgesNoHighlight(): GraphEdge[] {
  return GRAPH_EDGES.map(e => ({ ...e, highlighted: false }));
}

function edgesWithHighlight(idx: number): GraphEdge[] {
  return GRAPH_EDGES.map((e, i) => ({ ...e, highlighted: i === idx }));
}

function edgesWithMST(mstSet: Set<number>, considerIdx?: number): GraphEdge[] {
  return GRAPH_EDGES.map((e, i) => ({
    ...e,
    highlighted: i === considerIdx || mstSet.has(i),
  }));
}

export function generateKruskalSteps(arr: number[]): StepResult {
  const n = GRAPH_NODES.length;
  const steps: AnimationStep[] = [];

  // Union-Find
  const parent: number[] = Array.from({ length: n }, (_, i) => i);
  const rank: number[] = Array(n).fill(0);

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  function union(a: number, b: number): boolean {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else { parent[rb] = ra; rank[ra]++; }
    return true;
  }

  // Sort edges by weight
  const sortedIndices = GRAPH_EDGES
    .map((_, i) => i)
    .sort((a, b) => (GRAPH_EDGES[a].weight ?? 0) - (GRAPH_EDGES[b].weight ?? 0));

  const nodeStates: Record<number, string> = {};
  for (let i = 0; i < n; i++) nodeStates[i] = 'unvisited';

  const mstEdges = new Set<number>();
  let mstWeight = 0;
  let acceptedCount = 0;

  // Initial step
  steps.push({
    type: 'compare',
    indices: [],
    description: `Kruskal's algorithm — sorting ${GRAPH_EDGES.length} edges by weight`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesNoHighlight(),
      nodeStates: { ...nodeStates },
    } as GraphScene,
  });

  for (const edgeIdx of sortedIndices) {
    const edge = GRAPH_EDGES[edgeIdx];
    const u = edge.from;
    const v = edge.to;
    const w = edge.weight ?? 0;

    // Consider this edge
    steps.push({
      type: 'compare',
      indices: [u, v],
      description: `Considering edge ${NODE_LABELS[u]}–${NODE_LABELS[v]} (w=${w}) — cheapest remaining`,
      sceneUpdate: {
        type: 'graph',
        nodes: GRAPH_NODES,
        edges: edgesWithMST(mstEdges, edgeIdx),
        nodeStates: { ...nodeStates, [u]: 'visiting', [v]: 'visiting' },
      } as GraphScene,
    });

    if (union(u, v)) {
      // Accept — connects two different components
      mstEdges.add(edgeIdx);
      mstWeight += w;
      acceptedCount++;
      nodeStates[u] = 'finalized';
      nodeStates[v] = 'finalized';

      steps.push({
        type: 'swap',
        indices: [u, v],
        description: `Accepted ${NODE_LABELS[u]}–${NODE_LABELS[v]} (w=${w}) — connects different components. MST weight = ${mstWeight}`,
        sceneUpdate: {
          type: 'graph',
          nodes: GRAPH_NODES,
          edges: edgesWithMST(mstEdges),
          nodeStates: { ...nodeStates },
          distanceLabels: { [u]: `${NODE_LABELS[u]}`, [v]: `${NODE_LABELS[v]}` },
        } as GraphScene,
      });
    } else {
      // Reject — would create a cycle
      steps.push({
        type: 'compare',
        indices: [u, v],
        description: `Rejected ${NODE_LABELS[u]}–${NODE_LABELS[v]} (w=${w}) — would create a cycle`,
        sceneUpdate: {
          type: 'graph',
          nodes: GRAPH_NODES,
          edges: edgesWithMST(mstEdges),
          nodeStates: { ...nodeStates },
        } as GraphScene,
      });
    }

    // Early termination — MST has n-1 edges
    if (acceptedCount === n - 1) break;
  }

  // Mark all nodes finalized
  for (let i = 0; i < n; i++) nodeStates[i] = 'finalized';

  steps.push({
    type: 'done',
    indices: [],
    description: `Kruskal's complete — MST has ${acceptedCount} edges, total weight = ${mstWeight}`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesWithMST(mstEdges),
      nodeStates: { ...nodeStates },
    } as GraphScene,
  });

  const initialScene: GraphScene = {
    type: 'graph',
    nodes: GRAPH_NODES,
    edges: edgesNoHighlight(),
    nodeStates: Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'unvisited'])),
  };

  return { steps, initialScene };
}
