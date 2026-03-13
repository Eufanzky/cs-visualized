import type { AnimationStep } from '../animation-engine';
import { generateBubbleSortSteps } from './bubble-sort';
import { generateInsertionSortSteps } from './insertion-sort';
import { generateMergeSortSteps } from './merge-sort';
import { generateQuickSortSteps } from './quick-sort';
import { generateBinarySearchSteps } from './binary-search';
import { generateStackSteps } from './stack';
import { generateQueueSteps } from './queue';
import { generateLinkedListSteps } from './linked-list';
import { generateDijkstraSteps } from './dijkstra';
import { generateFibonacciSteps } from './fibonacci';
import { generateBFSSteps } from './bfs';
import { generateDFSSteps } from './dfs';
import { generatePerceptronSteps } from './perceptron';
import { generateHeapSortSteps } from './heap-sort';
import { generateBinaryTreeSteps } from './binary-tree';
import { generateHashTableSteps } from './hash-table';
import { generateKnapsackSteps } from './knapsack';
import { generateLCSSteps } from './lcs';

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
  'dijkstra': {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    category: 'graph-algorithms',
    description:
      'Find the shortest path from a source node to all other nodes in a weighted graph by greedily finalizing the closest unvisited node at each step.',
    timeComplexityWorst: 'O(V²)',
    timeComplexityBest: 'O(E log V)',
    spaceComplexity: 'O(V)',
    stable: true,
    generateSteps: generateDijkstraSteps,
  },
  'fibonacci': {
    id: 'fibonacci',
    name: 'Fibonacci (Memoized)',
    category: 'dynamic-programming',
    description:
      'Compute Fibonacci numbers efficiently using memoization, caching subproblem results to avoid the exponential redundancy of naïve recursion.',
    timeComplexityWorst: 'O(n)',
    timeComplexityBest: 'O(n)',
    spaceComplexity: 'O(n)',
    stable: true,
    generateSteps: generateFibonacciSteps,
  },
  'bfs': {
    id: 'bfs',
    name: 'Breadth-First Search',
    category: 'search-algorithms',
    description:
      'Explore a graph level by level using a FIFO queue, guaranteeing the shortest path in unweighted graphs and visiting all reachable nodes.',
    timeComplexityWorst: 'O(V+E)',
    timeComplexityBest: 'O(1)',
    spaceComplexity: 'O(V)',
    stable: true,
    generateSteps: generateBFSSteps,
  },
  'dfs': {
    id: 'dfs',
    name: 'Depth-First Search',
    category: 'search-algorithms',
    description:
      'Explore a graph by diving as deep as possible along each branch before backtracking, using an implicit call stack to track the traversal path.',
    timeComplexityWorst: 'O(V+E)',
    timeComplexityBest: 'O(1)',
    spaceComplexity: 'O(V)',
    stable: true,
    generateSteps: generateDFSSteps,
  },
  'perceptron': {
    id: 'perceptron',
    name: 'Perceptron',
    category: 'neural-networks',
    description:
      'Train a single neuron to classify linearly separable data by iteratively adjusting weights whenever a prediction is wrong.',
    timeComplexityWorst: 'O(epochs × examples)',
    timeComplexityBest: 'O(examples)',
    spaceComplexity: 'O(features)',
    stable: true,
    generateSteps: generatePerceptronSteps,
  },
  'heap-sort': {
    id: 'heap-sort',
    name: 'Heap Sort',
    category: 'sorting-algorithms',
    description:
      'Build a max-heap from the input, then repeatedly extract the maximum element to produce a sorted array in-place.',
    timeComplexityWorst: 'O(n log n)',
    timeComplexityBest: 'O(n log n)',
    spaceComplexity: 'O(1)',
    stable: false,
    generateSteps: generateHeapSortSteps,
  },
  'binary-tree': {
    id: 'binary-tree',
    name: 'Binary Search Tree',
    category: 'data-structures',
    description:
      'A hierarchical structure where each node has at most two children, with left subtree values smaller and right subtree values larger than the parent.',
    timeComplexityWorst: 'O(n) unbalanced',
    timeComplexityBest: 'O(log n)',
    spaceComplexity: 'O(n)',
    stable: true,
    generateSteps: generateBinaryTreeSteps,
  },
  'hash-table': {
    id: 'hash-table',
    name: 'Hash Table',
    category: 'data-structures',
    description:
      'Map keys to array indices via a hash function, resolving collisions with separate chaining for O(1) average-case insert and lookup.',
    timeComplexityWorst: 'O(n) worst case',
    timeComplexityBest: 'O(1)',
    spaceComplexity: 'O(n)',
    stable: true,
    generateSteps: generateHashTableSteps,
  },
  'knapsack': {
    id: 'knapsack',
    name: '0/1 Knapsack',
    category: 'dynamic-programming',
    description:
      'Determine the maximum value that can be placed into a weight-limited knapsack by building a DP table that considers including or excluding each item.',
    timeComplexityWorst: 'O(nW)',
    timeComplexityBest: 'O(nW)',
    spaceComplexity: 'O(nW)',
    stable: true,
    generateSteps: generateKnapsackSteps,
  },
  'lcs': {
    id: 'lcs',
    name: 'Longest Common Subsequence',
    category: 'dynamic-programming',
    description:
      'Find the longest subsequence present in both input sequences by filling a 2-D DP table, then backtrack to recover the actual subsequence.',
    timeComplexityWorst: 'O(mn)',
    timeComplexityBest: 'O(mn)',
    spaceComplexity: 'O(mn)',
    stable: true,
    generateSteps: generateLCSSteps,
  },
};

export function getAlgorithm(id: string): AlgorithmMeta | undefined {
  return ALGORITHMS[id];
}

export function listAlgorithms(): AlgorithmMeta[] {
  return Object.values(ALGORITHMS);
}
