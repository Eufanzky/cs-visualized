import type { AnimationStep } from '../animation-engine';
import { generateBubbleSortSteps } from './bubble-sort';

// ── Algorithm registry ────────────────────────────────────────────────────

export type StepGenerator = (arr: number[]) => AnimationStep[];

export interface AlgorithmMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Worst / average time complexity */
  timeComplexityWorst: string;
  /** Best-case time complexity */
  timeComplexityBest: string;
  /** Space complexity */
  spaceComplexity: string;
  stable: boolean;
  generateSteps: StepGenerator;
}

export const ALGORITHMS: Record<string, AlgorithmMeta> = {
  'bubble-sort': {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'sorting-algorithms',
    description:
      'Repeatedly step through the list, compare adjacent elements, and swap them if they are in the wrong order.',
    timeComplexityWorst: 'O(n²)',
    timeComplexityBest: 'O(n)',
    spaceComplexity: 'O(1)',
    stable: true,
    generateSteps: generateBubbleSortSteps,
  },
};

export function getAlgorithm(id: string): AlgorithmMeta | undefined {
  return ALGORITHMS[id];
}

export function listAlgorithms(): AlgorithmMeta[] {
  return Object.values(ALGORITHMS);
}
