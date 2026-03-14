  (function () {
    var NUM_NODES = 8;

    var COLORS = AppColors;

    function addEdge(s, a, b, w) {
      s.edges.push({ from: a, to: b, weight: w });
      s.adjList[a].push({ node: b, weight: w });
      s.adjList[b].push({ node: a, weight: w });
      s.edgeStates[a + '-' + b] = 'default';
      s.edgeStates[b + '-' + a] = 'default';
    }

    function hasEdge(s, a, b) {
      return s.edges.some(function (e) { return (e.from === a && e.to === b) || (e.from === b && e.to === a); });
    }

    function setEdgeState(s, a, b, state) {
      var k1 = a + '-' + b;
      var k2 = b + '-' + a;
      if (k1 in s.edgeStates) s.edgeStates[k1] = state;
      if (k2 in s.edgeStates) s.edgeStates[k2] = state;
    }

    function getEdgeState(s, a, b) {
      var k1 = a + '-' + b;
      var k2 = b + '-' + a;
      return s.edgeStates[k1] || s.edgeStates[k2] || 'default';
    }

    AnimationEngine({
      playLabel: '\u25B6 Start',

      generateData: function (size, eng) {
        var s = eng.state;
        s.nodes = [];
        s.edges = [];
        s.adjList = {};
        s.nodeStates = {};
        s.edgeStates = {};
        s.distLabels = {};

        var w = eng.w;
        var h = eng.h;
        var padding = 60;
        var cx = w / 2;
        var cy = h / 2;

        var positions = [
          [padding + 40, cy - 60],
          [padding + 160, padding + 40],
          [cx - 20, padding + 30],
          [cx + 120, padding + 60],
          [w - padding - 40, cy - 40],
          [w - padding - 140, cy + 100],
          [cx - 40, h - padding - 40],
          [padding + 120, cy + 100],
        ];

        for (var i = 0; i < NUM_NODES; i++) {
          var pos = positions[i] || [padding + Math.random() * (w - 2 * padding), padding + Math.random() * (h - 2 * padding)];
          s.nodes.push({ id: i, x: pos[0], y: pos[1] });
          s.adjList[i] = [];
          s.nodeStates[i] = 'unvisited';
          s.distLabels[i] = i === 0 ? '0' : '\u221e';
        }

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
      },

      generateSteps: function (eng) {
        var s = eng.state;

        // Reset states for re-run on same graph
        for (var i = 0; i < NUM_NODES; i++) {
          s.nodeStates[i] = 'unvisited';
          s.distLabels[i] = i === 0 ? '0' : '\u221e';
        }
        for (var key in s.edgeStates) {
          s.edgeStates[key] = 'default';
        }

        var steps = [];
        var dist = [];
        var finalized = [];
        for (var i = 0; i < NUM_NODES; i++) { dist.push(Infinity); finalized.push(false); }
        dist[0] = 0;

        steps.push({ type: 'visit', node: 0, dist: 0 });

        for (var iter = 0; iter < NUM_NODES; iter++) {
          var u = -1;
          var minD = Infinity;
          for (var i = 0; i < NUM_NODES; i++) {
            if (!finalized[i] && dist[i] < minD) {
              minD = dist[i];
              u = i;
            }
          }
          if (u === -1) break;

          steps.push({ type: 'visit', node: u, dist: dist[u] });

          for (var ni = 0; ni < s.adjList[u].length; ni++) {
            var neighbor = s.adjList[u][ni];
            var v = neighbor.node;
            var w = neighbor.weight;
            if (!finalized[v]) {
              var newDist = dist[u] + w;
              steps.push({ type: 'relax', from: u, to: v, newDist: newDist, oldDist: dist[v] });
              if (newDist < dist[v]) {
                dist[v] = newDist;
                steps.push({ type: 'update-dist', node: v, dist: newDist });
              }
            }
          }

          finalized[u] = true;
          steps.push({ type: 'finalize', node: u, dist: dist[u] });
        }

        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'visit') {
            s.nodeStates[step.node] = 'current';
            s.distLabels[step.node] = step.dist === Infinity ? '\u221e' : String(step.dist);
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'relax') {
            setEdgeState(s, step.from, step.to, 'relaxed');
            eng.draw();
            setTimeout(function () {
              if (step.newDist >= step.oldDist) {
                setEdgeState(s, step.from, step.to, 'default');
                eng.draw();
              }
              resolve();
            }, eng.getDelay());
          } else if (step.type === 'update-dist') {
            s.distLabels[step.node] = String(step.dist);
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.5);
          } else if (step.type === 'finalize') {
            s.nodeStates[step.node] = 'finalized';
            for (var ni = 0; ni < s.adjList[step.node].length; ni++) {
              var neighbor = s.adjList[step.node][ni];
              if (s.nodeStates[neighbor.node] === 'finalized') {
                setEdgeState(s, step.node, neighbor.node, 'finalized');
              }
            }
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.5);
          }
        });
      },

      draw: function (eng) {
        var s = eng.state;
        var ctx = eng.ctx;
        var w = eng.w;
        var h = eng.h;
        ctx.clearRect(0, 0, w, h);

        // Draw edges
        for (var ei = 0; ei < s.edges.length; ei++) {
          var edge = s.edges[ei];
          var nA = s.nodes[edge.from];
          var nB = s.nodes[edge.to];
          var state = getEdgeState(s, edge.from, edge.to);

          var color = COLORS.edge;
          var lineWidth = 2;
          if (state === 'relaxed') {
            color = COLORS.accent;
            lineWidth = 3;
          } else if (state === 'finalized') {
            color = COLORS.success;
            lineWidth = 3;
          }

          ctx.beginPath();
          ctx.moveTo(nA.x, nA.y);
          ctx.lineTo(nB.x, nB.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.stroke();

          var mx = (nA.x + nB.x) / 2;
          var my = (nA.y + nB.y) / 2;
          ctx.fillStyle = COLORS.bg;
          ctx.beginPath();
          ctx.arc(mx, my, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = state === 'relaxed' ? COLORS.accent : state === 'finalized' ? COLORS.success : COLORS.textMuted;
          ctx.font = '11px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(edge.weight, mx, my);
        }

        // Draw nodes
        var nodeRadius = 22;
        for (var ni = 0; ni < s.nodes.length; ni++) {
          var node = s.nodes[ni];
          var state = s.nodeStates[node.id];
          var fillColor = COLORS.node;
          var strokeColor = COLORS.border;
          var glow = false;

          if (state === 'current') {
            fillColor = COLORS.primary;
            strokeColor = COLORS.primary;
            glow = true;
          } else if (state === 'finalized') {
            fillColor = COLORS.success;
            strokeColor = COLORS.success;
            glow = true;
          }

          CanvasUtils.drawNode(ctx, node.x, node.y, nodeRadius, {
            fill: fillColor,
            stroke: strokeColor,
            glow: glow ? fillColor : null,
            label: node.id,
            labelColor: state === 'current' || state === 'finalized' ? COLORS.bg : COLORS.text
          });

          var dist = s.distLabels[node.id];
          ctx.fillStyle = state === 'finalized' ? COLORS.success : COLORS.textMuted;
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.fillText('d=' + dist, node.x, node.y + nodeRadius + 14);
        }

        // Status
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        var status = 'ready';
        if (eng.running) status = 'running...';
        var allFinalized = true;
        for (var i = 0; i < NUM_NODES; i++) {
          if (s.nodeStates[i] !== 'finalized') { allFinalized = false; break; }
        }
        if (allFinalized && eng.stepQueue.length === 0) status = 'complete \u2713';
        ctx.fillText('dijkstra | ' + status, 20, 16);
      }
    });
  })();
