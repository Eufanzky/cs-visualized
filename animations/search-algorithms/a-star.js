(function () {
  var COLORS = AppColors;
  COLORS.wall = '#1a1726';
  COLORS.closed = '#2a2540';
  COLORS.node = '#4a403a';
  COLORS.edge = '#4a403a';

  /* ────────── Maze constants ────────── */
  var COLS = 20;
  var ROWS = 12;
  var startCell = { r: 1, c: 1 };
  var goalCell = { r: ROWS - 2, c: COLS - 2 };

  /* ────────── Graph constants ────────── */
  var NUM_NODES = 8;
  var GRAPH_START = 0;
  var GRAPH_GOAL = NUM_NODES - 1;

  /* ────────── Shared helpers ────────── */
  function manhattan(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
  }

  function euclidean(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* ────────── Maze helpers ────────── */
  function buildGrid(s) {
    s.grid = [];
    s.cellStates = [];
    s.gScores = [];
    s.fScores = [];
    s.hScores = [];
    for (var r = 0; r < ROWS; r++) {
      s.grid[r] = [];
      s.cellStates[r] = [];
      s.gScores[r] = [];
      s.fScores[r] = [];
      s.hScores[r] = [];
      for (var c = 0; c < COLS; c++) {
        var isWall = (r === startCell.r && c === startCell.c) || (r === goalCell.r && c === goalCell.c)
          ? false
          : Math.random() < 0.25;
        s.grid[r][c] = isWall ? 1 : 0;
        s.cellStates[r][c] = isWall ? 'wall' : 'empty';
        s.gScores[r][c] = Infinity;
        s.fScores[r][c] = Infinity;
        s.hScores[r][c] = 0;
      }
    }
    s.cellStates[startCell.r][startCell.c] = 'start';
    s.cellStates[goalCell.r][goalCell.c] = 'goal';
    s.grid[startCell.r][startCell.c] = 0;
    s.grid[goalCell.r][goalCell.c] = 0;

    // Clear cells around start and goal so paths can exist
    var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    for (var d = 0; d < dirs.length; d++) {
      var sr = startCell.r + dirs[d][0], sc = startCell.c + dirs[d][1];
      if (sr >= 0 && sr < ROWS && sc >= 0 && sc < COLS) {
        s.grid[sr][sc] = 0;
        if (s.cellStates[sr][sc] === 'wall') s.cellStates[sr][sc] = 'empty';
      }
      var gr = goalCell.r + dirs[d][0], gc = goalCell.c + dirs[d][1];
      if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS) {
        s.grid[gr][gc] = 0;
        if (s.cellStates[gr][gc] === 'wall') s.cellStates[gr][gc] = 'empty';
      }
    }
  }

  /* ────────── Graph helpers ────────── */
  function addEdge(s, a, b, w) {
    s.graphEdges.push({ from: a, to: b, weight: w });
    s.graphAdjList[a].push({ node: b, weight: w });
    s.graphAdjList[b].push({ node: a, weight: w });
    s.graphEdgeStates[a + '-' + b] = 'default';
    s.graphEdgeStates[b + '-' + a] = 'default';
  }

  function hasEdge(s, a, b) {
    return s.graphEdges.some(function (e) {
      return (e.from === a && e.to === b) || (e.from === b && e.to === a);
    });
  }

  function setEdgeState(s, a, b, state) {
    var k1 = a + '-' + b;
    var k2 = b + '-' + a;
    if (k1 in s.graphEdgeStates) s.graphEdgeStates[k1] = state;
    if (k2 in s.graphEdgeStates) s.graphEdgeStates[k2] = state;
  }

  function getEdgeState(s, a, b) {
    var k1 = a + '-' + b;
    var k2 = b + '-' + a;
    return s.graphEdgeStates[k1] || s.graphEdgeStates[k2] || 'default';
  }

  function buildGraph(s, w, h) {
    s.graphNodes = [];
    s.graphEdges = [];
    s.graphAdjList = {};
    s.graphNodeStates = {};
    s.graphEdgeStates = {};
    s.graphFLabels = {};

    var cx = w / 2;
    var cy = h / 2;
    var rx = Math.min(w * 0.34, 240);
    var ry = Math.min(h * 0.34, 180);

    for (var i = 0; i < NUM_NODES; i++) {
      var angle = (2 * Math.PI * i) / NUM_NODES - Math.PI / 2;
      s.graphNodes.push({
        id: i,
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle)
      });
      s.graphAdjList[i] = [];
      s.graphNodeStates[i] = 'unvisited';
      s.graphFLabels[i] = '';
    }

    // Build spanning tree first to ensure connectivity
    var connected = [0];
    var unconnected = [];
    for (var i = 1; i < NUM_NODES; i++) unconnected.push(i);

    while (unconnected.length > 0) {
      var fromIdx = Math.floor(Math.random() * connected.length);
      var toIdx = Math.floor(Math.random() * unconnected.length);
      var from = connected[fromIdx];
      var to = unconnected[toIdx];
      var weight = Math.floor(Math.random() * 9) + 1;
      addEdge(s, from, to, weight);
      connected.push(to);
      unconnected.splice(toIdx, 1);
    }

    // Add extra edges for variety
    var extraCount = 4 + Math.floor(Math.random() * 3);
    for (var e = 0; e < extraCount; e++) {
      var a = Math.floor(Math.random() * NUM_NODES);
      var b = Math.floor(Math.random() * NUM_NODES);
      if (a === b) b = (b + 1) % NUM_NODES;
      if (!hasEdge(s, a, b)) {
        var weight = Math.floor(Math.random() * 9) + 1;
        addEdge(s, a, b, weight);
      }
    }
  }

  /* ────────── Maze step generation ────────── */
  function generateMazeSteps(eng) {
    var s = eng.state;
    var steps = [];
    var gScore = Array.from({ length: ROWS }, function () { return Array(COLS).fill(Infinity); });
    var fScore = Array.from({ length: ROWS }, function () { return Array(COLS).fill(Infinity); });
    var cameFrom = Array.from({ length: ROWS }, function () { return Array(COLS).fill(null); });
    var openSet = new Set();
    var closedSet = new Set();

    var key = function (r, c) { return r * COLS + c; };

    gScore[startCell.r][startCell.c] = 0;
    var h0 = manhattan(startCell.r, startCell.c, goalCell.r, goalCell.c);
    fScore[startCell.r][startCell.c] = h0;
    openSet.add(key(startCell.r, startCell.c));

    steps.push({ type: 'open', r: startCell.r, c: startCell.c, g: 0, f: h0, h: h0 });

    while (openSet.size > 0) {
      var bestKey = -1;
      var bestF = Infinity;
      openSet.forEach(function (k) {
        var r = Math.floor(k / COLS);
        var c = k % COLS;
        if (fScore[r][c] < bestF) {
          bestF = fScore[r][c];
          bestKey = k;
        }
      });

      var cr = Math.floor(bestKey / COLS);
      var cc = bestKey % COLS;

      steps.push({ type: 'current', r: cr, c: cc });

      if (cr === goalCell.r && cc === goalCell.c) {
        var path = [];
        var pr = cr, pc = cc;
        while (cameFrom[pr][pc] !== null) {
          path.push({ r: pr, c: pc });
          var prev = cameFrom[pr][pc];
          pr = prev.r;
          pc = prev.c;
        }
        path.push({ r: startCell.r, c: startCell.c });
        path.reverse();
        steps.push({ type: 'path', cells: path });
        return steps;
      }

      openSet.delete(bestKey);
      closedSet.add(bestKey);
      steps.push({ type: 'close', r: cr, c: cc });

      var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (var d = 0; d < dirs.length; d++) {
        var nr = cr + dirs[d][0];
        var nc = cc + dirs[d][1];
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        if (s.grid[nr][nc] === 1) continue;
        var nk = key(nr, nc);
        if (closedSet.has(nk)) continue;

        var tentG = gScore[cr][cc] + 1;
        if (tentG < gScore[nr][nc]) {
          cameFrom[nr][nc] = { r: cr, c: cc };
          gScore[nr][nc] = tentG;
          var h = manhattan(nr, nc, goalCell.r, goalCell.c);
          fScore[nr][nc] = tentG + h;

          if (!openSet.has(nk)) {
            openSet.add(nk);
          }
          steps.push({ type: 'open', r: nr, c: nc, g: tentG, f: tentG + h, h: h });
        }
      }
    }

    steps.push({ type: 'no-path' });
    return steps;
  }

  /* ────────── Graph step generation ────────── */
  function generateGraphSteps(eng) {
    var s = eng.state;
    var steps = [];

    // Reset visual states
    for (var i = 0; i < NUM_NODES; i++) {
      s.graphNodeStates[i] = 'unvisited';
      s.graphFLabels[i] = '';
    }
    for (var key in s.graphEdgeStates) {
      s.graphEdgeStates[key] = 'default';
    }

    var gScore = [];
    var fScoreArr = [];
    var cameFrom = [];
    for (var i = 0; i < NUM_NODES; i++) {
      gScore.push(Infinity);
      fScoreArr.push(Infinity);
      cameFrom.push(-1);
    }

    var goalNode = s.graphNodes[GRAPH_GOAL];

    // Heuristic: scaled euclidean distance to goal node
    function heuristic(nodeId) {
      var n = s.graphNodes[nodeId];
      var dist = euclidean(n.x, n.y, goalNode.x, goalNode.y);
      // Scale down to be comparable with edge weights (max ~9)
      // Find max distance for normalization
      var maxDist = 0;
      for (var i = 0; i < NUM_NODES; i++) {
        var d = euclidean(s.graphNodes[i].x, s.graphNodes[i].y, goalNode.x, goalNode.y);
        if (d > maxDist) maxDist = d;
      }
      return maxDist > 0 ? Math.round((dist / maxDist) * 9) : 0;
    }

    gScore[GRAPH_START] = 0;
    var h0 = heuristic(GRAPH_START);
    fScoreArr[GRAPH_START] = h0;

    var openSet = new Set();
    var closedSet = new Set();
    openSet.add(GRAPH_START);

    steps.push({ type: 'open', node: GRAPH_START, g: 0, f: h0, h: h0 });

    while (openSet.size > 0) {
      // Pick node with lowest f-score from open set
      var bestNode = -1;
      var bestF = Infinity;
      openSet.forEach(function (n) {
        if (fScoreArr[n] < bestF) {
          bestF = fScoreArr[n];
          bestNode = n;
        }
      });

      steps.push({ type: 'current', node: bestNode });

      if (bestNode === GRAPH_GOAL) {
        // Reconstruct path
        var path = [];
        var cur = bestNode;
        while (cur !== -1) {
          path.push(cur);
          cur = cameFrom[cur];
        }
        path.reverse();
        steps.push({ type: 'path', nodes: path });
        steps.push({ type: 'done' });
        return steps;
      }

      openSet.delete(bestNode);
      closedSet.add(bestNode);
      steps.push({ type: 'close', node: bestNode });

      var neighbors = s.graphAdjList[bestNode];
      for (var ni = 0; ni < neighbors.length; ni++) {
        var neighbor = neighbors[ni];
        var v = neighbor.node;
        var w = neighbor.weight;

        if (closedSet.has(v)) continue;

        steps.push({ type: 'check-edge', from: bestNode, to: v, weight: w });

        var tentG = gScore[bestNode] + w;
        if (tentG < gScore[v]) {
          cameFrom[v] = bestNode;
          gScore[v] = tentG;
          var h = heuristic(v);
          fScoreArr[v] = tentG + h;

          if (!openSet.has(v)) {
            openSet.add(v);
          }
          steps.push({ type: 'open', node: v, g: tentG, f: tentG + h, h: h });
        }
      }
    }

    // No path found
    steps.push({ type: 'done' });
    return steps;
  }

  /* ────────── Maze executeStep ────────── */
  function executeMazeStep(step, eng) {
    var s = eng.state;
    LofiSounds.step(step);
    return new Promise(function (resolve) {
      if (step.type === 'open') {
        if (!(step.r === startCell.r && step.c === startCell.c) && !(step.r === goalCell.r && step.c === goalCell.c)) {
          s.cellStates[step.r][step.c] = 'open';
        }
        s.gScores[step.r][step.c] = step.g;
        s.fScores[step.r][step.c] = step.f;
        s.hScores[step.r][step.c] = step.h;
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.3);
      } else if (step.type === 'current') {
        if (!(step.r === startCell.r && step.c === startCell.c) && !(step.r === goalCell.r && step.c === goalCell.c)) {
          s.cellStates[step.r][step.c] = 'current';
        }
        s.statusText = 'exploring (' + step.r + ',' + step.c + ')';
        eng.draw();
        setTimeout(resolve, eng.getDelay());
      } else if (step.type === 'close') {
        if (!(step.r === startCell.r && step.c === startCell.c) && !(step.r === goalCell.r && step.c === goalCell.c)) {
          s.cellStates[step.r][step.c] = 'closed';
        }
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.2);
      } else if (step.type === 'path') {
        var idx = 0;
        function showNext() {
          if (idx >= step.cells.length) {
            s.statusText = 'path found! length=' + step.cells.length + ' \u2713';
            eng.draw();
            setTimeout(function () { LofiSounds.complete(); }, 150);
            resolve();
            return;
          }
          var cell = step.cells[idx];
          s.cellStates[cell.r][cell.c] = 'path';
          eng.draw();
          idx++;
          setTimeout(showNext, eng.getDelay() * 0.4);
        }
        s.statusText = 'reconstructing path...';
        showNext();
      } else if (step.type === 'no-path') {
        s.statusText = 'no path found \u2717';
        eng.draw();
        resolve();
      }
    });
  }

  /* ────────── Graph executeStep ────────── */
  function executeGraphStep(step, eng) {
    var s = eng.state;
    LofiSounds.step(step);
    return new Promise(function (resolve) {
      if (step.type === 'open') {
        if (s.graphNodeStates[step.node] !== 'current' && s.graphNodeStates[step.node] !== 'closed') {
          s.graphNodeStates[step.node] = 'open';
        }
        s.graphFLabels[step.node] = 'f=' + step.f;
        s.statusText = 'open node ' + step.node + ' (g=' + step.g + ' h=' + step.h + ' f=' + step.f + ')';
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.5);
      } else if (step.type === 'current') {
        s.graphNodeStates[step.node] = 'current';
        s.statusText = 'exploring node ' + step.node;
        eng.draw();
        setTimeout(resolve, eng.getDelay());
      } else if (step.type === 'close') {
        s.graphNodeStates[step.node] = 'closed';
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.3);
      } else if (step.type === 'check-edge') {
        setEdgeState(s, step.from, step.to, 'checking');
        s.statusText = 'checking edge ' + step.from + '\u2192' + step.to + ' (w=' + step.weight + ')';
        eng.draw();
        setTimeout(function () {
          // Reset edge unless it becomes part of path later
          if (getEdgeState(s, step.from, step.to) === 'checking') {
            setEdgeState(s, step.from, step.to, 'default');
            eng.draw();
          }
          resolve();
        }, eng.getDelay() * 0.6);
      } else if (step.type === 'path') {
        var idx = 0;
        function showNext() {
          if (idx >= step.nodes.length) {
            s.statusText = 'shortest path found! cost via ' + step.nodes.join('\u2192') + ' \u2713';
            eng.draw();
            setTimeout(function () { LofiSounds.complete(); }, 150);
            resolve();
            return;
          }
          var n = step.nodes[idx];
          s.graphNodeStates[n] = 'path';
          if (idx > 0) {
            setEdgeState(s, step.nodes[idx - 1], n, 'path');
          }
          eng.draw();
          idx++;
          setTimeout(showNext, eng.getDelay() * 0.6);
        }
        s.statusText = 'reconstructing path...';
        showNext();
      } else if (step.type === 'done') {
        s.statusText = 'complete \u2713';
        eng.draw();
        resolve();
      }
    });
  }

  /* ────────── Maze draw ────────── */
  function drawMaze(eng) {
    var s = eng.state;
    var ctx = eng.ctx;
    ctx.clearRect(0, 0, eng.w, eng.h);

    var padding = 30;
    var availW = eng.w - padding * 2;
    var availH = eng.h - padding * 2 - 30;
    var cellSize = Math.min(availW / COLS, availH / ROWS);
    var gridW = cellSize * COLS;
    var offsetX = (eng.w - gridW) / 2;
    var offsetY = padding + 20;

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = offsetX + c * cellSize;
        var y = offsetY + r * cellSize;
        var state = s.cellStates[r][c];

        var fillColor = COLORS.surface;
        var glow = false;

        if (state === 'wall') {
          fillColor = COLORS.wall;
        } else if (state === 'start') {
          fillColor = COLORS.success; glow = true;
        } else if (state === 'goal') {
          fillColor = COLORS.accent; glow = true;
        } else if (state === 'current') {
          fillColor = COLORS.accent; glow = true;
        } else if (state === 'open') {
          fillColor = COLORS.primary;
        } else if (state === 'closed') {
          fillColor = COLORS.closed;
        } else if (state === 'path') {
          fillColor = COLORS.success; glow = true;
        }

        var gap = 1.5;
        var cx = x + gap;
        var cy = y + gap;
        var cw = cellSize - gap * 2;
        var ch = cellSize - gap * 2;

        CanvasUtils.drawBlock(ctx, cx, cy, cw, ch, {
          fill: fillColor,
          glow: glow,
          radius: 3
        });

        // f/g scores
        if (cellSize >= 32 && s.gScores[r][c] < Infinity && state !== 'wall' && state !== 'start' && state !== 'goal') {
          ctx.fillStyle = COLORS.textMuted;
          ctx.font = (Math.min(9, cellSize * 0.22)) + 'px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          var g = s.gScores[r][c];
          var f = s.fScores[r][c];
          if (cellSize >= 40) {
            ctx.fillText('f=' + f, x + cellSize / 2, y + cellSize * 0.35);
            ctx.fillText('g=' + g, x + cellSize / 2, y + cellSize * 0.65);
          } else {
            ctx.fillText('' + f, x + cellSize / 2, y + cellSize / 2);
          }
        }

        // Start/Goal labels
        if (state === 'start' || (r === startCell.r && c === startCell.c)) {
          ctx.fillStyle = COLORS.bg;
          ctx.font = 'bold ' + Math.min(12, cellSize * 0.4) + 'px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('S', x + cellSize / 2, y + cellSize / 2);
        } else if (state === 'goal' || (r === goalCell.r && c === goalCell.c)) {
          ctx.fillStyle = COLORS.bg;
          ctx.font = 'bold ' + Math.min(12, cellSize * 0.4) + 'px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('G', x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    // Status
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('a* maze | ' + COLS + 'x' + ROWS + ' grid  |  ' + s.statusText, 20, 18);
  }

  /* ────────── Graph draw ────────── */
  function drawGraph(eng) {
    var s = eng.state;
    var ctx = eng.ctx;
    ctx.clearRect(0, 0, eng.w, eng.h);

    if (!s.graphNodes || s.graphNodes.length === 0) return;

    // Draw edges
    for (var ei = 0; ei < s.graphEdges.length; ei++) {
      var edge = s.graphEdges[ei];
      var nA = s.graphNodes[edge.from];
      var nB = s.graphNodes[edge.to];
      var estate = getEdgeState(s, edge.from, edge.to);

      var color = COLORS.edge;
      var lineWidth = 2;
      if (estate === 'checking') {
        color = COLORS.accent;
        lineWidth = 3;
      } else if (estate === 'path') {
        color = COLORS.success;
        lineWidth = 4;
      }

      ctx.beginPath();
      ctx.moveTo(nA.x, nA.y);
      ctx.lineTo(nB.x, nB.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Weight label at midpoint
      var mx = (nA.x + nB.x) / 2;
      var my = (nA.y + nB.y) / 2;
      ctx.fillStyle = COLORS.bg;
      ctx.beginPath();
      ctx.arc(mx, my, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = estate === 'checking' ? COLORS.accent : estate === 'path' ? COLORS.success : COLORS.textMuted;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.weight, mx, my);
    }

    // Draw nodes
    var nodeRadius = 22;
    for (var ni = 0; ni < s.graphNodes.length; ni++) {
      var node = s.graphNodes[ni];
      var nstate = s.graphNodeStates[node.id];
      var fillColor = COLORS.node;
      var strokeColor = COLORS.border;
      var glow = false;

      if (nstate === 'open') {
        fillColor = COLORS.primary;
        strokeColor = COLORS.primary;
        glow = true;
      } else if (nstate === 'current') {
        fillColor = COLORS.accent;
        strokeColor = COLORS.accent;
        glow = true;
      } else if (nstate === 'closed') {
        fillColor = COLORS.closed;
        strokeColor = COLORS.border;
      } else if (nstate === 'path') {
        fillColor = COLORS.success;
        strokeColor = COLORS.success;
        glow = true;
      }

      // Highlight start and goal
      if (node.id === GRAPH_START && nstate === 'unvisited') {
        fillColor = COLORS.success;
        strokeColor = COLORS.success;
        glow = true;
      } else if (node.id === GRAPH_GOAL && nstate === 'unvisited') {
        fillColor = COLORS.accent;
        strokeColor = COLORS.accent;
        glow = true;
      }

      var labelText = node.id;
      if (node.id === GRAPH_START) labelText = 'S';
      if (node.id === GRAPH_GOAL) labelText = 'G';

      CanvasUtils.drawNode(ctx, node.x, node.y, nodeRadius, {
        fill: fillColor,
        stroke: strokeColor,
        glow: glow ? fillColor : null,
        label: labelText,
        labelColor: (nstate === 'current' || nstate === 'path' || nstate === 'open' || node.id === GRAPH_START || node.id === GRAPH_GOAL) ? COLORS.bg : COLORS.text
      });

      // f-score label below node
      var fLabel = s.graphFLabels[node.id];
      if (fLabel) {
        ctx.fillStyle = nstate === 'path' ? COLORS.success : COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(fLabel, node.x, node.y + nodeRadius + 6);
      }
    }

    // Status
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('a* graph | ' + NUM_NODES + ' nodes | ' + s.statusText, 20, 18);
  }

  /* ────────── Engine ────────── */
  var eng = AnimationEngine({
    autoWireControls: false,
    playLabel: '\u25B6 Start Search',

    generateData: function (size, engine) {
      var s = engine.state;
      if (!s.viewMode) s.viewMode = 'maze';
      s.statusText = 'ready';

      if (s.viewMode === 'maze') {
        buildGrid(s);
      } else {
        buildGraph(s, engine.w, engine.h);
      }
    },

    generateSteps: function (engine) {
      var s = engine.state;
      if (s.viewMode === 'maze') {
        return generateMazeSteps(engine);
      } else {
        return generateGraphSteps(engine);
      }
    },

    executeStep: function (step, engine) {
      var s = engine.state;
      if (s.viewMode === 'maze') {
        return executeMazeStep(step, engine);
      } else {
        return executeGraphStep(step, engine);
      }
    },

    draw: function (engine) {
      var s = engine.state;
      if (s.viewMode === 'maze') {
        drawMaze(engine);
      } else {
        drawGraph(engine);
      }
    }
  });

  /* ────────── Manual control wiring ────────── */
  var playBtn = document.getElementById('btnPlay');
  var stepBtn = document.getElementById('btnStep');
  var resetBtn = document.getElementById('btnReset');
  var speedSlider = document.getElementById('speedSlider');
  var sizeSlider = document.getElementById('sizeSlider');
  var soundBtn = document.getElementById('btnSound');

  if (playBtn) playBtn.addEventListener('click', eng.play);
  if (stepBtn) stepBtn.addEventListener('click', eng.step);
  if (resetBtn) resetBtn.addEventListener('click', function () {
    eng.generateData(eng.n);
  });
  if (speedSlider) speedSlider.addEventListener('input', function (e) {
    eng.speed = parseInt(e.target.value);
  });
  if (sizeSlider) sizeSlider.addEventListener('input', function (e) {
    eng.generateData(parseInt(e.target.value));
  });

  window.addEventListener('resize', function () {
    eng.resize();
    eng.draw();
  });

  /* ────────── View toggle ────────── */
  var viewBtn = document.getElementById('btnView');
  if (viewBtn) {
    viewBtn.addEventListener('click', function () {
      var s = eng.state;
      s.viewMode = s.viewMode === 'maze' ? 'graph' : 'maze';
      viewBtn.textContent = s.viewMode === 'maze' ? '\u25CE Graph' : '\u2591 Maze';
      eng.generateData(eng.n);
    });
  }
})();
