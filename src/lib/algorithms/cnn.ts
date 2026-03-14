import type { AnimationStep, NeuronScene, StepResult } from '../animation-engine';

/**
 * Generates a StepResult for a CNN forward-pass animation.
 *
 * Shows convolution filters sliding over an input grid, producing a feature map,
 * then max-pooling to reduce spatial dimensions.
 *
 * Steps produced:
 *   compare → convolution: kernel applied at a position
 *   swap    → pooling: max-pool over a 2×2 region
 *   sorted  → phase completion checkpoint
 *   done    → pipeline complete
 */

const INPUT_SIZE = 6;
const KERNEL_SIZE = 3;
const FEATURE_SIZE = INPUT_SIZE - KERNEL_SIZE + 1; // 4
const POOL_SIZE = 2;
const POOLED_SIZE = Math.floor(FEATURE_SIZE / POOL_SIZE); // 2

function relu(x: number): number {
  return Math.max(0, x);
}

const fmt = (v: number) => v.toFixed(3);

interface CNNState {
  inputGrid: number[][];
  kernel: number[][];
  featureMap: (number | null)[][];
  pooledMap: (number | null)[][];
  convPos: { r: number; c: number };
  poolPos: { r: number; c: number };
  phase: string;
}

function initCNN(seed: number[]): CNNState {
  const inputGrid: number[][] = [];
  let seedIdx = 0;
  const nextVal = () => {
    const v = seedIdx < seed.length ? seed[seedIdx] : Math.random();
    seedIdx++;
    return v;
  };

  for (let r = 0; r < INPUT_SIZE; r++) {
    inputGrid[r] = [];
    for (let c = 0; c < INPUT_SIZE; c++) {
      inputGrid[r][c] = nextVal();
    }
  }

  // Edge-detection kernel
  const kernel = [
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1],
  ];

  const featureMap: (number | null)[][] = [];
  for (let r = 0; r < FEATURE_SIZE; r++) {
    featureMap[r] = new Array(FEATURE_SIZE).fill(null);
  }

  const pooledMap: (number | null)[][] = [];
  for (let r = 0; r < POOLED_SIZE; r++) {
    pooledMap[r] = new Array(POOLED_SIZE).fill(null);
  }

  return {
    inputGrid,
    kernel,
    featureMap,
    pooledMap,
    convPos: { r: -1, c: -1 },
    poolPos: { r: -1, c: -1 },
    phase: 'idle',
  };
}

function makeScene(cnn: CNNState): NeuronScene {
  const kernelFlat = cnn.kernel.flat();
  const convValues: number[] = [];

  if (cnn.convPos.r >= 0 && cnn.convPos.c >= 0) {
    for (let kr = 0; kr < KERNEL_SIZE; kr++) {
      for (let kc = 0; kc < KERNEL_SIZE; kc++) {
        const r = cnn.convPos.r + kr;
        const c = cnn.convPos.c + kc;
        if (r < INPUT_SIZE && c < INPUT_SIZE) {
          convValues.push(cnn.inputGrid[r][c]);
        }
      }
    }
  }

  let currentOutput = 0;
  const fmFlat = cnn.featureMap.flat().filter((v): v is number => v !== null);
  if (fmFlat.length > 0) {
    currentOutput = fmFlat[fmFlat.length - 1];
  }

  return {
    type: 'neuron',
    variant: 'convolution',
    inputs: convValues.length > 0 ? convValues : [0],
    weights: kernelFlat,
    bias: 0,
    weightedSum: currentOutput,
    output: currentOutput,
    currentExample: cnn.phase === 'conv'
      ? cnn.convPos.r * FEATURE_SIZE + cnn.convPos.c
      : cnn.phase === 'pool'
        ? cnn.poolPos.r * POOLED_SIZE + cnn.poolPos.c
        : undefined,
    // CNN-specific fields
    inputGrid: cnn.inputGrid.map(row => [...row]),
    kernel: cnn.kernel.map(row => [...row]),
    featureMap: cnn.featureMap.map(row => [...row]),
    kernelPosition: cnn.convPos.r >= 0 ? { row: cnn.convPos.r, col: cnn.convPos.c } : undefined,
    poolingResult: cnn.pooledMap.map(row => [...row]),
    cnnPhase: cnn.phase,
  };
}

export function generateCNNSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];
  const cnn = initCNN(arr);

  const initialScene = makeScene(cnn);

  // Intro
  steps.push({
    type: 'compare',
    indices: [0],
    description: `CNN init — ${INPUT_SIZE}×${INPUT_SIZE} input, ${KERNEL_SIZE}×${KERNEL_SIZE} kernel, feature map ${FEATURE_SIZE}×${FEATURE_SIZE}, pooled ${POOLED_SIZE}×${POOLED_SIZE}`,
    sceneUpdate: makeScene(cnn),
  });

  // === CONVOLUTION PHASE ===
  for (let cr = 0; cr < FEATURE_SIZE; cr++) {
    for (let cc = 0; cc < FEATURE_SIZE; cc++) {
      cnn.phase = 'conv';
      cnn.convPos = { r: cr, c: cc };

      // Compute convolution at this position
      let sum = 0;
      for (let kr = 0; kr < KERNEL_SIZE; kr++) {
        for (let kc = 0; kc < KERNEL_SIZE; kc++) {
          sum += cnn.inputGrid[cr + kr][cc + kc] * cnn.kernel[kr][kc];
        }
      }
      const val = Math.min(1, relu(sum) / 8);
      cnn.featureMap[cr][cc] = val;

      steps.push({
        type: 'compare',
        indices: [cr * FEATURE_SIZE + cc],
        description: `Convolve at (${cr},${cc}): kernel·input = ${fmt(sum)}, ReLU → ${fmt(val)}`,
        sceneUpdate: makeScene(cnn),
      });
    }
  }

  // Convolution complete
  steps.push({
    type: 'sorted',
    indices: Array.from({ length: FEATURE_SIZE * FEATURE_SIZE }, (_, i) => i),
    description: `Convolution complete — ${FEATURE_SIZE}×${FEATURE_SIZE} feature map computed. Starting max pooling.`,
    sceneUpdate: makeScene(cnn),
  });

  // === POOLING PHASE ===
  for (let pr = 0; pr < POOLED_SIZE; pr++) {
    for (let pc = 0; pc < POOLED_SIZE; pc++) {
      cnn.phase = 'pool';
      cnn.convPos = { r: -1, c: -1 };
      cnn.poolPos = { r: pr, c: pc };

      const sr = pr * POOL_SIZE;
      const sc = pc * POOL_SIZE;

      let maxVal = -Infinity;
      const regionVals: number[] = [];
      for (let dr = 0; dr < POOL_SIZE; dr++) {
        for (let dc = 0; dc < POOL_SIZE; dc++) {
          const v = cnn.featureMap[sr + dr]?.[sc + dc] ?? 0;
          regionVals.push(v);
          if (v > maxVal) maxVal = v;
        }
      }
      cnn.pooledMap[pr][pc] = maxVal === -Infinity ? 0 : maxVal;

      steps.push({
        type: 'swap',
        indices: [pr * POOLED_SIZE + pc],
        description: `Max pool at (${pr},${pc}): region [${regionVals.map(v => fmt(v)).join(', ')}] → max=${fmt(maxVal)}`,
        sceneUpdate: makeScene(cnn),
      });
    }
  }

  // Pooling complete
  cnn.phase = 'done';
  cnn.convPos = { r: -1, c: -1 };
  cnn.poolPos = { r: -1, c: -1 };

  steps.push({
    type: 'sorted',
    indices: Array.from({ length: POOLED_SIZE * POOLED_SIZE }, (_, i) => i),
    description: `Pooling complete — ${POOLED_SIZE}×${POOLED_SIZE} output. Spatial dimensions reduced by ${POOL_SIZE}×.`,
    sceneUpdate: makeScene(cnn),
  });

  // Done
  steps.push({
    type: 'done',
    indices: [],
    description: `CNN forward pass complete: ${INPUT_SIZE}×${INPUT_SIZE} → conv → ${FEATURE_SIZE}×${FEATURE_SIZE} → pool → ${POOLED_SIZE}×${POOLED_SIZE}`,
    sceneUpdate: makeScene(cnn),
  });

  return { steps, initialScene };
}
