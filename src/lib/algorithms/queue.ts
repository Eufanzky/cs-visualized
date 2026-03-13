import type { AnimationStep, LinearScene, LinearItem, StepResult } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Queue (FIFO) operations.
 *
 * Returns { steps, initialScene } where initialScene is an empty LinearScene
 * with structureType 'queue'. Each step carries a sceneUpdate that replaces
 * the items array and keeps the FRONT / REAR pointers accurate.
 *
 * Operation sequence:
 *   - Enqueue all values (up to 6) one by one
 *   - Dequeue half of them from the front
 */
export function generateQueueSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  const values = arr.slice(0, Math.min(6, arr.length));
  const fmt = (v: number) => Math.round(v * 100).toString();

  // Mutable logical queue (front = index 0, rear = last index)
  const queue: string[] = [];

  /** Build LinearItem array from the current queue state. */
  function buildItems(enteringIdx?: number, leavingIdx?: number): LinearItem[] {
    return queue.map((val, i) => {
      if (leavingIdx !== undefined && i === leavingIdx) return { value: val, state: 'removed' };
      if (enteringIdx !== undefined && i === enteringIdx) return { value: val, state: 'inserted' };
      return { value: val, state: 'default' };
    });
  }

  /** Compute FRONT and REAR pointer array for the current queue length. */
  function queuePointers(len: number) {
    if (len === 0) {
      return [
        { index: -1, label: 'FRONT' },
        { index: -1, label: 'REAR' },
      ];
    }
    if (len === 1) {
      return [
        { index: 0, label: 'FRONT' },
        { index: 0, label: 'REAR' },
      ];
    }
    return [
      { index: 0, label: 'FRONT' },
      { index: len - 1, label: 'REAR' },
    ];
  }

  const enqueueCount = values.length;
  const dequeueCount = Math.floor(enqueueCount / 2);

  // ── Enqueue phase ───────────────────────────────────────────────────────
  for (let i = 0; i < enqueueCount; i++) {
    const val = fmt(values[i]);

    // Highlight current rear before enqueueing (skip when empty)
    if (queue.length > 0) {
      steps.push({
        type: 'compare',
        indices: [queue.length - 1],
        description: `Queue REAR is ${queue[queue.length - 1]} — enqueueing ${val} behind it`,
        sceneUpdate: {
          type: 'linear',
          structureType: 'queue',
          items: buildItems().map((item, idx) =>
            idx === queue.length - 1 ? { ...item, state: 'active' } : item
          ),
          pointers: queuePointers(queue.length),
        } as LinearScene,
      });
    }

    // Enqueue: add with entering state
    queue.push(val);
    steps.push({
      type: 'swap',
      indices: [queue.length - 1],
      description: `Enqueueing ${val} at the rear`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'queue',
        items: buildItems(queue.length - 1),
        pointers: queuePointers(queue.length),
      } as LinearScene,
    });

    // Settle
    steps.push({
      type: 'sorted',
      indices: [queue.length - 1],
      description: `${val} settled at the rear (queue size = ${queue.length})`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'queue',
        items: buildItems(),
        pointers: queuePointers(queue.length),
      } as LinearScene,
    });
  }

  // ── Dequeue phase ───────────────────────────────────────────────────────
  for (let i = 0; i < dequeueCount; i++) {
    if (queue.length === 0) break;
    const front = queue[0];

    // Highlight front before dequeuing
    steps.push({
      type: 'compare',
      indices: [0],
      description: `FRONT element is ${front} — preparing to dequeue`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'queue',
        items: buildItems().map((item, idx) =>
          idx === 0 ? { ...item, state: 'active' } : item
        ),
        pointers: queuePointers(queue.length),
      } as LinearScene,
    });

    // Mark front as leaving
    steps.push({
      type: 'swap',
      indices: [0],
      description: `Dequeueing ${front} from the front`,
      sceneUpdate: {
        type: 'linear',
        structureType: 'queue',
        items: buildItems(undefined, 0),
        pointers: queuePointers(queue.length),
      } as LinearScene,
    });

    queue.shift();

    // Scene after removal
    steps.push({
      type: 'sorted',
      indices: queue.length > 0 ? [0] : [],
      description:
        queue.length > 0
          ? `${queue[0]} is now the new FRONT (queue size = ${queue.length})`
          : 'Queue is now empty',
      sceneUpdate: {
        type: 'linear',
        structureType: 'queue',
        items: buildItems(),
        pointers: queuePointers(queue.length),
      } as LinearScene,
    });
  }

  steps.push({
    type: 'done',
    indices: [],
    description: 'Queue operation sequence complete',
    sceneUpdate: {
      type: 'linear',
      structureType: 'queue',
      items: buildItems(),
      pointers: queuePointers(queue.length),
    } as LinearScene,
  });

  const initialScene: LinearScene = {
    type: 'linear',
    structureType: 'queue',
    items: [],
    pointers: [
      { index: -1, label: 'FRONT' },
      { index: -1, label: 'REAR' },
    ],
  };

  return { steps, initialScene };
}
