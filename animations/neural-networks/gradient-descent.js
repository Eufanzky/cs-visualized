  (function () {
    var COLORS = AppColors;

    function lossFn(s, x, y) {
      var cosA = Math.cos(s.angle), sinA = Math.sin(s.angle);
      var rx = cosA * (x - s.centerX) + sinA * (y - s.centerY);
      var ry = -sinA * (x - s.centerX) + cosA * (y - s.centerY);
      return s.a * rx * rx + s.b * ry * ry;
    }

    function gradientFn(s, x, y) {
      var cosA = Math.cos(s.angle), sinA = Math.sin(s.angle);
      var rx = cosA * (x - s.centerX) + sinA * (y - s.centerY);
      var ry = -sinA * (x - s.centerX) + cosA * (y - s.centerY);
      var dRx = 2 * s.a * rx;
      var dRy = 2 * s.b * ry;
      var dx = dRx * cosA - dRy * sinA;
      var dy = dRx * sinA + dRy * cosA;
      return { dx: dx, dy: dy };
    }

    function toCanvas(s, eng, x, y) {
      var w = eng.w;
      var h = eng.h;
      var plotSize = Math.min(w - 200, h - 100);
      var plotX = 40;
      var plotY = 40;
      var cx = plotX + (x + 3) / 6 * plotSize;
      var cy = plotY + (y + 3) / 6 * plotSize;
      return { cx: cx, cy: cy };
    }

    var eng = AnimationEngine({
      autoWireControls: false,
      playBtnId: 'btnStart',
      playLabel: '\u25B6 Start',
      pauseLabel: '\u275A\u275A Pause',

      generateData: function (size, eng) {
        var s = eng.state;
        s.lr = 0.06;
        s.iteration = 0;
        s.path = [];
        s.a = 0.5 + Math.random() * 2;
        s.b = 1 + Math.random() * 4;
        s.angle = Math.random() * Math.PI;
        s.centerX = (Math.random() - 0.5) * 2;
        s.centerY = (Math.random() - 0.5) * 2;
        s.posX = (Math.random() - 0.5) * 4;
        s.posY = (Math.random() - 0.5) * 4;
        s.currentLoss = lossFn(s, s.posX, s.posY);
        s.path.push({ x: s.posX, y: s.posY });
      },

      generateSteps: function (eng) {
        var steps = [];
        for (var i = 0; i < 500; i++) {
          steps.push({ type: 'descend' });
        }
        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'descend') {
            var grad = gradientFn(s, s.posX, s.posY);
            s.posX -= s.lr * grad.dx;
            s.posY -= s.lr * grad.dy;
            s.posX = Math.max(-3, Math.min(3, s.posX));
            s.posY = Math.max(-3, Math.min(3, s.posY));
            s.currentLoss = lossFn(s, s.posX, s.posY);
            s.path.push({ x: s.posX, y: s.posY });
            s.iteration++;
            eng.draw();

            if (s.currentLoss <= 0.0001) {
              eng.stepQueue = [];
            }

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

        var plotSize = Math.min(w - 200, h - 100);
        var plotX = 40;
        var plotY = 40;

        var contourLevels = [0.1, 0.5, 1, 2, 4, 7, 11, 16, 22, 30];
        var contourColors = [
          '#1a2a1a', '#1f3020', '#243626', '#2a3d2c',
          '#304433', '#364b3a', '#3d5341', '#445b49',
          '#4b6350', '#526b58',
        ];

        var resolution = 3;
        for (var px = plotX; px < plotX + plotSize; px += resolution) {
          for (var py = plotY; py < plotY + plotSize; py += resolution) {
            var x = (px - plotX) / plotSize * 6 - 3;
            var y = (py - plotY) / plotSize * 6 - 3;
            var l = lossFn(s, x, y);

            var colorIdx = contourLevels.length - 1;
            for (var i = 0; i < contourLevels.length; i++) {
              if (l < contourLevels[i]) { colorIdx = i; break; }
            }

            ctx.fillStyle = contourColors[Math.min(colorIdx, contourColors.length - 1)];
            ctx.fillRect(px, py, resolution, resolution);
          }
        }

        ctx.lineWidth = 0.5;
        for (var level = 0; level < contourLevels.length; level++) {
          var threshold = contourLevels[level];
          ctx.strokeStyle = 'rgba(179, 228, 165, 0.3)';

          var cStep = 4;
          for (var cpx = plotX; cpx < plotX + plotSize - cStep; cpx += cStep) {
            for (var cpy = plotY; cpy < plotY + plotSize - cStep; cpy += cStep) {
              var x1 = (cpx - plotX) / plotSize * 6 - 3;
              var y1 = (cpy - plotY) / plotSize * 6 - 3;
              var x2 = ((cpx + cStep) - plotX) / plotSize * 6 - 3;
              var y2 = ((cpy + cStep) - plotY) / plotSize * 6 - 3;

              var l00 = lossFn(s, x1, y1);
              var l10 = lossFn(s, x2, y1);
              var l01 = lossFn(s, x1, y2);

              if ((l00 < threshold) !== (l10 < threshold)) {
                var t = (threshold - l00) / (l10 - l00);
                var ccx = cpx + t * cStep;
                ctx.beginPath();
                ctx.arc(ccx, cpy, 0.5, 0, Math.PI * 2);
                ctx.stroke();
              }
              if ((l00 < threshold) !== (l01 < threshold)) {
                var t2 = (threshold - l00) / (l01 - l00);
                var ccy = cpy + t2 * cStep;
                ctx.beginPath();
                ctx.arc(cpx, ccy, 0.5, 0, Math.PI * 2);
                ctx.stroke();
              }
            }
          }
        }

        var path = s.path || [];
        if (path.length > 1) {
          ctx.strokeStyle = COLORS.accent;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          var start = toCanvas(s, eng, path[0].x, path[0].y);
          ctx.moveTo(start.cx, start.cy);
          for (var pi = 1; pi < path.length; pi++) {
            var p = toCanvas(s, eng, path[pi].x, path[pi].y);
            ctx.lineTo(p.cx, p.cy);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;

          for (var di = 0; di < path.length; di++) {
            var dp = toCanvas(s, eng, path[di].x, path[di].y);
            var alpha = 0.3 + 0.7 * (di / path.length);
            ctx.beginPath();
            ctx.arc(dp.cx, dp.cy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.accent;
            ctx.globalAlpha = alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        var cur = toCanvas(s, eng, s.posX, s.posY);
        CanvasUtils.setGlow(ctx, COLORS.primary, 20);
        ctx.beginPath();
        ctx.arc(cur.cx, cur.cy, 7, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.primary;
        ctx.fill();
        ctx.strokeStyle = COLORS.text;
        ctx.lineWidth = 2;
        ctx.stroke();
        CanvasUtils.clearGlow(ctx);

        var grad = gradientFn(s, s.posX, s.posY);
        var gradMag = Math.sqrt(grad.dx * grad.dx + grad.dy * grad.dy);
        if (gradMag > 0.01) {
          var arrowLen = Math.min(40, gradMag * 8);
          var arrowDx = -grad.dx / gradMag * arrowLen;
          var arrowDy = -grad.dy / gradMag * arrowLen;

          var adx = arrowDx / 6 * plotSize * 0.3;
          var ady = arrowDy / 6 * plotSize * 0.3;

          ctx.beginPath();
          ctx.moveTo(cur.cx, cur.cy);
          ctx.lineTo(cur.cx + adx, cur.cy + ady);
          ctx.strokeStyle = COLORS.error;
          ctx.lineWidth = 2;
          ctx.stroke();

          var headLen = 8;
          var aAngle = Math.atan2(ady, adx);
          ctx.beginPath();
          ctx.moveTo(cur.cx + adx, cur.cy + ady);
          ctx.lineTo(
            cur.cx + adx - headLen * Math.cos(aAngle - 0.4),
            cur.cy + ady - headLen * Math.sin(aAngle - 0.4)
          );
          ctx.moveTo(cur.cx + adx, cur.cy + ady);
          ctx.lineTo(
            cur.cx + adx - headLen * Math.cos(aAngle + 0.4),
            cur.cy + ady - headLen * Math.sin(aAngle + 0.4)
          );
          ctx.stroke();
        }

        var minPos = toCanvas(s, eng, s.centerX, s.centerY);
        ctx.beginPath();
        ctx.arc(minPos.cx, minPos.cy, 4, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.success;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('min', minPos.cx + 8, minPos.cy + 4);

        var infoX = plotX + plotSize + 30;
        var infoY = plotY + 20;

        if (w - infoX > 100) {
          ctx.fillStyle = COLORS.text;
          ctx.font = '12px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText('Gradient Descent', infoX, infoY);

          ctx.font = '11px JetBrains Mono, monospace';
          ctx.fillStyle = COLORS.textMuted;
          ctx.fillText('iteration: ' + s.iteration, infoX, infoY + 30);

          ctx.fillStyle = COLORS.accent;
          ctx.fillText('loss: ' + s.currentLoss.toFixed(4), infoX, infoY + 55);

          ctx.fillStyle = COLORS.textMuted;
          ctx.fillText('lr: ' + s.lr.toFixed(4), infoX, infoY + 80);

          ctx.fillText('x: ' + s.posX.toFixed(3), infoX, infoY + 110);
          ctx.fillText('y: ' + s.posY.toFixed(3), infoX, infoY + 130);

          var grad2 = gradientFn(s, s.posX, s.posY);
          var gMag = Math.sqrt(grad2.dx * grad2.dx + grad2.dy * grad2.dy);
          ctx.fillStyle = COLORS.error;
          ctx.fillText('|grad|: ' + gMag.toFixed(4), infoX, infoY + 160);

          ctx.fillStyle = COLORS.textMuted;
          ctx.font = '9px JetBrains Mono, monospace';
          if (s.lr > 0.15) {
            ctx.fillStyle = COLORS.error;
            ctx.fillText('High LR: may oscillate', infoX, infoY + 200);
          } else if (s.lr < 0.02) {
            ctx.fillStyle = COLORS.accent;
            ctx.fillText('Low LR: slow convergence', infoX, infoY + 200);
          } else {
            ctx.fillStyle = COLORS.success;
            ctx.fillText('Good LR range', infoX, infoY + 200);
          }
        }

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        var status = 'ready';
        if (eng.running) status = 'optimizing...';
        if (s.currentLoss < 0.001 && !eng.running) status = 'converged';
        ctx.fillText('gradient descent  |  ' + status, 20, h - 15);
      }
    });

    // Custom control wiring
    document.getElementById('btnStart').addEventListener('click', function () { eng.play(); });
    document.getElementById('btnStep').addEventListener('click', function () { eng.step(); });
    document.getElementById('btnReset').addEventListener('click', function () { eng.generateData(eng.n); });
    document.getElementById('speedSlider').addEventListener('input', function (e) {
      eng.speed = parseInt(e.target.value);
    });
    document.getElementById('lrSlider').addEventListener('input', function (e) {
      eng.state.lr = parseInt(e.target.value) / 500;
    });
    window.addEventListener('resize', function () { eng.resize(); eng.draw(); });
  })();
