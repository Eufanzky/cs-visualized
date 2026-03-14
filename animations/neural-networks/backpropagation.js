  (function () {
    var COLORS = AppColors;

    var layers = [2, 3, 1];

    function sigmoid(x) {
      return 1 / (1 + Math.exp(-x));
    }

    function initNetwork(s) {
      s.weights = [];
      s.biases = [];
      s.activations = [];
      s.gradients = [];
      s.phase = 'idle';
      s.activeDir = 'none';
      s.activeLayer = -1;
      s.iteration = 0;
      s.loss = 0;

      for (var l = 0; l < layers.length; l++) {
        s.activations[l] = new Array(layers[l]).fill(0);
        if (l > 0) {
          s.weights[l] = [];
          s.biases[l] = new Array(layers[l]).fill(0);
          s.gradients[l] = [];
          for (var j = 0; j < layers[l]; j++) {
            s.weights[l][j] = [];
            s.gradients[l][j] = [];
            for (var i = 0; i < layers[l - 1]; i++) {
              s.weights[l][j][i] = (Math.random() - 0.5) * 2;
              s.gradients[l][j][i] = 0;
            }
            s.biases[l][j] = (Math.random() - 0.5) * 0.5;
          }
        }
      }

      s.activations[0][0] = Math.random();
      s.activations[0][1] = Math.random();
      s.target = Math.random() > 0.5 ? 1 : 0;
    }

    function makeSteps(mode) {
      var steps = [];
      if (mode === 'forward' || mode === 'full') {
        for (var l = 1; l < layers.length; l++) {
          steps.push({ type: 'forwardLayer', layer: l });
        }
        steps.push({ type: 'computeLoss' });
      }
      if (mode === 'backward' || mode === 'full') {
        for (var l2 = layers.length - 1; l2 >= 1; l2--) {
          steps.push({ type: 'backwardLayer', layer: l2 });
        }
        steps.push({ type: 'updateWeights' });
      }
      return steps;
    }

    function getNodePositions(eng) {
      var w = eng.w;
      var h = eng.h;
      var positions = [];
      var layerSpacing = (w - 160) / (layers.length - 1);

      for (var l = 0; l < layers.length; l++) {
        positions[l] = [];
        var x = 80 + l * layerSpacing;
        var nodeSpacing = Math.min(80, (h - 120) / (layers[l] + 1));
        var startY = h / 2 - (layers[l] - 1) * nodeSpacing / 2;

        for (var j = 0; j < layers[l]; j++) {
          positions[l][j] = { x: x, y: startY + j * nodeSpacing };
        }
      }
      return positions;
    }

    var eng = AnimationEngine({
      autoWireControls: false,
      playBtnId: 'btnFull',
      playLabel: '\u25B6 Full Step',
      pauseLabel: '\u275A\u275A Pause',

      generateData: function (size, eng) {
        initNetwork(eng.state);
      },

      generateSteps: function (eng) {
        return makeSteps(eng.state._mode || 'full');
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'forwardLayer') {
            s.activeDir = 'forward';
            s.activeLayer = step.layer;
            s.phase = 'forward';

            for (var j = 0; j < layers[step.layer]; j++) {
              var sum = s.biases[step.layer][j];
              for (var i = 0; i < layers[step.layer - 1]; i++) {
                sum += s.weights[step.layer][j][i] * s.activations[step.layer - 1][i];
              }
              s.activations[step.layer][j] = sigmoid(sum);
            }

            eng.draw();
            setTimeout(resolve, eng.getDelay() * 2);
          } else if (step.type === 'computeLoss') {
            s.activeDir = 'none';
            s.activeLayer = -1;
            var output = s.activations[layers.length - 1][0];
            s.loss = 0.5 * (s.target - output) * (s.target - output);
            s.phase = 'loss computed';
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'backwardLayer') {
            s.activeDir = 'backward';
            s.activeLayer = step.layer;
            s.phase = 'backward';

            var L = layers.length - 1;
            var out = s.activations[L][0];
            var dOutput = (out - s.target) * out * (1 - out);

            if (step.layer === L) {
              for (var i2 = 0; i2 < layers[L - 1]; i2++) {
                s.gradients[L][0][i2] = dOutput * s.activations[L - 1][i2];
              }
            } else {
              for (var j2 = 0; j2 < layers[step.layer]; j2++) {
                var a = s.activations[step.layer][j2];
                var upstream = 0;
                for (var k = 0; k < layers[step.layer + 1]; k++) {
                  var gUp = step.layer + 1 === L ? dOutput : 0;
                  upstream += gUp * s.weights[step.layer + 1][k][j2];
                }
                var dHidden = upstream * a * (1 - a);
                for (var i3 = 0; i3 < layers[step.layer - 1]; i3++) {
                  s.gradients[step.layer][j2][i3] = dHidden * s.activations[step.layer - 1][i3];
                }
              }
            }

            eng.draw();
            setTimeout(resolve, eng.getDelay() * 2);
          } else if (step.type === 'updateWeights') {
            s.activeDir = 'none';
            s.activeLayer = -1;
            s.phase = 'weights updated';

            var lr2 = 0.5;
            for (var l = 1; l < layers.length; l++) {
              for (var j3 = 0; j3 < layers[l]; j3++) {
                for (var i4 = 0; i4 < layers[l - 1]; i4++) {
                  s.weights[l][j3][i4] -= lr2 * s.gradients[l][j3][i4];
                }
              }
            }
            s.iteration++;
            s.activations[0][0] = Math.random();
            s.activations[0][1] = Math.random();
            s.target = Math.random() > 0.5 ? 1 : 0;

            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else {
            resolve();
          }
        });
      },

      onComplete: function (eng) {
        eng.state.activeDir = 'none';
        eng.state.activeLayer = -1;
      },

      draw: function (eng) {
        var s = eng.state;
        var ctx = eng.ctx;
        var w = eng.w;
        var h = eng.h;
        ctx.clearRect(0, 0, w, h);

        var pos = getNodePositions(eng);
        var nodeR = 24;

        for (var l = 1; l < layers.length; l++) {
          for (var j = 0; j < layers[l]; j++) {
            for (var i = 0; i < layers[l - 1]; i++) {
              var from = pos[l - 1][i];
              var to = pos[l][j];

              var wt = s.weights[l] ? s.weights[l][j][i] : 0;
              var thickness = Math.min(5, Math.abs(wt) * 2 + 0.5);

              var color = COLORS.border;
              if (s.activeDir === 'forward' && s.activeLayer === l) {
                color = COLORS.primary;
              } else if (s.activeDir === 'backward' && s.activeLayer === l) {
                color = COLORS.error;
              }

              ctx.beginPath();
              ctx.moveTo(from.x + nodeR, from.y);
              ctx.lineTo(to.x - nodeR, to.y);
              ctx.strokeStyle = color;
              ctx.lineWidth = thickness;
              ctx.globalAlpha = 0.6;
              ctx.stroke();
              ctx.globalAlpha = 1;

              var mx = (from.x + to.x) / 2;
              var my = (from.y + to.y) / 2;

              if (s.activeDir === 'backward' && s.activeLayer === l && s.gradients[l]) {
                var grad = s.gradients[l][j] ? s.gradients[l][j][i] : 0;
                ctx.fillStyle = COLORS.error;
                ctx.font = '8px JetBrains Mono, monospace';
                ctx.textAlign = 'center';
                ctx.fillText('g=' + grad.toFixed(3), mx, my - 8);
              }

              ctx.fillStyle = COLORS.textMuted;
              ctx.font = '8px JetBrains Mono, monospace';
              ctx.textAlign = 'center';
              ctx.fillText(wt.toFixed(2), mx, my + 10);
            }
          }
        }

        var layerLabels = ['Input', 'Hidden', 'Output'];
        for (var l2 = 0; l2 < layers.length; l2++) {
          ctx.fillStyle = COLORS.textMuted;
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(layerLabels[Math.min(l2, 2)], pos[l2][0].x, 30);

          for (var j2 = 0; j2 < layers[l2]; j2++) {
            var nx = pos[l2][j2].x;
            var ny = pos[l2][j2].y;
            var act = s.activations[l2][j2];

            var fillColor = COLORS.surface;
            var strokeColor = COLORS.border;
            var glow = false;

            if (s.activeDir === 'forward' && s.activeLayer === l2) {
              fillColor = COLORS.primary; strokeColor = COLORS.primary; glow = true;
            } else if (s.activeDir === 'backward' && s.activeLayer === l2) {
              fillColor = COLORS.error; strokeColor = COLORS.error; glow = true;
            } else if (act > 0) {
              var alpha = Math.min(1, act);
              fillColor = 'rgba(203, 178, 237, ' + (alpha * 0.5) + ')';
              strokeColor = COLORS.primary;
            }

            CanvasUtils.drawNode(ctx, nx, ny, nodeR, {
              fill: fillColor,
              stroke: strokeColor,
              glow: glow ? fillColor : null,
              label: act.toFixed(2),
              labelColor: COLORS.text,
              labelFont: '10px JetBrains Mono, monospace'
            });
          }
        }
        ctx.textBaseline = 'alphabetic';

        var lastPos = pos[layers.length - 1][0];
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('target: ' + s.target, lastPos.x + nodeR + 10, lastPos.y - 10);
        ctx.fillText('loss: ' + s.loss.toFixed(4), lastPos.x + nodeR + 10, lastPos.y + 10);

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('iteration=' + s.iteration + '  |  loss=' + s.loss.toFixed(4) + '  |  ' + s.phase, 20, h - 15);
      }
    });

    function runMode(mode) {
      if (eng.running) {
        eng.running = false;
        eng.updatePlayBtn();
        return;
      }
      eng.state._mode = mode;
      eng.stepQueue = [];
      eng.play();
    }

    // Custom control wiring
    document.getElementById('btnForward').addEventListener('click', function () { runMode('forward'); });
    document.getElementById('btnBackward').addEventListener('click', function () { runMode('backward'); });
    document.getElementById('btnFull').addEventListener('click', function () { runMode('full'); });
    document.getElementById('btnReset').addEventListener('click', function () { eng.generateData(eng.n); });
    document.getElementById('speedSlider').addEventListener('input', function (e) {
      eng.speed = parseInt(e.target.value);
    });
    window.addEventListener('resize', function () { eng.resize(); eng.draw(); });
  })();
