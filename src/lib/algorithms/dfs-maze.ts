import type { AnimationStep, MazeScene, StepResult } from '../animation-engine';

/**
 * DFS Maze Solver
 *
 * 1. Generate a random maze via recursive backtracking (seeded from arr)
 * 2. Run DFS (stack-based) from start to goal
 * 3. Trace the path back
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
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(1));

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
        grid[r + dr / 2][c + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);
  return grid;
}

// ── DFS on the maze ───────────────────────────────────────────────────────

function dfsSolve(
  grid: number[][],
  start: { r: number; c: number },
  goal: { r: number; c: number },
): AnimationStep[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const steps: AnimationStep[] = [];

  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const stack: Array<{ r: number; c: number }> = [];

  const key = (r: number, c: number) => `${r},${c}`;
  const startKey = key(start.r, start.c);
  const goalKey = key(goal.r, goal.c);

  const cellStates: Record<string, string> = {};
  cellStates[startKey] = 'start';
  cellStates[goalKey] = 'goal';

  visited.add(startKey);
  stack.push(start);

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function makeStackDisplay(): string[] {
    // Show top of stack (last few elements)
    const maxShow = 20;
    const start = Math.max(0, stack.length - maxShow);
    return stack.slice(start).map(({ r, c }) => `${r},${c}`);
  }

  // Initial step
  steps.push({
    type: 'compare',
    indices: [0],
    description: `DFS from (${start.r},${start.c}) — start pushed to stack`,
    sceneUpdate: {
      type: 'maze',
      grid,
      cellStates: { ...cellStates },
      rows,
      cols,
      start,
      goal,
      frontier: makeStackDisplay(),
    } as MazeScene,
  });

  let found = false;

  while (stack.length > 0) {
    const current = stack.pop()!;
    const ck = key(current.r, current.c);

    if (visited.has(ck) && ck !== startKey) {
      // Already visited via another path (DFS with explicit stack can push duplicates)
      continue;
    }

    if (ck !== startKey) {
      visited.add(ck);
    }

    // Mark current
    if (ck !== startKey && ck !== goalKey) {
      cellStates[ck] = 'current';
    }

    steps.push({
      type: 'compare',
      indices: [current.r * cols + current.c],
      description: `Pop (${current.r},${current.c}) — exploring neighbors. Stack size: ${stack.length}`,
      sceneUpdate: {
        type: 'maze',
        grid,
        cellStates: { ...cellStates },
        rows,
        cols,
        start,
        goal,
        frontier: makeStackDisplay(),
      } as MazeScene,
    });

    if (ck === goalKey) {
      found = true;
      break;
    }

    // Push neighbors in reverse order so the first direction is popped first
    const neighbors: Array<{ r: number; c: number }> = [];
    for (const [dr, dc] of dirs) {
      const nr = current.r + dr;
      const nc = current.c + dc;
      const nk = key(nr, nc);

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc] === 1) continue;
      if (visited.has(nk)) continue;

      neighbors.push({ r: nr, c: nc });
    }

    for (const n of neighbors) {
      const nk = key(n.r, n.c);
      if (!parent.has(nk)) parent.set(nk, ck);
      stack.push(n);

      if (nk !== goalKey) {
        cellStates[nk] = 'frontier';
      }

      steps.push({
        type: 'swap',
        indices: [current.r * cols + current.c, n.r * cols + n.c],
        description: `Discover (${n.r},${n.c}) via (${current.r},${current.c}) — push to stack. Stack size: ${stack.length}`,
        sceneUpdate: {
          type: 'maze',
          grid,
          cellStates: { ...cellStates },
          rows,
          cols,
          start,
          goal,
          frontier: makeStackDisplay(),
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
        frontier: makeStackDisplay(),
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
        description: `Tracing path — ${path.length} cells`,
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
      description: `DFS complete — path has ${path.length} cells, explored ${visited.size} total`,
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
      description: `DFS complete — no path found. Explored ${visited.size} cells.`,
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

export function generateDFSMazeSteps(arr: number[]): StepResult {
  const rng = createRng(seedFromArr(arr));
  const grid = generateMaze(ROWS, COLS, rng);

  const start = { r: 1, c: 1 };
  const goal = { r: ROWS - 2, c: COLS - 2 };

  grid[start.r][start.c] = 0;
  grid[goal.r][goal.c] = 0;

  const steps = dfsSolve(grid, start, goal);

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
