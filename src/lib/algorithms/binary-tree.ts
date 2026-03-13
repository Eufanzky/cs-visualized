import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Binary Search Tree (BST) operations.
 *
 * The demo runs three phases using a fixed set of values derived from the input array:
 *   1. Build   — insert nodes one by one, traversing to find the correct position
 *   2. Search  — traverse the BST to find a target value
 *   3. Confirm — highlight the found node (or report not found)
 *
 * The array is treated as a flat node store where the tree structure is implicit:
 *   - Index 0 is the root
 *   - Children of node i are at 2i+1 (left) and 2i+2 (right)
 *
 * Steps produced:
 *   - compare  → traversing a node (deciding left or right)
 *   - swap     → inserting a new node into the tree
 *   - sorted   → a node has been confirmed/settled (insertion done or node found)
 *   - done     → all BST operations are complete
 */
export function generateBinaryTreeSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];

  // Use up to 7 values for a balanced, readable tree (max 3 levels)
  const raw = arr.slice(0, Math.min(7, arr.length));
  const n = raw.length;
  const fmt = (v: number) => Math.round(v * 100).toString();

  if (n === 0) {
    steps.push({ type: 'done', indices: [], description: 'Empty input — nothing to insert' });
    return steps;
  }

  // Internal BST node structure (separate from the flat array used for visualization)
  interface BSTNode {
    value: number;
    flatIndex: number; // position in our flat visualization array
    left: BSTNode | null;
    right: BSTNode | null;
  }

  let root: BSTNode | null = null;
  // Maps flat visualization index → BSTNode
  const nodeByFlatIndex: Map<number, BSTNode> = new Map();
  let nextFlatIndex = 0;

  /**
   * Insert `value` into the BST and emit animation steps.
   * Returns the flat index assigned to the new node.
   */
  function bstInsert(value: number): number {
    const newFlatIndex = nextFlatIndex++;

    if (root === null) {
      root = { value, flatIndex: newFlatIndex, left: null, right: null };
      nodeByFlatIndex.set(newFlatIndex, root);

      steps.push({
        type: 'swap',
        indices: [newFlatIndex],
        description: `Inserting ${fmt(value)} as the root of the BST`,
      });
      steps.push({
        type: 'sorted',
        indices: [newFlatIndex],
        description: `Root node ${fmt(value)} is now settled at index 0`,
      });
      return newFlatIndex;
    }

    // Traverse to the insertion point
    let current: BSTNode = root;
    for (;;) {
      steps.push({
        type: 'compare',
        indices: [current.flatIndex],
        description: `Comparing ${fmt(value)} with node ${fmt(current.value)} at index ${current.flatIndex}`,
      });

      if (value <= current.value) {
        // Go left
        steps.push({
          type: 'compare',
          indices: [current.flatIndex],
          description: `${fmt(value)} ≤ ${fmt(current.value)} — going LEFT`,
        });
        if (current.left === null) {
          const newNode: BSTNode = { value, flatIndex: newFlatIndex, left: null, right: null };
          current.left = newNode;
          nodeByFlatIndex.set(newFlatIndex, newNode);
          steps.push({
            type: 'swap',
            indices: [newFlatIndex],
            description: `Inserting ${fmt(value)} as left child of ${fmt(current.value)}`,
          });
          steps.push({
            type: 'sorted',
            indices: [newFlatIndex],
            description: `Node ${fmt(value)} settled at index ${newFlatIndex}`,
          });
          break;
        }
        current = current.left;
      } else {
        // Go right
        steps.push({
          type: 'compare',
          indices: [current.flatIndex],
          description: `${fmt(value)} > ${fmt(current.value)} — going RIGHT`,
        });
        if (current.right === null) {
          const newNode: BSTNode = { value, flatIndex: newFlatIndex, left: null, right: null };
          current.right = newNode;
          nodeByFlatIndex.set(newFlatIndex, newNode);
          steps.push({
            type: 'swap',
            indices: [newFlatIndex],
            description: `Inserting ${fmt(value)} as right child of ${fmt(current.value)}`,
          });
          steps.push({
            type: 'sorted',
            indices: [newFlatIndex],
            description: `Node ${fmt(value)} settled at index ${newFlatIndex}`,
          });
          break;
        }
        current = current.right;
      }
    }

    return newFlatIndex;
  }

  // ── Phase 1: Build the BST ─────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    bstInsert(raw[i]);
  }

  // ── Phase 2: Search for the middle value ──────────────────────────────
  const searchTarget = raw[Math.floor(n / 2)];

  steps.push({
    type: 'compare',
    indices: [0],
    description: `Starting BST search for value ${fmt(searchTarget)} from the root`,
  });

  let current: BSTNode | null = root;
  let found = false;

  while (current !== null) {
    const node: BSTNode = current;
    steps.push({
      type: 'compare',
      indices: [node.flatIndex],
      description: `Comparing search target ${fmt(searchTarget)} with node ${fmt(node.value)}`,
    });

    if (Math.abs(node.value - searchTarget) < 1e-9) {
      // Found
      steps.push({
        type: 'sorted',
        indices: [node.flatIndex],
        description: `Found! Node ${fmt(searchTarget)} is at index ${node.flatIndex}`,
      });
      found = true;
      break;
    } else if (searchTarget < node.value) {
      steps.push({
        type: 'compare',
        indices: [node.flatIndex],
        description: `${fmt(searchTarget)} < ${fmt(node.value)} — searching LEFT subtree`,
      });
      current = node.left;
    } else {
      steps.push({
        type: 'compare',
        indices: [node.flatIndex],
        description: `${fmt(searchTarget)} > ${fmt(node.value)} — searching RIGHT subtree`,
      });
      current = node.right;
    }
  }

  if (!found) {
    steps.push({
      type: 'sorted',
      indices: [],
      description: `Value ${fmt(searchTarget)} not found in the BST`,
    });
  }

  steps.push({
    type: 'done',
    indices: [],
    description: 'BST insert and search operations complete',
  });

  return steps;
}
