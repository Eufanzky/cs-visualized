  (function () {
    var NUM_NODES = 8;

    var COLORS = AppColors;

    function drawArrowhead(ctx, fromX, fromY, toX, toY, radius, color) {
      var angle = Math.atan2(toY - fromY, toX - fromX);
      var tipX = toX - Math.cos(angle) * radius;
      var tipY = toY - Math.sin(angle) * radius;
      var arrowLen = 10;
      var arrowAngle = Math.PI / 7;

      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(
        tipX - arrowLen * Math.cos(angle - arrowAngle),
        tipY - arrowLen * Math.sin(angle - arrowAngle)
      );
      ctx.lineTo(
        tipX - arrowLen * Math.cos(angle + arrowAngle),
        tipY - arrowLen * Math.sin(angle + arrowAngle)
      );
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    AnimationEngine({
      playLabel: '\u25B6 Start',

      generateData: function (size, eng) {
        var s = eng.state;
        s.nodes = [];
        s.edges = [];
        s.adjList = {};
        s.nodeStates = {};
        s.inDegrees = {};
        s.resultOrder = [];

        var w = eng.w;
        var h = eng.h;
        var padding = 70;

        var numLevels = 4;
        var nodesPerLevel = [];
        var remaining = NUM_NODES;
        for (var l = 0; l < numLevels; l++) {
          if (l === numLevels - 1) {
            nodesPerLevel.push(remaining);
          } else {
            var count = Math.max(1, Math.floor(remaining / (numLevels - l)) + (Math.random() > 0.5 ? 1 : 0));
            nodesPerLevel.push(Math.min(count, remaining - (numLevels - l - 1)));
            remaining -= nodesPerLevel[l];
          }
        }

        var nodeIdx = 0;
        var levelAssignment = {};
        for (var l = 0; l < numLevels; l++) {
          for (var n = 0; n < nodesPerLevel[l]; n++) {
            levelAssignment[nodeIdx] = l;
            nodeIdx++;
          }
        }

        var colWidth = (w - padding * 2) / (numLevels - 1);
        var usableH = h - padding * 2 - 60;

        for (var i = 0; i < NUM_NODES; i++) {
          var level = levelAssignment[i];
          var nodesInLevel = nodesPerLevel[level];
          var idxInLevel = 0;
          for (var j = 0; j < i; j++) {
            if (levelAssignment[j] === level) idxInLevel++;
          }
          var levelSpacing = usableH / (nodesInLevel + 1);
          var x = padding + level * colWidth + (Math.random() - 0.5) * 30;
          var y = padding + (idxInLevel + 1) * levelSpacing + (Math.random() - 0.5) * 15;

          s.nodes.push({ id: i, x: x, y: y, level: level });
          s.adjList[i] = [];
          s.nodeStates[i] = 'unvisited';
          s.inDegrees[i] = 0;
        }

        // Create directed edges
        for (var i = 1; i < NUM_NODES; i++) {
          var candidates = [];
          for (var j = 0; j < i; j++) {
            if (levelAssignment[j] <= levelAssignment[i]) {
              candidates.push(j);
            }
          }
          if (candidates.length > 0) {
            var from = candidates[Math.floor(Math.random() * candidates.length)];
            s.edges.push({ from: from, to: i });
            s.adjList[from].push(i);
            s.inDegrees[i]++;
          }
        }

        // Extra edges
        var extraCount = 3 + Math.floor(Math.random() * 4);
        for (var e = 0; e < extraCount; e++) {
          var from = Math.floor(Math.random() * (NUM_NODES - 1));
          var to = from + 1 + Math.floor(Math.random() * (NUM_NODES - from - 1));
          if (to < NUM_NODES) {
            var exists = s.edges.some(function (ed) { return ed.from === from && ed.to === to; });
            if (!exists) {
              s.edges.push({ from: from, to: to });
              s.adjList[from].push(to);
              s.inDegrees[to]++;
            }
          }
        }
      },

      generateSteps: function (eng) {
        var s = eng.state;

        // Reset states for re-run on same graph
        for (var i = 0; i < NUM_NODES; i++) {
          s.nodeStates[i] = 'unvisited';
          s.inDegrees[i] = 0;
        }
        for (var ei = 0; ei < s.edges.length; ei++) {
          s.inDegrees[s.edges[ei].to]++;
        }
        s.resultOrder = [];

        var steps = [];
        var deg = {};
        for (var i = 0; i < NUM_NODES; i++) deg[i] = 0;

        for (var ei = 0; ei < s.edges.length; ei++) {
          deg[s.edges[ei].to]++;
        }

        for (var i = 0; i < NUM_NODES; i++) {
          steps.push({ type: 'compute-indegree', node: i, degree: deg[i] });
        }

        var queue = [];
        for (var i = 0; i < NUM_NODES; i++) {
          if (deg[i] === 0) {
            queue.push(i);
            steps.push({ type: 'enqueue', node: i });
          }
        }

        var order = [];
        while (queue.length > 0) {
          var u = queue.shift();
          order.push(u);
          steps.push({ type: 'process', node: u });

          for (var vi = 0; vi < s.adjList[u].length; vi++) {
            var v = s.adjList[u][vi];
            deg[v]--;
            steps.push({ type: 'decrement', node: v, newDegree: deg[v] });
            if (deg[v] === 0) {
              queue.push(v);
              steps.push({ type: 'enqueue', node: v });
            }
          }
        }

        steps.push({ type: 'result', order: order });
        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'compute-indegree') {
            s.inDegrees[step.node] = step.degree;
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.3);
          } else if (step.type === 'enqueue') {
            s.nodeStates[step.node] = 'queued';
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'process') {
            s.nodeStates[step.node] = 'processed';
            s.resultOrder.push(step.node);
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'decrement') {
            s.inDegrees[step.node] = step.newDegree;
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.4);
          } else if (step.type === 'result') {
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
          var fromState = s.nodeStates[edge.from];
          var toState = s.nodeStates[edge.to];

          var color = COLORS.edge;
          var lineWidth = 2;

          if (fromState === 'processed' && toState === 'processed') {
            color = COLORS.success + '66';
            lineWidth = 2;
          } else if (fromState === 'processed') {
            color = COLORS.accent;
            lineWidth = 2.5;
          }

          ctx.beginPath();
          ctx.moveTo(nA.x, nA.y);
          ctx.lineTo(nB.x, nB.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.stroke();

          drawArrowhead(ctx, nA.x, nA.y, nB.x, nB.y, nodeRadius, color);
        }

        // Draw nodes
        for (var ni = 0; ni < s.nodes.length; ni++) {
          var node = s.nodes[ni];
          var state = s.nodeStates[node.id];
          var fillColor = COLORS.node;
          var strokeColor = COLORS.border;
          var glow = false;

          if (state === 'queued') {
            fillColor = COLORS.primary;
            strokeColor = COLORS.primary;
            glow = true;
          } else if (state === 'processed') {
            fillColor = COLORS.success;
            strokeColor = COLORS.success;
            glow = true;
          }

          CanvasUtils.drawNode(ctx, node.x, node.y, nodeRadius, {
            fill: fillColor,
            stroke: strokeColor,
            glow: glow ? fillColor : null,
            label: node.id,
            labelColor: state === 'queued' || state === 'processed' ? COLORS.bg : COLORS.text
          });

          var deg = s.inDegrees[node.id];
          if (state !== 'processed') {
            ctx.fillStyle = deg === 0 ? COLORS.primary : COLORS.textMuted;
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.fillText('in=' + deg, node.x, node.y + nodeRadius + 14);
          }
        }

        // Result order at bottom
        var resultY = h - 35;
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('result: [', 20, resultY);

        if (s.resultOrder.length > 0) {
          var startX = 85;
          for (var i = 0; i < s.resultOrder.length; i++) {
            var rx = startX + i * 36;
            ctx.beginPath();
            ctx.arc(rx, resultY, 13, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.success + '33';
            ctx.fill();
            ctx.strokeStyle = COLORS.success;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = COLORS.success;
            ctx.font = 'bold 11px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.resultOrder[i], rx, resultY);
          }
          ctx.fillStyle = COLORS.textMuted;
          ctx.font = '11px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(']', startX + s.resultOrder.length * 36, resultY);
        } else {
          ctx.fillText(']', 85, resultY);
        }

        // Status
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        var status = 'ready';
        if (eng.running) status = 'running...';
        if (s.resultOrder.length === NUM_NODES && eng.stepQueue.length === 0) status = 'complete \u2713';
        ctx.fillText('topological-sort (kahn) | ' + status, 20, 16);
      }
    });
  })();
