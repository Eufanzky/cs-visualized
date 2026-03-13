import type { AnimationStep } from '../animation-engine';

/**
 * Generates AnimationSteps for Breadth-First Search on a small fixed graph.
 *
 * The `arr` parameter seeds the source node (arr.length % nodeCount).
 *
 * Steps produced:
 *   - compare  → dequeuing a node and beginning to process it
 *   - swap     → discovering an unvisited neighbor (enqueuing it)
 *   - sorted   → a node has been fully explored (all neighbors visited)
 *   - done     → BFS complete
 *
 * `indices` always carries the relevant node index so canvas renderers can
 * color nodes by their current BFS state.
 */

// Unweighted undirected adjacency list — 8 nodes (0–7), labeled A–H.
const GRAPH: number[][] = [
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

export function generateBFSSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const n = GRAPH.length;

  const source = arr.length > 0 ? arr.length % n : 0;
  const visited: boolean[] = Array(n).fill(false);
  const queue: number[] = [];

  visited[source] = true;
  queue.push(source);

  steps.push({
    type: 'compare',
    indices: [source],
    description: `BFS starting from node ${NODE_LABELS[source]} — enqueuing source. Queue: [${NODE_LABELS[source]}]`,
  });

  while (queue.length > 0) {
    const u = queue.shift()!;

    const queueLabel = queue.map((v) => NODE_LABELS[v]).join(', ');

    steps.push({
      type: 'compare',
      indices: [u],
      description: `Dequeuing node ${NODE_LABELS[u]} — exploring neighbors. Queue after dequeue: [${queueLabel || '∅'}]`,
    });

    for (const v of GRAPH[u]) {
      if (!visited[v]) {
        visited[v] = true;
        queue.push(v);

        const queueNow = queue.map((x) => NODE_LABELS[x]).join(', ');

        steps.push({
          type: 'swap',
          indices: [u, v],
          description: `Discovering neighbor ${NODE_LABELS[v]} via ${NODE_LABELS[u]} — enqueuing. Queue: [${queueNow}]`,
        });
      }
    }

    // Node u fully explored — all neighbors discovered
    steps.push({
      type: 'sorted',
      indices: [u],
      description: `Node ${NODE_LABELS[u]} fully explored`,
    });
  }

  steps.push({
    type: 'done',
    indices: [],
    description: `BFS complete — all ${n} nodes reachable from ${NODE_LABELS[source]} have been visited in level order`,
  });

  return steps;
}
