import type { AnimationStep } from '../animation-engine';

/**
 * Generates AnimationSteps for Depth-First Search on a small fixed graph.
 *
 * The same 8-node graph used by BFS is reused so the two explorations can be
 * compared directly. The `arr` parameter seeds the source node.
 *
 * Steps produced:
 *   - compare  → pushing a node onto the (implicit) call stack / visiting it
 *   - swap     → exploring an unvisited neighbor (recursing deeper)
 *   - sorted   → backtracking — a node is fully done (all subtrees explored)
 *   - done     → DFS complete
 */

// Unweighted undirected adjacency list — 8 nodes (0–7), labeled A–H.
// Identical to bfs.ts so results are directly comparable.
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

export function generateDFSSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const n = GRAPH.length;

  const source = arr.length > 0 ? arr.length % n : 0;
  const visited: boolean[] = Array(n).fill(false);

  steps.push({
    type: 'compare',
    indices: [source],
    description: `DFS starting from node ${NODE_LABELS[source]} — pushing onto call stack`,
  });

  // Iterative DFS using an explicit stack so step emission is straightforward.
  // We track the "parent" to avoid re-visiting via the edge we came from, and
  // we emit backtrack steps when we pop.
  const stack: Array<{ node: number; neighborIdx: number; parent: number }> = [];
  visited[source] = true;
  stack.push({ node: source, neighborIdx: 0, parent: -1 });

  steps.push({
    type: 'compare',
    indices: [source],
    description: `Visiting node ${NODE_LABELS[source]}. Stack: [${NODE_LABELS[source]}]`,
  });

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    const { node: u } = frame;

    // Find the next unvisited neighbor
    let advanced = false;
    while (frame.neighborIdx < GRAPH[u].length) {
      const v = GRAPH[u][frame.neighborIdx];
      frame.neighborIdx++;

      if (!visited[v]) {
        visited[v] = true;

        const stackLabel = [...stack.map((f) => NODE_LABELS[f.node]), NODE_LABELS[v]].join(' → ');

        steps.push({
          type: 'swap',
          indices: [u, v],
          description: `Exploring edge ${NODE_LABELS[u]}→${NODE_LABELS[v]} — pushing ${NODE_LABELS[v]} onto stack. Stack: [${stackLabel}]`,
        });

        stack.push({ node: v, neighborIdx: 0, parent: u });

        steps.push({
          type: 'compare',
          indices: [v],
          description: `Visiting node ${NODE_LABELS[v]}. Stack depth: ${stack.length}`,
        });

        advanced = true;
        break;
      }
    }

    if (!advanced) {
      // All neighbors of u have been visited — backtrack
      stack.pop();
      const stackLabel = stack.length > 0
        ? stack.map((f) => NODE_LABELS[f.node]).join(' → ')
        : '∅';

      steps.push({
        type: 'sorted',
        indices: [u],
        description: `Backtracking from ${NODE_LABELS[u]} — all neighbors explored. Stack: [${stackLabel}]`,
      });
    }
  }

  steps.push({
    type: 'done',
    indices: [],
    description: `DFS complete — all nodes reachable from ${NODE_LABELS[source]} visited in depth-first order`,
  });

  return steps;
}
