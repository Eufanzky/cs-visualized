  (function () {
    var COLORS = AppColors;

    var NUM_NODES = 10;

    function addEdge(adjList, a, b) {
      if (!adjList[a].includes(b)) adjList[a].push(b);
      if (!adjList[b].includes(a)) adjList[b].push(a);
    }

    function initPositions(w, h) {
      var cx = w * 0.5;
      var cy = h * 0.38;
      var rx = Math.min(w * 0.32, 200);
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

    var eng = AnimationEngine({
      autoWireControls: true,
      playLabel: '\u25B6 Start BFS',

      generateData: function (size, eng) {
        var s = eng.state;
        s.adjList = buildGraph();
        s.nodePositions = initPositions(eng.w, eng.h);
        s.nodeStates = Array(NUM_NODES).fill('unvisited');
        s.queue = [];
        s.edgeHighlight = null;
        s.statusText = 'ready';
      },

      generateSteps: function (eng) {
        var s = eng.state;
        // Reset visual state for a new run
        s.nodeStates = Array(NUM_NODES).fill('unvisited');
        s.queue = [];
        s.edgeHighlight = null;
        s.statusText = 'ready';

        var steps = [];
        var visited = new Set();
        var q = [0];
        visited.add(0);
        steps.push({ type: 'enqueue', node: 0 });

        while (q.length > 0) {
          var node = q.shift();
          steps.push({ type: 'dequeue', node: node });
          steps.push({ type: 'visit', node: node });

          var neighbors = s.adjList[node].slice().sort(function (a, b) { return a - b; });
          for (var ni = 0; ni < neighbors.length; ni++) {
            var neighbor = neighbors[ni];
            steps.push({ type: 'check-edge', from: node, to: neighbor });
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              q.push(neighbor);
              steps.push({ type: 'enqueue', node: neighbor });
            }
          }
        }
        steps.push({ type: 'done' });
        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'enqueue') {
            s.queue.push(step.node);
            s.nodeStates[step.node] = 'queued';
            s.edgeHighlight = null;
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'dequeue') {
            s.queue.shift();
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
          } else if (step.type === 'done') {
            s.edgeHighlight = null;
            s.statusText = 'complete \u2713';
            eng.draw();
            setTimeout(function () { LofiSounds.complete(); }, 150);
            resolve();
          }
        });
      },

      draw: function (eng) {
        var s = eng.state;
        var ctx = eng.ctx;
        ctx.clearRect(0, 0, eng.w, eng.h);

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

          if (state === 'queued') {
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

        // Queue display
        var queueY = eng.h - 50;
        var circR = 14;
        var spacing = 36;
        var startX = 60;

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('queue:', 12, queueY);

        for (var i = 0; i < s.queue.length; i++) {
          var cx = startX + i * spacing;
          if (cx + circR > eng.w - 20) break;

          CanvasUtils.drawNode(ctx, cx, queueY, circR, {
            fill: COLORS.accent,
            label: s.queue[i],
            labelColor: COLORS.bg,
            labelFont: 'bold 11px JetBrains Mono, monospace'
          });
        }

        // Status
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('nodes=' + NUM_NODES + '  |  ' + s.statusText, 20, 20);
      },

      onComplete: function (eng) {
        eng.state.edgeHighlight = null;
      }
    });

    // Recalculate node positions on resize
    window.addEventListener('resize', function () {
      eng.state.nodePositions = initPositions(eng.w, eng.h);
    });
  })();
