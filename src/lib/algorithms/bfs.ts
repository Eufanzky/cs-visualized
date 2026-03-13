import type { AnimationStep, GraphEdge, GraphNode, GraphScene, StepResult } from '../animation-engine';

/**
 * Generates animation steps and an initial GraphScene for BFS on a fixed
 * 8-node undirected graph.
 *
 * Node layout (normalized 0–1 coordinates):
 *
 *        A
 *       / \
 *      B   C
 *     /|   |\
 *    D  E  F G
 *     \  \/  /
 *         H
 *
 * Returns { steps, initialScene } so useAnimation can seed the graph renderer.
 */

// Unweighted undirected adjacency list — 8 nodes (0–7), labeled A–H
const ADJACENCY: number[][] = [
  /* 0(A) */ [1, 2],
  /* 1(B) */ [0, 3, 4],
  /* 2(C) */ [0, 5, 6],
  /* 3(D) */ [1, 7],
  /* 4(E) */ [1, 7],
  /* 5(F) */ [2],
  /* 6(G) */ [2, 7],
  /* 7(H) */ [3, 4, 6],
];

const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// Normalized (0–1) positions for a clean tree-like layout
const NODE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 0.50, y: 0.06 }, // 0: A  — top centre
  { x: 0.28, y: 0.30 }, // 1: B  — second-row left
  { x: 0.72, y: 0.30 }, // 2: C  — second-row right
  { x: 0.12, y: 0.60 }, // 3: D  — third-row far-left
  { x: 0.36, y: 0.60 }, // 4: E  — third-row centre-left
  { x: 0.62, y: 0.60 }, // 5: F  — third-row centre-right
  { x: 0.86, y: 0.60 }, // 6: G  — third-row far-right
  { x: 0.50, y: 0.90 }, // 7: H  — bottom centre
];

// Canonical undirected edge list (each pair once, lower id first)
const GRAPH_EDGES: GraphEdge[] = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 5 },
  { from: 2, to: 6 },
  { from: 3, to: 7 },
  { from: 4, to: 7 },
  { from: 6, to: 7 },
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

function edgesWithHighlight(highlightedEdgeIdx: number): GraphEdge[] {
  return GRAPH_EDGES.map((e, i) => ({ ...e, highlighted: i === highlightedEdgeIdx }));
}

function edgesNoHighlight(): GraphEdge[] {
  return GRAPH_EDGES.map(e => ({ ...e, highlighted: false }));
}

export function generateBFSSteps(arr: number[]): StepResult {
  const n = ADJACENCY.length;
  const source = arr.length > 0 ? arr.length % n : 0;

  const steps: AnimationStep[] = [];
  const visited: boolean[] = Array(n).fill(false);
  // nodeState tracks current visual state for each node
  const nodeState: Record<number, string> = Object.fromEntries(
    Array.from({ length: n }, (_, i) => [i, 'unvisited'])
  );

  visited[source] = true;
  nodeState[source] = 'visiting';
  const queue: number[] = [source];

  // ── Initial step: enqueue source ──────────────────────────────────────
  steps.push({
    type: 'compare',
    indices: [source],
    description: `BFS from ${NODE_LABELS[source]} — source enqueued. Queue: [${NODE_LABELS[source]}]`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesNoHighlight(),
      nodeStates: { ...nodeState },
      queueOrStack: [...queue],
    } as GraphScene,
  });

  while (queue.length > 0) {
    const u = queue.shift()!;
    nodeState[u] = 'visiting';

    const queueLabel = queue.map(v => NODE_LABELS[v]).join(', ');

    // Show: dequeuing u
    steps.push({
      type: 'compare',
      indices: [u],
      description: `Dequeue ${NODE_LABELS[u]} — exploring neighbors. Queue: [${queueLabel || '∅'}]`,
      sceneUpdate: {
        type: 'graph',
        nodes: GRAPH_NODES,
        edges: edgesNoHighlight(),
        nodeStates: { ...nodeState },
        queueOrStack: [...queue],
      } as GraphScene,
    });

    for (const v of ADJACENCY[u]) {
      if (!visited[v]) {
        visited[v] = true;
        nodeState[v] = 'queued';
        queue.push(v);

        const edgeIdx = findEdgeIdx(u, v);
        const queueNow = queue.map(x => NODE_LABELS[x]).join(', ');

        // Show: discovering and enqueuing v
        steps.push({
          type: 'swap',
          indices: [u, v],
          description: `Discover ${NODE_LABELS[v]} via ${NODE_LABELS[u]} — enqueue. Queue: [${queueNow}]`,
          sceneUpdate: {
            type: 'graph',
            nodes: GRAPH_NODES,
            edges: edgesWithHighlight(edgeIdx),
            nodeStates: { ...nodeState },
            queueOrStack: [...queue],
          } as GraphScene,
        });
      }
    }

    // Node u fully explored
    nodeState[u] = 'visited';
    steps.push({
      type: 'sorted',
      indices: [u],
      description: `Node ${NODE_LABELS[u]} fully explored`,
      sceneUpdate: {
        type: 'graph',
        nodes: GRAPH_NODES,
        edges: edgesNoHighlight(),
        nodeStates: { ...nodeState },
        queueOrStack: queue.length > 0 ? [...queue] : undefined,
      } as GraphScene,
    });
  }

  steps.push({
    type: 'done',
    indices: [],
    description: `BFS complete — all ${n} nodes visited in level order from ${NODE_LABELS[source]}`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesNoHighlight(),
      nodeStates: { ...nodeState },
      queueOrStack: undefined,
    } as GraphScene,
  });

  const initialScene: GraphScene = {
    type: 'graph',
    nodes: GRAPH_NODES,
    edges: edgesNoHighlight(),
    nodeStates: Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'unvisited'])),
    queueOrStack: undefined,
  };

  return { steps, initialScene };
}
