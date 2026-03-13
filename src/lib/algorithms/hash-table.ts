import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Hash Table operations.
 *
 * The demo uses separate chaining for collision resolution.  The table size is
 * fixed at TABLE_SIZE buckets; integer keys are derived from the input array by
 * scaling to [1, 99].
 *
 * The animation walks through three phases:
 *   1. Insert — hash each key, show the bucket selection, chain if needed
 *   2. Lookup  — hash a search key, traverse its bucket chain
 *   3. Confirm — highlight the found entry
 *
 * Flat index encoding:
 *   index = bucketIndex * MAX_CHAIN + chainPosition
 *   This maps each bucket slot to a unique array position for the visualizer.
 *
 * Steps produced:
 *   - compare  → computing the hash / examining a bucket or chain node
 *   - swap     → inserting a key into a bucket (or chain)
 *   - sorted   → an entry is confirmed in its final slot
 *   - done     → all hash table operations are complete
 */
export function generateHashTableSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];

  const TABLE_SIZE = 7;   // prime for better distribution
  const MAX_CHAIN = 3;    // max chain length we visualize per bucket

  // Convert floats → integer keys in [1, 99]
  const raw = arr.slice(0, Math.min(10, arr.length));
  const keys = raw.map((v) => Math.max(1, Math.round(v * 99)));
  const n = keys.length;

  if (n === 0) {
    steps.push({ type: 'done', indices: [], description: 'Empty input — nothing to insert' });
    return steps;
  }

  // Chain storage: chains[bucket] = array of keys in that bucket
  const chains: number[][] = Array.from({ length: TABLE_SIZE }, () => []);

  const hash = (key: number) => key % TABLE_SIZE;
  const flatIdx = (bucket: number, pos: number) => bucket * MAX_CHAIN + pos;

  // ── Phase 1: Insert all keys ──────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const key = keys[i];
    const bucket = hash(key);

    // Show hash computation
    steps.push({
      type: 'compare',
      indices: [flatIdx(bucket, 0)],
      description: `Hashing key ${key}: hash(${key}) = ${key} % ${TABLE_SIZE} = ${bucket} → bucket[${bucket}]`,
    });

    const chainLen = chains[bucket].length;

    if (chainLen === 0) {
      // Empty bucket — direct insert
      steps.push({
        type: 'swap',
        indices: [flatIdx(bucket, 0)],
        description: `Bucket[${bucket}] is empty — inserting key ${key} at head of chain`,
      });
    } else {
      // Collision — traverse existing chain
      for (let c = 0; c < chainLen && c < MAX_CHAIN - 1; c++) {
        steps.push({
          type: 'compare',
          indices: [flatIdx(bucket, c)],
          description: `Collision at bucket[${bucket}]! Key ${chains[bucket][c]} already there — checking chain[${c}]`,
        });
      }
      const insertPos = Math.min(chainLen, MAX_CHAIN - 1);
      steps.push({
        type: 'swap',
        indices: [flatIdx(bucket, insertPos)],
        description: `Appending key ${key} to chain at bucket[${bucket}], position ${insertPos}`,
      });
    }

    if (chainLen < MAX_CHAIN) {
      chains[bucket].push(key);
    }

    steps.push({
      type: 'sorted',
      indices: [flatIdx(bucket, Math.min(chainLen, MAX_CHAIN - 1))],
      description: `Key ${key} is now settled in bucket[${bucket}], chain length = ${chains[bucket].length}`,
    });
  }

  // ── Phase 2: Lookup a key ──────────────────────────────────────────────
  // Search for the key from the middle of the input
  const searchKey = keys[Math.floor(n / 2)];
  const searchBucket = hash(searchKey);

  steps.push({
    type: 'compare',
    indices: [flatIdx(searchBucket, 0)],
    description: `Lookup: hashing search key ${searchKey} → bucket[${searchBucket}]`,
  });

  const chain = chains[searchBucket];
  let foundPos = -1;

  for (let c = 0; c < chain.length; c++) {
    steps.push({
      type: 'compare',
      indices: [flatIdx(searchBucket, c)],
      description: `Lookup: examining chain[${c}] = ${chain[c]} in bucket[${searchBucket}]`,
    });

    if (chain[c] === searchKey) {
      foundPos = c;
      steps.push({
        type: 'sorted',
        indices: [flatIdx(searchBucket, c)],
        description: `Found! Key ${searchKey} at bucket[${searchBucket}], chain position ${c}`,
      });
      break;
    }
  }

  if (foundPos === -1) {
    steps.push({
      type: 'sorted',
      indices: [],
      description: `Key ${searchKey} not found in bucket[${searchBucket}]`,
    });
  }

  steps.push({
    type: 'done',
    indices: [],
    description: 'Hash table insert and lookup operations complete',
  });

  return steps;
}
