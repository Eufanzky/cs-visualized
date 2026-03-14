  (function () {
    var COLORS = AppColors;

    var strA = 'ABCBDAB';
    var strB = 'BDCAB';

    AnimationEngine({
      playBtnId: 'btnSolve',
      playLabel: '\u25B6 Solve',
      pauseLabel: '\u275A\u275A Pause',

      generateData: function (size, eng) {
        var s = eng.state;
        s.cellStates = {};
        s.cellValues = {};
      },

      generateSteps: function (eng) {
        var s = eng.state;
        s.cellStates = {};
        s.cellValues = {};
        var steps = [];
        var m = strA.length;
        var n = strB.length;
        var dp = [];

        for (var i = 0; i <= m; i++) {
          dp[i] = new Array(n + 1).fill(0);
        }

        for (var j = 0; j <= n; j++) {
          steps.push({ type: 'fill', row: 0, col: j, value: 0 });
        }
        for (var i2 = 1; i2 <= m; i2++) {
          steps.push({ type: 'fill', row: i2, col: 0, value: 0 });
        }

        for (var i3 = 1; i3 <= m; i3++) {
          for (var j2 = 1; j2 <= n; j2++) {
            steps.push({ type: 'current', row: i3, col: j2 });

            if (strA[i3 - 1] === strB[j2 - 1]) {
              dp[i3][j2] = dp[i3 - 1][j2 - 1] + 1;
              steps.push({ type: 'match', row: i3, col: j2, diagCell: [i3 - 1, j2 - 1], value: dp[i3][j2] });
            } else {
              dp[i3][j2] = Math.max(dp[i3 - 1][j2], dp[i3][j2 - 1]);
              steps.push({ type: 'noMatch', row: i3, col: j2, compareCells: [[i3 - 1, j2], [i3, j2 - 1]], value: dp[i3][j2] });
            }

            steps.push({ type: 'fill', row: i3, col: j2, value: dp[i3][j2] });
          }
        }

        var path = [];
        var bi = m, bj = n;
        while (bi > 0 && bj > 0) {
          if (strA[bi - 1] === strB[bj - 1]) {
            path.push([bi, bj]);
            bi--; bj--;
          } else if (dp[bi - 1][bj] > dp[bi][bj - 1]) {
            bi--;
          } else {
            bj--;
          }
        }
        steps.push({ type: 'backtrack', cells: path });

        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          Object.keys(s.cellStates).forEach(function (k) {
            if (s.cellStates[k] === 'current' || s.cellStates[k] === 'comparing' || s.cellStates[k] === 'match') {
              s.cellStates[k] = s.cellValues[k] !== undefined ? 'filled' : undefined;
            }
          });

          if (step.type === 'current') {
            s.cellStates[step.row + ',' + step.col] = 'current';
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.4);
          } else if (step.type === 'match') {
            s.cellStates[step.row + ',' + step.col] = 'match';
            s.cellStates[step.diagCell[0] + ',' + step.diagCell[1]] = 'comparing';
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'noMatch') {
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
            setTimeout(resolve, eng.getDelay() * 0.2);
          } else if (step.type === 'backtrack') {
            step.cells.forEach(function (pair) {
              s.cellStates[pair[0] + ',' + pair[1]] = 'backtrack';
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
        ctx.clearRect(0, 0, w, h);

        var m = strA.length;
        var n = strB.length;
        var rows = m + 1;
        var cols = n + 1;
        var leftMargin = 60;
        var topMargin = 70;
        var cellW = Math.min(42, (w - leftMargin - 40) / (cols + 1));
        var cellH = Math.min(38, (h - topMargin - 60) / (rows + 1));

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('-', leftMargin + cellW / 2, topMargin - 8);
        for (var j = 0; j < n; j++) {
          ctx.fillStyle = COLORS.accent;
          ctx.fillText(strB[j], leftMargin + (j + 1) * cellW + cellW / 2, topMargin - 8);
        }

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText('B: "' + strB + '"', leftMargin + (n + 1) * cellW / 2, topMargin - 28);

        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.textMuted;
        ctx.fillText('-', leftMargin - 8, topMargin + cellH / 2 + 4);
        for (var i = 0; i < m; i++) {
          ctx.fillStyle = COLORS.primary;
          ctx.fillText(strA[i], leftMargin - 8, topMargin + (i + 1) * cellH + cellH / 2 + 4);
        }

        ctx.save();
        ctx.translate(15, topMargin + (m + 1) * cellH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = COLORS.textMuted;
        ctx.textAlign = 'center';
        ctx.fillText('A: "' + strA + '"', 0, 0);
        ctx.restore();

        for (var r = 0; r <= m; r++) {
          for (var c = 0; c <= n; c++) {
            var x = leftMargin + c * cellW;
            var y = topMargin + r * cellH;
            var key = r + ',' + c;
            var state = s.cellStates[key];

            var fillColor = COLORS.bg;
            var borderColor = COLORS.border;
            var glow = false;

            if (state === 'current') {
              fillColor = COLORS.primary; borderColor = COLORS.primary; glow = true;
            } else if (state === 'match') {
              fillColor = COLORS.success; borderColor = COLORS.success; glow = true;
            } else if (state === 'comparing') {
              fillColor = COLORS.accent; borderColor = COLORS.accent; glow = true;
            } else if (state === 'filled') {
              fillColor = COLORS.surface;
            } else if (state === 'backtrack') {
              fillColor = COLORS.success; borderColor = COLORS.success; glow = true;
            }

            if (glow) { CanvasUtils.setGlow(ctx, fillColor, 10); }

            ctx.fillStyle = fillColor;
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

            CanvasUtils.clearGlow(ctx);

            if (s.cellValues[key] !== undefined) {
              ctx.fillStyle = (state === 'current' || state === 'match' || state === 'backtrack') ? COLORS.bg : COLORS.text;
              ctx.font = '11px JetBrains Mono, monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(s.cellValues[key], x + cellW / 2, y + cellH / 2);
            }
          }
        }
        ctx.textBaseline = 'alphabetic';

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        var status = 'ready';
        if (eng.running) status = 'solving...';
        if (!eng.running && eng.stepQueue.length === 0 && Object.keys(s.cellValues).length > 0) status = 'complete';
        ctx.fillText('LCS  |  ' + status, 20, 20);
      }
    });
  })();
