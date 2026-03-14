import type { AnimationStep, RecursionTreeNode, RecursionTreeScene, StepResult } from '../animation-engine';

/**
 * Generates a StepResult that visualizes the Fibonacci recursion tree
 * with memoization. The key educational insight: duplicate sub-calls are
 * retrieved from the memo cache (shown in gold) instead of recomputed.
 *
 * n is clamped to [5, 8] for visual clarity.
 */

// ── Internal tree-building types ────────────────────────────────────────

interface TreeNodeData {
  id: number;
  fibN: number;
  parentId?: number;
  leftChildId?: number;
  rightChildId?: number;
  depth: number;
  /** Horizontal position index within the depth level */
  posIndex: number;
}

// ── Tree layout ─────────────────────────────────────────────────────────

/**
 * Build the full recursion tree for fib(n) WITHOUT memoization pruning,
 * so we can show which calls would be made and which are cache hits.
 * Returns all nodes in DFS pre-order.
 */
function buildFullTree(n: number): TreeNodeData[] {
  const nodes: TreeNodeData[] = [];
  let nextId = 0;

  function build(fibN: number, depth: number, parentId?: number): number {
    const id = nextId++;
    nodes.push({ id, fibN, parentId, depth, posIndex: 0 });

    if (fibN >= 2) {
      const leftId = build(fibN - 1, depth + 1, id);
      const rightId = build(fibN - 2, depth + 1, id);
      nodes[id].leftChildId = leftId;
      nodes[id].rightChildId = rightId;
    }

    return id;
  }

  build(n, 0);
  return nodes;
}

/**
 * Build a memoized recursion tree: the first time fib(k) is computed we
 * expand its children. Subsequent calls to fib(k) are leaf nodes marked
 * as cache hits. Returns nodes in DFS pre-order.
 */
function buildMemoizedTree(n: number): TreeNodeData[] {
  const nodes: TreeNodeData[] = [];
  let nextId = 0;
  const computed = new Set<number>(); // which fib(k) have been computed

  function build(fibN: number, depth: number, parentId?: number): number {
    const id = nextId++;
    nodes.push({ id, fibN, parentId, depth, posIndex: 0 });

    if (fibN <= 1) {
      // Base case — always a leaf
      computed.add(fibN);
    } else if (computed.has(fibN)) {
      // Cache hit — leaf node (no children expanded)
    } else {
      // Cache miss — expand children
      const leftId = build(fibN - 1, depth + 1, id);
      const rightId = build(fibN - 2, depth + 1, id);
      nodes[id].leftChildId = leftId;
      nodes[id].rightChildId = rightId;
      computed.add(fibN);
    }

    return id;
  }

  build(n, 0);
  return nodes;
}

/**
 * Assign normalized (0-1) x/y positions to each node.
 * Uses a simple level-based layout: each level is evenly spaced vertically,
 * nodes within a level are spread horizontally based on subtree extent.
 */
function assignPositions(treeNodes: TreeNodeData[]): void {
  if (treeNodes.length === 0) return;

  const maxDepth = Math.max(...treeNodes.map(n => n.depth));

  // Compute subtree widths for spacing
  const subtreeWidth = new Map<number, number>();

  // Process bottom-up: leaves have width 1
  // Sort by depth descending to process leaves first
  const byDepthDesc = [...treeNodes].sort((a, b) => b.depth - a.depth);
  for (const node of byDepthDesc) {
    if (node.leftChildId === undefined && node.rightChildId === undefined) {
      subtreeWidth.set(node.id, 1);
    } else {
      const lw = node.leftChildId !== undefined ? (subtreeWidth.get(node.leftChildId) ?? 1) : 0;
      const rw = node.rightChildId !== undefined ? (subtreeWidth.get(node.rightChildId) ?? 1) : 0;
      subtreeWidth.set(node.id, lw + rw);
    }
  }

  // Assign x positions using subtree widths
  const totalWidth = subtreeWidth.get(treeNodes[0].id) ?? 1;

  function assignX(nodeId: number, leftBound: number, rightBound: number): void {
    const node = treeNodes.find(n => n.id === nodeId);
    if (!node) return;

    const w = subtreeWidth.get(nodeId) ?? 1;
    const mid = leftBound + (rightBound - leftBound) / 2;

    node.posIndex = 0; // unused after this
    // Store x as normalized 0-1
    (node as TreeNodeData & { _x: number })._x = mid;

    if (node.leftChildId !== undefined && node.rightChildId !== undefined) {
      const lw = subtreeWidth.get(node.leftChildId) ?? 1;
      const rw = subtreeWidth.get(node.rightChildId) ?? 1;
      const splitPoint = leftBound + (rightBound - leftBound) * (lw / (lw + rw));
      assignX(node.leftChildId, leftBound, splitPoint);
      assignX(node.rightChildId, splitPoint, rightBound);
    } else if (node.leftChildId !== undefined) {
      assignX(node.leftChildId, leftBound, rightBound);
    } else if (node.rightChildId !== undefined) {
      assignX(node.rightChildId, leftBound, rightBound);
    }
  }

  assignX(treeNodes[0].id, 0, 1);

  // Set final normalized positions
  for (const node of treeNodes) {
    node.posIndex = 0;
    const nx = (node as TreeNodeData & { _x?: number })._x ?? 0.5;
    // We'll store positions directly — accessed via the treeNodes array
    (node as TreeNodeData & { nx: number; ny: number }).nx = nx;
    (node as TreeNodeData & { nx: number; ny: number }).ny = maxDepth > 0 ? node.depth / maxDepth : 0;
  }
}

// ── Step generation ─────────────────────────────────────────────────────

export function generateFibonacciTreeSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  // Clamp n to [5, 8] for visual clarity
  const n = Math.min(8, Math.max(5, Math.min(arr.length + 2, 8)));

  // Build the memoized tree
  const treeNodes = buildMemoizedTree(n);
  assignPositions(treeNodes);

  // Pre-compute actual fibonacci values
  const fibValues: number[] = [0, 1];
  for (let i = 2; i <= n; i++) fibValues[i] = fibValues[i - 1] + fibValues[i - 2];

  // Convert to RecursionTreeNode format
  function makeSceneNodes(
    visibleIds: Set<number>,
    stateMap: Map<number, string>,
    resultMap: Map<number, string>
  ): RecursionTreeNode[] {
    return treeNodes
      .filter(tn => visibleIds.has(tn.id))
      .map(tn => ({
        id: tn.id,
        label: `f(${tn.fibN})`,
        x: (tn as TreeNodeData & { nx: number }).nx ?? 0.5,
        y: (tn as TreeNodeData & { ny: number }).ny ?? 0,
        parentId: tn.parentId,
        state: stateMap.get(tn.id) ?? 'default',
        result: resultMap.get(tn.id),
      }));
  }

  function makeEdges(visibleIds: Set<number>): Array<{ from: number; to: number }> {
    const result: Array<{ from: number; to: number }> = [];
    for (const tn of treeNodes) {
      if (!visibleIds.has(tn.id)) continue;
      if (tn.parentId !== undefined && visibleIds.has(tn.parentId)) {
        result.push({ from: tn.parentId, to: tn.id });
      }
    }
    return result;
  }

  // State tracking
  const visibleIds = new Set<number>();
  const stateMap = new Map<number, string>();
  const resultMap = new Map<number, string>();
  const memo: Record<number, number> = {};
  const computedFibs = new Set<number>(); // which fib(k) have been fully computed

  function makeScene(): RecursionTreeScene {
    return {
      type: 'recursion-tree',
      nodes: makeSceneNodes(visibleIds, stateMap, resultMap),
      edges: makeEdges(visibleIds),
      memo: { ...memo },
    };
  }

  // Initial scene (empty)
  const initialScene: RecursionTreeScene = {
    type: 'recursion-tree',
    nodes: [],
    edges: [],
    memo: {},
  };

  // Walk the tree in DFS order and generate steps
  function dfs(nodeId: number): void {
    const node = treeNodes.find(tn => tn.id === nodeId);
    if (!node) return;

    // Show node appearing
    visibleIds.add(nodeId);
    stateMap.set(nodeId, 'current');

    // Check if this is a cache hit
    if (node.fibN >= 2 && computedFibs.has(node.fibN)) {
      // Cache hit!
      steps.push({
        type: 'swap', // counts as a "hit" (secondary stat)
        indices: [nodeId],
        description: `f(${node.fibN}) — cache hit! Retrieved memo[${node.fibN}] = ${fibValues[node.fibN]}`,
        sceneUpdate: makeScene(),
      });

      stateMap.set(nodeId, 'cached');
      resultMap.set(nodeId, String(fibValues[node.fibN]));

      steps.push({
        type: 'sorted',
        indices: [nodeId],
        description: `f(${node.fibN}) = ${fibValues[node.fibN]} (from cache)`,
        sceneUpdate: makeScene(),
      });

      return;
    }

    // Base cases
    if (node.fibN <= 1) {
      steps.push({
        type: 'compare',
        indices: [nodeId],
        description: `f(${node.fibN}) — base case`,
        sceneUpdate: makeScene(),
      });

      stateMap.set(nodeId, 'computed');
      resultMap.set(nodeId, String(fibValues[node.fibN]));
      memo[node.fibN] = fibValues[node.fibN];
      computedFibs.add(node.fibN);

      steps.push({
        type: 'sorted',
        indices: [nodeId],
        description: `f(${node.fibN}) = ${fibValues[node.fibN]} — stored in memo`,
        sceneUpdate: makeScene(),
      });

      return;
    }

    // Recursive case — not yet computed
    steps.push({
      type: 'compare',
      indices: [nodeId],
      description: `computing f(${node.fibN}) — need f(${node.fibN - 1}) + f(${node.fibN - 2})`,
      sceneUpdate: makeScene(),
    });

    stateMap.set(nodeId, 'computing');

    // Recurse left (fib(n-1))
    if (node.leftChildId !== undefined) {
      steps.push({
        type: 'compare',
        indices: [nodeId],
        description: `f(${node.fibN}): calling f(${node.fibN - 1})`,
        sceneUpdate: makeScene(),
      });
      dfs(node.leftChildId);
    }

    // Recurse right (fib(n-2))
    if (node.rightChildId !== undefined) {
      steps.push({
        type: 'compare',
        indices: [nodeId],
        description: `f(${node.fibN}): calling f(${node.fibN - 2})`,
        sceneUpdate: makeScene(),
      });
      dfs(node.rightChildId);
    }

    // Compute result
    const result = fibValues[node.fibN];
    stateMap.set(nodeId, 'computed');
    resultMap.set(nodeId, String(result));
    memo[node.fibN] = result;
    computedFibs.add(node.fibN);

    steps.push({
      type: 'sorted',
      indices: [nodeId],
      description: `f(${node.fibN}) = f(${node.fibN - 1}) + f(${node.fibN - 2}) = ${fibValues[node.fibN - 1]} + ${fibValues[node.fibN - 2]} = ${result} — stored in memo`,
      sceneUpdate: makeScene(),
    });
  }

  // Start DFS from root
  dfs(0);

  // Done step
  steps.push({
    type: 'done',
    indices: [0],
    description: `f(${n}) = ${fibValues[n]} — memoization reduced exponential recursion to ${Object.keys(memo).length} unique subproblems`,
    sceneUpdate: makeScene(),
  });

  return { steps, initialScene };
}
