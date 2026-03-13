# CS Animations — Complete Build Plan

_Last updated: 2026-03-12_

This document covers every animation planned for cs-visualized, organized into
build phases, with implementation notes for each visualization.

---

## Priority Rationale

Priorities are weighted by three factors:

- **Educational value** — How fundamental is this concept to CS curricula?
- **Visual impact** — Does the canvas format produce a compelling, intuitive visualization?
- **Implementation complexity** — How much new canvas infrastructure does it require?

Phase 1 targets the widest audience (introductory CS students) with the highest
visual payoff per implementation hour. Phase 2 covers intermediate algorithms
that reward the patterns established in Phase 1. Phase 3 covers advanced and
novel categories that require more bespoke canvas work.

---

## Phase 1 — MVP (8 animations)

These eight are the animations most frequently searched for, most commonly
taught in introductory CS courses, and most immediately satisfying on canvas.
Bubble Sort is already done; the remaining seven are ordered by build priority.

### 1. Insertion Sort  _(Sorting Algorithms)_
- **What it shows:** A single "key" element is lifted out of the array on each
  pass and slid leftward through already-sorted bars until it finds its correct
  position.
- **Key visual elements:** A highlighted "key" bar floats above the array at a
  fixed elevated Y position while sorted bars shift right to make room. An
  insertion-point cursor (vertical line) marks where the key will land.
- **Controls:** Play/Pause, Step, Reset, Speed slider, Size slider (matches
  Bubble Sort exactly — reuse the control strip).
- **Educational value:** Teaches in-place incremental sorting, best-case O(n)
  on nearly-sorted input, and the contrast between comparison count and swap
  count. Natural bridge from the O(n²) intuition of Bubble Sort toward smarter
  algorithms.

### 2. Binary Search  _(Search Algorithms)_
- **What it shows:** A sorted bar array with a target value highlighted. Low,
  mid, and high pointers move inward each step, eliminating half the search
  space at a time.
- **Key visual elements:** Low (teal) and high (rose) pointer arrows below the
  array, mid (gold) arrow above. Eliminated regions dim progressively. A "found"
  flash when mid lands on the target.
- **Controls:** Play/Pause, Step, Reset, Speed slider, Size slider, Target value
  input (or randomize target button).
- **Educational value:** The canonical O(log n) vs O(n) demonstration. Makes
  the halving behavior viscerally clear in a way text cannot.

### 3. Merge Sort  _(Sorting Algorithms)_
- **What it shows:** The array splits recursively downward (shown as a tree of
  sub-arrays) then merges back upward, bars rising into sorted position.
- **Key visual elements:** Two-zone canvas — top half shows the current merge
  step as two colored sub-arrays being interleaved into a result row; bottom
  half shows the full array state at all times. Depth counter in the status bar.
- **Controls:** Play/Pause, Step, Reset, Speed slider, Size slider.
- **Educational value:** Divide-and-conquer paradigm, stable sort, O(n log n)
  guarantee, and introduction to recursion through a concrete output.

### 4. Stack  _(Data Structures)_
- **What it shows:** A vertical column of labeled blocks. Push slides a new
  block down onto the top; Pop lifts the top block off with an easing animation.
  A "top" pointer arrow always indicates the current top-of-stack.
- **Key visual elements:** Blocks rendered as rounded rectangles with value
  labels; a dotted "base" line at the bottom; a glowing "TOP" badge beside the
  uppermost block; overflow warning when capacity is reached.
- **Controls:** Push (with value input or random), Pop, Reset, Speed slider.
- **Educational value:** LIFO principle, call stack mental model, bounded
  capacity, stack overflow — foundational for understanding recursion and
  function call mechanics.

### 5. Queue  _(Data Structures)_
- **What it shows:** A horizontal row of blocks. Enqueue appends a new block on
  the right with a slide-in; Dequeue removes the leftmost block with a slide-out
  and shifts the rest (or, for a circular queue variant, the head pointer
  advances without moving blocks).
- **Key visual elements:** Head (teal) and tail (gold) pointer arrows above the
  row; blocks labelled with values; a circular-buffer ring view toggled by a
  checkbox.
- **Controls:** Enqueue (value input or random), Dequeue, Reset, Speed slider,
  Linear/Circular toggle.
- **Educational value:** FIFO principle, head/tail pointer mechanics, circular
  buffer optimization — essential for BFS, scheduling, and I/O buffering.

### 6. Linked List  _(Data Structures)_
- **What it shows:** Nodes rendered as boxes connected by animated arrows. The
  visualization supports Insert (at head, tail, or arbitrary index), Delete, and
  Search, with the pointer chain re-wiring animated on each operation.
- **Key visual elements:** Node boxes with a value cell and a next-pointer cell;
  animated bezier arrow re-routing on insert/delete; a null terminator block at
  the tail; a "current" traversal cursor that hops node-to-node on search.
- **Controls:** Insert (head / tail / index), Delete (by value or index), Search,
  Reset, Speed slider.
- **Educational value:** Pointer semantics, dynamic memory allocation intuition,
  O(n) traversal vs O(1) head insert, and why arrays have O(1) random access
  while linked lists do not.

### 7. Fibonacci (Memoized)  _(Dynamic Programming)_
- **What it shows:** Two side-by-side trees — one for naïve recursion (with
  repeated sub-trees lit in red to show redundancy) and one for memoized
  recursion (with cached nodes lit in gold on first use, then teal on reuse).
  A counter shows the call-count difference live.
- **Key visual elements:** Recursion tree nodes as circles with values; edges
  drawn as the call stack unfolds; duplicate sub-trees highlighted in the naïve
  view; a memo table that fills in as nodes are first computed.
- **Controls:** Play/Pause, Step, Reset, n input (3–20), Naïve/Memoized toggle.
- **Educational value:** The canonical introduction to DP: overlapping
  subproblems, memoization, and the dramatic difference between exponential and
  linear time on a problem everyone already knows.

### 8. Dijkstra's Algorithm  _(Graph Algorithms)_
- **What it shows:** A weighted directed/undirected graph with a chosen source
  node. Nodes are colored by their tentative distance (cold-to-hot gradient);
  edges relax step by step; a shortest-path tree emerges as finalized nodes turn
  green.
- **Key visual elements:** Graph with draggable nodes, weighted edge labels,
  a distance table panel that updates live, a priority-queue inspector showing
  the current frontier, and animated edge relaxation pulses.
- **Controls:** Play/Pause, Step, Reset, Randomize Graph, source node picker,
  Speed slider, Directed/Undirected toggle.
- **Educational value:** Greedy shortest-path, priority queue mechanics, graph
  relaxation, and the contrast with unweighted BFS — one of the most
  career-relevant algorithms in this entire project.

---

## Phase 2 — Core Coverage (10 animations)

With Phase 1 shipped, Phase 2 rounds out the existing categories and introduces
one new one (Recursion Visualizations).

### 9. Quick Sort  _(Sorting Algorithms)_
- **What it shows:** A pivot element (highlighted in gold) is selected; the
  partition step moves all smaller elements left and larger elements right via
  animated swaps; the pivot drops into its final sorted position; recursion
  continues on each sub-array shown with bracket overlays.
- **Key visual elements:** Partition bracket overlays above the bar array; pivot
  bar elevated slightly; low/high scan pointers as colored arrows beneath bars.
- **Controls:** Play/Pause, Step, Reset, Speed slider, Size slider, Pivot
  strategy selector (last element / random / median-of-three).
- **Educational value:** In-place divide-and-conquer, amortized O(n log n),
  worst-case O(n²) on sorted input, and how pivot choice matters — bridges
  theory to practice.

### 10. Heap Sort  _(Sorting Algorithms)_
- **What it shows:** Two-panel view: left panel is the bar array; right panel is
  a binary heap tree rendered from the same array indices. Heapify animations
  sift nodes down the tree and simultaneously swap bars in the array view.
- **Key visual elements:** Tree nodes with index labels; sift-down path
  highlighted as a glowing edge chain; sorted region of the array growing from
  the right as elements are extracted.
- **Controls:** Play/Pause, Step, Reset, Speed slider, Size slider.
- **Educational value:** Heap data structure, in-place sort using a tree
  invariant, O(n log n) guaranteed, and the connection between array indexing
  and tree structure.

### 11. Binary Tree  _(Data Structures)_
- **What it shows:** A binary search tree supporting Insert, Delete, and Search
  operations. Each operation animates a traversal from root to the target node,
  with re-balancing shown for AVL/BST comparison (optional toggle).
- **Key visual elements:** Tree rendered with edge curves and node circles;
  visited nodes flash during traversal; inserted node drops in from above;
  deleted nodes collapse with their replacement sliding up.
- **Controls:** Insert (value input), Delete (value input), Search, Reset, BST /
  AVL toggle, Speed slider.
- **Educational value:** Tree traversal, BST property, rotations (if AVL),
  O(log n) vs O(n) height degeneration — shows why balance matters.

### 12. Hash Table  _(Data Structures)_
- **What it shows:** An array of buckets with a hash function visualized as a
  "funnel" that maps a key to a bucket index. Insert, Search, and Delete
  operations animate the hash computation and show chaining or open addressing
  collision resolution.
- **Key visual elements:** Bucket array with linked chain nodes hanging below
  each slot; a hash funnel graphic at the top that animates the key input
  through to the bucket index; collision counter in the status bar.
- **Controls:** Insert (key-value input), Search, Delete, Reset, Chaining /
  Open Addressing toggle, Load factor slider (controls table size), Speed slider.
- **Educational value:** Hash functions, collision handling, O(1) average vs
  O(n) worst case, load factor and rehashing — among the most practically
  important data structures.

### 13. Breadth-First Search  _(Search Algorithms)_
- **What it shows:** A graph (or optionally a grid maze) with a source node.
  BFS expands outward in concentric waves, nodes turning teal as they are
  visited, edges highlighted as they are traversed. A queue panel on the side
  shows the current frontier queue state.
- **Key visual elements:** Graph with colored visit-state nodes (unvisited,
  in-queue, visited); animated edge traversal pulses; a queue inspector strip
  below the canvas; optional grid-maze mode where cells act as nodes.
- **Controls:** Play/Pause, Step, Reset, Randomize Graph, source picker, Grid /
  Graph toggle, Speed slider.
- **Educational value:** Level-order traversal, FIFO queue mechanics, shortest
  path in unweighted graphs, and the contrast with DFS exploration order.

### 14. Depth-First Search  _(Search Algorithms)_
- **What it shows:** A graph with a source node. DFS dives deep down one path
  before backtracking, with a call-stack panel showing the recursion depth.
  Back-edges are shown in a different color to distinguish tree edges from
  cycle-detecting edges.
- **Key visual elements:** Graph nodes colored by DFS state (unvisited, active,
  finished); a call-stack strip that pushes/pops with each step; back-edge
  indicators (dashed rose lines); optional grid-maze mode.
- **Controls:** Play/Pause, Step, Reset, Randomize Graph, source picker, Grid /
  Graph toggle, Speed slider.
- **Educational value:** Recursion via call stack, backtracking, cycle detection,
  pre/post-order numbering — foundational for topological sort, SCCs, and
  maze generation.

### 15. Topological Sort  _(Graph Algorithms)_
- **What it shows:** A directed acyclic graph (DAG). Kahn's algorithm (BFS-based)
  is shown with a live in-degree counter on each node; nodes with zero in-degree
  enter the queue and are peeled off the graph one by one into an ordered output
  strip at the bottom.
- **Key visual elements:** DAG with directed arrows; in-degree badges on each
  node; a queue strip of zero-in-degree nodes; an output rail at the bottom
  where the sorted order assembles; cycle-detection error state if a non-DAG is
  loaded.
- **Controls:** Play/Pause, Step, Reset, Randomize Graph (guaranteed DAG), Speed
  slider.
- **Educational value:** Dependency ordering, Kahn's algorithm, in-degree
  tracking, and the practical applications in build systems, task scheduling,
  and course prerequisite resolution.

### 16. 0/1 Knapsack  _(Dynamic Programming)_
- **What it shows:** A 2-D DP table (items × capacity) fills cell by cell. Each
  cell lights up as it is computed, showing which of the two choices (include or
  exclude the item) was taken. After the table is filled, the backtracking path
  traces which items were selected.
- **Key visual elements:** Grid of cells with value labels; the current cell
  highlighted with a gold border; dependency arrows pointing to the cells being
  compared; a backtrack path drawn in teal after completion; an item list panel
  on the left with weight/value labels.
- **Controls:** Play/Pause, Step, Reset, Randomize Items, capacity slider, Speed
  slider.
- **Educational value:** 2-D DP table construction, include/exclude recurrence,
  backtracking to recover the solution, and space optimization intuition.

### 17. Longest Common Subsequence  _(Dynamic Programming)_
- **What it shows:** Two input strings rendered as column and row headers of a
  DP table. The table fills diagonally; when characters match, a diagonal arrow
  is drawn and the value increments. After completion, backtracking traces the
  LCS characters through the table, highlighting them in both original strings.
- **Key visual elements:** Character-labeled row/column headers; fill animation
  cell by cell; directional arrows inside cells (diagonal, up, left); backtrack
  path in gold; matched characters highlighted in the original strings above and
  to the left of the grid.
- **Controls:** Play/Pause, Step, Reset, String input fields (with random
  presets), Speed slider.
- **Educational value:** String DP, recurrence with two sequences, backtracking
  for solution recovery — directly applicable to diff utilities, DNA alignment,
  and spell checking.

### 18. Perceptron  _(Neural Networks)_
- **What it shows:** A single neuron with N inputs. Each training example is
  fed in, the weighted sum and activation are computed, and weights are updated
  via the perceptron learning rule if the prediction is wrong. A 2-D decision
  boundary plot updates after each example for 2-input problems.
- **Key visual elements:** Input nodes → weight edges → summation node →
  activation node → output; edge widths scale with weight magnitude; edge color
  indicates sign (teal positive, rose negative); a live 2-D scatter plot with
  the decision boundary line animated after each update.
- **Controls:** Play/Pause, Step, Reset, Learning rate slider, Randomize data,
  Speed slider.
- **Educational value:** Linear classification, weighted sum, step activation,
  the update rule, convergence on linearly separable data, and failure on XOR —
  the gateway to neural network intuition.

---

## Phase 3 — Advanced & New Categories (remaining + new)

Phase 3 covers the remaining planned animations and introduces four new
categories that significantly broaden the educational scope.

---

### Remaining planned animations

#### 19. A* Search  _(Search Algorithms)_
- **What it shows:** A grid maze with a start and goal cell. A* expands nodes
  ordered by f = g + h, where h is the Manhattan distance heuristic. The open
  set, closed set, and the optimal path are all visualized simultaneously.
- **Key visual elements:** Grid cells colored by state (open set in purple,
  closed set dimmed, current node in gold); g and f score overlays on each cell;
  the discovered path traced in teal on completion; a heuristic comparison panel
  showing A* vs plain Dijkstra expansion counts.
- **Controls:** Play/Pause, Step, Reset, Randomize Maze, Start/Goal picker,
  Heuristic selector (Manhattan / Euclidean / Diagonal), Speed slider.
- **Educational value:** Informed search, heuristic admissibility, the role of
  the open/closed sets, and why A* is faster than Dijkstra on grid problems.

#### 20. Kruskal's Algorithm  _(Graph Algorithms)_
- **What it shows:** Edges are sorted by weight and considered one by one. A
  Union-Find structure is visualized as a forest of trees on the side; each edge
  either joins two components (added to the MST, highlighted green) or creates a
  cycle (rejected, highlighted red).
- **Key visual elements:** Edge list sorted panel on the left; graph canvas in
  the center; Union-Find forest panel on the right with component coloring;
  animated edge consideration with accept/reject flash.
- **Controls:** Play/Pause, Step, Reset, Randomize Graph, Speed slider, Directed /
  Undirected toggle (locks to undirected with an explanation).
- **Educational value:** Greedy MST, Union-Find (path compression), cycle
  detection without DFS, and the contrast with Prim's algorithm.

#### 21. Prim's Algorithm  _(Graph Algorithms)_
- **What it shows:** Starting from a single node, the MST grows by always
  selecting the minimum-weight edge that connects a visited node to an unvisited
  one. The frontier edges glow to show they are "in play."
- **Key visual elements:** Graph with MST edges drawn in gold as they are
  selected; frontier edges glowing purple; a min-heap inspector strip below;
  total MST weight counter updating live.
- **Controls:** Play/Pause, Step, Reset, Randomize Graph, Start node picker,
  Speed slider.
- **Educational value:** Greedy MST via priority queue, contrast with Kruskal's
  edge-centric approach, and the Prim-Dijkstra structural similarity.

#### 22. Array  _(Data Structures)_
- **What it shows:** A flat row of indexed cells supporting Read (O(1) flash),
  Write (O(1) flash), Insert (O(n) shift animation), and Delete (O(n) shift
  animation). A second panel shows the memory address layout.
- **Key visual elements:** Index labels above cells; value labels inside cells;
  shift animations (cells slide right on insert, left on delete); a memory
  address bar below showing contiguous allocation; access-time counter.
- **Controls:** Read (index input), Write (index + value), Insert (index +
  value), Delete (index), Reset, Speed slider.
- **Educational value:** O(1) random access, O(n) insert/delete, contiguous
  memory layout, and why this makes arrays fundamentally different from linked
  structures.

#### 23. Heap (Priority Queue)  _(Data Structures)_
- **What it shows:** A max-heap rendered as a binary tree (same two-panel
  approach as Heap Sort) supporting Insert (sift-up) and Extract-Max (sift-down)
  operations. The heap property is annotated on each node.
- **Key visual elements:** Tree with parent-child relationship annotations;
  sift-up path shown as a glowing ascending edge chain; sift-down path as a
  descending chain; array representation below the tree to show the index mapping.
- **Controls:** Insert (value input), Extract Max, Heapify (build from random
  array), Reset, Min / Max toggle, Speed slider.
- **Educational value:** Complete binary tree, heap invariant, O(log n) insert
  and extract, O(n) build-heap, and the connection to priority queues.

#### 24. Graph (Data Structure)  _(Data Structures)_
- **What it shows:** A general graph with interactive node and edge creation.
  Toggles between adjacency matrix and adjacency list representations, updating
  both displays live as the graph is modified.
- **Key visual elements:** Draggable nodes on a canvas; edge arrows (directed or
  undirected); adjacency matrix panel (cells highlight on hover of corresponding
  edge); adjacency list panel; space complexity comparison label.
- **Controls:** Add Node, Add Edge (source → dest + optional weight), Remove
  Node/Edge, Directed / Undirected toggle, Weighted / Unweighted toggle, Reset.
- **Educational value:** Graph vocabulary (vertices, edges, degree, adjacency),
  storage representations, space trade-offs, and the foundation for all graph
  algorithm visualizations.

#### 25. Backpropagation  _(Neural Networks)_
- **What it shows:** A fully-connected network (1–2 hidden layers) performing a
  forward pass followed by a backward pass. Gradient values flow back along edges
  with arrow widths and colors indicating magnitude and sign. Weights update at
  the end of each backward pass.
- **Key visual elements:** Layer-by-layer node circles with activation values;
  edge colors and widths encoding gradient magnitude; a loss curve chart below
  updating per epoch; weight value tooltips on hover.
- **Controls:** Play (run epochs), Step (single pass), Reset, Learning rate
  slider, Network topology selector (layer size presets), Speed slider.
- **Educational value:** Chain rule in practice, gradient flow direction,
  vanishing/exploding gradients visible in edge widths, and how loss decreases
  over training iterations.

#### 26. Gradient Descent  _(Neural Networks)_
- **What it shows:** A 3-D loss surface (rendered with a canvas isometric
  projection or a 2-D contour map) with a ball rolling downhill toward the
  minimum. Variants (SGD, Momentum, Adam) are compared in real time on the
  same surface.
- **Key visual elements:** Contour map with gradient arrows; current position
  marker (ball); path trace of previous positions; a loss-vs-iteration chart
  below; a learning rate indicator showing step size relative to the surface
  gradient.
- **Controls:** Play/Pause, Step, Reset, Algorithm selector (SGD / Momentum /
  RMSProp / Adam), Learning rate slider, Starting position randomizer.
- **Educational value:** Loss surface geometry, local minima, saddle points,
  learning rate effects, and the advantage of adaptive optimizers.

#### 27. Convolutional Neural Network  _(Neural Networks)_
- **What it shows:** A small input image (or generated pattern) passes through
  a convolution filter step-by-step. The filter slides across the input, showing
  the element-wise multiply-and-sum at each position, and the resulting feature
  map fills in. A ReLU activation pass follows.
- **Key visual elements:** Input grid with pixel values; filter grid highlighting
  the current receptive field; output feature map filling in cell by cell;
  animated "spotlight" rectangle scanning the input; filter weight values labeled.
- **Controls:** Play/Pause, Step, Reset, Filter preset selector (edge detect /
  blur / sharpen / custom), Stride selector, Speed slider.
- **Educational value:** Convolution operation, feature maps, shared weights,
  translation invariance intuition, and the spatial meaning of learned filters.

---

### New Category: Recursion Visualizations

_Accent: `--syn-operator` (blue, `#3e8fb0`) — currently unused by any category._

These visualizations use an animated call-stack strip as the central UI
primitive, making recursion's "hidden" mechanics visible.

#### 28. Call Stack Explorer
- **What it shows:** A user-supplied recursive function (factorial, power,
  countdown) executes step by step. Each call pushes a frame onto the visualized
  stack with its local variables; each return pops the frame and passes the
  return value upward.
- **Key visual elements:** Stack of labeled frames with local variable badges;
  return value bubbles floating up between frames; current executing frame
  highlighted in gold; maximum stack depth counter.
- **Controls:** Function selector (factorial / power / sum-to-n / custom n),
  Play/Pause, Step, Reset, n input, Speed slider.
- **Educational value:** Stack frame creation and destruction, local variable
  scope, return value propagation, and stack overflow as a concrete visual event.

#### 29. Tree Recursion (Fibonacci Naïve)
- **What it shows:** A live-drawn recursion tree for naïve Fibonacci. Each
  recursive call spawns two child nodes; the tree grows depth-first, nodes
  coloring themselves when they return. Identical sub-calls are visually linked
  to show redundancy.
- **Key visual elements:** Binary tree growing in real time (node-by-node);
  duplicate sub-tree nodes connected by dashed lines; total call counter vs
  unique call counter; tree-depth ruler on the side.
- **Controls:** Play/Pause, Step, Reset, n input (3–15), Speed slider.
  _(Note: this is the naïve half of the Fibonacci animation from Phase 1; it can
  share code if both are on the same page, or stand alone.)_
- **Educational value:** Exponential time from tree recursion, overlapping
  subproblems made visible, and why memoization is not just an optimization but
  a structural transformation.

#### 30. Divide and Conquer — Tower of Hanoi
- **What it shows:** Three pegs with stacked discs. The recursive Hanoi
  algorithm moves discs, with each recursive call highlighted in the call-stack
  panel. The animation shows why the algorithm is correct by making the
  subproblem structure visible.
- **Key visual elements:** Three pegs with proportionally sized disc stacks;
  animated disc lift-and-drop; call-stack panel showing current subproblem
  parameters (n, source, target, auxiliary); move counter.
- **Controls:** Play/Pause, Step, Reset, n discs slider (1–8), Speed slider.
- **Educational value:** Recursion on a problem with no obvious iterative
  solution, subproblem decomposition, O(2ⁿ) move count made viscerally clear.

---

### New Category: String Algorithms

_Accent: reuse `--syn-success` (green, `#a6da95`) or introduce a new token._

#### 31. KMP Pattern Matching
- **What it shows:** A text string and a pattern string rendered as two rows of
  character cells. The KMP failure function is built and shown as a table, then
  the search proceeds with the pattern sliding and the "partial match" table
  enabling skips instead of backtracking.
- **Key visual elements:** Aligned text and pattern rows with matching characters
  highlighted; mismatches shown in red; skip arrows jumping the pattern forward;
  the failure table below updating as it is built.
- **Controls:** Play/Pause, Step, Reset, Text input, Pattern input, Speed slider.
- **Educational value:** Naïve O(mn) search vs KMP O(m+n), failure function
  semantics, and the general principle that preprocessing enables faster search.

#### 32. Trie (Prefix Tree)
- **What it shows:** A trie data structure supporting Insert and Search. Words
  are inserted character by character with nodes created or traversed as needed.
  Common prefixes are shown sharing nodes, making the space-sharing property
  concrete.
- **Key visual elements:** Tree with character-labeled edges; word-end markers
  (double-circle nodes); prefix highlighting when a search shares a path with
  existing words; a word list panel on the side.
- **Controls:** Insert (word input), Search (word input), Reset, Speed slider.
- **Educational value:** Prefix sharing, O(L) insert/search (L = word length),
  autocomplete intuition, and the trade-off between a trie and a hash set.

#### 33. Rabin-Karp Rolling Hash
- **What it shows:** The rolling hash computation sliding across the text. At
  each position the hash of the current window is computed (shown arithmetically)
  and compared to the pattern hash. A match triggers a character-level
  verification step.
- **Key visual elements:** Text with a sliding "window" highlight; hash values
  displayed above the window updating at each step; the pattern hash shown as a
  constant reference bar; hash collision events (hash match but character
  mismatch) called out in rose.
- **Controls:** Play/Pause, Step, Reset, Text input, Pattern input, Speed slider.
- **Educational value:** Rolling hash, the sliding window technique, hash
  collisions and false positives, and O(n+m) average-case string search.

---

### New Category: Pathfinding

_Accent: can reuse Search Algorithm teal or introduce a warm amber._

Note: BFS, DFS, Dijkstra's, and A* already cover much of this ground. The new
animations here are for pathfinding-specific variants that are distinct enough
to merit their own entries.

#### 34. Maze Generation (Recursive Backtracker)
- **What it shows:** A grid starts as a wall of cells. The recursive
  backtracking algorithm carves paths: the "carver" cell is shown in gold,
  visited cells in teal, and unvisited cells in the default dark background.
  The complete maze is then solvable by any of the search algorithms.
- **Key visual elements:** Grid with wall/passage cells; the active carver cell
  glowing gold; a call-stack depth counter; optional solution overlay after
  generation using BFS.
- **Controls:** Play/Pause, Step, Reset, Grid size slider, Seed input, Speed
  slider, Show Solution toggle.
- **Educational value:** Recursive backtracking, spanning tree generation,
  randomized DFS — and a platform for comparing search algorithms on the same
  generated maze.

#### 35. Bellman-Ford
- **What it shows:** A weighted directed graph (possibly with negative edges).
  All distances initialize to infinity; the algorithm relaxes every edge V-1
  times, and a final iteration detects negative cycles (highlighted in red).
- **Key visual elements:** Graph with distance labels on nodes updating each
  relaxation round; edge relaxation pulses (gold flash when a shorter path is
  found); round counter; a negative-cycle warning panel if detected.
- **Controls:** Play/Pause, Step, Reset, Randomize Graph (with negative-weight
  option), Source node picker, Speed slider.
- **Educational value:** Bellman-Ford as a baseline for understanding Dijkstra's
  greedy assumption, negative weights, negative cycle detection — important for
  currency arbitrage and routing protocols.

---

### New Category: Memory Management

_Accent: a desaturated warm tone distinct from existing palette._

#### 36. Stack vs Heap Memory
- **What it shows:** A dual-panel canvas showing a call stack (growing downward)
  and a heap (growing upward with fragmentation). Function calls push frames onto
  the stack; heap allocation (`malloc`/`new`) shows a free-block search, blocks
  being marked used, and fragmentation emerging over time.
- **Key visual elements:** Stack panel: frames with local variable blocks growing
  downward; heap panel: color-coded blocks (free in muted, allocated in rose,
  fragmented gaps in darker shade); a pointer from a stack variable to a heap
  object.
- **Controls:** Call function (push frame), Return (pop frame), Malloc (size
  input), Free (address input), Reset, Speed slider.
- **Educational value:** The stack/heap dichotomy, pointer semantics, memory
  fragmentation, use-after-free, and why garbage-collected languages hide this
  complexity.

#### 37. Garbage Collection (Mark and Sweep)
- **What it shows:** An object graph (nodes as heap objects, edges as
  references). The GC mark phase traverses from root references, coloring
  reachable objects; the sweep phase removes unmarked objects and coalesces free
  space.
- **Key visual elements:** Object graph with root-set nodes highlighted; mark
  phase animation traversing edges depth-first; reachable nodes turning teal,
  unreachable staying grey; sweep phase erasing unreachable nodes with a
  compaction animation.
- **Controls:** Play/Pause, Step, Reset, Add Object, Add Reference, Remove
  Reference (to make objects unreachable), Speed slider.
- **Educational value:** Reachability-based memory management, tri-color
  marking, stop-the-world pauses, and why cyclic references are handled
  naturally (unlike reference counting).

---

### New Category: Concurrency

_Accent: a vibrant contrasting color (e.g., amber/orange) separate from existing tokens._

These are the most complex visualizations in the project, requiring
multi-threaded simulation logic. Consider building them last.

#### 38. Mutex and Race Condition
- **What it shows:** Two "threads" (animated bars moving across a timeline)
  both increment a shared counter. Without a mutex, interleaved reads and writes
  produce wrong results (lost updates). With a mutex, one thread blocks while
  the other holds the lock — the counter is always correct but threads stall.
- **Key visual elements:** Two thread lanes with instruction pointers; a shared
  memory cell for the counter; a mutex lock icon that changes appearance
  (locked/unlocked); race condition errors shown as red flash on the counter;
  a timeline axis.
- **Controls:** Run Without Mutex, Run With Mutex, Speed slider, Reset,
  Step (per instruction).
- **Educational value:** Race conditions, critical sections, mutual exclusion,
  the cost of synchronization, and why concurrent bugs are non-deterministic.

#### 39. Deadlock
- **What it shows:** Two (or more) threads each holding one resource and waiting
  for the other. A resource-allocation graph (RAG) is shown alongside the thread
  state panel. The circular wait is highlighted, and a deadlock-detection
  algorithm identifies the cycle.
- **Key visual elements:** Thread nodes and resource nodes in a directed RAG;
  "holds" edges (solid) and "waits-for" edges (dashed); threads shown in a
  state machine (running, blocked, waiting); cycle detection highlight; optional
  resolution strategies (timeout, priority preemption) shown.
- **Controls:** Step (advance time), Introduce Deadlock scenario, Apply
  Resolution (timeout / preempt), Reset, Speed slider.
- **Educational value:** Deadlock conditions (mutual exclusion, hold and wait,
  no preemption, circular wait), RAG cycle detection, and prevention strategies.

---

## Summary Table

| Phase | # | Animation                  | Category               | Complexity     |
|-------|---|----------------------------|------------------------|----------------|
| 1     | 1 | Insertion Sort             | Sorting                | O(n²)          |
| 1     | 2 | Binary Search              | Search                 | O(log n)       |
| 1     | 3 | Merge Sort                 | Sorting                | O(n log n)     |
| 1     | 4 | Stack                      | Data Structures        | LIFO           |
| 1     | 5 | Queue                      | Data Structures        | FIFO           |
| 1     | 6 | Linked List                | Data Structures        | O(n) access    |
| 1     | 7 | Fibonacci (Memoized)       | Dynamic Programming    | O(n) vs O(2ⁿ)  |
| 1     | 8 | Dijkstra's Algorithm       | Graph Algorithms       | O(E log V)     |
| 2     | 9 | Quick Sort                 | Sorting                | O(n log n)     |
| 2     |10 | Heap Sort                  | Sorting                | O(n log n)     |
| 2     |11 | Binary Tree (BST)          | Data Structures        | O(log n)       |
| 2     |12 | Hash Table                 | Data Structures        | O(1) avg       |
| 2     |13 | Breadth-First Search       | Search                 | O(V+E)         |
| 2     |14 | Depth-First Search         | Search                 | O(V+E)         |
| 2     |15 | Topological Sort           | Graph Algorithms       | O(V+E)         |
| 2     |16 | 0/1 Knapsack               | Dynamic Programming    | O(nW)          |
| 2     |17 | Longest Common Subseq.     | Dynamic Programming    | O(mn)          |
| 2     |18 | Perceptron                 | Neural Networks        | single neuron  |
| 3     |19 | A* Search                  | Search                 | O(E)           |
| 3     |20 | Kruskal's Algorithm        | Graph Algorithms       | O(E log E)     |
| 3     |21 | Prim's Algorithm           | Graph Algorithms       | O(E log V)     |
| 3     |22 | Array                      | Data Structures        | O(1) access    |
| 3     |23 | Heap (Priority Queue)      | Data Structures        | O(log n)       |
| 3     |24 | Graph (Data Structure)     | Data Structures        | varies         |
| 3     |25 | Backpropagation            | Neural Networks        | chain rule     |
| 3     |26 | Gradient Descent           | Neural Networks        | optimization   |
| 3     |27 | Convolutional NN           | Neural Networks        | convolutions   |
| 3     |28 | Call Stack Explorer        | Recursion              | varies         |
| 3     |29 | Tree Recursion             | Recursion              | O(2ⁿ)          |
| 3     |30 | Tower of Hanoi             | Recursion              | O(2ⁿ)          |
| 3     |31 | KMP Pattern Matching       | String Algorithms      | O(m+n)         |
| 3     |32 | Trie                       | String Algorithms      | O(L)           |
| 3     |33 | Rabin-Karp                 | String Algorithms      | O(n+m)         |
| 3     |34 | Maze Generation            | Pathfinding            | O(V)           |
| 3     |35 | Bellman-Ford               | Pathfinding            | O(VE)          |
| 3     |36 | Stack vs Heap Memory       | Memory Management      | —              |
| 3     |37 | Garbage Collection         | Memory Management      | O(V+E)         |
| 3     |38 | Mutex & Race Condition     | Concurrency            | —              |
| 3     |39 | Deadlock                   | Concurrency            | —              |

**Total: 39 animations** (1 already shipped, 38 to build)
across 10 categories (6 existing + 4 new).

---

## Implementation Notes

### Canvas infrastructure patterns

Every animation should follow the bubble-sort.html reference implementation:

- **IIFE-wrapped inline script** — no global scope pollution.
- **Step queue pattern** — pre-compute all algorithm steps as plain objects, then
  execute them one by one with async/await. This makes Step mode free.
- **DPI scaling** — `canvas.width = container.clientWidth * dpr`.
- **Standard control strip** — Play/Pause, Step, Reset, Speed slider, plus any
  animation-specific controls (additional sliders, inputs, toggles).
- **easeInOutCubic** for all animated transitions.

### Graph animations (BFS, DFS, Dijkstra, etc.)

Build a shared `GraphCanvas` helper (not a library — just a copy-paste utility
module) that handles:
- Node positions (random + force-directed relaxation)
- Draggable nodes (mouse/touch events)
- Edge drawing (straight lines with arrowheads for directed, plain for undirected)
- Hover detection for source/target picking

Each graph animation copies and customizes this module inline, keeping the
zero-external-dependencies contract.

### Tree animations (Binary Tree, Heap, Trie, recursion trees)

Build a shared `TreeLayout` helper that computes Reingold-Tilford positions for
arbitrary binary trees. Inline-copy into each animation page.

### New category accents

| Category           | Suggested token          | Hex       |
|--------------------|--------------------------|-----------|
| Recursion          | `--syn-operator` (blue)  | `#3e8fb0` |
| String Algorithms  | `--syn-success` (green)  | `#a6da95` |
| Pathfinding        | amber (new token)        | `#f4a261` |
| Memory Management  | slate (new token)        | `#8da0b0` |
| Concurrency        | orange (new token)       | `#e07b39` |

Add new tokens to the `:root` block in `css/styles.css` and new entries to the
`CATEGORIES` array in `js/categories.js` following the existing schema.
