import type { AnimationStep, LinearScene, LinearItem, StepResult } from '../animation-engine';

/**
 * Generates AnimationSteps for Array data structure operations.
 *
 * Returns { steps, initialScene } where initialScene is a LinearScene
 * with structureType 'array'. Every step carries a sceneUpdate with
 * the full items snapshot.
 *
 * Operation sequence:
 *   1. Show initial array
 *   2. Access random indices (O(1) direct access)
 *   3. Insert values at the end
 *   4. Insert at a specific index (shifting elements)
 *   5. Delete from a specific index (shifting elements)
 */
export function generateArraySteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  // Build initial array from input (cap at 8)
  const values = arr.slice(0, Math.min(8, arr.length));
  const array: string[] = values.map(v => Math.round(v * 100).toString());

  function buildItems(activeIdx?: number, insertedIdx?: number, removedIdx?: number): LinearItem[] {
    return array.map((val, i) => {
      if (removedIdx !== undefined && i === removedIdx) return { value: val, state: 'removed' };
      if (insertedIdx !== undefined && i === insertedIdx) return { value: val, state: 'inserted' };
      if (activeIdx !== undefined && i === activeIdx) return { value: val, state: 'active' };
      return { value: val, state: 'default' };
    });
  }

  function pointers(indices?: Array<{ index: number; label: string }>) {
    return indices ?? [{ index: array.length - 1, label: 'len=' + array.length }];
  }

  // ── Show initial array ────────────────────────────────────────────────
  steps.push({
    type: 'compare',
    indices: [],
    description: `Array initialized with ${array.length} elements`,
    sceneUpdate: {
      type: 'linear',
      structureType: 'array',
      items: buildItems(),
      pointers: pointers(),
    } as LinearScene,
  });

  // ── Phase 1: Access operations (O(1)) ─────────────────────────────────
  const accessCount = Math.min(3, array.length);
  for (let a = 0; a < accessCount; a++) {
    const idx = (a * 3 + 1) % array.length;

    steps.push({
      type: 'compare',
      indices: [idx],
      description: `Accessing arr[${idx}] = ${array[idx]} — O(1) direct index lookup`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'array',
        items: buildItems(idx),
        pointers: pointers([{ index: idx, label: `i=${idx}` }]),
      } as LinearScene,
    });

    steps.push({
      type: 'sorted',
      indices: [idx],
      description: `Found arr[${idx}] = ${array[idx]}`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'array',
        items: buildItems(),
        pointers: pointers(),
      } as LinearScene,
    });
  }

  // ── Phase 2: Append (push) ────────────────────────────────────────────
  const appendVal = String(Math.round(Math.random() * 50 + 50));
  array.push(appendVal);

  steps.push({
    type: 'swap',
    indices: [array.length - 1],
    description: `Appending ${appendVal} at index ${array.length - 1} — O(1) amortized`,
    sceneUpdate: {
      type: 'linear',
      structureType: 'array',
      items: buildItems(undefined, array.length - 1),
      pointers: pointers(),
    } as LinearScene,
  });

  steps.push({
    type: 'sorted',
    indices: [array.length - 1],
    description: `Array now has ${array.length} elements`,
    sceneUpdate: {
      type: 'linear',
      structureType: 'array',
      items: buildItems(),
      pointers: pointers(),
    } as LinearScene,
  });

  // ── Phase 3: Insert at index (shift right) ────────────────────────────
  const insertIdx = Math.min(2, array.length);
  const insertVal = String(Math.round(Math.random() * 50 + 25));

  // Show shifting elements right
  steps.push({
    type: 'compare',
    indices: Array.from({ length: array.length - insertIdx }, (_, i) => insertIdx + i),
    description: `Inserting ${insertVal} at index ${insertIdx} — shifting elements right`,
    sceneUpdate: {
      type: 'linear',
      structureType: 'array',
      items: buildItems().map((item, i) =>
        i >= insertIdx ? { ...item, state: 'comparing' as const } : item
      ),
      pointers: pointers([{ index: insertIdx, label: `insert@${insertIdx}` }]),
    } as LinearScene,
  });

  array.splice(insertIdx, 0, insertVal);

  steps.push({
    type: 'swap',
    indices: [insertIdx],
    description: `Inserted ${insertVal} at index ${insertIdx} — O(n) due to shifting`,
    sceneUpdate: {
      type: 'linear',
      structureType: 'array',
      items: buildItems(undefined, insertIdx),
      pointers: pointers(),
    } as LinearScene,
  });

  steps.push({
    type: 'sorted',
    indices: [insertIdx],
    description: `Array now has ${array.length} elements after insert`,
    sceneUpdate: {
      type: 'linear',
      structureType: 'array',
      items: buildItems(),
      pointers: pointers(),
    } as LinearScene,
  });

  // ── Phase 4: Delete at index (shift left) ─────────────────────────────
  const deleteIdx = Math.min(1, array.length - 1);
  const deleteVal = array[deleteIdx];

  steps.push({
    type: 'compare',
    indices: [deleteIdx],
    description: `Deleting arr[${deleteIdx}] = ${deleteVal} — will shift elements left`,
    sceneUpdate: {
      type: 'linear',
      structureType: 'array',
      items: buildItems(undefined, undefined, deleteIdx),
      pointers: pointers([{ index: deleteIdx, label: `del@${deleteIdx}` }]),
    } as LinearScene,
  });

  array.splice(deleteIdx, 1);

  steps.push({
    type: 'swap',
    indices: Array.from({ length: array.length - deleteIdx }, (_, i) => deleteIdx + i),
    description: `Elements shifted left — O(n) operation`,
    sceneUpdate: {
      type: 'linear',
      structureType: 'array',
      items: buildItems().map((item, i) =>
        i >= deleteIdx ? { ...item, state: 'active' as const } : item
      ),
      pointers: pointers(),
    } as LinearScene,
  });

  steps.push({
    type: 'sorted',
    indices: [],
    description: `Array now has ${array.length} elements after delete`,
    sceneUpdate: {
      type: 'linear',
      structureType: 'array',
      items: buildItems(),
      pointers: pointers(),
    } as LinearScene,
  });

  // ── Done ──────────────────────────────────────────────────────────────
  steps.push({
    type: 'done',
    indices: [],
    description: 'Array operations complete — access O(1), insert/delete O(n)',
    sceneUpdate: {
      type: 'linear',
      structureType: 'array',
      items: buildItems(),
      pointers: pointers(),
    } as LinearScene,
  });

  const initialScene: LinearScene = {
    type: 'linear',
    structureType: 'array',
    items: values.map(v => ({
      value: Math.round(v * 100).toString(),
      state: 'default',
    })),
    pointers: [{ index: values.length - 1, label: 'len=' + values.length }],
  };

  return { steps, initialScene };
}
