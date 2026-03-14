(function () {
  var COLORS = AppColors;

  var NUM_NODES = 10;
  var COLS = 20;
  var ROWS = 12;
  var startCell = { r: 1, c: 1 };
  var goalCell = { r: ROWS - 2, c: COLS - 2 };

  /* ─── Graph helpers ─── */

  function addEdge(adjList, a, b) {
    if (!adjList[a].includes(b)) adjList[a].push(b);
    if (!adjList[b].includes(a)) adjList[b].push(a);
  }

  function initPositions(w, h) {
    var cx = w * 0.45;
    var cy = h * 0.38;
    var rx = Math.min(w * 0.30, 190);
    var ry = Math.min(h * 0.28, 140);
    var positions = [];
    for (var i = 0; i < NUM_NODES; i++) {
      var angle = (2 * Math.PI * i) / NUM_NODES - Math.PI / 2;
      positions.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
    }
    return positions;
  }

  function buildGraph() {
    var adjList = Array.from({ length: NUM_NODES }, function () { return []; });
    var nodes = Array.from({ length: NUM_NODES }, function (_, i) { return i; });
    for (var i = nodes.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = nodes[i]; nodes[i] = nodes[j]; nodes[j] = tmp;
    }
    for (var i = 1; i < NUM_NODES; i++) {
      addEdge(adjList, nodes[i], nodes[Math.floor(Math.random() * i)]);
    }
    var extraEdges = 4 + Math.floor(Math.random() * 4);
    for (var e = 0; e < extraEdges; e++) {
      var a = Math.floor(Math.random() * NUM_NODES);
      var b = Math.floor(Math.random() * NUM_NODES);
      if (a !== b && !adjList[a].includes(b)) addEdge(adjList, a, b);
    }
    return adjList;
  }

  /* ─── Engine ─── */

  var eng = AnimationEngine({
    autoWireControls: false,
    playLabel: '\u25B6 Start DFS',

    generateData: function (size, eng) {
      var s = eng.state;
      if (!s.viewMode) s.viewMode = 'graph';

      s.stack = [];
      s.edgeHighlight = null;
      s.statusText = 'ready';

      if (s.viewMode === 'maze') {
        MazeRenderer.buildMaze(s, COLS, ROWS, startCell, goalCell);
      } else {
        s.adjList = buildGraph();
        s.nodePositions = initPositions(eng.w, eng.h);
        s.nodeStates = Array(NUM_NODES).fill('unvisited');
      }
    },

    generateSteps: function (eng) {
      var s = eng.state;

      if (s.viewMode === 'maze') {
        return generateMazeSteps(s);
      }
      return generateGraphSteps(s);
    },

    executeStep: function (step, eng) {
      var s = eng.state;
      LofiSounds.step(step);

      if (s.viewMode === 'maze') {
        return executeMazeStep(step, eng);
      }
      return executeGraphStep(step, eng);
    },

    draw: function (eng) {
      var s = eng.state;
      var ctx = eng.ctx;
      ctx.clearRect(0, 0, eng.w, eng.h);

      if (s.viewMode === 'maze') {
        drawMazeMode(eng);
      } else {
        drawGraphMode(eng);
      }
    },

    onComplete: function (eng) {
      eng.state.edgeHighlight = null;
    }
  });

  /* ─── Graph mode: steps ─── */

  function generateGraphSteps(s) {
    s.nodeStates = Array(NUM_NODES).fill('unvisited');
    s.stack = [];
    s.edgeHighlight = null;
    s.statusText = 'ready';

    var steps = [];
    var visited = new Set();
    var stk = [0];
    steps.push({ type: 'push', node: 0 });

    while (stk.length > 0) {
      var node = stk.pop();
      steps.push({ type: 'pop', node: node });

      if (visited.has(node)) {
        steps.push({ type: 'backtrack', node: node });
        continue;
      }

      visited.add(node);
      steps.push({ type: 'visit', node: node });

      var neighbors = s.adjList[node].slice().sort(function (a, b) { return b - a; });
      for (var ni = 0; ni < neighbors.length; ni++) {
        var neighbor = neighbors[ni];
        steps.push({ type: 'check-edge', from: node, to: neighbor });
        if (!visited.has(neighbor)) {
          stk.push(neighbor);
          steps.push({ type: 'push', node: neighbor });
        }
      }
    }
    steps.push({ type: 'done' });
    return steps;
  }

  /* ─── Graph mode: execute step ─── */

  function executeGraphStep(step, eng) {
    var s = eng.state;
    return new Promise(function (resolve) {
      if (step.type === 'push') {
        s.stack.push(step.node);
        if (s.nodeStates[step.node] === 'unvisited') {
          s.nodeStates[step.node] = 'on-stack';
        }
        s.edgeHighlight = null;
        eng.draw();
        setTimeout(resolve, eng.getDelay());
      } else if (step.type === 'pop') {
        s.stack.pop();
        s.edgeHighlight = null;
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.3);
      } else if (step.type === 'visit') {
        s.nodeStates[step.node] = 'visiting';
        s.statusText = 'visiting node ' + step.node;
        eng.draw();
        setTimeout(function () {
          s.nodeStates[step.node] = 'visited';
          eng.draw();
          setTimeout(resolve, eng.getDelay() * 0.3);
        }, eng.getDelay() * 0.5);
      } else if (step.type === 'check-edge') {
        s.edgeHighlight = { from: step.from, to: step.to };
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.5);
      } else if (step.type === 'backtrack') {
        s.statusText = 'backtrack (node ' + step.node + ' already visited)';
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.3);
      } else if (step.type === 'done') {
        s.edgeHighlight = null;
        s.statusText = 'complete \u2713';
        eng.draw();
        setTimeout(function () { LofiSounds.complete(); }, 150);
        resolve();
      }
    });
  }

  /* ─── Graph mode: draw ─── */

  function drawGraphMode(eng) {
    var s = eng.state;
    var ctx = eng.ctx;

    var nodeRadius = 22;

    // Edges
    for (var i = 0; i < NUM_NODES; i++) {
      for (var ji = 0; ji < s.adjList[i].length; ji++) {
        var j = s.adjList[i][ji];
        if (j > i) {
          var pi = s.nodePositions[i];
          var pj = s.nodePositions[j];
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);

          var strokeColor = COLORS.border;
          var lineWidth = 1.5;
          if (s.edgeHighlight && ((s.edgeHighlight.from === i && s.edgeHighlight.to === j) ||
              (s.edgeHighlight.from === j && s.edgeHighlight.to === i))) {
            strokeColor = COLORS.primary;
            lineWidth = 3;
          }
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      }
    }

    // Nodes
    for (var i = 0; i < NUM_NODES; i++) {
      var p = s.nodePositions[i];
      var state = s.nodeStates[i];

      var fillColor = COLORS.surface;
      var borderColor = COLORS.border;
      var textColor = COLORS.textMuted;
      var glow = false;

      if (state === 'on-stack') {
        fillColor = COLORS.accent; borderColor = COLORS.accent; textColor = COLORS.bg; glow = true;
      } else if (state === 'visiting') {
        fillColor = COLORS.primary; borderColor = COLORS.primary; textColor = COLORS.bg; glow = true;
      } else if (state === 'visited') {
        fillColor = COLORS.success; borderColor = COLORS.success; textColor = COLORS.bg;
      }

      CanvasUtils.drawNode(ctx, p.x, p.y, nodeRadius, {
        fill: fillColor,
        stroke: borderColor,
        glow: glow && fillColor,
        label: i,
        labelColor: textColor
      });
    }

    // Stack display (right side)
    drawStackDisplay(eng);

    // Status
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('[graph]  nodes=' + NUM_NODES + '  |  ' + s.statusText, 20, 20);
  }

  /* ─── Maze mode: steps ─── */

  function generateMazeSteps(s) {
    // Reset maze cell states
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (s.mazeGrid[r][c] === 1) {
          s.mazeCellStates[r][c] = 'wall';
        } else {
          s.mazeCellStates[r][c] = 'empty';
        }
      }
    }
    s.mazeCellStates[startCell.r][startCell.c] = 'start';
    s.mazeCellStates[goalCell.r][goalCell.c] = 'goal';
    s.stack = [];
    s.statusText = 'ready';

    var steps = [];
    var visited = {};
    var cameFrom = {};
    var stk = [startCell];

    var startKey = MazeRenderer.cellKey(startCell.r, startCell.c, COLS);
    visited[startKey] = true;
    steps.push({ type: 'push', r: startCell.r, c: startCell.c });
    steps.push({ type: 'visit', r: startCell.r, c: startCell.c });

    var found = false;

    while (stk.length > 0) {
      var cell = stk.pop();
      steps.push({ type: 'pop', r: cell.r, c: cell.c });

      var cellKey = MazeRenderer.cellKey(cell.r, cell.c, COLS);

      if (cell.r === goalCell.r && cell.c === goalCell.c) {
        // Reconstruct path
        var path = [];
        var cur = cellKey;
        while (cur !== undefined) {
          var pr = Math.floor(cur / COLS);
          var pc = cur % COLS;
          path.unshift({ r: pr, c: pc });
          cur = cameFrom[cur];
        }
        steps.push({ type: 'path', cells: path });
        found = true;
        break;
      }

      var neighbors = MazeRenderer.getNeighbors(s, cell.r, cell.c, COLS, ROWS);
      for (var ni = 0; ni < neighbors.length; ni++) {
        var nb = neighbors[ni];
        var nbKey = MazeRenderer.cellKey(nb.r, nb.c, COLS);
        steps.push({ type: 'check-edge', fromR: cell.r, fromC: cell.c, toR: nb.r, toC: nb.c });

        if (visited[nbKey]) {
          steps.push({ type: 'backtrack', r: nb.r, c: nb.c });
        } else {
          visited[nbKey] = true;
          cameFrom[nbKey] = cellKey;
          stk.push(nb);
          steps.push({ type: 'push', r: nb.r, c: nb.c });
          steps.push({ type: 'visit', r: nb.r, c: nb.c });
        }
      }
    }

    if (!found) {
      steps.push({ type: 'no-path' });
    }
    steps.push({ type: 'done' });
    return steps;
  }

  /* ─── Maze mode: execute step ─── */

  function executeMazeStep(step, eng) {
    var s = eng.state;
    return new Promise(function (resolve) {
      if (step.type === 'push') {
        s.stack.push({ r: step.r, c: step.c });
        var cs = s.mazeCellStates[step.r][step.c];
        if (cs !== 'start' && cs !== 'goal') {
          s.mazeCellStates[step.r][step.c] = 'on-stack';
        }
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.4);
      } else if (step.type === 'pop') {
        s.stack.pop();
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.2);
      } else if (step.type === 'visit') {
        var cs = s.mazeCellStates[step.r][step.c];
        if (cs !== 'start' && cs !== 'goal') {
          s.mazeCellStates[step.r][step.c] = 'visited';
        }
        s.statusText = 'visiting (' + step.r + ',' + step.c + ')';
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.5);
      } else if (step.type === 'check-edge') {
        s.statusText = 'check (' + step.fromR + ',' + step.fromC + ') \u2192 (' + step.toR + ',' + step.toC + ')';
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.3);
      } else if (step.type === 'backtrack') {
        s.statusText = 'backtrack (' + step.r + ',' + step.c + ') already visited';
        eng.draw();
        setTimeout(resolve, eng.getDelay() * 0.2);
      } else if (step.type === 'path') {
        var cells = step.cells;
        var idx = 0;
        function animateNext() {
          if (idx >= cells.length) {
            s.statusText = 'path found! length=' + cells.length;
            eng.draw();
            resolve();
            return;
          }
          var cell = cells[idx];
          var cs = s.mazeCellStates[cell.r][cell.c];
          if (cs !== 'start' && cs !== 'goal') {
            s.mazeCellStates[cell.r][cell.c] = 'path';
          }
          idx++;
          eng.draw();
          setTimeout(animateNext, eng.getDelay() * 0.3);
        }
        animateNext();
      } else if (step.type === 'no-path') {
        s.statusText = 'no path exists';
        eng.draw();
        setTimeout(resolve, eng.getDelay());
      } else if (step.type === 'done') {
        if (s.statusText.indexOf('path') === -1) {
          s.statusText = 'complete \u2713';
        }
        eng.draw();
        setTimeout(function () { LofiSounds.complete(); }, 150);
        resolve();
      }
    });
  }

  /* ─── Maze mode: draw ─── */

  function drawMazeMode(eng) {
    var s = eng.state;
    var ctx = eng.ctx;

    // Draw maze grid (leave room on right for stack)
    MazeRenderer.drawMaze(eng, s, {
      cols: COLS,
      rows: ROWS,
      startCell: startCell,
      goalCell: goalCell,
      statusText: '[maze]  ' + s.statusText
    });

    // Stack display (right side)
    drawStackDisplay(eng);
  }

  /* ─── Shared stack display ─── */

  function drawStackDisplay(eng) {
    var s = eng.state;
    var ctx = eng.ctx;

    var stackX = eng.w - 50;
    var circR = 14;
    var spacing = 34;
    var topY = 60;

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('stack', stackX, 40);

    for (var i = 0; i < s.stack.length; i++) {
      var idx = s.stack.length - 1 - i;
      var cy = topY + i * spacing;
      if (cy + circR > eng.h - 30) break;

      var item = s.stack[idx];
      var label;
      if (typeof item === 'object') {
        label = item.r + ',' + item.c;
      } else {
        label = item;
      }

      CanvasUtils.drawNode(ctx, stackX, cy, circR, {
        fill: COLORS.accent,
        label: label,
        labelColor: COLORS.bg,
        labelFont: 'bold ' + (typeof item === 'object' ? '9' : '11') + 'px JetBrains Mono, monospace'
      });
    }
  }

  /* ─── Manual control wiring ─── */

  var btnPlay = document.getElementById('btnPlay');
  var btnStep = document.getElementById('btnStep');
  var btnReset = document.getElementById('btnReset');
  var speedSlider = document.getElementById('speedSlider');
  var sizeSlider = document.getElementById('sizeSlider');

  if (btnPlay) btnPlay.addEventListener('click', eng.play);
  if (btnStep) btnStep.addEventListener('click', eng.step);
  if (btnReset) btnReset.addEventListener('click', function () { eng.generateData(eng.n); });
  if (speedSlider) speedSlider.addEventListener('input', function (e) { eng.speed = parseInt(e.target.value); });

  /* ─── View toggle ─── */

  var viewBtn = document.getElementById('btnView');
  if (viewBtn) {
    viewBtn.addEventListener('click', function () {
      var s = eng.state;
      s.viewMode = s.viewMode === 'graph' ? 'maze' : 'graph';
      viewBtn.textContent = s.viewMode === 'graph' ? '\u2591 Maze' : '\u25CE Graph';
      eng.generateData(eng.n);
    });
  }

  /* ─── Resize handler ─── */

  window.addEventListener('resize', function () {
    var s = eng.state;
    if (s.viewMode !== 'maze' && s.nodePositions) {
      s.nodePositions = initPositions(eng.w, eng.h);
    }
  });
})();
