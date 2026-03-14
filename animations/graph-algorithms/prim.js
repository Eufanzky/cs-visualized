  (function () {
    var NUM_NODES = 9;

    var COLORS = Object.assign({}, AppColors, { node: '#4a403a', edge: '#4a403a' });

    function addEdge(s, a, b, w) {
      s.edges.push({ from: a, to: b, weight: w });
      s.adjList[a].push({ node: b, weight: w });
      s.adjList[b].push({ node: a, weight: w });
      s.edgeStates[a + '-' + b] = 'default';
    }

    function hasEdge(s, a, b) {
      return s.edges.some(function (e) { return (e.from === a && e.to === b) || (e.from === b && e.to === a); });
    }

    function getEdgeState(s, from, to) {
      return s.edgeStates[from + '-' + to] || s.edgeStates[to + '-' + from] || 'default';
    }

    function setEdgeState(s, from, to, state) {
      var k1 = from + '-' + to;
      var k2 = to + '-' + from;
      if (k1 in s.edgeStates) s.edgeStates[k1] = state;
      else if (k2 in s.edgeStates) s.edgeStates[k2] = state;
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
        s.mstWeight = 0;

        var w = eng.w;
        var h = eng.h;
        var padding = 60;

        var cols = 3;
        var rows = 3;
        var cellW = (w - padding * 2) / (cols - 1);
        var cellH = (h - padding * 2) / (rows - 1);

        for (var i = 0; i < NUM_NODES; i++) {
          var row = Math.floor(i / cols);
          var col = i % cols;
          var jitterX = (Math.random() - 0.5) * cellW * 0.25;
          var jitterY = (Math.random() - 0.5) * cellH * 0.25;
          s.nodes.push({
            id: i,
            x: padding + col * cellW + jitterX,
            y: padding + row * cellH + jitterY
          });
          s.adjList[i] = [];
          s.nodeStates[i] = 'unvisited';
        }

        // Spanning tree
        var connected = [0];
        var unconnected = [];
        for (var i = 1; i < NUM_NODES; i++) unconnected.push(i);

        while (unconnected.length > 0) {
          var fi = Math.floor(Math.random() * connected.length);
          var ti = Math.floor(Math.random() * unconnected.length);
          var from = connected[fi];
          var to = unconnected[ti];
          var weight = Math.floor(Math.random() * 9) + 1;
          addEdge(s, from, to, weight);
          connected.push(to);
          unconnected.splice(ti, 1);
        }

        // Extra edges
        var extra = 5 + Math.floor(Math.random() * 4);
        for (var e = 0; e < extra; e++) {
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
        }
        for (var key in s.edgeStates) {
          s.edgeStates[key] = 'default';
        }
        s.mstWeight = 0;

        var steps = [];
        var inMST = {};
        var inMSTCount = 0;

        steps.push({ type: 'add-to-mst', node: 0 });
        inMST[0] = true;
        inMSTCount = 1;

        while (inMSTCount < NUM_NODES) {
          var candidates = [];
          for (var u in inMST) {
            u = parseInt(u);
            for (var ni = 0; ni < s.adjList[u].length; ni++) {
              var neighbor = s.adjList[u][ni];
              if (!inMST[neighbor.node]) {
                candidates.push({ from: u, to: neighbor.node, weight: neighbor.weight });
              }
            }
          }

          for (var ci = 0; ci < candidates.length; ci++) {
            var c = candidates[ci];
            steps.push({ type: 'consider-edge', from: c.from, to: c.to, weight: c.weight });
          }

          if (candidates.length === 0) break;

          candidates.sort(function (a, b) { return a.weight - b.weight; });
          var best = candidates[0];

          steps.push({ type: 'select-edge', from: best.from, to: best.to, weight: best.weight });
          steps.push({ type: 'add-to-mst', node: best.to });
          inMST[best.to] = true;
          inMSTCount++;

          steps.push({ type: 'clear-candidates', except: { from: best.from, to: best.to } });
        }

        steps.push({ type: 'complete' });
        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'add-to-mst') {
            s.nodeStates[step.node] = 'mst';
            for (var ni = 0; ni < s.adjList[step.node].length; ni++) {
              var neighbor = s.adjList[step.node][ni];
              if (s.nodeStates[neighbor.node] === 'unvisited') {
                s.nodeStates[neighbor.node] = 'frontier';
              }
            }
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'consider-edge') {
            setEdgeState(s, step.from, step.to, 'candidate');
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.3);
          } else if (step.type === 'select-edge') {
            setEdgeState(s, step.from, step.to, 'mst');
            s.mstWeight += step.weight;
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'clear-candidates') {
            for (var ei = 0; ei < s.edges.length; ei++) {
              var edge = s.edges[ei];
              var state = getEdgeState(s, edge.from, edge.to);
              if (state === 'candidate') {
                setEdgeState(s, edge.from, edge.to, 'default');
              }
            }
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.3);
          } else if (step.type === 'complete') {
            for (var i = 0; i < NUM_NODES; i++) {
              if (s.nodeStates[i] === 'frontier') s.nodeStates[i] = 'mst';
            }
            eng.draw();
            resolve();
          }
        });
      },

      draw: function (eng) {
        var s = eng.state;
        var ctx = eng.ctx;
        var w = eng.w;
        var h = eng.h;
        ctx.clearRect(0, 0, w, h);

        var nodeRadius = 22;

        // Draw edges
        for (var ei = 0; ei < s.edges.length; ei++) {
          var edge = s.edges[ei];
          var nA = s.nodes[edge.from];
          var nB = s.nodes[edge.to];
          var state = getEdgeState(s, edge.from, edge.to);

          var color = COLORS.edge;
          var lineWidth = 2;

          if (state === 'candidate') {
            color = COLORS.accent;
            lineWidth = 2.5;
          } else if (state === 'selected' || state === 'mst') {
            color = COLORS.success;
            lineWidth = 3.5;
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
          ctx.fillStyle = state === 'candidate' ? COLORS.accent : (state === 'selected' || state === 'mst') ? COLORS.success : COLORS.textMuted;
          ctx.font = '11px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(edge.weight, mx, my);
        }

        // Draw nodes
        for (var ni = 0; ni < s.nodes.length; ni++) {
          var node = s.nodes[ni];
          var state = s.nodeStates[node.id];
          var fillColor = COLORS.node;
          var strokeColor = COLORS.border;
          var glow = false;

          if (state === 'mst') {
            fillColor = COLORS.success;
            strokeColor = COLORS.success;
            glow = true;
          } else if (state === 'frontier') {
            fillColor = COLORS.accent;
            strokeColor = COLORS.accent;
            glow = true;
          }

          CanvasUtils.drawNode(ctx, node.x, node.y, nodeRadius, {
            fill: fillColor,
            stroke: strokeColor,
            glow: glow ? fillColor : null,
            label: node.id,
            labelColor: state === 'mst' || state === 'frontier' ? COLORS.bg : COLORS.text
          });
        }

        // Status
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        var allMst = true;
        for (var i = 0; i < NUM_NODES; i++) {
          if (s.nodeStates[i] !== 'mst') { allMst = false; break; }
        }
        var status = 'ready';
        if (eng.running) status = 'running...';
        if (allMst && eng.stepQueue.length === 0) status = 'MST complete \u2713  total=' + s.mstWeight;
        ctx.fillText('prim | ' + status, 20, 16);
      }
    });
  })();
