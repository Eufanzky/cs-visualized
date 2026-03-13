import type { AnimationStep } from '../animation-engine';

/**
 * Generates AnimationSteps for Fibonacci computed with memoization.
 *
 * The `arr` parameter controls which Fibonacci number to compute:
 *   n = clamp(arr.length + 3, 6, 14)
 * This keeps the step count reasonable for small and large input arrays.
 *
 * Steps produced:
 *   - compare  → a cache lookup is attempted for fib(k)
 *   - swap     → computing fib(k) for the first time (cache miss → store result)
 *   - sorted   → fib(k) was already in the cache (cache hit)
 *   - done     → fib(n) has been computed
 *
 * The `indices` field carries [k] — the current Fibonacci argument — which
 * renderers can use to light up the call-tree node for fib(k).
 */

export function generateFibonacciSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];

  // Derive n from arr length; clamp to [6, 14] to stay visually tractable
  const n = Math.min(14, Math.max(6, arr.length + 3));

  const memo: Map<number, number> = new Map();
  memo.set(0, 0);
  memo.set(1, 1);

  steps.push({
    type: 'compare',
    indices: [n],
    description: `Computing fib(${n}) with memoization — cache pre-seeded: fib(0)=0, fib(1)=1`,
  });

  /**
   * Iterative simulation of the memoized top-down call order.
   * We walk from fib(2) up to fib(n), emitting steps that mirror what the
   * recursive memoized function would do on a cold cache.
   */
  for (let k = 2; k <= n; k++) {
    // Cache lookup step
    steps.push({
      type: 'compare',
      indices: [k],
      description: `computing fib(${k}) — looking up cache`,
    });

    if (memo.has(k)) {
      // Cache hit (only possible if the same value is revisited — in this
      // iterative simulation it won't happen, but the step is emitted for
      // correctness if the pattern is extended)
      steps.push({
        type: 'sorted',
        indices: [k],
        description: `cache hit for fib(${k}) = ${memo.get(k)}`,
      });
    } else {
      // Cache miss: compute and store
      const result = memo.get(k - 1)! + memo.get(k - 2)!;
      memo.set(k, result);

      steps.push({
        type: 'swap',
        indices: [k],
        values: [result],
        description: `cache miss — computing fib(${k}) = fib(${k - 1}) + fib(${k - 2}) = ${memo.get(k - 1)} + ${memo.get(k - 2)} = ${result}, storing in cache`,
      });

      // Mark fib(k) as resolved (cached)
      steps.push({
        type: 'sorted',
        indices: [k],
        description: `fib(${k}) = ${result} cached`,
      });
    }
  }

  steps.push({
    type: 'done',
    indices: [n],
    description: `fib(${n}) = ${memo.get(n)} — computed in ${n - 1} unique subproblems (memoization avoided ${Math.pow(2, n) - 1} redundant calls of naïve recursion)`,
  });

  return steps;
}
