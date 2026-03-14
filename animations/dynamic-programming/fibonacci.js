  (function () {
    var COLORS = AppColors;

    function buildTree(n, depth, parentId, s) {
      var id = s.nodes.length;
      var node = { id: id, value: n, depth: depth, state: 'idle', result: null, x: 0, y: 0 };
      s.nodes.push(node);

      if (parentId !== null) {
        s.edges.push({ from: parentId, to: id });
      }

      if (n > 1) {
        buildTree(n - 1, depth + 1, id, s);
        buildTree(n - 2, depth + 1, id, s);
      }

      return id;
    }

    function layoutTree(eng) {
      var s = eng.state;
      if (s.nodes.length === 0) return;

      var w = eng.w;
      var h = eng.h;
      var memoHeight = 60;
      var topPad = 40;
      var availH = h - memoHeight - topPad - 20;

      var maxDepth = 0;
      s.nodes.forEach(function (n) { if (n.depth > maxDepth) maxDepth = n.depth; });

      var levelHeight = maxDepth > 0 ? availH / (maxDepth + 1) : availH;

      var levels = {};
      s.nodes.forEach(function (n) {
        if (!levels[n.depth]) levels[n.depth] = [];
        levels[n.depth].push(n);
      });

      for (var d = 0; d <= maxDepth; d++) {
        var nodesAtLevel = levels[d] || [];
        var count = nodesAtLevel.length;
        var spacing = w / (count + 1);
        nodesAtLevel.forEach(function (n, i) {
          n.x = spacing * (i + 1);
          n.y = topPad + d * levelHeight + 20;
        });
      }

      for (var pass = 0; pass < 3; pass++) {
        for (var dd = maxDepth; dd >= 0; dd--) {
          var nAtLevel = levels[dd] || [];
          nAtLevel.forEach(function (node) {
            var children = s.edges.filter(function (e) { return e.from === node.id; }).map(function (e) { return s.nodes[e.to]; });
            if (children.length > 0) {
              var avgX = children.reduce(function (sum, c) { return sum + c.x; }, 0) / children.length;
              node.x = avgX;
            }
          });
        }
        for (var dd2 = 0; dd2 <= maxDepth; dd2++) {
          var nAtLevel2 = levels[dd2] || [];
          nAtLevel2.sort(function (a, b) { return a.x - b.x; });
          var minGap = 36;
          for (var i = 1; i < nAtLevel2.length; i++) {
            if (nAtLevel2[i].x - nAtLevel2[i - 1].x < minGap) {
              nAtLevel2[i].x = nAtLevel2[i - 1].x + minGap;
            }
          }
          if (nAtLevel2.length > 0) {
            var totalW = nAtLevel2[nAtLevel2.length - 1].x - nAtLevel2[0].x;
            var offset = (w - totalW) / 2 - nAtLevel2[0].x;
            nAtLevel2.forEach(function (n) { n.x += offset; });
          }
        }
      }
    }

    var eng = AnimationEngine({
      autoWireControls: false,
      playBtnId: 'btnCompute',
      playLabel: '\u25B6 Compute',
      pauseLabel: '\u275A\u275A Pause',
      initialSize: 8,

      generateData: function (size, eng) {
        var s = eng.state;
        s.N = size;
        s.nodes = [];
        s.edges = [];
        s.memoDisplay = {};
        buildTree(s.N, 0, null, s);
        layoutTree(eng);
      },

      generateSteps: function (eng) {
        var s = eng.state;
        var steps = [];
        var m = {};

        function fib(n, nodeIdx) {
          steps.push({ type: 'computing', nodeId: nodeIdx });

          if (n <= 1) {
            steps.push({ type: 'complete', nodeId: nodeIdx, result: n, memoKey: n });
            m[n] = n;
            return n;
          }

          if (m[n] !== undefined) {
            steps.push({ type: 'cached', nodeId: nodeIdx, result: m[n], memoKey: n });
            return m[n];
          }

          var childEdges = s.edges.filter(function (e) { return e.from === nodeIdx; });
          var leftChild = childEdges[0] ? childEdges[0].to : null;
          var rightChild = childEdges[1] ? childEdges[1].to : null;

          var left = fib(n - 1, leftChild);
          var right = fib(n - 2, rightChild);
          var result = left + right;
          m[n] = result;
          steps.push({ type: 'complete', nodeId: nodeIdx, result: result, memoKey: n });
          return result;
        }

        fib(s.N, 0);
        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          var node = s.nodes[step.nodeId];
          if (!node) { resolve(); return; }

          if (step.type === 'computing') {
            node.state = 'computing';
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'cached') {
            node.state = 'cached';
            node.result = step.result;
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'complete') {
            node.state = 'complete';
            node.result = step.result;
            s.memoDisplay[step.memoKey] = step.result;
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.5);
          } else {
            resolve();
          }
        });
      },

      draw: function (eng) {
        var s = eng.state;
        var ctx = eng.ctx;
        var w = eng.w;
        var h = eng.h;
        var N = s.N;
        ctx.clearRect(0, 0, w, h);

        // Draw edges
        s.edges.forEach(function (e) {
          var from = s.nodes[e.from];
          var to = s.nodes[e.to];
          if (!from || !to) return;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y + 14);
          ctx.lineTo(to.x, to.y - 14);
          ctx.strokeStyle = COLORS.border;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });

        // Draw nodes
        var radius = 14;
        s.nodes.forEach(function (node) {
          var fillColor = COLORS.surface;
          var strokeColor = COLORS.border;
          var textColor = COLORS.textMuted;
          var glow = false;

          if (node.state === 'computing') {
            fillColor = COLORS.primary;
            strokeColor = COLORS.primary;
            textColor = COLORS.bg;
            glow = true;
          } else if (node.state === 'cached') {
            fillColor = COLORS.accent;
            strokeColor = COLORS.accent;
            textColor = COLORS.bg;
            glow = true;
          } else if (node.state === 'complete') {
            fillColor = COLORS.success;
            strokeColor = COLORS.success;
            textColor = COLORS.bg;
          }

          CanvasUtils.drawNode(ctx, node.x, node.y, radius, {
            fill: fillColor,
            stroke: strokeColor,
            glow: glow ? fillColor : null,
            label: 'f(' + node.value + ')',
            labelColor: textColor,
            labelFont: '10px JetBrains Mono, monospace'
          });

          if (node.result !== null) {
            ctx.fillStyle = COLORS.text;
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.fillText('=' + node.result, node.x, node.y - radius - 8);
          }
        });

        // Draw memo table at bottom
        var memoY = h - 50;
        var cellW = Math.min(40, (w - 80) / (N + 1));
        var startX = (w - cellW * (N + 1)) / 2;

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('memo table', w / 2, memoY - 14);

        for (var i = 0; i <= N; i++) {
          var x = startX + i * cellW;
          ctx.fillStyle = s.memoDisplay[i] !== undefined ? COLORS.surface : COLORS.bg;
          ctx.strokeStyle = COLORS.border;
          ctx.lineWidth = 1;
          ctx.fillRect(x, memoY, cellW - 2, 24);
          ctx.strokeRect(x, memoY, cellW - 2, 24);

          ctx.fillStyle = COLORS.textMuted;
          ctx.font = '8px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(i, x + (cellW - 2) / 2, memoY + 34);

          if (s.memoDisplay[i] !== undefined) {
            ctx.fillStyle = COLORS.accent;
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.fillText(s.memoDisplay[i], x + (cellW - 2) / 2, memoY + 14);
          }
        }

        // Status
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        var status = 'ready';
        if (eng.running) status = 'computing...';
        if (!eng.running && Object.keys(s.memoDisplay).length > 0) status = 'complete';
        ctx.fillText('n=' + N + '  |  ' + status, 40, 20);
      }
    });

    // Custom control wiring (non-standard button IDs and nSlider)
    document.getElementById('btnCompute').addEventListener('click', function () { eng.play(); });
    document.getElementById('btnStep').addEventListener('click', function () { eng.step(); });
    document.getElementById('btnReset').addEventListener('click', function () { eng.generateData(eng.n); });
    document.getElementById('speedSlider').addEventListener('input', function (e) {
      eng.speed = parseInt(e.target.value);
    });
    document.getElementById('nSlider').addEventListener('input', function (e) {
      eng.generateData(parseInt(e.target.value));
    });
    window.addEventListener('resize', function () { eng.resize(); layoutTree(eng); eng.draw(); });
  })();
