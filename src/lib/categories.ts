/**
 * Central registry of all categories and their animations.
 * TypeScript port of js/categories.js — this is the single source of truth
 * for the Next.js app. Animation status drives badge rendering and link availability.
 */

export type AnimationStatus = 'ready' | 'coming';

export interface Animation {
  id: string;
  title: string;
  complexity: string;
  status: AnimationStatus;
}

export interface Category {
  id: string;
  title: string;
  /** Short symbol displayed in the card icon box (e.g. '{}', '[]') */
  icon: string;
  /** CSS custom-property reference for the primary accent colour */
  accent: string;
  /** CSS custom-property reference for the low-opacity glow colour */
  glow: string;
  /** Raw hex value used for Tailwind inline styles / shadow colours */
  accentHex: string;
  /** Raw hex value for glow (rgba string) */
  glowRgba: string;
  description: string;
  animations: Animation[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'sorting-algorithms',
    title: 'Sorting Algorithms',
    icon: '{}',
    accent: 'var(--syn-number)',
    glow: 'var(--glow-number)',
    accentHex: '#f6c177',
    glowRgba: 'rgba(246, 193, 119, 0.15)',
    description:
      'Watch elements rearrange themselves through comparison, swapping, and partitioning strategies.',
    animations: [
      { id: 'bubble-sort',    title: 'Bubble Sort',    complexity: 'O(n²)',      status: 'ready' },
      { id: 'merge-sort',     title: 'Merge Sort',     complexity: 'O(n log n)', status: 'coming' },
      { id: 'quick-sort',     title: 'Quick Sort',     complexity: 'O(n log n)', status: 'coming' },
      { id: 'insertion-sort', title: 'Insertion Sort', complexity: 'O(n²)',      status: 'coming' },
      { id: 'heap-sort',      title: 'Heap Sort',      complexity: 'O(n log n)', status: 'coming' },
    ],
  },
  {
    id: 'data-structures',
    title: 'Data Structures',
    icon: '[]',
    accent: 'var(--syn-function)',
    glow: 'var(--glow-function)',
    accentHex: '#ebbcba',
    glowRgba: 'rgba(235, 188, 186, 0.15)',
    description:
      'Explore how data is organized, stored, and accessed in memory through fundamental structures.',
    animations: [
      { id: 'array',       title: 'Array',        complexity: 'O(1) access', status: 'coming' },
      { id: 'linked-list', title: 'Linked List',  complexity: 'O(n) access', status: 'coming' },
      { id: 'binary-tree', title: 'Binary Tree',  complexity: 'O(log n)',    status: 'coming' },
      { id: 'hash-table',  title: 'Hash Table',   complexity: 'O(1) avg',    status: 'coming' },
      { id: 'stack',       title: 'Stack',         complexity: 'LIFO',        status: 'coming' },
      { id: 'queue',       title: 'Queue',         complexity: 'FIFO',        status: 'coming' },
      { id: 'heap',        title: 'Heap',          complexity: 'O(log n)',    status: 'coming' },
      { id: 'graph',       title: 'Graph',         complexity: 'varies',      status: 'coming' },
    ],
  },
  {
    id: 'search-algorithms',
    title: 'Search Algorithms',
    icon: '?()',
    accent: 'var(--syn-string)',
    glow: 'var(--glow-string)',
    accentHex: '#9ccfd8',
    glowRgba: 'rgba(156, 207, 216, 0.15)',
    description:
      'Follow the path as algorithms hunt for targets through sorted arrays, trees, and graphs.',
    animations: [
      { id: 'binary-search', title: 'Binary Search',       complexity: 'O(log n)', status: 'coming' },
      { id: 'bfs',           title: 'Breadth-First Search', complexity: 'O(V+E)',   status: 'coming' },
      { id: 'dfs',           title: 'Depth-First Search',   complexity: 'O(V+E)',   status: 'coming' },
      { id: 'a-star',        title: 'A* Search',            complexity: 'O(E)',     status: 'coming' },
    ],
  },
  {
    id: 'graph-algorithms',
    title: 'Graph Algorithms',
    icon: '<>',
    accent: 'var(--syn-keyword)',
    glow: 'var(--glow-keyword)',
    accentHex: '#c4a7e7',
    glowRgba: 'rgba(196, 167, 231, 0.15)',
    description:
      'Witness shortest paths emerge and spanning trees grow across weighted and unweighted graphs.',
    animations: [
      { id: 'dijkstra',         title: "Dijkstra's Algorithm", complexity: 'O(V² / E log V)', status: 'coming' },
      { id: 'kruskal',          title: "Kruskal's Algorithm",  complexity: 'O(E log E)',       status: 'coming' },
      { id: 'prim',             title: "Prim's Algorithm",     complexity: 'O(E log V)',       status: 'coming' },
      { id: 'topological-sort', title: 'Topological Sort',     complexity: 'O(V+E)',           status: 'coming' },
    ],
  },
  {
    id: 'dynamic-programming',
    title: 'Dynamic Programming',
    icon: 'dp',
    accent: 'var(--syn-comment)',
    glow: 'var(--glow-comment)',
    accentHex: '#6e6a86',
    glowRgba: 'rgba(110, 106, 134, 0.15)',
    description:
      'See how complex problems decompose into overlapping subproblems and build optimal solutions.',
    animations: [
      { id: 'fibonacci', title: 'Fibonacci',             complexity: 'O(n)',   status: 'coming' },
      { id: 'knapsack',  title: '0/1 Knapsack',          complexity: 'O(nW)',  status: 'coming' },
      { id: 'lcs',       title: 'Longest Common Subseq', complexity: 'O(mn)', status: 'coming' },
    ],
  },
  {
    id: 'neural-networks',
    title: 'Neural Networks',
    icon: 'nn',
    accent: 'var(--syn-type)',
    glow: 'var(--glow-type)',
    accentHex: '#ea9a97',
    glowRgba: 'rgba(234, 154, 151, 0.15)',
    description:
      'Visualize forward passes, backpropagation, and gradient descent as networks learn patterns.',
    animations: [
      { id: 'perceptron',       title: 'Perceptron',       complexity: 'single neuron', status: 'coming' },
      { id: 'backpropagation',  title: 'Backpropagation',  complexity: 'chain rule',    status: 'coming' },
      { id: 'cnn',              title: 'Convolutional NN', complexity: 'convolutions',  status: 'coming' },
      { id: 'gradient-descent', title: 'Gradient Descent', complexity: 'optimization',  status: 'coming' },
    ],
  },
];

/** Look up a category by its slug id. Returns undefined if not found. */
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** Look up an animation within a specific category. */
export function getAnimationById(
  categoryId: string,
  animationId: string,
): { category: Category; animation: Animation } | undefined {
  const category = getCategoryById(categoryId);
  if (!category) return undefined;
  const animation = category.animations.find((a) => a.id === animationId);
  if (!animation) return undefined;
  return { category, animation };
}

/** Total count of animations across all categories. */
export const TOTAL_ANIMATIONS = CATEGORIES.reduce(
  (sum, c) => sum + c.animations.length,
  0,
);

/** Count of animations currently marked ready. */
export const READY_ANIMATIONS = CATEGORIES.reduce(
  (sum, c) => sum + c.animations.filter((a) => a.status === 'ready').length,
  0,
);
