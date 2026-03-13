import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Linked List operations.
 *
 * The visualisation maps each node to an array index; node values come from the
 * caller's `arr`.  The demo walks through three phases:
 *   1. Build — sequentially insert nodes to form the initial list
 *   2. Search — traverse the list hunting for a target value
 *   3. Delete — unlink the found node and stitch neighbours together
 *
 * Steps produced:
 *   - compare  → a node is being visited / traversed
 *   - swap     → an insertion or deletion is being applied
 *   - sorted   → a node has been confirmed as part of the final list
 *   - done     → all operations are complete
 */
export function generateLinkedListSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];

  // Cap list size for readability
  const nodes = arr.slice(0, Math.min(8, arr.length));
  const n = nodes.length;
  const fmt = (v: number) => Math.round(v * 100).toString();

  if (n === 0) {
    steps.push({ type: 'done', indices: [], description: 'Empty list' });
    return steps;
  }

  // ── Phase 1: Build the list ────────────────────────────────────────────
  const list: number[] = [];

  for (let i = 0; i < n; i++) {
    const val = nodes[i];

    if (list.length > 0) {
      // Show traversal to the current tail before inserting
      steps.push({
        type: 'compare',
        indices: [list.length - 1],
        description: `Traversing to node ${fmt(list[list.length - 1])} to append next node`,
      });
    }

    // Insert new node at the tail
    steps.push({
      type: 'swap',
      indices: [list.length],
      values: [...list, val],
      description:
        list.length === 0
          ? `Inserting head node ${fmt(val)}`
          : `Inserting ${fmt(val)} after node ${fmt(list[list.length - 1])}`,
    });
    list.push(val);

    // Node is now settled
    steps.push({
      type: 'sorted',
      indices: [list.length - 1],
      description: `Node ${fmt(val)} linked at position ${list.length - 1}`,
    });
  }

  // ── Phase 2: Search for the middle node ───────────────────────────────
  const searchIndex = Math.floor(n / 2);
  const searchTarget = list[searchIndex];

  steps.push({
    type: 'compare',
    indices: [0],
    description: `Starting traversal from head to find node ${fmt(searchTarget)}`,
  });

  for (let i = 0; i < searchIndex; i++) {
    steps.push({
      type: 'compare',
      indices: [i],
      description: `Visiting node ${fmt(list[i])} — not the target, following next pointer`,
    });
  }

  steps.push({
    type: 'compare',
    indices: [searchIndex],
    description: `Found target node ${fmt(searchTarget)} at position ${searchIndex}`,
  });

  // ── Phase 3: Delete the found node ────────────────────────────────────
  if (n > 1) {
    const prevIndex = searchIndex - 1;
    const nextIndex = searchIndex + 1;

    if (prevIndex >= 0 && nextIndex < n) {
      steps.push({
        type: 'swap',
        indices: [prevIndex, searchIndex],
        description: `Re-linking: node ${fmt(list[prevIndex])} → node ${fmt(list[nextIndex])} (skipping ${fmt(searchTarget)})`,
      });
    } else if (prevIndex < 0) {
      // Deleting head
      steps.push({
        type: 'swap',
        indices: [searchIndex],
        description: `Removing head node ${fmt(searchTarget)} — new head is ${fmt(list[nextIndex])}`,
      });
    } else {
      // Deleting tail
      steps.push({
        type: 'swap',
        indices: [searchIndex],
        description: `Removing tail node ${fmt(searchTarget)} — new tail is ${fmt(list[prevIndex])}`,
      });
    }

    // Mark remaining nodes as settled after deletion
    const remaining: number[] = [];
    for (let i = 0; i < n; i++) {
      if (i !== searchIndex) remaining.push(i > searchIndex ? i - 1 : i);
    }
    steps.push({
      type: 'sorted',
      indices: remaining,
      description: `Node ${fmt(searchTarget)} removed — list has ${n - 1} nodes remaining`,
    });
  }

  steps.push({
    type: 'done',
    indices: [],
    description: 'Linked list operations complete',
  });

  return steps;
}
