  (function () {
    var COLORS = AppColors;
    // Algorithm-specific colors not in AppColors
    COLORS.pivot = AppColors.type;
    COLORS.wall = AppColors.highlight;
    COLORS.lessThan = 'rgba(143,191,176,0.15)';

    AnimationEngine({
      generateData: function (size, eng) {
        var s = eng.state;
        s.arr = [];
        for (var i = 0; i < size; i++) s.arr.push(Math.random() * 0.85 + 0.1);
        s.sortedIndices = new Set();
        s.comparingIndices = [];
        s.swappingIndices = [];
        s.pivotIndex = -1;
        s.partitionWall = -1;
        s.partitionRange = null;
        s.phaseLabel = '';
      },

      generateSteps: function (eng) {
        var steps = [];
        var a = eng.state.arr.slice();
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

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'pivot') {
            s.pivotIndex = step.index;
            s.partitionRange = { low: step.low, high: step.high };
            s.phaseLabel = 'partitioning [' + step.low + '..' + step.high + ']';
            s.comparingIndices = [];
            s.swappingIndices = [];
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.5);
          } else if (step.type === 'wall') {
            s.partitionWall = step.index;
            eng.draw();
            resolve();
          } else if (step.type === 'partition-end') {
            s.pivotIndex = -1;
            s.partitionWall = -1;
            s.partitionRange = null;
            s.phaseLabel = '';
            s.comparingIndices = [];
            s.swappingIndices = [];
            eng.draw();
            resolve();
          } else if (step.type === 'compare') {
            s.comparingIndices = step.indices;
            s.swappingIndices = [];
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'swap') {
            s.comparingIndices = [];
            s.swappingIndices = step.indices;
            eng.draw();
            BarRenderer.animateSwap(eng, s.arr, step.indices, eng.draw).then(function () {
              s.swappingIndices = [];
              eng.draw();
              setTimeout(resolve, eng.getDelay() * 0.3);
            });
          } else if (step.type === 'sorted') {
            s.comparingIndices = [];
            s.swappingIndices = [];
            s.pivotIndex = -1;
            s.sortedIndices.add(step.index);
            eng.draw();
            if (s.sortedIndices.size === eng.n) {
              setTimeout(function () { LofiSounds.complete(); }, 150);
            }
            resolve();
          }
        });
      },

      draw: function (eng) {
        var s = eng.state;
        var ctx = eng.ctx;
        ctx.clearRect(0, 0, eng.w, eng.h);

        // Draw overlays BEFORE bars
        var layout = BarRenderer.getBarLayout(eng, eng.n);
        var barWidth = layout.barWidth;
        var gap = layout.gap;
        var padding = layout.padding;

        // Draw "less than pivot" zone background
        if (s.partitionRange && s.partitionWall > s.partitionRange.low) {
          var xStart = padding + s.partitionRange.low * (barWidth + gap) - gap;
          var xEnd = padding + s.partitionWall * (barWidth + gap) - gap / 2;
          ctx.fillStyle = COLORS.lessThan;
          ctx.fillRect(xStart, padding - 10, xEnd - xStart, eng.h - padding * 2 + 20);
        }

        // Draw partition wall indicator
        if (s.partitionWall >= 0 && s.partitionRange) {
          var wallX = padding + s.partitionWall * (barWidth + gap) - gap / 2;
          ctx.strokeStyle = COLORS.wall;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(wallX, padding - 5);
          ctx.lineTo(wallX, eng.h - padding + 5);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = COLORS.wall;
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('wall', wallX, padding - 14);
        }

        BarRenderer.drawBars(eng, {
          arr: s.arr,
          colorFn: function (i) {
            if (s.swappingIndices.includes(i)) return { color: COLORS.swapping, glow: true };
            if (s.comparingIndices.includes(i) && i !== s.pivotIndex) return { color: COLORS.comparing, glow: true };
            if (i === s.pivotIndex) {
              return {
                color: COLORS.pivot, glow: true,
                label: { text: 'P', color: COLORS.pivot, bold: true }
              };
            }
            if (s.sortedIndices.has(i)) return { color: COLORS.sorted };
            return null;
          }
        });

        var status = 'ready';
        if (eng.running) status = s.phaseLabel || 'sorting...';
        if (s.sortedIndices.size === eng.n) status = 'sorted \u2713';
        BarRenderer.drawStatus(eng, 'n=' + eng.n + '  |  ' + status);

        // Info text — pivot-aware
        if (s.pivotIndex >= 0) {
          if (s.comparingIndices.length === 2) {
            var scanIdx = s.comparingIndices[0] === s.pivotIndex ? s.comparingIndices[1] : s.comparingIndices[0];
            BarRenderer.drawInfo(eng, '[' + scanIdx + '] vs pivot  |  wall at [' + s.partitionWall + ']', COLORS.comparing);
          } else if (s.swappingIndices.length === 2) {
            BarRenderer.drawInfo(eng, 'swap [' + s.swappingIndices[0] + '] \u2194 [' + s.swappingIndices[1] + ']  |  wall at [' + s.partitionWall + ']', COLORS.swapping);
          } else {
            BarRenderer.drawInfo(eng, 'pivot [' + s.pivotIndex + '] = ' + Math.round(s.arr[s.pivotIndex] * 100), COLORS.pivot);
          }
        }
      },

      onComplete: function (eng) {
        eng.state.comparingIndices = [];
        eng.state.swappingIndices = [];
        eng.state.pivotIndex = -1;
        eng.state.partitionWall = -1;
        eng.state.partitionRange = null;
        eng.state.phaseLabel = '';
      }
    });
  })();
