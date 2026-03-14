  (function () {
    var NUM_NODES = 9;

    var COMPONENT_COLORS = [
      '#c8a4d4', '#8fbfb0', '#e4c08a', '#e8b4a8', '#9cc49a',
      '#d48a8a', '#5da3c4', '#d4968e', '#b8a99a'
    ];

    var COLORS = Object.assign({}, AppColors, { node: '#4a403a', edge: '#4a403a' });

    function getEdgeState(s, from, to) {
      return s.edgeStates[from + '-' + to] || s.edgeStates[to + '-' + from] || 'default';
    }

    function setEdgeState(s, from, to, state) {
      var k1 = from + '-' + to;
      var k2 = to + '-' + from;
      if (k1 in s.edgeStates) s.edgeStates[k1] = state;
      else if (k2 in s.edgeStates) s.edgeStates[k2] = state;
      else s.edgeStates[k1] = state;
    }

    AnimationEngine({
      playLabel: '\u25B6 Start',

      generateData: function (size, eng) {
        var s = eng.state;
        s.nodes = [];
        s.edges = [];
        s.edgeStates = {};
        s.nodeComponent = {};
        s.sortedEdges = [];
        s.currentEdgeIdx = -1;
        s.mstWeight = 0;
        s.acceptedCount = 0;

        var w = eng.w;
        var h = eng.h;
        var padding = 70;
        var graphW = w * 0.72;

        var cols = 3;
        var rows = 3;
        var cellW = (graphW - padding * 2) / (cols - 1);
        var cellH = (h - padding * 2) / (rows - 1);

        for (var i = 0; i < NUM_NODES; i++) {
          var row = Math.floor(i / cols);
          var col = i % cols;
          var jitterX = (Math.random() - 0.5) * cellW * 0.3;
          var jitterY = (Math.random() - 0.5) * cellH * 0.3;
          s.nodes.push({
            id: i,
            x: padding + col * cellW + jitterX,
            y: padding + row * cellH + jitterY
          });
          s.nodeComponent[i] = i;
        }

        // Spanning tree for connectivity
        var connected = [0];
        var unconnected = [];
        for (var i = 1; i < NUM_NODES; i++) unconnected.push(i);

        while (unconnected.length > 0) {
          var fi = Math.floor(Math.random() * connected.length);
          var ti = Math.floor(Math.random() * unconnected.length);
          var from = connected[fi];
          var to = unconnected[ti];
          var weight = Math.floor(Math.random() * 9) + 1;
          s.edges.push({ from: from, to: to, weight: weight });
          s.edgeStates[from + '-' + to] = 'default';
          connected.push(to);
          unconnected.splice(ti, 1);
        }

        // Extra edges
        var extra = 5 + Math.floor(Math.random() * 4);
        for (var e = 0; e < extra; e++) {
          var a = Math.floor(Math.random() * NUM_NODES);
          var b = Math.floor(Math.random() * NUM_NODES);
          if (a === b) b = (b + 1) % NUM_NODES;
          var exists = s.edges.some(function (ed) { return (ed.from === a && ed.to === b) || (ed.from === b && ed.to === a); });
          if (!exists) {
            var weight = Math.floor(Math.random() * 9) + 1;
            s.edges.push({ from: a, to: b, weight: weight });
            s.edgeStates[a + '-' + b] = 'default';
          }
        }
      },

      generateSteps: function (eng) {
        var s = eng.state;

        // Reset states for re-run on same graph
        for (var i = 0; i < NUM_NODES; i++) {
          s.nodeComponent[i] = i;
        }
        for (var key in s.edgeStates) {
          s.edgeStates[key] = 'default';
        }
        s.sortedEdges = [];
        s.currentEdgeIdx = -1;
        s.mstWeight = 0;
        s.acceptedCount = 0;

        var steps = [];
        var parent = [];
        var rank = [];
        for (var i = 0; i < NUM_NODES; i++) { parent.push(i); rank.push(0); }

        function find(x) {
          while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
          return x;
        }

        function union(a, b) {
          var ra = find(a);
          var rb = find(b);
          if (ra === rb) return false;
          if (rank[ra] < rank[rb]) parent[ra] = rb;
          else if (rank[ra] > rank[rb]) parent[rb] = ra;
          else { parent[rb] = ra; rank[ra]++; }
          return true;
        }

        var sorted = s.edges.slice().sort(function (a, b) { return a.weight - b.weight; });
        s.sortedEdges = sorted;

        for (var ei = 0; ei < sorted.length; ei++) {
          var edge = sorted[ei];
          steps.push({ type: 'consider-edge', from: edge.from, to: edge.to, weight: edge.weight });

          if (union(edge.from, edge.to)) {
            var componentMap = {};
            for (var i = 0; i < NUM_NODES; i++) {
              componentMap[i] = find(i);
            }
            steps.push({ type: 'accept', from: edge.from, to: edge.to, weight: edge.weight, componentMap: componentMap });
          } else {
            steps.push({ type: 'reject', from: edge.from, to: edge.to });
          }
        }

        steps.push({ type: 'complete' });
        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'consider-edge') {
            setEdgeState(s, step.from, step.to, 'considering');
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'accept') {
            setEdgeState(s, step.from, step.to, 'accepted');
            s.acceptedCount++;
            s.mstWeight += step.weight;
            if (step.componentMap) {
              for (var id in step.componentMap) {
                s.nodeComponent[id] = step.componentMap[id];
              }
            }
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'reject') {
            setEdgeState(s, step.from, step.to, 'rejected');
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.7);
          } else if (step.type === 'complete') {
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

        var nodeRadius = 20;

        // Draw edges
        for (var ei = 0; ei < s.edges.length; ei++) {
          var edge = s.edges[ei];
          var nA = s.nodes[edge.from];
          var nB = s.nodes[edge.to];
          var state = getEdgeState(s, edge.from, edge.to);

          var color = COLORS.edge;
          var lineWidth = 2;
          var dash = [];

          if (state === 'considering') {
            color = COLORS.accent;
            lineWidth = 3;
          } else if (state === 'accepted') {
            color = COLORS.success;
            lineWidth = 3.5;
          } else if (state === 'rejected') {
            color = COLORS.error;
            lineWidth = 2;
            dash = [6, 4];
          }

          ctx.beginPath();
          ctx.setLineDash(dash);
          ctx.moveTo(nA.x, nA.y);
          ctx.lineTo(nB.x, nB.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
          ctx.setLineDash([]);

          var mx = (nA.x + nB.x) / 2;
          var my = (nA.y + nB.y) / 2;
          ctx.fillStyle = COLORS.bg;
          ctx.beginPath();
          ctx.arc(mx, my, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = state === 'considering' ? COLORS.accent : state === 'accepted' ? COLORS.success : state === 'rejected' ? COLORS.error : COLORS.textMuted;
          ctx.font = '11px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(edge.weight, mx, my);
        }

        // Draw nodes
        for (var ni = 0; ni < s.nodes.length; ni++) {
          var node = s.nodes[ni];
          var compIdx = s.nodeComponent[node.id];
          var compColor = COMPONENT_COLORS[compIdx % COMPONENT_COLORS.length];

          CanvasUtils.drawNode(ctx, node.x, node.y, nodeRadius, {
            fill: compColor + '33',
            stroke: compColor,
            glow: compColor,
            label: node.id,
            labelColor: COLORS.text
          });
        }

        // Sorted edge list on the right side
        var listX = w * 0.78;
        var listY = 30;
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('SORTED EDGES', listX, listY);

        if (s.sortedEdges.length > 0) {
          var maxShow = Math.min(s.sortedEdges.length, 16);
          for (var i = 0; i < maxShow; i++) {
            var se = s.sortedEdges[i];
            var state = getEdgeState(s, se.from, se.to);
            var y = listY + 18 + i * 16;

            if (state === 'accepted') ctx.fillStyle = COLORS.success;
            else if (state === 'rejected') ctx.fillStyle = COLORS.error;
            else if (state === 'considering') ctx.fillStyle = COLORS.accent;
            else ctx.fillStyle = COLORS.textMuted;

            var marker = state === 'accepted' ? '\u2713' : state === 'rejected' ? '\u2717' : state === 'considering' ? '\u25B6' : ' ';
            ctx.fillText(marker + ' ' + se.from + '-' + se.to + ' w=' + se.weight, listX, y);
          }
          if (s.sortedEdges.length > maxShow) {
            ctx.fillStyle = COLORS.textMuted;
            ctx.fillText('... +' + (s.sortedEdges.length - maxShow) + ' more', listX, listY + 18 + maxShow * 16);
          }
        }

        // Status
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        var status = 'ready';
        if (eng.running) status = 'running...';
        if (s.acceptedCount === NUM_NODES - 1 && eng.stepQueue.length === 0) status = 'MST complete \u2713  total=' + s.mstWeight;
        ctx.fillText('kruskal | ' + status, 20, 16);
      }
    });
  })();
