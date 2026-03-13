import type { AnimationStep, GraphEdge, GraphNode, GraphScene, StepResult } from '../animation-engine';

/**
 * Generates animation steps and an initial GraphScene for Dijkstra's
 * shortest-path algorithm on a fixed 7-node weighted graph.
 *
 * Node layout (normalized 0–1 coordinates):
 *
 *        A(0)
 *       / \
 *      B   C
 *     / \ / \
 *    D   E   F
 *         \ /
 *          G
 *
 * Returns { steps, initialScene } so useAnimation can seed the graph renderer.
 */

interface InternalEdge {
  to: number;
  weight: number;
}

// Fixed 7-node weighted undirected graph — adjacency list
const ADJACENCY: InternalEdge[][] = [
  /* 0(A) */ [{ to: 1, weight: 4 }, { to: 2, weight: 2 }],
  /* 1(B) */ [{ to: 0, weight: 4 }, { to: 2, weight: 5 }, { to: 3, weight: 10 }],
  /* 2(C) */ [{ to: 0, weight: 2 }, { to: 1, weight: 5 }, { to: 4, weight: 3 }],
  /* 3(D) */ [{ to: 1, weight: 10 }, { to: 4, weight: 4 }, { to: 5, weight: 11 }],
  /* 4(E) */ [{ to: 2, weight: 3 }, { to: 3, weight: 4 }, { to: 5, weight: 6 }, { to: 6, weight: 8 }],
  /* 5(F) */ [{ to: 3, weight: 11 }, { to: 4, weight: 6 }, { to: 6, weight: 7 }],
  /* 6(G) */ [{ to: 4, weight: 8 }, { to: 5, weight: 7 }],
];

const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Normalized (0–1) positions — visually pleasing layout:
//   A at top-centre, B/C in the second row, D/E/F in the third, G at bottom-right
const NODE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 0.50, y: 0.08 }, // 0: A  — top centre
  { x: 0.22, y: 0.38 }, // 1: B  — mid-left
  { x: 0.72, y: 0.30 }, // 2: C  — mid-right
  { x: 0.10, y: 0.70 }, // 3: D  — lower-left
  { x: 0.50, y: 0.62 }, // 4: E  — lower-centre
  { x: 0.80, y: 0.70 }, // 5: F  — lower-right
  { x: 0.65, y: 0.92 }, // 6: G  — bottom-right
];

// Build the canonical undirected edge list (each pair once, from < to)
const GRAPH_EDGES: GraphEdge[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 2, weight: 2 },
  { from: 1, to: 2, weight: 5 },
  { from: 1, to: 3, weight: 10 },
  { from: 2, to: 4, weight: 3 },
  { from: 3, to: 4, weight: 4 },
  { from: 3, to: 5, weight: 11 },
  { from: 4, to: 5, weight: 6 },
  { from: 4, to: 6, weight: 8 },
  { from: 5, to: 6, weight: 7 },
];

const GRAPH_NODES: GraphNode[] = NODE_LABELS.map((label, i) => ({
  id: i,
  label,
  x: NODE_POSITIONS[i].x,
  y: NODE_POSITIONS[i].y,
}));

/** Find the canonical edge index for (u,v) regardless of direction. */
function findEdgeIdx(u: number, v: number): number {
  return GRAPH_EDGES.findIndex(
    e => (e.from === u && e.to === v) || (e.from === v && e.to === u)
  );
}

/** Produce an edges array with exactly one edge highlighted, rest not. */
function edgesWithHighlight(highlightedEdgeIdx: number): GraphEdge[] {
  return GRAPH_EDGES.map((e, i) => ({ ...e, highlighted: i === highlightedEdgeIdx }));
}

/** Produce an edges array with no highlighted edges. */
function edgesNoHighlight(): GraphEdge[] {
  return GRAPH_EDGES.map(e => ({ ...e, highlighted: false }));
}

/** Format a distance value for display. */
function fmtDist(d: number): string {
  return d === Infinity ? '∞' : String(d);
}

export function generateDijkstraSteps(arr: number[]): StepResult {
  const n = ADJACENCY.length;
  const source = arr.length > 0 ? arr.length % n : 0;

  const dist: number[] = Array(n).fill(Infinity);
  const finalized: boolean[] = Array(n).fill(false);
  dist[source] = 0;

  const steps: AnimationStep[] = [];

  // Helpers that build nodeStates and distanceLabels snapshots
  const nodeStates = (): Record<number, string> => {
    const s: Record<number, string> = {};
    for (let i = 0; i < n; i++) {
      s[i] = finalized[i] ? 'finalized' : 'unvisited';
    }
    return s;
  };

  const distLabels = (): Record<number, string> => {
    const d: Record<number, string> = {};
    for (let i = 0; i < n; i++) d[i] = fmtDist(dist[i]);
    return d;
  };

  // ── Initial step: show the starting state ──────────────────────────────
  steps.push({
    type: 'compare',
    indices: [source],
    description: `Starting Dijkstra from node ${NODE_LABELS[source]} — d[${NODE_LABELS[source]}]=0, all others ∞`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesNoHighlight(),
      nodeStates: { ...nodeStates(), [source]: 'visiting' },
      distanceLabels: distLabels(),
      queueOrStack: [source],
    } as GraphScene,
  });

  for (let iter = 0; iter < n; iter++) {
    // Pick unvisited node with smallest tentative distance
    let u = -1;
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (!finalized[i] && dist[i] < minDist) {
        minDist = dist[i];
        u = i;
      }
    }
    if (u === -1) break;

    // Show: visiting node u
    steps.push({
      type: 'compare',
      indices: [u],
      description: `Visiting node ${NODE_LABELS[u]} (d=${dist[u]}) — checking all neighbors`,
      sceneUpdate: {
        type: 'graph',
        nodes: GRAPH_NODES,
        edges: edgesNoHighlight(),
        nodeStates: { ...nodeStates(), [u]: 'visiting' },
        distanceLabels: distLabels(),
        queueOrStack: undefined,
      } as GraphScene,
    });

    // Relax each outgoing edge from u
    for (const edge of ADJACENCY[u]) {
      const v = edge.to;
      if (finalized[v]) continue;

      const newDist = dist[u] + edge.weight;
      const edgeIdx = findEdgeIdx(u, v);

      // Show: examining edge u→v
      steps.push({
        type: 'compare',
        indices: [u, v],
        description: `Examining ${NODE_LABELS[u]}→${NODE_LABELS[v]} (w=${edge.weight}): d[${NODE_LABELS[v]}]=${fmtDist(dist[v])}, candidate=${dist[u]}+${edge.weight}=${newDist}`,
        sceneUpdate: {
          type: 'graph',
          nodes: GRAPH_NODES,
          edges: edgesWithHighlight(edgeIdx),
          nodeStates: { ...nodeStates(), [u]: 'visiting', [v]: 'queued' },
          distanceLabels: distLabels(),
          queueOrStack: undefined,
        } as GraphScene,
      });

      if (newDist < dist[v]) {
        dist[v] = newDist;

        // Show: relaxation — update distance label in gold
        steps.push({
          type: 'swap',
          indices: [u, v],
          values: [dist[v], newDist],
          description: `Relaxing ${NODE_LABELS[u]}→${NODE_LABELS[v]}: d[${NODE_LABELS[v]}] updated to ${newDist}`,
          sceneUpdate: {
            type: 'graph',
            nodes: GRAPH_NODES,
            edges: edgesWithHighlight(edgeIdx),
            nodeStates: { ...nodeStates(), [u]: 'visiting', [v]: 'queued' },
            distanceLabels: distLabels(),
            queueOrStack: undefined,
          } as GraphScene,
        });
      }
    }

    // Finalize node u
    finalized[u] = true;
    steps.push({
      type: 'sorted',
      indices: [u],
      description: `Node ${NODE_LABELS[u]} finalized — shortest path from ${NODE_LABELS[source]} = ${dist[u]}`,
      sceneUpdate: {
        type: 'graph',
        nodes: GRAPH_NODES,
        edges: edgesNoHighlight(),
        nodeStates: nodeStates(),
        distanceLabels: distLabels(),
        queueOrStack: undefined,
      } as GraphScene,
    });
  }

  // Done
  const summary = NODE_LABELS.map((lbl, i) => `${lbl}:${fmtDist(dist[i])}`).join('  ');
  steps.push({
    type: 'done',
    indices: [],
    description: `Dijkstra complete from ${NODE_LABELS[source]}. Distances — ${summary}`,
    sceneUpdate: {
      type: 'graph',
      nodes: GRAPH_NODES,
      edges: edgesNoHighlight(),
      nodeStates: nodeStates(),
      distanceLabels: distLabels(),
      queueOrStack: undefined,
    } as GraphScene,
  });

  const initialScene: GraphScene = {
    type: 'graph',
    nodes: GRAPH_NODES,
    edges: edgesNoHighlight(),
    nodeStates: Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'unvisited'])),
    distanceLabels: Object.fromEntries(Array.from({ length: n }, (_, i) => [i, i === source ? '0' : '∞'])),
    queueOrStack: undefined,
  };

  return { steps, initialScene };
}
