  (function () {
    var COLORS = AppColors;
    // Algorithm-specific colors not in AppColors
    COLORS.pivot = AppColors.type;
    COLORS.wall = AppColors.highlight;
    COLORS.lessThan = AppColors.partitionZone;

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
        s.pivotIndex = -1;
        s.partitionWall = -1;
        s.partitionRange = null;
        s.phaseLabel = '';
      },

      generateSteps: function (engine) {
        var steps = [];
        var a = engine.state.arr.slice();
        var len = a.length;

        function quickSort(low, high) {
          if (low >= high) {
            if (low === high) {
              steps.push({ type: 'sorted', index: low });
            }
            return;
          }
          var p = partition(low, high);
          steps.push({ type: 'sorted', index: p });
          steps.push({ type: 'partition-end' });
          quickSort(low, p - 1);
          quickSort(p + 1, high);
        }

        function partition(low, high) {
          var pivotVal = a[high];
          steps.push({ type: 'pivot', index: high, low: low, high: high });
          var i = low;
          steps.push({ type: 'wall', index: i });

          for (var j = low; j < high; j++) {
            steps.push({ type: 'compare', indices: [j, high] });
            if (a[j] < pivotVal) {
              if (i !== j) {
                steps.push({ type: 'swap', indices: [i, j] });
                var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
              }
              i++;
              steps.push({ type: 'wall', index: i });
            }
          }

          if (i !== high) {
            steps.push({ type: 'swap', indices: [i, high] });
            var tmp = a[i]; a[i] = a[high]; a[high] = tmp;
          }

          return i;
        }

        quickSort(0, len - 1);

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
          if (step.type === 'pivot') {
            s.pivotIndex = step.index;
            s.partitionRange = { low: step.low, high: step.high };
            s.phaseLabel = 'partitioning [' + step.low + '..' + step.high + ']';
            s.comparingIndices = [];
            s.swappingIndices = [];
            engine.draw();
            setTimeout(resolve, engine.getDelay() * 0.5);
          } else if (step.type === 'wall') {
            s.partitionWall = step.index;
            engine.draw();
            resolve();
          } else if (step.type === 'partition-end') {
            s.pivotIndex = -1;
            s.partitionWall = -1;
            s.partitionRange = null;
            s.phaseLabel = '';
            s.comparingIndices = [];
            s.swappingIndices = [];
            engine.draw();
            resolve();
          } else if (step.type === 'compare') {
            s.comparingIndices = step.indices;
            s.swappingIndices = [];
            engine.draw();
            setTimeout(resolve, engine.getDelay());
          } else if (step.type === 'swap') {
            s.comparingIndices = [];
            s.swappingIndices = step.indices;
            engine.draw();
            renderer.animateSwap(engine, s.arr, step.indices, engine.draw).then(function () {
              s.swappingIndices = [];
              engine.draw();
              setTimeout(resolve, engine.getDelay() * 0.3);
            });
          } else if (step.type === 'sorted') {
            s.comparingIndices = [];
            s.swappingIndices = [];
            s.pivotIndex = -1;
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
          if (s.comparingIndices.includes(i) && i !== s.pivotIndex) return { color: COLORS.comparing, glow: true };
          if (i === s.pivotIndex) {
            if (s.viewMode === 'boxes') {
              return { color: COLORS.pivot, glow: true };
            }
            return {
              color: COLORS.pivot, glow: true,
              label: { text: 'P', color: COLORS.pivot, bold: true }
            };
          }
          if (s.sortedIndices.has(i)) return { color: COLORS.sorted };
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
          // Draw overlays BEFORE bars
          var layout = BarRenderer.getBarLayout(engine, engine.n);
          var barWidth = layout.barWidth;
          var gap = layout.gap;
          var padding = layout.padding;

          // Draw "less than pivot" zone background
          if (s.partitionRange && s.partitionWall > s.partitionRange.low) {
            var xStart = padding + s.partitionRange.low * (barWidth + gap) - gap;
            var xEnd = padding + s.partitionWall * (barWidth + gap) - gap / 2;
            ctx.fillStyle = COLORS.lessThan;
            ctx.fillRect(xStart, padding - 10, xEnd - xStart, engine.h - padding * 2 + 20);
          }

          // Draw partition wall indicator
          if (s.partitionWall >= 0 && s.partitionRange) {
            var wallX = padding + s.partitionWall * (barWidth + gap) - gap / 2;
            ctx.strokeStyle = COLORS.wall;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(wallX, padding - 5);
            ctx.lineTo(wallX, engine.h - padding + 5);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = COLORS.wall;
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('wall', wallX, padding - 14);
          }

          BarRenderer.drawBars(engine, { arr: s.arr, colorFn: colorFn });
        }

        var R = s.viewMode === 'boxes' ? BoxRenderer : BarRenderer;
        var status = 'ready';
        if (engine.running) status = s.phaseLabel || 'sorting...';
        if (s.sortedIndices.size === engine.n) status = 'sorted \u2713';
        var modeLabel = s.viewMode === 'boxes' ? '[boxes]' : '[bars]';
        R.drawStatus(engine, modeLabel + '  n=' + engine.n + '  |  ' + status);

        // Info text — pivot-aware
        if (s.pivotIndex >= 0) {
          if (s.comparingIndices.length === 2) {
            var scanIdx = s.comparingIndices[0] === s.pivotIndex ? s.comparingIndices[1] : s.comparingIndices[0];
            R.drawInfo(engine, '[' + scanIdx + '] vs pivot  |  wall at [' + s.partitionWall + ']', COLORS.comparing);
          } else if (s.swappingIndices.length === 2) {
            R.drawInfo(engine, 'swap [' + s.swappingIndices[0] + '] \u2194 [' + s.swappingIndices[1] + ']  |  wall at [' + s.partitionWall + ']', COLORS.swapping);
          } else {
            R.drawInfo(engine, 'pivot [' + s.pivotIndex + '] = ' + Math.round(s.arr[s.pivotIndex] * 100), COLORS.pivot);
          }
        }
      },

      onComplete: function (engine) {
        engine.state.comparingIndices = [];
        engine.state.swappingIndices = [];
        engine.state.pivotIndex = -1;
        engine.state.partitionWall = -1;
        engine.state.partitionRange = null;
        engine.state.phaseLabel = '';
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
