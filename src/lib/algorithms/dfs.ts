import type { AnimationStep, GraphEdge, GraphNode, GraphScene, StepResult } from '../animation-engine';

/**
 * Generates animation steps and an initial GraphScene for DFS on the same
 * 8-node graph as BFS, so the two traversals can be compared directly.
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

// Same node positions as BFS for a direct visual comparison
const NODE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 0.50, y: 0.06 }, // 0: A
  { x: 0.28, y: 0.30 }, // 1: B
  { x: 0.72, y: 0.30 }, // 2: C
  { x: 0.12, y: 0.60 }, // 3: D
  { x: 0.36, y: 0.60 }, // 4: E
  { x: 0.62, y: 0.60 }, // 5: F
  { x: 0.86, y: 0.60 }, // 6: G
  { x: 0.50, y: 0.90 }, // 7: H
];

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

export function generateDFSSteps(arr: number[]): StepResult {
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

  // Iterative DFS with an explicit stack so step emission is straightforward
  const callStack: Array<{ node: number; neighborIdx: number }> = [];
  callStack.push({ node: source, neighborIdx: 0 });

  const stackIds = (): number[] => callStack.map(f => f.node);

  // ── Initial step: push source ──────────────────────────────────────────
  steps.push({
    type: 'compare',
    indices: [source],
    description: `DFS from ${NODE_LABELS[source]} — push source onto stack. Stack: [${NODE_LABELS[source]}]`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesNoHighlight(),
      nodeStates: { ...nodeState },
      queueOrStack: stackIds(),
    } as GraphScene,
  });

  while (callStack.length > 0) {
    const frame = callStack[callStack.length - 1];
    const u = frame.node;

    // Find the next unvisited neighbor
    let advanced = false;
    while (frame.neighborIdx < ADJACENCY[u].length) {
      const v = ADJACENCY[u][frame.neighborIdx];
      frame.neighborIdx++;

      if (!visited[v]) {
        visited[v] = true;
        nodeState[v] = 'visiting';

        const edgeIdx = findEdgeIdx(u, v);
        callStack.push({ node: v, neighborIdx: 0 });
        const stackLabel = stackIds().map(id => NODE_LABELS[id]).join(' → ');

        // Show: exploring edge u→v and pushing v
        steps.push({
          type: 'swap',
          indices: [u, v],
          description: `Explore ${NODE_LABELS[u]}→${NODE_LABELS[v]} — push ${NODE_LABELS[v]}. Stack: [${stackLabel}]`,
          sceneUpdate: {
            type: 'graph',
            nodes: GRAPH_NODES,
            edges: edgesWithHighlight(edgeIdx),
            nodeStates: { ...nodeState },
            queueOrStack: stackIds(),
          } as GraphScene,
        });

        // Show: visiting v
        steps.push({
          type: 'compare',
          indices: [v],
          description: `Visiting ${NODE_LABELS[v]} (stack depth ${callStack.length})`,
          sceneUpdate: {
            type: 'graph',
            nodes: GRAPH_NODES,
            edges: edgesNoHighlight(),
            nodeStates: { ...nodeState },
            queueOrStack: stackIds(),
          } as GraphScene,
        });

        advanced = true;
        break;
      }
    }

    if (!advanced) {
      // All neighbors of u explored — backtrack
      callStack.pop();
      nodeState[u] = 'visited';
      const stackLabel = callStack.length > 0
        ? callStack.map(f => NODE_LABELS[f.node]).join(' → ')
        : '∅';

      steps.push({
        type: 'sorted',
        indices: [u],
        description: `Backtrack from ${NODE_LABELS[u]} — all neighbors done. Stack: [${stackLabel}]`,
        sceneUpdate: {
          type: 'graph',
          nodes: GRAPH_NODES,
          edges: edgesNoHighlight(),
          nodeStates: { ...nodeState },
          queueOrStack: callStack.length > 0 ? stackIds() : undefined,
        } as GraphScene,
      });
    }
  }

  steps.push({
    type: 'done',
    indices: [],
    description: `DFS complete — all nodes reachable from ${NODE_LABELS[source]} visited depth-first`,
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
