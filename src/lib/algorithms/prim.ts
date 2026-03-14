import type { AnimationStep, GraphEdge, GraphNode, GraphScene, StepResult } from '../animation-engine';

/**
 * Generates animation steps for Prim's MST algorithm on a fixed
 * 7-node weighted undirected graph.
 *
 * Steps:
 *   1. Start from node A — add it to the MST
 *   2. Greedily add the cheapest edge connecting an MST node to a non-MST node
 *   3. Repeat until all nodes are in the MST
 *
 * Returns { steps, initialScene } for the graph renderer.
 */

interface InternalEdge {
  to: number;
  weight: number;
}

const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const NODE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 0.50, y: 0.08 }, // 0: A
  { x: 0.22, y: 0.35 }, // 1: B
  { x: 0.78, y: 0.35 }, // 2: C
  { x: 0.10, y: 0.68 }, // 3: D
  { x: 0.38, y: 0.68 }, // 4: E
  { x: 0.62, y: 0.68 }, // 5: F
  { x: 0.90, y: 0.68 }, // 6: G
];

const ADJACENCY: InternalEdge[][] = [
  /* 0(A) */ [{ to: 1, weight: 4 }, { to: 2, weight: 8 }],
  /* 1(B) */ [{ to: 0, weight: 4 }, { to: 2, weight: 11 }, { to: 3, weight: 8 }, { to: 4, weight: 2 }],
  /* 2(C) */ [{ to: 0, weight: 8 }, { to: 1, weight: 11 }, { to: 5, weight: 1 }, { to: 6, weight: 7 }],
  /* 3(D) */ [{ to: 1, weight: 8 }, { to: 4, weight: 7 }],
  /* 4(E) */ [{ to: 1, weight: 2 }, { to: 3, weight: 7 }, { to: 5, weight: 6 }],
  /* 5(F) */ [{ to: 2, weight: 1 }, { to: 4, weight: 6 }, { to: 6, weight: 2 }],
  /* 6(G) */ [{ to: 2, weight: 7 }, { to: 5, weight: 2 }],
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

function findEdgeIdx(u: number, v: number): number {
  return GRAPH_EDGES.findIndex(
    e => (e.from === u && e.to === v) || (e.from === v && e.to === u)
  );
}

function buildEdges(mstEdgeIndices: Set<number>, highlightIdx?: number): GraphEdge[] {
  return GRAPH_EDGES.map((e, i) => ({
    ...e,
    highlighted: i === highlightIdx || mstEdgeIndices.has(i),
  }));
}

function edgesNoHighlight(): GraphEdge[] {
  return GRAPH_EDGES.map(e => ({ ...e, highlighted: false }));
}

export function generatePrimSteps(arr: number[]): StepResult {
  const n = ADJACENCY.length;
  const source = arr.length > 0 ? arr.length % n : 0;
  const steps: AnimationStep[] = [];

  const inMST: boolean[] = Array(n).fill(false);
  const nodeStates: Record<number, string> = {};
  for (let i = 0; i < n; i++) nodeStates[i] = 'unvisited';

  const mstEdgeIndices = new Set<number>();
  let mstWeight = 0;

  // Start from source node
  inMST[source] = true;
  nodeStates[source] = 'finalized';

  steps.push({
    type: 'compare',
    indices: [source],
    description: `Starting Prim's from node ${NODE_LABELS[source]} — added to MST`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesNoHighlight(),
      nodeStates: { ...nodeStates },
    } as GraphScene,
  });

  // Mark frontier nodes
  for (const edge of ADJACENCY[source]) {
    if (!inMST[edge.to]) {
      nodeStates[edge.to] = 'queued';
    }
  }

  steps.push({
    type: 'compare',
    indices: [source],
    description: `Frontier nodes from ${NODE_LABELS[source]}: ${ADJACENCY[source].filter(e => !inMST[e.to]).map(e => NODE_LABELS[e.to]).join(', ')}`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesNoHighlight(),
      nodeStates: { ...nodeStates },
    } as GraphScene,
  });

  for (let iter = 1; iter < n; iter++) {
    // Find cheapest edge from MST to non-MST
    let bestU = -1;
    let bestV = -1;
    let bestW = Infinity;

    for (let u = 0; u < n; u++) {
      if (!inMST[u]) continue;
      for (const edge of ADJACENCY[u]) {
        if (!inMST[edge.to] && edge.weight < bestW) {
          bestU = u;
          bestV = edge.to;
          bestW = edge.weight;
        }
      }
    }

    if (bestU === -1) break;

    const edgeIdx = findEdgeIdx(bestU, bestV);

    // Show considering the cheapest edge
    steps.push({
      type: 'compare',
      indices: [bestU, bestV],
      description: `Cheapest crossing edge: ${NODE_LABELS[bestU]}–${NODE_LABELS[bestV]} (w=${bestW})`,
      sceneUpdate: {
        type: 'graph',
        nodes: GRAPH_NODES,
        edges: buildEdges(mstEdgeIndices, edgeIdx),
        nodeStates: { ...nodeStates, [bestV]: 'visiting' },
      } as GraphScene,
    });

    // Add to MST
    inMST[bestV] = true;
    mstEdgeIndices.add(edgeIdx);
    mstWeight += bestW;
    nodeStates[bestV] = 'finalized';

    steps.push({
      type: 'swap',
      indices: [bestU, bestV],
      description: `Added ${NODE_LABELS[bestV]} to MST via edge ${NODE_LABELS[bestU]}–${NODE_LABELS[bestV]} (w=${bestW}). MST weight = ${mstWeight}`,
      sceneUpdate: {
        type: 'graph',
        nodes: GRAPH_NODES,
        edges: buildEdges(mstEdgeIndices),
        nodeStates: { ...nodeStates },
      } as GraphScene,
    });

    // Update frontier
    for (const edge of ADJACENCY[bestV]) {
      if (!inMST[edge.to] && nodeStates[edge.to] !== 'queued') {
        nodeStates[edge.to] = 'queued';
      }
    }

    steps.push({
      type: 'sorted',
      indices: [bestV],
      description: `Node ${NODE_LABELS[bestV]} finalized — updating frontier`,
      sceneUpdate: {
        type: 'graph',
        nodes: GRAPH_NODES,
        edges: buildEdges(mstEdgeIndices),
        nodeStates: { ...nodeStates },
      } as GraphScene,
    });
  }

  // Done
  for (let i = 0; i < n; i++) nodeStates[i] = 'finalized';

  steps.push({
    type: 'done',
    indices: [],
    description: `Prim's complete — MST has ${mstEdgeIndices.size} edges, total weight = ${mstWeight}`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: buildEdges(mstEdgeIndices),
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
