import type { AnimationStep, GraphEdge, GraphNode, GraphScene, StepResult } from '../animation-engine';

/**
 * Generates animation steps for Topological Sort (Kahn's algorithm)
 * on a fixed 8-node directed acyclic graph.
 *
 * Steps:
 *   1. Compute in-degrees for all nodes
 *   2. Enqueue all nodes with in-degree 0
 *   3. Process queue: dequeue node, decrement neighbors' in-degrees
 *   4. Enqueue any neighbor whose in-degree drops to 0
 *   5. Repeat until queue is empty
 *
 * Returns { steps, initialScene } for the graph renderer.
 */

const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// Layout: left-to-right layers for a DAG
const NODE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 0.10, y: 0.30 }, // 0: A — layer 0
  { x: 0.10, y: 0.70 }, // 1: B — layer 0
  { x: 0.35, y: 0.20 }, // 2: C — layer 1
  { x: 0.35, y: 0.55 }, // 3: D — layer 1
  { x: 0.35, y: 0.85 }, // 4: E — layer 1
  { x: 0.62, y: 0.35 }, // 5: F — layer 2
  { x: 0.62, y: 0.70 }, // 6: G — layer 2
  { x: 0.88, y: 0.50 }, // 7: H — layer 3
];

// Directed edges (from → to) forming a DAG
const DIRECTED_EDGES: Array<{ from: number; to: number }> = [
  { from: 0, to: 2 },
  { from: 0, to: 3 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 5 },
  { from: 3, to: 5 },
  { from: 3, to: 6 },
  { from: 4, to: 6 },
  { from: 5, to: 7 },
  { from: 6, to: 7 },
];

// Build adjacency list
const ADJACENCY: number[][] = Array.from({ length: NODE_LABELS.length }, () => []);
for (const e of DIRECTED_EDGES) {
  ADJACENCY[e.from].push(e.to);
}

const GRAPH_EDGES: GraphEdge[] = DIRECTED_EDGES.map(e => ({
  from: e.from,
  to: e.to,
  highlighted: false,
}));

const GRAPH_NODES: GraphNode[] = NODE_LABELS.map((label, i) => ({
  id: i,
  label,
  x: NODE_POSITIONS[i].x,
  y: NODE_POSITIONS[i].y,
}));

function edgesNoHighlight(): GraphEdge[] {
  return GRAPH_EDGES.map(e => ({ ...e, highlighted: false }));
}

function edgesWithHighlightFrom(u: number): GraphEdge[] {
  return GRAPH_EDGES.map(e => ({
    ...e,
    highlighted: e.from === u,
  }));
}

export function generateTopologicalSortSteps(arr: number[]): StepResult {
  const n = NODE_LABELS.length;
  const steps: AnimationStep[] = [];

  // Compute in-degrees
  const inDegree: number[] = Array(n).fill(0);
  for (const e of DIRECTED_EDGES) {
    inDegree[e.to]++;
  }

  const nodeStates: Record<number, string> = {};
  for (let i = 0; i < n; i++) nodeStates[i] = 'unvisited';

  const distLabels: Record<number, string> = {};
  for (let i = 0; i < n; i++) distLabels[i] = `in=${inDegree[i]}`;

  // Step: show in-degrees
  steps.push({
    type: 'compare',
    indices: [],
    description: `Computing in-degrees: ${NODE_LABELS.map((l, i) => `${l}:${inDegree[i]}`).join(' ')}`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesNoHighlight(),
      nodeStates: { ...nodeStates },
      distanceLabels: { ...distLabels },
    } as GraphScene,
  });

  // Enqueue all zero in-degree nodes
  const queue: number[] = [];
  for (let i = 0; i < n; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
      nodeStates[i] = 'queued';
    }
  }

  steps.push({
    type: 'compare',
    indices: [...queue],
    description: `Nodes with in-degree 0: ${queue.map(i => NODE_LABELS[i]).join(', ')} — enqueued`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesNoHighlight(),
      nodeStates: { ...nodeStates },
      distanceLabels: { ...distLabels },
      queueOrStack: [...queue],
    } as GraphScene,
  });

  const result: number[] = [];
  const deg = [...inDegree]; // working copy

  while (queue.length > 0) {
    const u = queue.shift()!;
    result.push(u);
    nodeStates[u] = 'visiting';

    // Show: processing node u
    steps.push({
      type: 'compare',
      indices: [u],
      description: `Processing ${NODE_LABELS[u]} — added to result order [${result.map(i => NODE_LABELS[i]).join(', ')}]`,
      sceneUpdate: {
        type: 'graph',
        nodes: GRAPH_NODES,
        edges: edgesWithHighlightFrom(u),
        nodeStates: { ...nodeStates },
        distanceLabels: { ...distLabels },
        queueOrStack: [...queue],
      } as GraphScene,
    });

    // Decrement in-degrees of neighbors
    for (const v of ADJACENCY[u]) {
      deg[v]--;
      distLabels[v] = `in=${deg[v]}`;

      steps.push({
        type: 'swap',
        indices: [u, v],
        description: `Edge ${NODE_LABELS[u]}→${NODE_LABELS[v]}: in-degree of ${NODE_LABELS[v]} decremented to ${deg[v]}`,
        sceneUpdate: {
          type: 'graph',
          nodes: GRAPH_NODES,
          edges: edgesWithHighlightFrom(u),
          nodeStates: { ...nodeStates, [v]: deg[v] === 0 ? 'queued' : nodeStates[v] },
          distanceLabels: { ...distLabels },
          queueOrStack: [...queue],
        } as GraphScene,
      });

      if (deg[v] === 0) {
        queue.push(v);
        nodeStates[v] = 'queued';

        steps.push({
          type: 'compare',
          indices: [v],
          description: `${NODE_LABELS[v]} in-degree is 0 — enqueued. Queue: [${queue.map(i => NODE_LABELS[i]).join(', ')}]`,
          sceneUpdate: {
            type: 'graph',
            nodes: GRAPH_NODES,
            edges: edgesNoHighlight(),
            nodeStates: { ...nodeStates },
            distanceLabels: { ...distLabels },
            queueOrStack: [...queue],
          } as GraphScene,
        });
      }
    }

    // Mark u as processed
    nodeStates[u] = 'finalized';

    steps.push({
      type: 'sorted',
      indices: [u],
      description: `Node ${NODE_LABELS[u]} fully processed`,
      sceneUpdate: {
        type: 'graph',
        nodes: GRAPH_NODES,
        edges: edgesNoHighlight(),
        nodeStates: { ...nodeStates },
        distanceLabels: { ...distLabels },
        queueOrStack: queue.length > 0 ? [...queue] : undefined,
      } as GraphScene,
    });
  }

  const orderStr = result.map(i => NODE_LABELS[i]).join(' → ');
  steps.push({
    type: 'done',
    indices: [],
    description: `Topological sort complete: ${orderStr}`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesNoHighlight(),
      nodeStates: { ...nodeStates },
      distanceLabels: { ...distLabels },
    } as GraphScene,
  });

  const initialScene: GraphScene = {
    type: 'graph',
    nodes: GRAPH_NODES,
    edges: edgesNoHighlight(),
    nodeStates: Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'unvisited'])),
    distanceLabels: Object.fromEntries(Array.from({ length: n }, (_, i) => [i, `in=${inDegree[i]}`])),
  };

  return { steps, initialScene };
}
