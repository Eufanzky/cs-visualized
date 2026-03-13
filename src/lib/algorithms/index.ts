import type { AnimationStep } from '../animation-engine';
import { generateBubbleSortSteps } from './bubble-sort';
import { generateInsertionSortSteps } from './insertion-sort';
import { generateMergeSortSteps } from './merge-sort';
import { generateQuickSortSteps } from './quick-sort';
import { generateBinarySearchSteps } from './binary-search';
import { generateStackSteps } from './stack';
import { generateQueueSteps } from './queue';
import { generateLinkedListSteps } from './linked-list';

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
  'insertion-sort': {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    category: 'sorting-algorithms',
    description:
      'Build the sorted array one element at a time by comparing each new element with those already sorted and shifting to insert it in the right place.',
    timeComplexityWorst: 'O(n²)',
    timeComplexityBest: 'O(n)',
    spaceComplexity: 'O(1)',
    stable: true,
    generateSteps: generateInsertionSortSteps,
  },
  'merge-sort': {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'sorting-algorithms',
    description:
      'Divide the array in half recursively until each subarray has one element, then merge the sorted halves back together.',
    timeComplexityWorst: 'O(n log n)',
    timeComplexityBest: 'O(n log n)',
    spaceComplexity: 'O(n)',
    stable: true,
    generateSteps: generateMergeSortSteps,
  },
  'quick-sort': {
    id: 'quick-sort',
    name: 'Quick Sort',
    category: 'sorting-algorithms',
    description:
      'Select a pivot element, partition the array so all smaller elements come before it and larger after, then recursively sort each partition.',
    timeComplexityWorst: 'O(n²)',
    timeComplexityBest: 'O(n log n)',
    spaceComplexity: 'O(log n)',
    stable: false,
    generateSteps: generateQuickSortSteps,
  },
  'binary-search': {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'search-algorithms',
    description:
      'Repeatedly halve the search space by comparing the target against the middle element of a sorted array.',
    timeComplexityWorst: 'O(log n)',
    timeComplexityBest: 'O(1)',
    spaceComplexity: 'O(1)',
    stable: true,
    generateSteps: generateBinarySearchSteps,
  },
  'stack': {
    id: 'stack',
    name: 'Stack',
    category: 'data-structures',
    description:
      'A Last-In First-Out (LIFO) structure where elements are pushed onto and popped from the top.',
    timeComplexityWorst: 'O(1) push/pop',
    timeComplexityBest: 'O(1)',
    spaceComplexity: 'O(n)',
    stable: true,
    generateSteps: generateStackSteps,
  },
  'queue': {
    id: 'queue',
    name: 'Queue',
    category: 'data-structures',
    description:
      'A First-In First-Out (FIFO) structure where elements are enqueued at the rear and dequeued from the front.',
    timeComplexityWorst: 'O(1) enqueue/dequeue',
    timeComplexityBest: 'O(1)',
    spaceComplexity: 'O(n)',
    stable: true,
    generateSteps: generateQueueSteps,
  },
  'linked-list': {
    id: 'linked-list',
    name: 'Linked List',
    category: 'data-structures',
    description:
      'A sequential structure of nodes each holding a value and a pointer to the next, supporting insertion, deletion, and traversal.',
    timeComplexityWorst: 'O(n) access/search',
    timeComplexityBest: 'O(1) insert at head',
    spaceComplexity: 'O(n)',
    stable: true,
    generateSteps: generateLinkedListSteps,
  },
};

export function getAlgorithm(id: string): AlgorithmMeta | undefined {
  return ALGORITHMS[id];
}

export function listAlgorithms(): AlgorithmMeta[] {
  return Object.values(ALGORITHMS);
}
