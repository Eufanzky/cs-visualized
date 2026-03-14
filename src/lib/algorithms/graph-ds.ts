import type { AnimationStep, GraphEdge, GraphNode, GraphScene, StepResult } from '../animation-engine';

/**
 * Generates AnimationSteps for a Graph data structure visualization.
 *
 * Returns { steps, initialScene } for the graph renderer.
 *
 * Phases:
 *   1. Build — add nodes one by one
 *   2. Connect — add edges between nodes
 *   3. BFS traversal from node A
 */
export function generateGraphDSSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const n = 7;

  // Circular layout
  const NODE_POSITIONS: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    NODE_POSITIONS.push({
      x: 0.5 + 0.35 * Math.cos(angle),
      y: 0.5 + 0.35 * Math.sin(angle),
    });
  }

  // Edges to add progressively
  const EDGE_PAIRS: Array<[number, number]> = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
    [0, 3], [1, 4], [2, 5],
  ];

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeStates: Record<number, string> = {};

  function currentScene(extra?: Partial<GraphScene>): GraphScene {
    return {
      type: 'graph',
      nodes: [...nodes],
      edges: edges.map(e => ({ ...e })),
      nodeStates: { ...nodeStates },
      ...extra,
    };
  }

  // ── Phase 1: Add nodes ────────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    nodes.push({
      id: i,
      label: NODE_LABELS[i],
      x: NODE_POSITIONS[i].x,
      y: NODE_POSITIONS[i].y,
    });
    nodeStates[i] = 'unvisited';

    steps.push({
      type: 'swap',
      indices: [i],
      description: `Adding node ${NODE_LABELS[i]} (V=${nodes.length})`,
      sceneUpdate: {
        ...currentScene(),
        nodeStates: { ...nodeStates, [i]: 'visiting' },
      } as GraphScene,
    });

    steps.push({
      type: 'sorted',
      indices: [i],
      description: `Node ${NODE_LABELS[i]} added`,
      sceneUpdate: currentScene(),
    });
  }

  // ── Phase 2: Add edges ────────────────────────────────────────────────
  for (const [u, v] of EDGE_PAIRS) {
    edges.push({ from: u, to: v, highlighted: true });

    steps.push({
      type: 'swap',
      indices: [u, v],
      description: `Adding edge ${NODE_LABELS[u]}–${NODE_LABELS[v]} (E=${edges.length})`,
      sceneUpdate: {
        ...currentScene(),
        nodeStates: { ...nodeStates, [u]: 'visiting', [v]: 'visiting' },
      } as GraphScene,
    });

    // Un-highlight the edge
    edges[edges.length - 1].highlighted = false;

    steps.push({
      type: 'sorted',
      indices: [u, v],
      description: `Edge ${NODE_LABELS[u]}–${NODE_LABELS[v]} added`,
      sceneUpdate: currentScene(),
    });
  }

  // ── Phase 3: BFS traversal ────────────────────────────────────────────
  // Build adjacency from edges
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const e of EDGE_PAIRS) {
    adj[e[0]].push(e[1]);
    adj[e[1]].push(e[0]);
  }

  const visited = new Set<number>();
  const queue: number[] = [0];
  visited.add(0);
  nodeStates[0] = 'queued';

  steps.push({
    type: 'compare',
    indices: [0],
    description: `Starting BFS traversal from ${NODE_LABELS[0]}`,
    sceneUpdate: {
      ...currentScene(),
      queueOrStack: [...queue],
    } as GraphScene,
  });

  while (queue.length > 0) {
    const u = queue.shift()!;
    nodeStates[u] = 'visiting';

    steps.push({
      type: 'compare',
      indices: [u],
      description: `Visiting ${NODE_LABELS[u]} — exploring neighbors`,
      sceneUpdate: {
        ...currentScene(),
        queueOrStack: [...queue],
      } as GraphScene,
    });

    for (const v of adj[u]) {
      if (!visited.has(v)) {
        visited.add(v);
        queue.push(v);
        nodeStates[v] = 'queued';

        const edgeIdx = edges.findIndex(
          e => (e.from === u && e.to === v) || (e.from === v && e.to === u)
        );

        steps.push({
          type: 'swap',
          indices: [u, v],
          description: `Discovered ${NODE_LABELS[v]} via ${NODE_LABELS[u]}`,
          sceneUpdate: {
            ...currentScene(),
            edges: edges.map((e, i) => ({ ...e, highlighted: i === edgeIdx })),
            queueOrStack: [...queue],
          } as GraphScene,
        });
      }
    }

    nodeStates[u] = 'finalized';

    steps.push({
      type: 'sorted',
      indices: [u],
      description: `${NODE_LABELS[u]} fully explored`,
      sceneUpdate: {
        ...currentScene(),
        queueOrStack: queue.length > 0 ? [...queue] : undefined,
      } as GraphScene,
    });
  }

  // ── Done ──────────────────────────────────────────────────────────────
  steps.push({
    type: 'done',
    indices: [],
    description: `Graph complete — V=${n}, E=${edges.length}. BFS visited all ${visited.size} nodes.`,
    sceneUpdate: currentScene(),
  });

  const initialScene: GraphScene = {
    type: 'graph',
    nodes: [],
    edges: [],
    nodeStates: {},
  };

  return { steps, initialScene };
}
