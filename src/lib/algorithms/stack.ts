import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Stack (LIFO) operations.
 *
 * The visualisation encodes stack state as a number array where index 0 is the
 * bottom and the last element is the top.  The incoming `arr` parameter drives
 * the set of values that will be pushed/popped; the function derives an
 * operation sequence automatically.
 *
 * Steps produced:
 *   - compare  → the top-of-stack element is highlighted (peek / pre-pop)
 *   - swap     → a push or pop mutation is happening
 *   - sorted   → an element has settled into its resting position on the stack
 *   - done     → the full operation sequence is complete
 */
export function generateStackSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];

  // We'll run a deterministic sequence of pushes and pops on the first
  // few values from `arr`, so the animation has a fixed, readable story.
  // Use at most 8 values to keep the demo concise.
  const values = arr.slice(0, Math.min(8, arr.length));
  const stack: number[] = [];

  // Helper: display value as a rounded percentage string
  const fmt = (v: number) => Math.round(v * 100).toString();

  // Build an operation list: push all values, then pop half of them
  const pushCount = values.length;
  const popCount = Math.floor(pushCount / 2);

  const operations: Array<{ op: 'push' | 'pop'; value?: number }> = [
    ...values.map((v) => ({ op: 'push' as const, value: v })),
    ...Array.from({ length: popCount }, () => ({ op: 'pop' as const })),
  ];

  for (const { op, value } of operations) {
    if (op === 'push' && value !== undefined) {
      // Highlight current top before pushing
      if (stack.length > 0) {
        steps.push({
          type: 'compare',
          indices: [stack.length - 1],
          description: `Stack top is currently ${fmt(stack[stack.length - 1])} — pushing ${fmt(value)} above it`,
        });
      }

      // Push animation — the new element arrives at the top
      steps.push({
        type: 'swap',
        indices: [stack.length],
        values: [...stack, value],
        description: `Pushing ${fmt(value)} onto the stack`,
      });
      stack.push(value);

      // Settle the newly pushed element
      steps.push({
        type: 'sorted',
        indices: [stack.length - 1],
        description: `${fmt(value)} is now at the top of the stack (size = ${stack.length})`,
      });
    } else if (op === 'pop' && stack.length > 0) {
      const top = stack[stack.length - 1];

      // Highlight top before popping
      steps.push({
        type: 'compare',
        indices: [stack.length - 1],
        description: `Peeking at top element ${fmt(top)} before popping`,
      });

      // Pop animation
      steps.push({
        type: 'swap',
        indices: [stack.length - 1],
        values: stack.slice(0, -1),
        description: `Popping ${fmt(top)} from the stack`,
      });
      stack.pop();

      if (stack.length > 0) {
        // Mark new top as settled
        steps.push({
          type: 'sorted',
          indices: [stack.length - 1],
          description: `${fmt(stack[stack.length - 1])} is now the new top (size = ${stack.length})`,
        });
      }
    }
  }

  steps.push({
    type: 'done',
    indices: [],
    description: 'Stack operation sequence complete',
  });

  return steps;
}
