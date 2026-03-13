/**
 * Central registry of all categories and their animations.
 * Each animation entry drives both the category listing pages
 * and the navigation breadcrumbs on individual animation pages.
 */

const CATEGORIES = [
  {
    id: 'sorting-algorithms',
    title: 'Sorting Algorithms',
    icon: '{}',
    accent: 'var(--syn-number)',
    glow: 'var(--glow-number)',
    description: 'Watch elements rearrange themselves through comparison, swapping, and partitioning strategies.',
    animations: [
      { id: 'bubble-sort',    title: 'Bubble Sort',    complexity: 'O(n²)',       status: 'ready' },
      { id: 'merge-sort',     title: 'Merge Sort',     complexity: 'O(n log n)',  status: 'ready' },
      { id: 'quick-sort',     title: 'Quick Sort',     complexity: 'O(n log n)',  status: 'ready' },
      { id: 'insertion-sort', title: 'Insertion Sort', complexity: 'O(n²)',       status: 'ready' },
      { id: 'heap-sort',      title: 'Heap Sort',      complexity: 'O(n log n)',  status: 'ready' },
    ]
  },
  {
    id: 'data-structures',
    title: 'Data Structures',
    icon: '[]',
    accent: 'var(--syn-function)',
    glow: 'var(--glow-function)',
    description: 'Explore how data is organized, stored, and accessed in memory through fundamental structures.',
    animations: [
      { id: 'array',       title: 'Array',           complexity: 'O(1) access', status: 'ready' },
      { id: 'linked-list', title: 'Linked List',     complexity: 'O(n) access', status: 'ready' },
      { id: 'binary-tree', title: 'Binary Tree',     complexity: 'O(log n)',    status: 'ready' },
      { id: 'hash-table',  title: 'Hash Table',      complexity: 'O(1) avg',    status: 'ready' },
      { id: 'stack',       title: 'Stack',            complexity: 'LIFO',        status: 'ready' },
      { id: 'queue',       title: 'Queue',            complexity: 'FIFO',        status: 'ready' },
      { id: 'heap',        title: 'Heap',             complexity: 'O(log n)',    status: 'ready' },
      { id: 'graph',       title: 'Graph',            complexity: 'varies',      status: 'ready' },
    ]
  },
  {
    id: 'search-algorithms',
    title: 'Search Algorithms',
    icon: '?()',
    accent: 'var(--syn-string)',
    glow: 'var(--glow-string)',
    description: 'Follow the path as algorithms hunt for targets through sorted arrays, trees, and graphs.',
    animations: [
      { id: 'binary-search', title: 'Binary Search', complexity: 'O(log n)', status: 'ready' },
      { id: 'bfs',           title: 'Breadth-First Search', complexity: 'O(V+E)', status: 'ready' },
      { id: 'dfs',           title: 'Depth-First Search',   complexity: 'O(V+E)', status: 'ready' },
      { id: 'a-star',        title: 'A* Search',            complexity: 'O(E)',    status: 'ready' },
    ]
  },
  {
    id: 'graph-algorithms',
    title: 'Graph Algorithms',
    icon: '<>',
    accent: 'var(--syn-keyword)',
    glow: 'var(--glow-keyword)',
    description: 'Witness shortest paths emerge and spanning trees grow across weighted and unweighted graphs.',
    animations: [
      { id: 'dijkstra',         title: "Dijkstra's Algorithm",  complexity: 'O(V² / E log V)', status: 'ready' },
      { id: 'kruskal',          title: "Kruskal's Algorithm",   complexity: 'O(E log E)',       status: 'ready' },
      { id: 'prim',             title: "Prim's Algorithm",      complexity: 'O(E log V)',       status: 'ready' },
      { id: 'topological-sort', title: 'Topological Sort',      complexity: 'O(V+E)',           status: 'ready' },
    ]
  },
  {
    id: 'dynamic-programming',
    title: 'Dynamic Programming',
    icon: 'dp',
    accent: 'var(--syn-comment)',
    glow: 'var(--glow-comment)',
    description: 'See how complex problems decompose into overlapping subproblems and build optimal solutions.',
    animations: [
      { id: 'fibonacci', title: 'Fibonacci',            complexity: 'O(n)',     status: 'ready' },
      { id: 'knapsack',  title: '0/1 Knapsack',         complexity: 'O(nW)',    status: 'ready' },
      { id: 'lcs',       title: 'Longest Common Subseq', complexity: 'O(mn)',   status: 'ready' },
    ]
  },
  {
    id: 'neural-networks',
    title: 'Neural Networks',
    icon: 'nn',
    accent: 'var(--syn-type)',
    glow: 'var(--glow-type)',
    description: 'Visualize forward passes, backpropagation, and gradient descent as networks learn patterns.',
    animations: [
      { id: 'perceptron',        title: 'Perceptron',         complexity: 'single neuron',  status: 'ready' },
      { id: 'backpropagation',   title: 'Backpropagation',    complexity: 'chain rule',     status: 'ready' },
      { id: 'cnn',               title: 'Convolutional NN',   complexity: 'convolutions',   status: 'ready' },
      { id: 'gradient-descent',  title: 'Gradient Descent',   complexity: 'optimization',   status: 'ready' },
    ]
  },
];
