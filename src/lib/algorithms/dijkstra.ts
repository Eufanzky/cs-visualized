import type { AnimationStep } from '../animation-engine';

/**
 * Generates AnimationSteps for Dijkstra's shortest-path algorithm.
 *
 * A fixed 7-node weighted graph is used. The `arr` parameter seeds which
 * node is chosen as the source (arr.length % nodeCount).
 *
 * Steps produced:
 *   - compare  → visiting a node or examining a neighbor edge
 *   - swap     → relaxing an edge (updating a tentative distance)
 *   - sorted   → a node has been finalized (shortest path confirmed)
 *   - done     → all reachable nodes finalized
 */

interface Edge {
  to: number;
  weight: number;
}

// A small, hand-crafted 7-node weighted undirected graph.
// Nodes are labeled 0–6 (rendered as A–G).
const GRAPH: Edge[][] = [
  /* 0(A) */ [{ to: 1, weight: 4 }, { to: 2, weight: 2 }],
  /* 1(B) */ [{ to: 0, weight: 4 }, { to: 2, weight: 5 }, { to: 3, weight: 10 }],
  /* 2(C) */ [{ to: 0, weight: 2 }, { to: 1, weight: 5 }, { to: 4, weight: 3 }],
  /* 3(D) */ [{ to: 1, weight: 10 }, { to: 4, weight: 4 }, { to: 5, weight: 11 }],
  /* 4(E) */ [{ to: 2, weight: 3 }, { to: 3, weight: 4 }, { to: 5, weight: 6 }, { to: 6, weight: 8 }],
  /* 5(F) */ [{ to: 3, weight: 11 }, { to: 4, weight: 6 }, { to: 6, weight: 7 }],
  /* 6(G) */ [{ to: 4, weight: 8 }, { to: 5, weight: 7 }],
];

const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export function generateDijkstraSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const n = GRAPH.length;

  // Seed source node from arr length so different array sizes give different starts
  const source = arr.length > 0 ? arr.length % n : 0;

  const dist: number[] = Array(n).fill(Infinity);
  const visited: boolean[] = Array(n).fill(false);
  dist[source] = 0;

  steps.push({
    type: 'compare',
    indices: [source],
    description: `Starting Dijkstra from node ${NODE_LABELS[source]} — initializing distances to ∞, d[${NODE_LABELS[source]}] = 0`,
  });

  for (let iter = 0; iter < n; iter++) {
    // Pick the unvisited node with the smallest tentative distance
    let u = -1;
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (!visited[i] && dist[i] < minDist) {
        minDist = dist[i];
        u = i;
      }
    }

    if (u === -1) break; // All remaining nodes are unreachable

    visited[u] = true;

    steps.push({
      type: 'compare',
      indices: [u],
      description: `Visiting node ${NODE_LABELS[u]} (distance ${dist[u]}) — checking all neighbors`,
    });

    // Relax each outgoing edge from u
    for (const edge of GRAPH[u]) {
      const v = edge.to;
      if (visited[v]) continue;

      const newDist = dist[u] + edge.weight;

      steps.push({
        type: 'compare',
        indices: [u, v],
        description: `Examining edge ${NODE_LABELS[u]}→${NODE_LABELS[v]} (weight ${edge.weight}): current d[${NODE_LABELS[v]}] = ${dist[v] === Infinity ? '∞' : dist[v]}, candidate = ${dist[u]} + ${edge.weight} = ${newDist}`,
      });

      if (newDist < dist[v]) {
        steps.push({
          type: 'swap',
          indices: [u, v],
          values: [dist[v], newDist],
          description: `Relaxing edge ${NODE_LABELS[u]}→${NODE_LABELS[v]}: d[${NODE_LABELS[v]}] updated from ${dist[v] === Infinity ? '∞' : dist[v]} to ${newDist}`,
        });
        dist[v] = newDist;
      }
    }

    // Node u is finalized
    steps.push({
      type: 'sorted',
      indices: [u],
      description: `Node ${NODE_LABELS[u]} finalized — shortest path from ${NODE_LABELS[source]} to ${NODE_LABELS[u]} = ${dist[u]}`,
    });
  }

  // Report final distances
  const summary = NODE_LABELS.map((lbl, i) =>
    `${lbl}:${dist[i] === Infinity ? '∞' : dist[i]}`
  ).join(', ');

  steps.push({
    type: 'done',
    indices: [],
    description: `Dijkstra complete from ${NODE_LABELS[source]}. Shortest distances — ${summary}`,
  });

  return steps;
}
