import type { AnimationStep, MazeScene, StepResult } from '../animation-engine';

/**
 * BFS Maze Solver
 *
 * 1. Generate a random maze via recursive backtracking (seeded from arr)
 * 2. Run BFS from start to goal
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
  let seed = 42;
  for (let i = 0; i < arr.length; i++) {
    seed = (seed * 31 + Math.floor(arr[i] * 1000)) & 0x7fffffff;
  }
  return seed;
}

// ── Maze generation (recursive backtracking) ──────────────────────────────

function generateMaze(rows: number, cols: number, rng: () => number): number[][] {
  // Start with all walls (1)
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(1));

  // Directions: [dr, dc] — move 2 cells at a time
  const dirs = [
    [-2, 0], [2, 0], [0, -2], [0, 2],
  ];

  function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function carve(r: number, c: number): void {
    grid[r][c] = 0;
    const shuffled = shuffle([...dirs]);
    for (const [dr, dc] of shuffled) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
        // Carve the wall between current and neighbor
        grid[r + dr / 2][c + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }

  // Start carving from (1, 1) — odd indices form the passage grid
  carve(1, 1);

  return grid;
}

// ── BFS on the maze ───────────────────────────────────────────────────────

function bfsSolve(
  grid: number[][],
  start: { r: number; c: number },
  goal: { r: number; c: number },
): AnimationStep[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const steps: AnimationStep[] = [];

  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: Array<{ r: number; c: number }> = [];

  const key = (r: number, c: number) => `${r},${c}`;
  const startKey = key(start.r, start.c);
  const goalKey = key(goal.r, goal.c);

  // Track cell states for rendering
  const cellStates: Record<string, string> = {};
  cellStates[startKey] = 'start';
  cellStates[goalKey] = 'goal';

  visited.add(startKey);
  queue.push(start);

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function makeFrontier(): string[] {
    return queue.map(({ r, c }) => `${r},${c}`);
  }

  // Initial step
  steps.push({
    type: 'compare',
    indices: [0],
    description: `BFS from (${start.r},${start.c}) — start enqueued`,
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

  let found = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const ck = key(current.r, current.c);

    // Mark current
    if (ck !== startKey && ck !== goalKey) {
      cellStates[ck] = 'current';
    }

    steps.push({
      type: 'compare',
      indices: [current.r * cols + current.c],
      description: `Dequeue (${current.r},${current.c}) — exploring neighbors. Queue size: ${queue.length}`,
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

    if (ck === goalKey) {
      found = true;
      break;
    }

    for (const [dr, dc] of dirs) {
      const nr = current.r + dr;
      const nc = current.c + dc;
      const nk = key(nr, nc);

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc] === 1) continue;
      if (visited.has(nk)) continue;

      visited.add(nk);
      parent.set(nk, ck);
      queue.push({ r: nr, c: nc });

      if (nk !== goalKey) {
        cellStates[nk] = 'queued';
      }

      steps.push({
        type: 'swap',
        indices: [current.r * cols + current.c, nr * cols + nc],
        description: `Discover (${nr},${nc}) via (${current.r},${current.c}) — enqueue. Queue size: ${queue.length}`,
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

    // Mark as visited
    if (ck !== startKey && ck !== goalKey) {
      cellStates[ck] = 'visited';
    }

    steps.push({
      type: 'sorted',
      indices: [current.r * cols + current.c],
      description: `Cell (${current.r},${current.c}) fully explored`,
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
        description: `Tracing shortest path — ${path.length} cells`,
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
      description: `BFS complete — shortest path has ${path.length} cells, explored ${visited.size} total`,
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
      description: `BFS complete — no path found. Explored ${visited.size} cells.`,
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

export function generateBFSMazeSteps(arr: number[]): StepResult {
  const rng = createRng(seedFromArr(arr));
  const grid = generateMaze(ROWS, COLS, rng);

  const start = { r: 1, c: 1 };
  const goal = { r: ROWS - 2, c: COLS - 2 };

  // Ensure start and goal are passable
  grid[start.r][start.c] = 0;
  grid[goal.r][goal.c] = 0;

  const steps = bfsSolve(grid, start, goal);

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
