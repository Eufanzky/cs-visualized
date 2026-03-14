import type { AnimationStep, RendererType, SceneState, StepResult } from '../animation-engine';
export type { StepResult } from '../animation-engine';
export { isStepResult } from '../animation-engine';
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
import { generateBFSMazeSteps } from './bfs-maze';
import { generateDFSMazeSteps } from './dfs-maze';
import { generateFibonacciTreeSteps } from './fibonacci-tree';
import { generateBackpropagationSteps } from './backpropagation';
import { generateCNNSteps } from './cnn';
import { generateGradientDescentSteps } from './gradient-descent';
import { generateKruskalSteps } from './kruskal';
import { generatePrimSteps } from './prim';
import { generateTopologicalSortSteps } from './topological-sort';
import { generateAStarSteps } from './a-star';
import { generateArraySteps } from './array';
import { generateHeapSteps } from './heap';
import { generateGraphDSSteps } from './graph-ds';

// ── Algorithm registry ────────────────────────────────────────────────────

export type StepGenerator = (arr: number[]) => AnimationStep[] | StepResult;

export interface VisualizationMode {
  id: string;
  label: string;
  rendererType: RendererType;
  generateSteps?: StepGenerator;
}

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
  /** Which visual renderer to use for this algorithm */
  rendererType: RendererType;
  /** Additional visualization modes beyond the default */
  modes?: VisualizationMode[];
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
    rendererType: 'bar-chart',
    modes: [
      { id: 'bars', label: 'bars', rendererType: 'bar-chart' },
      { id: 'spectrum', label: 'spectrum', rendererType: 'color-spectrum' },
      { id: 'boxes', label: 'boxes', rendererType: 'box-swap' },
    ],
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
    rendererType: 'bar-chart',
    modes: [
      { id: 'bars', label: 'bars', rendererType: 'bar-chart' },
      { id: 'spectrum', label: 'spectrum', rendererType: 'color-spectrum' },
      { id: 'boxes', label: 'boxes', rendererType: 'box-swap' },
    ],
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
    rendererType: 'bar-chart',
    modes: [
      { id: 'bars', label: 'bars', rendererType: 'bar-chart' },
      { id: 'spectrum', label: 'spectrum', rendererType: 'color-spectrum' },
      { id: 'boxes', label: 'boxes', rendererType: 'box-swap' },
    ],
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
    rendererType: 'bar-chart',
    modes: [
      { id: 'bars', label: 'bars', rendererType: 'bar-chart' },
      { id: 'spectrum', label: 'spectrum', rendererType: 'color-spectrum' },
      { id: 'boxes', label: 'boxes', rendererType: 'box-swap' },
    ],
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
    rendererType: 'bar-chart',
    modes: [
      { id: 'bars', label: 'bars', rendererType: 'bar-chart' },
    ],
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
    rendererType: 'linear',
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
    rendererType: 'linear',
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
    rendererType: 'linear',
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
    rendererType: 'graph',
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
    rendererType: 'dp-grid',
    modes: [
      { id: 'grid', label: 'grid', rendererType: 'dp-grid' },
      { id: 'tree', label: 'tree', rendererType: 'recursion-tree', generateSteps: generateFibonacciTreeSteps },
    ],
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
    rendererType: 'graph',
    modes: [
      { id: 'graph', label: 'graph', rendererType: 'graph' },
      { id: 'maze', label: 'maze', rendererType: 'maze', generateSteps: generateBFSMazeSteps },
    ],
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
    rendererType: 'graph',
    modes: [
      { id: 'graph', label: 'graph', rendererType: 'graph' },
      { id: 'maze', label: 'maze', rendererType: 'maze', generateSteps: generateDFSMazeSteps },
    ],
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
    rendererType: 'neuron',
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
    rendererType: 'bar-chart',
    modes: [
      { id: 'bars', label: 'bars', rendererType: 'bar-chart' },
      { id: 'spectrum', label: 'spectrum', rendererType: 'color-spectrum' },
      { id: 'boxes', label: 'boxes', rendererType: 'box-swap' },
    ],
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
    rendererType: 'tree',
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
    rendererType: 'hash-table',
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
    rendererType: 'dp-grid',
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
    rendererType: 'dp-grid',
  },
  'bfs-maze': {
    id: 'bfs-maze',
    name: 'BFS Maze Solver',
    category: 'search-algorithms',
    description:
      'Watch BFS explore a maze level by level, guaranteeing the shortest path from start to goal by expanding all cells at the current distance before moving deeper.',
    timeComplexityWorst: 'O(V+E)',
    timeComplexityBest: 'O(1)',
    spaceComplexity: 'O(V)',
    stable: true,
    generateSteps: generateBFSMazeSteps,
    rendererType: 'maze',
  },
  'fibonacci-tree': {
    id: 'fibonacci-tree',
    name: 'Fibonacci Recursion Tree',
    category: 'dynamic-programming',
    description:
      'Visualize the recursion tree for Fibonacci with memoization, showing how cached subproblems eliminate redundant computation.',
    timeComplexityWorst: 'O(n)',
    timeComplexityBest: 'O(n)',
    spaceComplexity: 'O(n)',
    stable: true,
    generateSteps: generateFibonacciTreeSteps,
    rendererType: 'recursion-tree',
  },
  'dfs-maze': {
    id: 'dfs-maze',
    name: 'DFS Maze Solver',
    category: 'search-algorithms',
    description:
      'Watch DFS dive deep into a maze using a stack, exploring one path fully before backtracking — finding a path quickly but not necessarily the shortest one.',
    timeComplexityWorst: 'O(V+E)',
    timeComplexityBest: 'O(1)',
    spaceComplexity: 'O(V)',
    stable: true,
    generateSteps: generateDFSMazeSteps,
    rendererType: 'maze',
  },
  'backpropagation': {
    id: 'backpropagation',
    name: 'Backpropagation',
    category: 'neural-networks',
    description:
      'Watch error gradients flow backward through a multi-layer network, adjusting weights via the chain rule to minimize loss.',
    timeComplexityWorst: 'O(epochs × layers × weights)',
    timeComplexityBest: 'O(layers × weights)',
    spaceComplexity: 'O(weights)',
    stable: true,
    generateSteps: generateBackpropagationSteps,
    rendererType: 'neuron',
  },
  'cnn': {
    id: 'cnn',
    name: 'Convolutional Neural Network',
    category: 'neural-networks',
    description:
      'See convolution filters slide over an input grid, producing feature maps, then max-pooling to reduce spatial dimensions.',
    timeComplexityWorst: 'O(input² × kernel²)',
    timeComplexityBest: 'O(input² × kernel²)',
    spaceComplexity: 'O(feature²)',
    stable: true,
    generateSteps: generateCNNSteps,
    rendererType: 'neuron',
  },
  'gradient-descent': {
    id: 'gradient-descent',
    name: 'Gradient Descent',
    category: 'neural-networks',
    description:
      'Watch a point descend a loss surface by following the negative gradient, iteratively updating its position to find the minimum.',
    timeComplexityWorst: 'O(iterations)',
    timeComplexityBest: 'O(1)',
    spaceComplexity: 'O(1)',
    stable: true,
    generateSteps: generateGradientDescentSteps,
    rendererType: 'neuron',
  },
  'kruskal': {
    id: 'kruskal',
    name: "Kruskal's Algorithm",
    category: 'graph-algorithms',
    description:
      'Build a minimum spanning tree by sorting all edges by weight and greedily adding each edge that does not create a cycle, using union-find to detect connectivity.',
    timeComplexityWorst: 'O(E log E)',
    timeComplexityBest: 'O(E log E)',
    spaceComplexity: 'O(V)',
    stable: true,
    generateSteps: generateKruskalSteps,
    rendererType: 'graph',
  },
  'prim': {
    id: 'prim',
    name: "Prim's Algorithm",
    category: 'graph-algorithms',
    description:
      'Grow a minimum spanning tree from a starting node by repeatedly adding the cheapest edge that connects an MST node to a non-MST node.',
    timeComplexityWorst: 'O(E log V)',
    timeComplexityBest: 'O(E log V)',
    spaceComplexity: 'O(V)',
    stable: true,
    generateSteps: generatePrimSteps,
    rendererType: 'graph',
  },
  'topological-sort': {
    id: 'topological-sort',
    name: 'Topological Sort',
    category: 'graph-algorithms',
    description:
      'Order the vertices of a directed acyclic graph so that every edge points from an earlier vertex to a later one, using Kahn\'s BFS-based algorithm with in-degree tracking.',
    timeComplexityWorst: 'O(V+E)',
    timeComplexityBest: 'O(V+E)',
    spaceComplexity: 'O(V)',
    stable: true,
    generateSteps: generateTopologicalSortSteps,
    rendererType: 'graph',
  },
  'a-star': {
    id: 'a-star',
    name: 'A* Search',
    category: 'search-algorithms',
    description:
      'Find the optimal path through a maze using a heuristic-guided search that combines actual distance traveled with an estimated remaining distance.',
    timeComplexityWorst: 'O(E)',
    timeComplexityBest: 'O(1)',
    spaceComplexity: 'O(V)',
    stable: true,
    generateSteps: generateAStarSteps,
    rendererType: 'maze',
  },
  'array': {
    id: 'array',
    name: 'Array',
    category: 'data-structures',
    description:
      'A contiguous block of memory supporting O(1) random access by index, with O(n) insert and delete due to element shifting.',
    timeComplexityWorst: 'O(n) insert/delete',
    timeComplexityBest: 'O(1) access',
    spaceComplexity: 'O(n)',
    stable: true,
    generateSteps: generateArraySteps,
    rendererType: 'linear',
  },
  'heap': {
    id: 'heap',
    name: 'Heap',
    category: 'data-structures',
    description:
      'A complete binary tree where each parent is smaller than its children (min-heap), supporting O(log n) insert and extract-min via bubble-up and bubble-down.',
    timeComplexityWorst: 'O(log n)',
    timeComplexityBest: 'O(1) peek',
    spaceComplexity: 'O(n)',
    stable: true,
    generateSteps: generateHeapSteps,
    rendererType: 'tree',
  },
  'graph': {
    id: 'graph',
    name: 'Graph',
    category: 'data-structures',
    description:
      'A collection of vertices and edges representing pairwise relationships, supporting node/edge addition and BFS/DFS traversal.',
    timeComplexityWorst: 'O(V+E) traversal',
    timeComplexityBest: 'O(1) add node',
    spaceComplexity: 'O(V+E)',
    stable: true,
    generateSteps: generateGraphDSSteps,
    rendererType: 'graph',
  },
};

export function getAlgorithm(id: string): AlgorithmMeta | undefined {
  return ALGORITHMS[id];
}

export function listAlgorithms(): AlgorithmMeta[] {
  return Object.values(ALGORITHMS);
}
