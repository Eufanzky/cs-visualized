import type { AnimationStep, LinearScene, LinearItem, StepResult } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Linked List operations.
 *
 * Returns { steps, initialScene } where initialScene is an empty LinearScene
 * with structureType 'linked-list'. Each step carries a sceneUpdate that
 * reflects the current list state so the linear renderer always has accurate
 * data.
 *
 * Three phases:
 *   1. Build  — append nodes one at a time
 *   2. Search — traverse with 'active' highlight looking for the middle node
 *   3. Delete — mark the found node as 'removed', then remove it
 */
export function generateLinkedListSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  const nodes = arr.slice(0, Math.min(7, arr.length));
  const n = nodes.length;
  const fmt = (v: number) => Math.round(v * 100).toString();

  if (n === 0) {
    const initialScene: LinearScene = {
      type: 'linear',
      structureType: 'linked-list',
      items: [],
      pointers: [{ index: -1, label: 'HEAD' }],
    };
    steps.push({
      type: 'done',
      indices: [],
      description: 'Empty list',
      sceneUpdate: initialScene,
    });
    return { steps, initialScene };
  }

  // Mutable logical list (array of display strings)
  const list: string[] = [];

  /** Build LinearItem array from the current list. */
  function buildItems(
    activeIdx?: number,
    leavingIdx?: number,
  ): LinearItem[] {
    return list.map((val, i) => {
      if (leavingIdx !== undefined && i === leavingIdx) return { value: val, state: 'removed' };
      if (activeIdx !== undefined && i === activeIdx) return { value: val, state: 'active' };
      return { value: val, state: 'default' };
    });
  }

  /** HEAD pointer always at index 0 when list is non-empty, else -1. */
  function headPointer(len: number) {
    return [{ index: len > 0 ? 0 : -1, label: 'HEAD' }];
  }

  // ── Phase 1: Build ──────────────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const val = fmt(nodes[i]);

    if (list.length > 0) {
      // Show tail being visited before append
      steps.push({
        type: 'compare',
        indices: [list.length - 1],
        description: `Traversing to tail node ${list[list.length - 1]} to append ${val}`,
        sceneUpdate: {
          type: 'linear',
          structureType: 'linked-list',
          items: buildItems(list.length - 1),
          pointers: headPointer(list.length),
        } as LinearScene,
      });
    }

    list.push(val);

    // Insert: show new node as 'inserted'
    steps.push({
      type: 'swap',
      indices: [list.length - 1],
      description:
        list.length === 1
          ? `Inserting head node ${val}`
          : `Inserting ${val} after ${list[list.length - 2]}`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'linked-list',
        items: buildItems(list.length - 1),
        pointers: headPointer(list.length),
      } as LinearScene,
    });

    // Settle
    steps.push({
      type: 'sorted',
      indices: [list.length - 1],
      description: `Node ${val} linked at position ${list.length - 1}`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'linked-list',
        items: buildItems(),
        pointers: headPointer(list.length),
      } as LinearScene,
    });
  }

  // ── Phase 2: Search ─────────────────────────────────────────────────────
  const searchIndex = Math.floor(n / 2);
  const searchTarget = list[searchIndex];

  steps.push({
    type: 'compare',
    indices: [0],
    description: `Starting traversal from HEAD to find node ${searchTarget}`,
    sceneUpdate: {
      type: 'linear',
      structureType: 'linked-list',
      items: buildItems(0),
      pointers: headPointer(list.length),
    } as LinearScene,
  });

  for (let i = 0; i < searchIndex; i++) {
    steps.push({
      type: 'compare',
      indices: [i],
      description: `Visiting node ${list[i]} — not the target, following next pointer`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'linked-list',
        items: buildItems(i),
        pointers: headPointer(list.length),
      } as LinearScene,
    });
  }

  steps.push({
    type: 'compare',
    indices: [searchIndex],
    description: `Found target node ${searchTarget} at position ${searchIndex}`,
    sceneUpdate: {
      type: 'linear',
      structureType: 'linked-list',
      items: buildItems(searchIndex),
      pointers: headPointer(list.length),
    } as LinearScene,
  });

  // ── Phase 3: Delete ─────────────────────────────────────────────────────
  if (n > 1) {
    const prevIndex = searchIndex - 1;
    const nextIndex = searchIndex + 1;

    let description: string;
    if (prevIndex >= 0 && nextIndex < n) {
      description = `Re-linking: node ${list[prevIndex]} → node ${list[nextIndex]} (skipping ${searchTarget})`;
    } else if (prevIndex < 0) {
      description = `Removing head node ${searchTarget} — new HEAD is ${list[nextIndex]}`;
    } else {
      description = `Removing tail node ${searchTarget} — new tail is ${list[prevIndex]}`;
    }

    // Show node as leaving
    steps.push({
      type: 'swap',
      indices: [searchIndex],
      description,
      sceneUpdate: {
        type: 'linear',
        structureType: 'linked-list',
        items: buildItems(undefined, searchIndex),
        pointers: headPointer(list.length),
      } as LinearScene,
    });

    // Remove node from list
    list.splice(searchIndex, 1);

    // Remaining nodes settle
    steps.push({
      type: 'sorted',
      indices: list.map((_, i) => i),
      description: `Node ${searchTarget} removed — list has ${list.length} nodes remaining`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'linked-list',
        items: buildItems(),
        pointers: headPointer(list.length),
      } as LinearScene,
    });
  }

  steps.push({
    type: 'done',
    indices: [],
    description: 'Linked list operations complete',
    sceneUpdate: {
      type: 'linear',
      structureType: 'linked-list',
      items: buildItems(),
      pointers: headPointer(list.length),
    } as LinearScene,
  });

  const initialScene: LinearScene = {
    type: 'linear',
    structureType: 'linked-list',
    items: [],
    pointers: [{ index: -1, label: 'HEAD' }],
  };

  return { steps, initialScene };
}
