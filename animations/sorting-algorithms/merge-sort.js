  (function () {
    var COLORS = AppColors;
    // Algorithm-specific colors not in AppColors
    COLORS.mergeLeft = AppColors.highlight;
    COLORS.mergeRight = AppColors.type;
    COLORS.mergeRegion = AppColors.mergeRegion;

    var eng = AnimationEngine({
      autoWireControls: false,

      generateData: function (size, engine) {
        var s = engine.state;
        s.arr = [];
        s.viewMode = s.viewMode || 'bars';
        for (var i = 0; i < size; i++) s.arr.push(Math.random() * 0.85 + 0.1);
        s._boxIntValues = s.arr.map(function (v) { return Math.round(v * 100); });
        s._boxSwapAnim = null;
        s.sortedIndices = new Set();
        s.comparingIndices = [];
        s.swappingIndices = [];
        s.mergeRange = null;
        s.activeHalf = '';
        s.phaseLabel = '';
      },

      generateSteps: function (engine) {
        var steps = [];
        var a = engine.state.arr.slice();
        var len = a.length;

        function mergeSort(left, right) {
          if (right - left <= 1) return;
          var mid = Math.floor((left + right) / 2);
          mergeSort(left, mid);
          mergeSort(mid, right);
          merge(left, mid, right);
        }

        function merge(left, mid, right) {
          steps.push({ type: 'merge-start', left: left, mid: mid, right: right });

          var temp = [];
          var sources = [];
          var i = left, j = mid;

          while (i < mid && j < right) {
            steps.push({ type: 'compare', indices: [i, j] });
            if (a[i] <= a[j]) {
              temp.push(a[i]);
              sources.push('left');
              i++;
            } else {
              temp.push(a[j]);
              sources.push('right');
              j++;
            }
          }
          while (i < mid) {
            temp.push(a[i]);
            sources.push('left');
            i++;
          }
          while (j < right) {
            temp.push(a[j]);
            sources.push('right');
            j++;
          }

          for (var k = 0; k < temp.length; k++) {
            a[left + k] = temp[k];
            steps.push({ type: 'place', index: left + k, value: temp[k], half: sources[k] });
          }

          steps.push({ type: 'merge-end', left: left, right: right });
        }

        mergeSort(0, len);

        for (var i = 0; i < len; i++) {
          steps.push({ type: 'sorted', index: i });
        }

        return steps;
      },

      executeStep: function (step, engine) {
        var s = engine.state;
        var isBoxes = s.viewMode === 'boxes';
        var renderer = isBoxes ? BoxRenderer : BarRenderer;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'merge-start') {
            s.mergeRange = { left: step.left, mid: step.mid, right: step.right };
            s.phaseLabel = 'merging [' + step.left + '..' + (step.right - 1) + ']';
            s.comparingIndices = [];
            s.swappingIndices = [];
            engine.draw();
            setTimeout(resolve, engine.getDelay() * 0.5);
          } else if (step.type === 'merge-end') {
            s.mergeRange = null;
            s.activeHalf = '';
            s.comparingIndices = [];
            s.swappingIndices = [];
            engine.draw();
            resolve();
          } else if (step.type === 'compare') {
            s.comparingIndices = step.indices;
            s.swappingIndices = [];
            engine.draw();
            setTimeout(resolve, engine.getDelay());
          } else if (step.type === 'place') {
            s.comparingIndices = [];
            s.swappingIndices = [step.index];
            s.activeHalf = step.half || '';
            engine.draw();
            renderer.animatePlace(engine, s.arr, step.index, step.value, engine.draw).then(function () {
              if (s._boxIntValues) s._boxIntValues[step.index] = Math.round(step.value * 100);
              s.swappingIndices = [];
              engine.draw();
              setTimeout(resolve, engine.getDelay() * 0.3);
            });
          } else if (step.type === 'sorted') {
            s.comparingIndices = [];
            s.swappingIndices = [];
            s.mergeRange = null;
            s.sortedIndices.add(step.index);
            engine.draw();
            if (s.sortedIndices.size === engine.n) {
              setTimeout(function () { LofiSounds.complete(); }, 150);
            }
            resolve();
          }
        });
      },

      draw: function (engine) {
        var s = engine.state;
        var ctx = engine.ctx;
        ctx.clearRect(0, 0, engine.w, engine.h);

        var colorFn = function (i) {
          if (s.swappingIndices.includes(i)) return { color: COLORS.swapping, glow: true };
          if (s.comparingIndices.includes(i)) return { color: COLORS.comparing, glow: true };
          if (s.sortedIndices.has(i)) return { color: COLORS.sorted };
          // Color bars within merge range as left/right halves
          if (s.mergeRange && i >= s.mergeRange.left && i < s.mergeRange.right) {
            if (i < s.mergeRange.mid) return { color: COLORS.mergeLeft };
            return { color: COLORS.mergeRight };
          }
          return null;
        };

        if (s.viewMode === 'boxes') {
          BoxRenderer.drawBoxes(engine, {
            arr: s.arr,
            intValues: s._boxIntValues,
            colorFn: colorFn,
            swapAnim: s._boxSwapAnim
          });
        } else {
          // Draw merge region overlay BEFORE bars
          if (s.mergeRange) {
            var layout = BarRenderer.getBarLayout(engine, engine.n);
            var barWidth = layout.barWidth;
            var gap = layout.gap;
            var padding = layout.padding;

            var xStart = padding + s.mergeRange.left * (barWidth + gap) - gap;
            var xEnd = padding + (s.mergeRange.right - 1) * (barWidth + gap) + barWidth + gap;
            ctx.fillStyle = COLORS.mergeRegion;
            ctx.fillRect(xStart, padding - 10, xEnd - xStart, engine.h - padding * 2 + 20);

            // Divider between left and right halves
            var midX = padding + s.mergeRange.mid * (barWidth + gap) - gap / 2;
            ctx.strokeStyle = 'rgba(200,164,212,0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(midX, padding - 5);
            ctx.lineTo(midX, engine.h - padding + 5);
            ctx.stroke();
            ctx.setLineDash([]);

            // "left" and "right" labels
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            var leftCenter = padding + ((s.mergeRange.left + s.mergeRange.mid) / 2) * (barWidth + gap);
            var rightCenter = padding + ((s.mergeRange.mid + s.mergeRange.right - 1) / 2) * (barWidth + gap);
            ctx.fillStyle = COLORS.mergeLeft;
            ctx.fillText('left', leftCenter, padding - 14);
            ctx.fillStyle = COLORS.mergeRight;
            ctx.fillText('right', rightCenter, padding - 14);
          }

          BarRenderer.drawBars(engine, { arr: s.arr, colorFn: colorFn });
        }

        var R = s.viewMode === 'boxes' ? BoxRenderer : BarRenderer;
        var status = 'ready';
        if (engine.running) status = s.phaseLabel || 'sorting...';
        if (s.sortedIndices.size === engine.n) status = 'sorted \u2713';
        var modeLabel = s.viewMode === 'boxes' ? '[boxes]' : '[bars]';
        R.drawStatus(engine, modeLabel + '  n=' + engine.n + '  |  ' + status);

        if (s.comparingIndices.length === 2) {
          R.drawInfo(engine, 'comparing left[' + s.comparingIndices[0] + '] & right[' + s.comparingIndices[1] + ']', COLORS.comparing);
        }
        if (s.swappingIndices.length > 0 && !s.comparingIndices.length) {
          var src = s.activeHalf === 'left' ? 'left' : s.activeHalf === 'right' ? 'right' : '';
          R.drawInfo(engine, 'placing from ' + src + ' half \u2192 [' + s.swappingIndices[0] + ']', COLORS.swapping);
        }
      },

      onComplete: function (engine) {
        engine.state.comparingIndices = [];
        engine.state.swappingIndices = [];
      }
    });

    // Wire controls manually to support view toggle
    document.getElementById('btnPlay').addEventListener('click', eng.play);
    document.getElementById('btnStep').addEventListener('click', eng.step);
    document.getElementById('btnReset').addEventListener('click', function () { eng.generateData(eng.n); });
    document.getElementById('speedSlider').addEventListener('input', function (e) {
      eng.speed = parseInt(e.target.value);
    });
    document.getElementById('sizeSlider').addEventListener('input', function (e) {
      eng.generateData(parseInt(e.target.value));
    });

    // View toggle
    var viewBtn = document.getElementById('btnView');
    if (viewBtn) {
      viewBtn.addEventListener('click', function () {
        var s = eng.state;
        s.viewMode = s.viewMode === 'bars' ? 'boxes' : 'bars';
        viewBtn.textContent = s.viewMode === 'bars' ? '\u25A5 Boxes' : '\u2586 Bars';
        eng.generateData(eng.n);
      });
    }

    window.addEventListener('resize', function () { eng.resize(); eng.draw(); });
  })();
