import type { AnimationStep, HashTableScene, HashBucket, StepResult } from '../animation-engine';

/**
 * Generates AnimationSteps for Hash Table operations (separate chaining).
 *
 * Returns { steps, initialScene } where initialScene has 7 empty buckets.
 * Every step's sceneUpdate carries a full HashTableScene snapshot — including
 * hashComputation for the active key — so the hash-table renderer always has
 * accurate data to render.
 *
 * Phases:
 *   1. Insert — hash each key, show bucket selection and chain append
 *   2. Lookup  — hash a search key, traverse its bucket chain
 */
export function generateHashTableSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  const TABLE_SIZE = 7;   // prime for better distribution
  const MAX_CHAIN = 3;    // max chain length rendered per bucket

  // Convert floats → integer keys in [1, 99]
  const raw = arr.slice(0, Math.min(10, arr.length));
  const keys = raw.map((v) => Math.max(1, Math.round(v * 99)));
  const n = keys.length;

  // Chain storage: chains[bucket] = ordered list of keys
  const chains: number[][] = Array.from({ length: TABLE_SIZE }, () => []);

  const hash = (key: number) => key % TABLE_SIZE;

  /** Build the full HashTableScene snapshot. */
  function buildScene(
    activeKey?: number,
    activeBucket?: number,
    chainStates?: Map<string, string>   // "bucket:chainPos" → state string
  ): HashTableScene {
    const buckets: HashBucket[] = chains.map((chain, b) => ({
      index: b,
      chain: chain.map((key, c) => ({
        key,
        state: chainStates?.get(`${b}:${c}`) ?? 'default',
      })),
    }));

    return {
      type: 'hash-table',
      buckets,
      tableSize: TABLE_SIZE,
      hashComputation:
        activeKey !== undefined && activeBucket !== undefined
          ? { key: activeKey, bucketIndex: activeBucket }
          : undefined,
    };
  }

  if (n === 0) {
    const initialScene = buildScene();
    steps.push({
      type: 'done',
      indices: [],
      description: 'Empty input — nothing to insert',
      sceneUpdate: initialScene,
    });
    return { steps, initialScene };
  }

  // ── Phase 1: Insert all keys ────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const key = keys[i];
    const bucket = hash(key);
    const chainLen = chains[bucket].length;
    const flatIdx = bucket * MAX_CHAIN + Math.min(chainLen, MAX_CHAIN - 1);

    // Show hash computation
    steps.push({
      type: 'compare',
      indices: [flatIdx],
      description: `Hashing key ${key}: ${key} % ${TABLE_SIZE} = ${bucket} → bucket[${bucket}]`,
      sceneUpdate: buildScene(key, bucket),
    });

    if (chainLen === 0) {
      // Empty bucket — direct insert (computing state on the new slot)
      const states = new Map<string, string>([[ `${bucket}:0`, 'inserting' ]]);
      steps.push({
        type: 'swap',
        indices: [bucket * MAX_CHAIN],
        description: `bucket[${bucket}] is empty — inserting key ${key} at head of chain`,
        sceneUpdate: buildScene(key, bucket, states),
      });
    } else {
      // Collision — traverse existing chain entries
      const examineStates = new Map<string, string>();
      for (let c = 0; c < chainLen && c < MAX_CHAIN - 1; c++) {
        examineStates.set(`${bucket}:${c}`, 'examining');
        steps.push({
          type: 'compare',
          indices: [bucket * MAX_CHAIN + c],
          description: `Collision at bucket[${bucket}]: key ${chains[bucket][c]} is already there — checking chain[${c}]`,
          sceneUpdate: buildScene(key, bucket, new Map(examineStates)),
        });
      }
      const insertPos = Math.min(chainLen, MAX_CHAIN - 1);
      const insertStates = new Map<string, string>([[ `${bucket}:${insertPos}`, 'inserting' ]]);
      steps.push({
        type: 'swap',
        indices: [bucket * MAX_CHAIN + insertPos],
        description: `Appending key ${key} to chain at bucket[${bucket}], position ${insertPos}`,
        sceneUpdate: buildScene(key, bucket, insertStates),
      });
    }

    // Commit insert
    if (chainLen < MAX_CHAIN) {
      chains[bucket].push(key);
    }

    const confirmedPos = Math.min(chainLen, MAX_CHAIN - 1);
    const confirmedStates = new Map<string, string>([[ `${bucket}:${confirmedPos}`, 'confirmed' ]]);
    steps.push({
      type: 'sorted',
      indices: [bucket * MAX_CHAIN + confirmedPos],
      description: `Key ${key} confirmed in bucket[${bucket}] (chain length = ${chains[bucket].length})`,
      sceneUpdate: buildScene(undefined, undefined, confirmedStates),
    });
  }

  // ── Phase 2: Lookup ─────────────────────────────────────────────────────
  const searchKey = keys[Math.floor(n / 2)];
  const searchBucket = hash(searchKey);
  const chain = chains[searchBucket];

  steps.push({
    type: 'compare',
    indices: [searchBucket * MAX_CHAIN],
    description: `Lookup: ${searchKey} % ${TABLE_SIZE} = ${searchBucket} → bucket[${searchBucket}]`,
    sceneUpdate: buildScene(searchKey, searchBucket),
  });

  let foundPos = -1;
  for (let c = 0; c < chain.length; c++) {
    const examineStates = new Map<string, string>([[ `${searchBucket}:${c}`, 'examining' ]]);
    steps.push({
      type: 'compare',
      indices: [searchBucket * MAX_CHAIN + c],
      description: `Lookup: examining chain[${c}] = ${chain[c]} in bucket[${searchBucket}]`,
      sceneUpdate: buildScene(searchKey, searchBucket, examineStates),
    });

    if (chain[c] === searchKey) {
      foundPos = c;
      const foundStates = new Map<string, string>([[ `${searchBucket}:${c}`, 'found' ]]);
      steps.push({
        type: 'sorted',
        indices: [searchBucket * MAX_CHAIN + c],
        description: `Found! Key ${searchKey} at bucket[${searchBucket}], chain position ${c}`,
        sceneUpdate: buildScene(undefined, undefined, foundStates),
      });
      break;
    }
  }

  if (foundPos === -1) {
    steps.push({
      type: 'sorted',
      indices: [],
      description: `Key ${searchKey} not found in bucket[${searchBucket}]`,
      sceneUpdate: buildScene(),
    });
  }

  steps.push({
    type: 'done',
    indices: [],
    description: 'Hash table insert and lookup operations complete',
    sceneUpdate: buildScene(),
  });

  // Build the initial empty scene
  const initialScene: HashTableScene = {
    type: 'hash-table',
    buckets: Array.from({ length: TABLE_SIZE }, (_, b) => ({ index: b, chain: [] })),
    tableSize: TABLE_SIZE,
  };

  return { steps, initialScene };
}
