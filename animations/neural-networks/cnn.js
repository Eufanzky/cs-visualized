  (function () {
    var COLORS = AppColors;

    var INPUT_SIZE = 8;
    var KERNEL_SIZE = 3;
    var FEATURE_SIZE = INPUT_SIZE - KERNEL_SIZE + 1;
    var POOL_SIZE = 2;
    var POOLED_SIZE = Math.floor(FEATURE_SIZE / POOL_SIZE);

    function relu(x) { return Math.max(0, x); }

    function valToColor(v, baseColor) {
      if (v === null) return COLORS.bg;
      var intensity = Math.min(1, Math.max(0, v));
      var r1 = parseInt(COLORS.bg.slice(1, 3), 16);
      var g1 = parseInt(COLORS.bg.slice(3, 5), 16);
      var b1 = parseInt(COLORS.bg.slice(5, 7), 16);
      var r2 = parseInt(baseColor.slice(1, 3), 16);
      var g2 = parseInt(baseColor.slice(3, 5), 16);
      var b2 = parseInt(baseColor.slice(5, 7), 16);
      var r = Math.round(r1 + (r2 - r1) * intensity);
      var g = Math.round(g1 + (g2 - g1) * intensity);
      var b = Math.round(b1 + (b2 - b1) * intensity);
      return '#' + [r, g, b].map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    }

    AnimationEngine({
      playBtnId: 'btnForward',
      playLabel: '\u25B6 Forward Pass',
      pauseLabel: '\u275A\u275A Pause',

      generateData: function (size, eng) {
        var s = eng.state;
        s.inputGrid = [];
        for (var r = 0; r < INPUT_SIZE; r++) {
          s.inputGrid[r] = [];
          for (var c = 0; c < INPUT_SIZE; c++) {
            s.inputGrid[r][c] = Math.random();
          }
        }

        s.kernel = [
          [-1, -1, -1],
          [-1,  8, -1],
          [-1, -1, -1],
        ];

        s.featureMap = [];
        for (var r2 = 0; r2 < FEATURE_SIZE; r2++) {
          s.featureMap[r2] = new Array(FEATURE_SIZE).fill(null);
        }

        s.pooledMap = [];
        for (var r3 = 0; r3 < POOLED_SIZE; r3++) {
          s.pooledMap[r3] = new Array(POOLED_SIZE).fill(null);
        }

        s.convPos = { r: -1, c: -1 };
        s.poolPos = { r: -1, c: -1 };
        s.phase = 'idle';
      },

      generateSteps: function (eng) {
        var s = eng.state;
        // Reset feature and pooled maps
        for (var r = 0; r < FEATURE_SIZE; r++) s.featureMap[r] = new Array(FEATURE_SIZE).fill(null);
        for (var r2 = 0; r2 < POOLED_SIZE; r2++) s.pooledMap[r2] = new Array(POOLED_SIZE).fill(null);
        s.phase = 'idle';

        var steps = [];

        for (var cr = 0; cr < FEATURE_SIZE; cr++) {
          for (var cc = 0; cc < FEATURE_SIZE; cc++) {
            var sum = 0;
            for (var kr = 0; kr < KERNEL_SIZE; kr++) {
              for (var kc = 0; kc < KERNEL_SIZE; kc++) {
                sum += s.inputGrid[cr + kr][cc + kc] * s.kernel[kr][kc];
              }
            }
            var val = relu(sum) / 8;
            steps.push({ type: 'conv', r: cr, c: cc, value: Math.min(1, val) });
          }
        }

        for (var pr = 0; pr < POOLED_SIZE; pr++) {
          for (var pc = 0; pc < POOLED_SIZE; pc++) {
            var sr = pr * POOL_SIZE;
            var sc = pc * POOL_SIZE;
            steps.push({ type: 'pool', r: pr, c: pc, sr: sr, sc: sc });
          }
        }

        steps.push({ type: 'done' });
        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'conv') {
            s.phase = 'conv';
            s.convPos = { r: step.r, c: step.c };
            s.featureMap[step.r][step.c] = step.value;
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'pool') {
            s.phase = 'pool';
            s.convPos = { r: -1, c: -1 };
            s.poolPos = { r: step.r, c: step.c };

            var maxVal = -Infinity;
            for (var pr = 0; pr < POOL_SIZE; pr++) {
              for (var pc = 0; pc < POOL_SIZE; pc++) {
                var v = s.featureMap[step.sr + pr] ? s.featureMap[step.sr + pr][step.sc + pc] : 0;
                if (v !== null && v > maxVal) maxVal = v;
              }
            }
            s.pooledMap[step.r][step.c] = maxVal === -Infinity ? 0 : maxVal;

            eng.draw();
            setTimeout(resolve, eng.getDelay() * 1.5);
          } else if (step.type === 'done') {
            s.phase = 'done';
            s.convPos = { r: -1, c: -1 };
            s.poolPos = { r: -1, c: -1 };
            eng.draw();
            resolve();
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

        var inputGrid = s.inputGrid || [];
        var kernel = s.kernel || [];
        var featureMap = s.featureMap || [];
        var pooledMap = s.pooledMap || [];
        var convPos = s.convPos || { r: -1, c: -1 };
        var poolPos = s.poolPos || { r: -1, c: -1 };
        var phase = s.phase || 'idle';

        var cellSize = Math.min(28, (w - 200) / (INPUT_SIZE + FEATURE_SIZE + POOLED_SIZE + KERNEL_SIZE + 8));
        var topY = 80;
        var curX = 30;

        // === INPUT GRID ===
        var inputX = curX;
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Input (' + INPUT_SIZE + 'x' + INPUT_SIZE + ')', inputX + INPUT_SIZE * cellSize / 2, topY - 12);

        for (var r = 0; r < INPUT_SIZE; r++) {
          for (var c = 0; c < INPUT_SIZE; c++) {
            var x = inputX + c * cellSize;
            var y = topY + r * cellSize;

            var highlight = false;
            if (phase === 'conv' && convPos.r >= 0) {
              if (r >= convPos.r && r < convPos.r + KERNEL_SIZE &&
                  c >= convPos.c && c < convPos.c + KERNEL_SIZE) {
                highlight = true;
              }
            }

            ctx.fillStyle = valToColor(inputGrid[r] ? inputGrid[r][c] : 0, '#8fbfb0');
            ctx.fillRect(x, y, cellSize - 1, cellSize - 1);

            if (highlight) {
              ctx.strokeStyle = COLORS.primary;
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
              CanvasUtils.setGlow(ctx, COLORS.primary, 8);
              ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
              CanvasUtils.clearGlow(ctx);
            }
          }
        }

        curX = inputX + INPUT_SIZE * cellSize + 20;

        // === ARROW ===
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        var arrowY = topY + INPUT_SIZE * cellSize / 2;
        ctx.fillText('*', curX + 5, arrowY);
        curX += 20;

        // === KERNEL ===
        var kernelX = curX;
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Kernel (' + KERNEL_SIZE + 'x' + KERNEL_SIZE + ')', kernelX + KERNEL_SIZE * cellSize / 2, topY - 12);

        var kernelTopY = topY + (INPUT_SIZE - KERNEL_SIZE) * cellSize / 2;
        for (var kr = 0; kr < KERNEL_SIZE; kr++) {
          for (var kc = 0; kc < KERNEL_SIZE; kc++) {
            var kx = kernelX + kc * cellSize;
            var ky = kernelTopY + kr * cellSize;
            var kv = (kernel[kr] ? (kernel[kr][kc] + 1) / 9 : 0);
            ctx.fillStyle = valToColor(kv, COLORS.accent);
            ctx.fillRect(kx, ky, cellSize - 1, cellSize - 1);
            ctx.strokeStyle = COLORS.border;
            ctx.lineWidth = 1;
            ctx.strokeRect(kx, ky, cellSize - 1, cellSize - 1);

            if (cellSize > 16 && kernel[kr]) {
              ctx.fillStyle = COLORS.text;
              ctx.font = '8px JetBrains Mono, monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(kernel[kr][kc], kx + cellSize / 2, ky + cellSize / 2);
              ctx.textBaseline = 'alphabetic';
            }
          }
        }

        curX = kernelX + KERNEL_SIZE * cellSize + 20;

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('=', curX + 5, arrowY);
        curX += 20;

        // === FEATURE MAP ===
        var featureX = curX;
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Feature Map (' + FEATURE_SIZE + 'x' + FEATURE_SIZE + ')', featureX + FEATURE_SIZE * cellSize / 2, topY - 12);

        var featureTopY = topY + (INPUT_SIZE - FEATURE_SIZE) * cellSize / 2;
        for (var fr = 0; fr < FEATURE_SIZE; fr++) {
          for (var fc = 0; fc < FEATURE_SIZE; fc++) {
            var fx = featureX + fc * cellSize;
            var fy = featureTopY + fr * cellSize;

            var fHighlight = false;
            if (phase === 'conv' && fr === convPos.r && fc === convPos.c) {
              fHighlight = true;
            }
            if (phase === 'pool' && poolPos.r >= 0) {
              var psr = poolPos.r * POOL_SIZE;
              var psc = poolPos.c * POOL_SIZE;
              if (fr >= psr && fr < psr + POOL_SIZE && fc >= psc && fc < psc + POOL_SIZE) {
                fHighlight = true;
              }
            }

            var fv = featureMap[fr] ? featureMap[fr][fc] : null;
            ctx.fillStyle = fv !== null ? valToColor(fv, COLORS.success) : COLORS.bg;
            ctx.fillRect(fx, fy, cellSize - 1, cellSize - 1);
            ctx.strokeStyle = fHighlight ? COLORS.accent : COLORS.border;
            ctx.lineWidth = fHighlight ? 2 : 0.5;
            ctx.strokeRect(fx, fy, cellSize - 1, cellSize - 1);

            if (fHighlight && fv !== null) {
              CanvasUtils.setGlow(ctx, COLORS.accent, 8);
              ctx.strokeRect(fx, fy, cellSize - 1, cellSize - 1);
              CanvasUtils.clearGlow(ctx);
            }
          }
        }

        curX = featureX + FEATURE_SIZE * cellSize + 20;

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('pool', curX + 10, arrowY - 10);
        ctx.fillText('\u2192', curX + 10, arrowY + 8);
        curX += 30;

        // === POOLED OUTPUT ===
        var poolX = curX;
        var poolCellSize = cellSize * 1.5;
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Pooled (' + POOLED_SIZE + 'x' + POOLED_SIZE + ')', poolX + POOLED_SIZE * poolCellSize / 2, topY - 12);

        var poolTopY = topY + (INPUT_SIZE * cellSize - POOLED_SIZE * poolCellSize) / 2;
        for (var pr2 = 0; pr2 < POOLED_SIZE; pr2++) {
          for (var pc2 = 0; pc2 < POOLED_SIZE; pc2++) {
            var px = poolX + pc2 * poolCellSize;
            var py = poolTopY + pr2 * poolCellSize;

            var pHighlight = phase === 'pool' && poolPos.r === pr2 && poolPos.c === pc2;
            var pv = pooledMap[pr2] ? pooledMap[pr2][pc2] : null;

            ctx.fillStyle = pv !== null ? valToColor(pv, COLORS.primary) : COLORS.bg;
            ctx.fillRect(px, py, poolCellSize - 2, poolCellSize - 2);
            ctx.strokeStyle = pHighlight ? COLORS.primary : COLORS.border;
            ctx.lineWidth = pHighlight ? 2 : 1;
            ctx.strokeRect(px, py, poolCellSize - 2, poolCellSize - 2);

            if (pHighlight) {
              CanvasUtils.setGlow(ctx, COLORS.primary, 12);
              ctx.strokeRect(px, py, poolCellSize - 2, poolCellSize - 2);
              CanvasUtils.clearGlow(ctx);
            }

            if (pv !== null && poolCellSize > 20) {
              ctx.fillStyle = COLORS.text;
              ctx.font = '9px JetBrains Mono, monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(pv.toFixed(2), px + poolCellSize / 2, py + poolCellSize / 2);
              ctx.textBaseline = 'alphabetic';
            }
          }
        }

        // Status
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        var statusText = 'ready';
        if (phase === 'conv') statusText = 'convolving at (' + convPos.r + ',' + convPos.c + ')';
        if (phase === 'pool') statusText = 'max pooling at (' + poolPos.r + ',' + poolPos.c + ')';
        if (phase === 'done') statusText = 'complete';
        ctx.fillText('CNN pipeline  |  ' + statusText, 20, h - 15);
      }
    });
  })();
