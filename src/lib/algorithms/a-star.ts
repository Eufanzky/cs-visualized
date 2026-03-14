import type { AnimationStep, MazeScene, StepResult } from '../animation-engine';

/**
 * A* Search — Maze Solver
 *
 * 1. Generate a random maze via recursive backtracking (seeded from arr)
 * 2. Run A* from start to goal using Manhattan distance heuristic
 * 3. Trace the shortest path back
 *
 * Returns { steps, initialScene } for the maze renderer.
 */

const ROWS = 21;
const COLS = 21;

// ── Seeded PRNG (simple LCG) ─────────────────────────────────────────────

function createRng(seed: number): () => number {
  let s = seed | 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function seedFromArr(arr: number[]): number {
  let seed = 97; // different seed from BFS maze for variety
  for (let i = 0; i < arr.length; i++) {
    seed = (seed * 31 + Math.floor(arr[i] * 1000)) & 0x7fffffff;
  }
  return seed;
}

// ── Maze generation (recursive backtracking) ──────────────────────────────

function generateMaze(rows: number, cols: number, rng: () => number): number[][] {
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(1));

  const dirs: Array<[number, number]> = [[-2, 0], [2, 0], [0, -2], [0, 2]];

  function shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function carve(r: number, c: number): void {
    grid[r][c] = 0;
    const shuffled = shuffle([...dirs]);
    for (const [dr, dc] of shuffled) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
        grid[r + dr / 2][c + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);
  return grid;
}

// ── A* on the maze ───────────────────────────────────────────────────────

function manhattan(r1: number, c1: number, r2: number, c2: number): number {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

function aStarSolve(
  grid: number[][],
  start: { r: number; c: number },
  goal: { r: number; c: number },
): AnimationStep[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const steps: AnimationStep[] = [];

  const key = (r: number, c: number) => `${r},${c}`;
  const startKey = key(start.r, start.c);
  const goalKey = key(goal.r, goal.c);

  const cellStates: Record<string, string> = {};
  cellStates[startKey] = 'start';
  cellStates[goalKey] = 'goal';

  // g-scores and f-scores
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const parent = new Map<string, string>();
  const openSet = new Set<string>();
  const closedSet = new Set<string>();

  gScore.set(startKey, 0);
  const h0 = manhattan(start.r, start.c, goal.r, goal.c);
  fScore.set(startKey, h0);
  openSet.add(startKey);

  function makeFrontier(): string[] {
    return Array.from(openSet);
  }

  // Initial step
  steps.push({
    type: 'compare',
    indices: [0],
    description: `A* from (${start.r},${start.c}) to (${goal.r},${goal.c}) — h=${h0}`,
    sceneUpdate: {
      type: 'maze',
      grid,
      cellStates: { ...cellStates },
      rows,
      cols,
      start,
      goal,
      frontier: makeFrontier(),
    } as MazeScene,
  });

  const dirs: Array<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let found = false;

  while (openSet.size > 0) {
    // Pick node with lowest f-score in open set
    let bestKey = '';
    let bestF = Infinity;
    for (const k of openSet) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        bestKey = k;
      }
    }

    const [crStr, ccStr] = bestKey.split(',');
    const cr = parseInt(crStr);
    const cc = parseInt(ccStr);

    // Mark current
    if (bestKey !== startKey && bestKey !== goalKey) {
      cellStates[bestKey] = 'current';
    }

    const g = gScore.get(bestKey) ?? 0;
    steps.push({
      type: 'compare',
      indices: [cr * cols + cc],
      description: `Exploring (${cr},${cc}) — g=${g}, f=${bestF}`,
      sceneUpdate: {
        type: 'maze',
        grid,
        cellStates: { ...cellStates },
        rows,
        cols,
        start,
        goal,
        frontier: makeFrontier(),
      } as MazeScene,
    });

    // Check if we reached the goal
    if (cr === goal.r && cc === goal.c) {
      found = true;
      break;
    }

    openSet.delete(bestKey);
    closedSet.add(bestKey);

    if (bestKey !== startKey && bestKey !== goalKey) {
      cellStates[bestKey] = 'visited';
    }

    // Explore neighbors
    for (const [dr, dc] of dirs) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc] === 1) continue;

      const nk = key(nr, nc);
      if (closedSet.has(nk)) continue;

      const tentG = g + 1;
      const currentG = gScore.get(nk) ?? Infinity;

      if (tentG < currentG) {
        parent.set(nk, bestKey);
        gScore.set(nk, tentG);
        const h = manhattan(nr, nc, goal.r, goal.c);
        fScore.set(nk, tentG + h);

        if (!openSet.has(nk)) {
          openSet.add(nk);
        }

        if (nk !== goalKey) {
          cellStates[nk] = 'queued';
        }

        steps.push({
          type: 'swap',
          indices: [cr * cols + cc, nr * cols + nc],
          description: `Discover (${nr},${nc}) — g=${tentG}, h=${h}, f=${tentG + h}`,
          sceneUpdate: {
            type: 'maze',
            grid,
            cellStates: { ...cellStates },
            rows,
            cols,
            start,
            goal,
            frontier: makeFrontier(),
          } as MazeScene,
        });
      }
    }
  }

  // ── Trace path back ──────────────────────────────────────────────────────
  if (found) {
    const path: string[] = [];
    let cur = goalKey;
    while (cur && cur !== startKey) {
      path.push(cur);
      cur = parent.get(cur)!;
    }
    path.push(startKey);
    path.reverse();

    for (const pk of path) {
      if (pk !== startKey && pk !== goalKey) {
        cellStates[pk] = 'path';
      }

      steps.push({
        type: 'sorted',
        indices: [],
        description: `Tracing optimal path — ${path.length} cells`,
        sceneUpdate: {
          type: 'maze',
          grid,
          cellStates: { ...cellStates },
          rows,
          cols,
          start,
          goal,
          frontier: undefined,
        } as MazeScene,
      });
    }

    steps.push({
      type: 'done',
      indices: [],
      description: `A* complete — optimal path has ${path.length} cells, explored ${closedSet.size + 1} total`,
      sceneUpdate: {
        type: 'maze',
        grid,
        cellStates: { ...cellStates },
        rows,
        cols,
        start,
        goal,
        frontier: undefined,
      } as MazeScene,
    });
  } else {
    steps.push({
      type: 'done',
      indices: [],
      description: `A* complete — no path found. Explored ${closedSet.size} cells.`,
      sceneUpdate: {
        type: 'maze',
        grid,
        cellStates: { ...cellStates },
        rows,
        cols,
        start,
        goal,
        frontier: undefined,
      } as MazeScene,
    });
  }

  return steps;
}

// ── Public API ────────────────────────────────────────────────────────────

export function generateAStarSteps(arr: number[]): StepResult {
  const rng = createRng(seedFromArr(arr));
  const grid = generateMaze(ROWS, COLS, rng);

  const start = { r: 1, c: 1 };
  const goal = { r: ROWS - 2, c: COLS - 2 };

  // Ensure start and goal are passable
  grid[start.r][start.c] = 0;
  grid[goal.r][goal.c] = 0;

  const steps = aStarSolve(grid, start, goal);

  const initialCellStates: Record<string, string> = {};
  initialCellStates[`${start.r},${start.c}`] = 'start';
  initialCellStates[`${goal.r},${goal.c}`] = 'goal';

  const initialScene: MazeScene = {
    type: 'maze',
    grid,
    cellStates: initialCellStates,
    rows: ROWS,
    cols: COLS,
    start,
    goal,
    frontier: undefined,
  };

  return { steps, initialScene };
}
