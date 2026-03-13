import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Queue (FIFO) operations.
 *
 * The visualisation represents the queue as a number array where index 0 is the
 * front (dequeue end) and the last index is the rear (enqueue end).
 * The incoming `arr` parameter supplies the values; the function derives an
 * enqueue/dequeue sequence automatically.
 *
 * Steps produced:
 *   - compare  → front or rear element is highlighted (pre-dequeue or peek)
 *   - swap     → an enqueue or dequeue mutation is in progress
 *   - sorted   → an element has settled into its position in the queue
 *   - done     → the full operation sequence is complete
 */
export function generateQueueSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];

  // Use at most 8 values for a concise, readable demo
  const values = arr.slice(0, Math.min(8, arr.length));
  const queue: number[] = [];

  const fmt = (v: number) => Math.round(v * 100).toString();

  // Operation plan: enqueue all values, then dequeue half
  const enqueueCount = values.length;
  const dequeueCount = Math.floor(enqueueCount / 2);

  const operations: Array<{ op: 'enqueue' | 'dequeue'; value?: number }> = [
    ...values.map((v) => ({ op: 'enqueue' as const, value: v })),
    ...Array.from({ length: dequeueCount }, () => ({ op: 'dequeue' as const })),
  ];

  for (const { op, value } of operations) {
    if (op === 'enqueue' && value !== undefined) {
      // Highlight the current rear before enqueueing
      if (queue.length > 0) {
        steps.push({
          type: 'compare',
          indices: [queue.length - 1],
          description: `Queue rear is currently ${fmt(queue[queue.length - 1])} — enqueueing ${fmt(value)} behind it`,
        });
      }

      // Enqueue animation — value joins the rear
      steps.push({
        type: 'swap',
        indices: [queue.length],
        values: [...queue, value],
        description: `Enqueueing ${fmt(value)} at the rear`,
      });
      queue.push(value);

      // Settle the newly enqueued element
      steps.push({
        type: 'sorted',
        indices: [queue.length - 1],
        description: `${fmt(value)} settled at the rear (queue size = ${queue.length})`,
      });
    } else if (op === 'dequeue' && queue.length > 0) {
      const front = queue[0];

      // Highlight front before dequeuing
      steps.push({
        type: 'compare',
        indices: [0],
        description: `Front element is ${fmt(front)} — preparing to dequeue`,
      });

      // Dequeue animation — front element leaves
      steps.push({
        type: 'swap',
        indices: [0],
        values: queue.slice(1),
        description: `Dequeueing ${fmt(front)} from the front`,
      });
      queue.shift();

      if (queue.length > 0) {
        // Mark new front as settled
        steps.push({
          type: 'sorted',
          indices: [0],
          description: `${fmt(queue[0])} is now the new front (queue size = ${queue.length})`,
        });
      }
    }
  }

  steps.push({
    type: 'done',
    indices: [],
    description: 'Queue operation sequence complete',
  });

  return steps;
}
