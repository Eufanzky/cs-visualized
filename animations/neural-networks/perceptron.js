  (function () {
    var COLORS = AppColors;

    function makeData() {
      var data = [];
      var angle = Math.random() * Math.PI * 0.5 + Math.PI * 0.25;
      var nx = Math.cos(angle);
      var ny = Math.sin(angle);

      for (var i = 0; i < 20; i++) {
        var x = Math.random() * 2 - 1;
        var y = Math.random() * 2 - 1;
        var side = nx * x + ny * y;

        if (Math.abs(side) < 0.1) { i--; continue; }
        data.push({ x: x, y: y, label: side > 0 ? 1 : 0 });
      }
      return data;
    }

    function predict(s, x, y) {
      var z = s.w1 * x + s.w2 * y + s.bias;
      return z >= 0 ? 1 : 0;
    }

    var eng = AnimationEngine({
      autoWireControls: false,
      playBtnId: 'btnAuto',
      playLabel: '\u25B6 Auto Train',
      pauseLabel: '\u275A\u275A Pause',

      generateData: function (size, eng) {
        var s = eng.state;
        s.w1 = (Math.random() - 0.5) * 0.5;
        s.w2 = (Math.random() - 0.5) * 0.5;
        s.bias = (Math.random() - 0.5) * 0.5;
        s.lr = 0.1;
        s.epoch = 0;
        s.errors = 0;
        s.currentPoint = -1;
        s.trainIndex = 0;
        s.data = makeData();
      },

      generateSteps: function (eng) {
        // Generate enough training steps for up to 100 epochs
        var s = eng.state;
        var steps = [];
        var maxSteps = s.data.length * 100;
        for (var i = 0; i < maxSteps; i++) {
          steps.push({ type: 'train', index: i % s.data.length, epochEnd: ((i + 1) % s.data.length === 0) });
        }
        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'train') {
            var point = s.data[s.trainIndex];
            s.currentPoint = s.trainIndex;
            var output = predict(s, point.x, point.y);
            var err = point.label - output;

            if (err !== 0) {
              s.w1 += s.lr * err * point.x;
              s.w2 += s.lr * err * point.y;
              s.bias += s.lr * err;
              s.errors++;
            }

            s.trainIndex++;
            if (s.trainIndex >= s.data.length) {
              s.trainIndex = 0;
              s.epoch++;
              s.errors = 0;
            }

            eng.draw();

            // Check convergence
            var allCorrect = true;
            for (var i = 0; i < s.data.length; i++) {
              if (predict(s, s.data[i].x, s.data[i].y) !== s.data[i].label) {
                allCorrect = false;
                break;
              }
            }
            if (allCorrect && s.trainIndex === 0) {
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
        var canvasW = eng.w;
        var canvasH = eng.h;
        ctx.clearRect(0, 0, canvasW, canvasH);

        var plotSize = Math.min(canvasW * 0.55, canvasH - 80);
        var plotX = 40;
        var plotY = 40;
        var plotW = plotSize;
        var plotH = plotSize;

        ctx.fillStyle = COLORS.surface;
        ctx.fillRect(plotX, plotY, plotW, plotH);
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(plotX, plotY, plotW, plotH);

        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 0.5;
        for (var gi = 1; gi < 4; gi++) {
          ctx.beginPath();
          ctx.moveTo(plotX + plotW * gi / 4, plotY);
          ctx.lineTo(plotX + plotW * gi / 4, plotY + plotH);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(plotX, plotY + plotH * gi / 4);
          ctx.lineTo(plotX + plotW, plotY + plotH * gi / 4);
          ctx.stroke();
        }

        if (s.w1 !== 0 || s.w2 !== 0) {
          ctx.strokeStyle = COLORS.primary;
          ctx.lineWidth = 2;
          CanvasUtils.setGlow(ctx, COLORS.primary, 10);
          ctx.beginPath();

          if (Math.abs(s.w2) > 0.001) {
            var x0 = -1, x1 = 1;
            var y0 = -(s.w1 * x0 + s.bias) / s.w2;
            var y1_val = -(s.w1 * x1 + s.bias) / s.w2;
            var sx0 = plotX + (x0 + 1) / 2 * plotW;
            var sy0 = plotY + plotH - (y0 + 1) / 2 * plotH;
            var sx1 = plotX + (x1 + 1) / 2 * plotW;
            var sy1 = plotY + plotH - (y1_val + 1) / 2 * plotH;
            ctx.moveTo(sx0, sy0);
            ctx.lineTo(sx1, sy1);
          } else {
            var xv = -s.bias / (s.w1 || 0.001);
            var sx = plotX + (xv + 1) / 2 * plotW;
            ctx.moveTo(sx, plotY);
            ctx.lineTo(sx, plotY + plotH);
          }
          ctx.stroke();
          CanvasUtils.clearGlow(ctx);
        }

        (s.data || []).forEach(function (point, i) {
          var psx = plotX + (point.x + 1) / 2 * plotW;
          var psy = plotY + plotH - (point.y + 1) / 2 * plotH;
          var r = i === s.currentPoint ? 8 : 5;

          ctx.beginPath();
          ctx.arc(psx, psy, r, 0, Math.PI * 2);

          if (point.label === 1) {
            ctx.fillStyle = COLORS.accent;
          } else {
            ctx.fillStyle = COLORS.primary;
          }

          if (i === s.currentPoint) {
            CanvasUtils.setGlow(ctx, ctx.fillStyle, 15);
          }
          ctx.fill();

          var pred = predict(s, point.x, point.y);
          if (pred !== point.label) {
            ctx.strokeStyle = COLORS.error;
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          CanvasUtils.clearGlow(ctx);
        });

        var diagX = plotX + plotW + 40;
        var diagW = canvasW - diagX - 30;
        var diagCenterY = canvasH / 2;

        if (diagW > 100) {
          var nodeR = 22;
          var inputX = diagX + 30;
          var sumX = diagX + diagW * 0.45;
          var actX = diagX + diagW * 0.7;
          var outX = diagX + diagW - 30;
          var inputY1 = diagCenterY - 50;
          var inputY2 = diagCenterY + 50;
          var biasY = diagCenterY - 110;

          function drawConnection(cx1, cy1, cx2, cy2, label, color) {
            ctx.beginPath();
            ctx.moveTo(cx1 + nodeR, cy1);
            ctx.lineTo(cx2 - nodeR, cy2);
            var thickness = Math.min(4, Math.abs(parseFloat(label)) * 3 + 0.5);
            ctx.strokeStyle = color || COLORS.border;
            ctx.lineWidth = thickness;
            ctx.stroke();

            var mx = (cx1 + cx2) / 2;
            var my = (cy1 + cy2) / 2 - 10;
            ctx.fillStyle = COLORS.text;
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, mx, my);
          }

          drawConnection(inputX, inputY1, sumX, diagCenterY, s.w1.toFixed(2), COLORS.accent);
          drawConnection(inputX, inputY2, sumX, diagCenterY, s.w2.toFixed(2), COLORS.accent);

          ctx.beginPath();
          ctx.moveTo(sumX, biasY + nodeR);
          ctx.lineTo(sumX, diagCenterY - nodeR);
          ctx.strokeStyle = COLORS.textMuted;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = COLORS.textMuted;
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText('b=' + s.bias.toFixed(2), sumX + 8, biasY + nodeR + 12);

          ctx.beginPath();
          ctx.moveTo(sumX + nodeR, diagCenterY);
          ctx.lineTo(actX - nodeR, diagCenterY);
          ctx.strokeStyle = COLORS.border;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(actX + nodeR, diagCenterY);
          ctx.lineTo(outX - nodeR, diagCenterY);
          ctx.strokeStyle = COLORS.border;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          function drawPerceptronNode(nx, ny, label, color) {
            CanvasUtils.drawNode(ctx, nx, ny, nodeR, {
              fill: COLORS.surface,
              stroke: color,
              label: label,
              labelColor: color,
              labelFont: '9px JetBrains Mono, monospace'
            });
          }

          drawPerceptronNode(inputX, inputY1, 'x1', COLORS.primary);
          drawPerceptronNode(inputX, inputY2, 'x2', COLORS.primary);
          drawPerceptronNode(sumX, biasY, 'bias', COLORS.textMuted);
          drawPerceptronNode(sumX, diagCenterY, 'sum', COLORS.accent);
          drawPerceptronNode(actX, diagCenterY, 'step', COLORS.text);
          drawPerceptronNode(outX, diagCenterY, 'out', COLORS.success);

          ctx.textBaseline = 'alphabetic';

          ctx.fillStyle = COLORS.textMuted;
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('Perceptron', diagX + diagW / 2, plotY);
        }

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('epoch=' + s.epoch + '  |  lr=' + s.lr.toFixed(2), 20, 20);
      }
    });

    // Custom control wiring
    document.getElementById('btnAuto').addEventListener('click', function () { eng.play(); });
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
