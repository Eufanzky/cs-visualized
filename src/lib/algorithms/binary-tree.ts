import type { AnimationStep, TreeScene, TreeNode, StepResult } from '../animation-engine';

/**
 * Generates AnimationSteps for Binary Search Tree (BST) insert + search.
 *
 * Returns { steps, initialScene } where initialScene is an empty TreeScene.
 * Each step's sceneUpdate carries the full TreeScene at that moment so the
 * tree renderer always has accurate node positions and edges.
 *
 * Node layout:
 *   - Root at normalised (cx=0.5, cy=0.15) — renderer maps these to canvas px
 *   - Each depth level spreads children ± (0.5 / 2^depth) horizontally
 *   - Y advances by 0.18 per level
 *
 * Phases:
 *   1. Build — insert up to 7 values into the BST
 *   2. Search — highlight the traversal path to the middle value
 */
export function generateBinaryTreeSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  const raw = arr.slice(0, Math.min(7, arr.length));
  const n = raw.length;
  const fmt = (v: number) => Math.round(v * 100).toString();

  // ── Internal BST node ───────────────────────────────────────────────────
  interface BSTNode {
    id: number;
    value: number;
    label: string;
    x: number;   // normalised [0,1] horizontal position
    y: number;   // normalised [0,1] vertical position
    left: BSTNode | null;
    right: BSTNode | null;
  }

  let nextId = 0;
  let root: BSTNode | null = null;

  /**
   * Compute (x, y) for a new child node.
   *   depth: 0-based level of the child
   *   parentX: normalised x of the parent
   *   isLeft: which side
   */
  function childPos(depth: number, parentX: number, isLeft: boolean): { x: number; y: number } {
    const spread = 0.5 / Math.pow(2, depth);
    const x = isLeft ? parentX - spread : parentX + spread;
    const y = 0.15 + depth * 0.18;
    return { x, y };
  }

  /** Build a fresh TreeScene snapshot from the current BST. */
  function buildScene(activePathIds: number[] = []): TreeScene {
    const nodes: TreeNode[] = [];
    const edges: Array<{ from: number; to: number }> = [];

    function traverse(node: BSTNode | null) {
      if (!node) return;
      nodes.push({
        id: node.id,
        value: node.label,
        x: node.x,
        y: node.y,
        left: node.left?.id,
        right: node.right?.id,
      });
      if (node.left) {
        edges.push({ from: node.id, to: node.left.id });
        traverse(node.left);
      }
      if (node.right) {
        edges.push({ from: node.id, to: node.right.id });
        traverse(node.right);
      }
    }

    traverse(root);
    return { type: 'tree', nodes, edges, activePathIds };
  }

  if (n === 0) {
    const initialScene: TreeScene = { type: 'tree', nodes: [], edges: [], activePathIds: [] };
    steps.push({
      type: 'done',
      indices: [],
      description: 'Empty input — nothing to insert',
      sceneUpdate: initialScene,
    });
    return { steps, initialScene };
  }

  // ── Phase 1: Build the BST ──────────────────────────────────────────────
  function bstInsert(value: number) {
    const label = fmt(value);

    if (root === null) {
      root = { id: nextId++, value, label, x: 0.5, y: 0.15, left: null, right: null };

      steps.push({
        type: 'swap',
        indices: [root.id],
        description: `Inserting ${label} as the root of the BST`,
        sceneUpdate: buildScene([root.id]),
      });
      steps.push({
        type: 'sorted',
        indices: [root.id],
        description: `Root node ${label} settled`,
        sceneUpdate: buildScene(),
      });
      return;
    }

    let current: BSTNode = root;
    let depth = 1;
    const path: number[] = [root.id];

    for (;;) {
      steps.push({
        type: 'compare',
        indices: [current.id],
        description: `Comparing ${label} with node ${current.label} — going ${value <= current.value ? 'LEFT' : 'RIGHT'}`,
        sceneUpdate: buildScene([...path]),
      });

      if (value <= current.value) {
        if (current.left === null) {
          const { x, y } = childPos(depth, current.x, true);
          const newNode: BSTNode = { id: nextId++, value, label, x, y, left: null, right: null };
          current.left = newNode;
          steps.push({
            type: 'swap',
            indices: [newNode.id],
            description: `Inserting ${label} as left child of ${current.label}`,
            sceneUpdate: buildScene([...path, newNode.id]),
          });
          steps.push({
            type: 'sorted',
            indices: [newNode.id],
            description: `Node ${label} settled`,
            sceneUpdate: buildScene(),
          });
          break;
        }
        path.push(current.left.id);
        current = current.left;
      } else {
        if (current.right === null) {
          const { x, y } = childPos(depth, current.x, false);
          const newNode: BSTNode = { id: nextId++, value, label, x, y, left: null, right: null };
          current.right = newNode;
          steps.push({
            type: 'swap',
            indices: [newNode.id],
            description: `Inserting ${label} as right child of ${current.label}`,
            sceneUpdate: buildScene([...path, newNode.id]),
          });
          steps.push({
            type: 'sorted',
            indices: [newNode.id],
            description: `Node ${label} settled`,
            sceneUpdate: buildScene(),
          });
          break;
        }
        path.push(current.right.id);
        current = current.right;
      }
      depth++;
    }
  }

  for (let i = 0; i < n; i++) {
    bstInsert(raw[i]);
  }

  // ── Phase 2: Search for the middle value ────────────────────────────────
  const searchTarget = raw[Math.floor(n / 2)];
  const searchLabel = fmt(searchTarget);

  // Capture root into a typed local to help TypeScript narrowing.
  // Cast through unknown to work around control-flow narrowing to 'never'
  // that occurs because `root` is mutated inside nested closure `bstInsert`.
  const rootNode = root as BSTNode | null;

  steps.push({
    type: 'compare',
    indices: rootNode ? [rootNode.id] : [],
    description: `Starting BST search for value ${searchLabel} from the root`,
    sceneUpdate: buildScene(rootNode ? [rootNode.id] : []),
  });

  let current: BSTNode | null = rootNode;
  const searchPath: number[] = [];
  let found = false;

  while (current !== null) {
    const node = current;
    searchPath.push(node.id);

    steps.push({
      type: 'compare',
      indices: [node.id],
      description: `Comparing ${searchLabel} with node ${node.label}`,
      sceneUpdate: buildScene([...searchPath]),
    });

    if (Math.abs(node.value - searchTarget) < 1e-9) {
      steps.push({
        type: 'sorted',
        indices: [node.id],
        description: `Found! Node ${searchLabel} at id ${node.id}`,
        sceneUpdate: buildScene([...searchPath]),
      });
      found = true;
      break;
    } else if (searchTarget < node.value) {
      steps.push({
        type: 'compare',
        indices: [node.id],
        description: `${searchLabel} < ${node.label} — searching LEFT subtree`,
        sceneUpdate: buildScene([...searchPath]),
      });
      current = node.left;
    } else {
      steps.push({
        type: 'compare',
        indices: [node.id],
        description: `${searchLabel} > ${node.label} — searching RIGHT subtree`,
        sceneUpdate: buildScene([...searchPath]),
      });
      current = node.right;
    }
  }

  if (!found) {
    steps.push({
      type: 'sorted',
      indices: [],
      description: `Value ${searchLabel} not found in the BST`,
      sceneUpdate: buildScene(),
    });
  }

  steps.push({
    type: 'done',
    indices: [],
    description: 'BST insert and search operations complete',
    sceneUpdate: buildScene(),
  });

  const initialScene: TreeScene = { type: 'tree', nodes: [], edges: [], activePathIds: [] };
  return { steps, initialScene };
}
