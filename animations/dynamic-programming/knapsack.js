  (function () {
    var COLORS = AppColors;

    var W = 10;

    function generateItems() {
      var items = [];
      var count = 5;
      for (var i = 0; i < count; i++) {
        items.push({
          weight: Math.floor(Math.random() * 5) + 1,
          value: Math.floor(Math.random() * 10) + 1,
          name: 'Item ' + (i + 1),
        });
      }
      return items;
    }

    AnimationEngine({
      playBtnId: 'btnSolve',
      playLabel: '\u25B6 Solve',
      pauseLabel: '\u275A\u275A Pause',

      generateData: function (size, eng) {
        var s = eng.state;
        s.items = generateItems();
        s.cellStates = {};
        s.cellValues = {};
      },

      generateSteps: function (eng) {
        var s = eng.state;
        s.cellStates = {};
        s.cellValues = {};
        var steps = [];
        var items = s.items;
        var n = items.length;
        var table = [];
        for (var i = 0; i <= n; i++) {
          table[i] = new Array(W + 1).fill(0);
        }

        for (var w = 0; w <= W; w++) {
          steps.push({ type: 'fill', row: 0, col: w, value: 0 });
        }

        for (var i2 = 1; i2 <= n; i2++) {
          var item = items[i2 - 1];
          for (var w2 = 0; w2 <= W; w2++) {
            steps.push({ type: 'current', row: i2, col: w2 });

            if (item.weight <= w2) {
              var skip = table[i2 - 1][w2];
              var include = item.value + table[i2 - 1][w2 - item.weight];
              steps.push({ type: 'compare', row: i2, col: w2, compareCells: [[i2 - 1, w2], [i2 - 1, w2 - item.weight]] });
              table[i2][w2] = Math.max(skip, include);
            } else {
              table[i2][w2] = table[i2 - 1][w2];
              steps.push({ type: 'compare', row: i2, col: w2, compareCells: [[i2 - 1, w2]] });
            }

            steps.push({ type: 'fill', row: i2, col: w2, value: table[i2][w2] });
          }
        }

        var bw = W;
        var optimalPath = [];
        for (var bi = n; bi > 0; bi--) {
          if (table[bi][bw] !== table[bi - 1][bw]) {
            optimalPath.push([bi, bw]);
            bw -= items[bi - 1].weight;
          }
          optimalPath.push([bi - 1, bw]);
        }
        steps.push({ type: 'optimal', cells: optimalPath });

        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          Object.keys(s.cellStates).forEach(function (k) {
            if (s.cellStates[k] === 'current' || s.cellStates[k] === 'comparing') {
              s.cellStates[k] = s.cellValues[k] !== undefined ? 'filled' : undefined;
            }
          });

          if (step.type === 'current') {
            s.cellStates[step.row + ',' + step.col] = 'current';
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.5);
          } else if (step.type === 'compare') {
            s.cellStates[step.row + ',' + step.col] = 'current';
            step.compareCells.forEach(function (pair) {
              s.cellStates[pair[0] + ',' + pair[1]] = 'comparing';
            });
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'fill') {
            var key = step.row + ',' + step.col;
            s.cellValues[key] = step.value;
            s.cellStates[key] = 'filled';
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.3);
          } else if (step.type === 'optimal') {
            step.cells.forEach(function (pair) {
              s.cellStates[pair[0] + ',' + pair[1]] = 'optimal';
            });
            eng.draw();
            setTimeout(resolve, eng.getDelay());
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
        var items = s.items || [];
        ctx.clearRect(0, 0, w, h);

        var n = items.length;
        var rows = n + 1;
        var cols = W + 1;
        var leftMargin = 100;
        var topMargin = 50;
        var cellW = Math.min(32, (w - leftMargin - 40) / cols);
        var cellH = Math.min(32, (h - topMargin - 60) / rows);

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        for (var c = 0; c <= W; c++) {
          ctx.fillText(c, leftMargin + c * cellW + cellW / 2, topMargin - 8);
        }
        ctx.fillText('capacity \u2192', leftMargin + (W + 1) * cellW / 2, topMargin - 24);

        ctx.textAlign = 'right';
        ctx.fillText('(none)', leftMargin - 8, topMargin + cellH / 2 + 4);
        for (var i = 0; i < n; i++) {
          var y = topMargin + (i + 1) * cellH;
          ctx.fillStyle = COLORS.text;
          ctx.fillText('w=' + items[i].weight + ' v=' + items[i].value, leftMargin - 8, y + cellH / 2 + 4);
        }

        for (var r = 0; r <= n; r++) {
          for (var c2 = 0; c2 <= W; c2++) {
            var x = leftMargin + c2 * cellW;
            var y2 = topMargin + r * cellH;
            var key = r + ',' + c2;
            var state = s.cellStates[key];

            var fillColor = COLORS.bg;
            var borderColor = COLORS.border;
            var glow = false;

            if (state === 'current') {
              fillColor = COLORS.primary; borderColor = COLORS.primary; glow = true;
            } else if (state === 'comparing') {
              fillColor = COLORS.accent; borderColor = COLORS.accent; glow = true;
            } else if (state === 'filled') {
              fillColor = COLORS.surface;
            } else if (state === 'optimal') {
              fillColor = COLORS.success; borderColor = COLORS.success; glow = true;
            }

            if (glow) { CanvasUtils.setGlow(ctx, fillColor, 10); }

            ctx.fillStyle = fillColor;
            ctx.fillRect(x + 1, y2 + 1, cellW - 2, cellH - 2);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y2 + 1, cellW - 2, cellH - 2);

            CanvasUtils.clearGlow(ctx);

            if (s.cellValues[key] !== undefined) {
              ctx.fillStyle = (state === 'current' || state === 'optimal') ? COLORS.bg : COLORS.text;
              ctx.font = '10px JetBrains Mono, monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(s.cellValues[key], x + cellW / 2, y2 + cellH / 2);
            }
          }
        }
        ctx.textBaseline = 'alphabetic';

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        var status = 'ready';
        if (eng.running) status = 'solving...';
        if (!eng.running && eng.stepQueue.length === 0 && Object.keys(s.cellValues).length > 0) status = 'solved';
        ctx.fillText(items.length + ' items  |  W=' + W + '  |  ' + status, 20, 20);
      }
    });
  })();
