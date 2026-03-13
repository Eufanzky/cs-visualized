import type { AnimationStep, LinearScene, LinearItem, StepResult } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Stack (LIFO) operations.
 *
 * Returns { steps, initialScene } where initialScene is an empty LinearScene
 * with structureType 'stack'. Every step carries a sceneUpdate that replaces
 * the items array and updates the TOP pointer so the linear renderer always has
 * a complete, accurate scene snapshot.
 *
 * Operation sequence:
 *   - Push all values (up to 6) one by one
 *   - Pop half of them back off
 */
export function generateStackSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  // Cap at 6 values for a readable demo
  const values = arr.slice(0, Math.min(6, arr.length));
  const fmt = (v: number) => Math.round(v * 100).toString();

  // Mutable logical stack (array of display strings)
  const stack: string[] = [];

  /** Build the LinearScene items snapshot from the current logical stack. */
  function buildItems(enteringIdx?: number, leavingIdx?: number): LinearItem[] {
    return stack.map((val, i) => {
      if (leavingIdx !== undefined && i === leavingIdx) return { value: val, state: 'removed' };
      if (enteringIdx !== undefined && i === enteringIdx) return { value: val, state: 'inserted' };
      return { value: val, state: 'default' };
    });
  }

  /** TOP pointer for the current stack length. index -1 when empty. */
  function topPointer(len: number) {
    return [{ index: len - 1, label: 'TOP' }];
  }

  const pushCount = values.length;
  const popCount = Math.floor(pushCount / 2);

  // ── Push phase ──────────────────────────────────────────────────────────
  for (let i = 0; i < pushCount; i++) {
    const val = fmt(values[i]);

    // Highlight current top before pushing (skip on empty stack)
    if (stack.length > 0) {
      steps.push({
        type: 'compare',
        indices: [stack.length - 1],
        description: `Stack TOP is ${stack[stack.length - 1]} — pushing ${val} above it`,
        sceneUpdate: {
          type: 'linear',
          structureType: 'stack',
          items: buildItems(undefined, undefined).map((item, idx) =>
            idx === stack.length - 1 ? { ...item, state: 'active' } : item
          ),
          pointers: topPointer(stack.length),
        } as LinearScene,
      });
    }

    // Push: add item with 'entering' state
    stack.push(val);
    steps.push({
      type: 'swap',
      indices: [stack.length - 1],
      description: `Pushing ${val} onto the stack`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'stack',
        items: buildItems(stack.length - 1),
        pointers: topPointer(stack.length),
      } as LinearScene,
    });

    // Settle — item becomes idle
    steps.push({
      type: 'sorted',
      indices: [stack.length - 1],
      description: `${val} is now at the top of the stack (size = ${stack.length})`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'stack',
        items: buildItems(),
        pointers: topPointer(stack.length),
      } as LinearScene,
    });
  }

  // ── Pop phase ───────────────────────────────────────────────────────────
  for (let i = 0; i < popCount; i++) {
    if (stack.length === 0) break;
    const top = stack[stack.length - 1];

    // Highlight top before popping
    steps.push({
      type: 'compare',
      indices: [stack.length - 1],
      description: `Peeking at TOP element ${top} before popping`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'stack',
        items: buildItems().map((item, idx) =>
          idx === stack.length - 1 ? { ...item, state: 'active' } : item
        ),
        pointers: topPointer(stack.length),
      } as LinearScene,
    });

    // Mark as leaving
    steps.push({
      type: 'swap',
      indices: [stack.length - 1],
      description: `Popping ${top} from the stack`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'stack',
        items: buildItems(undefined, stack.length - 1),
        pointers: topPointer(stack.length),
      } as LinearScene,
    });

    stack.pop();

    // Scene after removal
    steps.push({
      type: 'sorted',
      indices: stack.length > 0 ? [stack.length - 1] : [],
      description:
        stack.length > 0
          ? `${stack[stack.length - 1]} is now the new TOP (size = ${stack.length})`
          : 'Stack is now empty',
      sceneUpdate: {
        type: 'linear',
        structureType: 'stack',
        items: buildItems(),
        pointers: topPointer(stack.length),
      } as LinearScene,
    });
  }

  steps.push({
    type: 'done',
    indices: [],
    description: 'Stack operation sequence complete',
    sceneUpdate: {
      type: 'linear',
      structureType: 'stack',
      items: buildItems(),
      pointers: topPointer(stack.length),
    } as LinearScene,
  });

  const initialScene: LinearScene = {
    type: 'linear',
    structureType: 'stack',
    items: [],
    pointers: [{ index: -1, label: 'TOP' }],
  };

  return { steps, initialScene };
}
