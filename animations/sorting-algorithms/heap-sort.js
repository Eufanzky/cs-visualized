  (function () {
    var COLORS = AppColors;
    // Algorithm-specific color not in AppColors
    COLORS.heapRoot = AppColors.type;

    AnimationEngine({
      generateData: function (size, eng) {
        var s = eng.state;
        s.arr = [];
        for (var i = 0; i < size; i++) s.arr.push(Math.random() * 0.85 + 0.1);
        s.sortedIndices = new Set();
        s.comparingIndices = [];
        s.swappingIndices = [];
        s.phaseLabel = '';
        s.heapSize = 0;
      },

      generateSteps: function (eng) {
        var steps = [];
        var a = eng.state.arr.slice();
        var len = a.length;

        function heapify(size, root) {
          var largest = root;
          var left = 2 * root + 1;
          var right = 2 * root + 2;

          if (left < size) {
            steps.push({ type: 'compare', indices: [largest, left], relation: 'parent-child' });
            if (a[left] > a[largest]) {
              largest = left;
            }
          }

          if (right < size) {
            steps.push({ type: 'compare', indices: [largest, right], relation: 'parent-child' });
            if (a[right] > a[largest]) {
              largest = right;
            }
          }

          if (largest !== root) {
            steps.push({ type: 'swap', indices: [root, largest], relation: 'sift-down' });
            var tmp = a[root]; a[root] = a[largest]; a[largest] = tmp;
            heapify(size, largest);
          }
        }

        // Build max-heap
        steps.push({ type: 'phase', label: 'building max-heap', heapSize: len });
        for (var i = Math.floor(len / 2) - 1; i >= 0; i--) {
          heapify(len, i);
        }

        // Extract elements from heap
        for (var i = len - 1; i > 0; i--) {
          steps.push({ type: 'phase', label: 'extracting max', heapSize: i + 1 });
          steps.push({ type: 'swap', indices: [0, i], relation: 'extract' });
          var tmp = a[0]; a[0] = a[i]; a[i] = tmp;
          steps.push({ type: 'sorted', index: i });
          steps.push({ type: 'phase', label: 'sifting down root', heapSize: i });
          heapify(i, 0);
        }

        // Mark the last remaining element as sorted
        steps.push({ type: 'sorted', index: 0 });

        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'phase') {
            s.phaseLabel = step.label;
            s.heapSize = step.heapSize;
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

        // Draw heap boundary line overlay BEFORE bars
        if (s.heapSize > 0 && s.heapSize < eng.n) {
          var layout = BarRenderer.getBarLayout(eng, eng.n);
          var barWidth = layout.barWidth;
          var gap = layout.gap;
          var padding = layout.padding;

          var boundaryX = padding + s.heapSize * (barWidth + gap) - gap / 2;
          ctx.strokeStyle = 'rgba(212,150,142,0.4)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(boundaryX, padding - 5);
          ctx.lineTo(boundaryX, eng.h - padding + 5);
          ctx.stroke();
          ctx.setLineDash([]);

          // Labels
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = COLORS.heapRoot;
          ctx.fillText('heap', padding + (s.heapSize / 2) * (barWidth + gap), padding - 14);
          ctx.fillStyle = COLORS.sorted;
          ctx.fillText('sorted', padding + ((s.heapSize + eng.n) / 2) * (barWidth + gap), padding - 14);
        }

        BarRenderer.drawBars(eng, {
          arr: s.arr,
          colorFn: function (i) {
            if (s.swappingIndices.includes(i)) return { color: COLORS.swapping, glow: true };
            if (s.comparingIndices.includes(i)) return { color: COLORS.comparing, glow: true };
            if (s.sortedIndices.has(i)) return { color: COLORS.sorted };
            return null;
          }
        });

        var status = 'ready';
        if (eng.running) status = s.phaseLabel || 'sorting...';
        if (s.sortedIndices.size === eng.n) status = 'sorted \u2713';
        BarRenderer.drawStatus(eng, 'n=' + eng.n + '  |  ' + status);

        if (s.comparingIndices.length === 2) {
          BarRenderer.drawInfo(eng, 'parent [' + s.comparingIndices[0] + '] vs child [' + s.comparingIndices[1] + ']', COLORS.comparing);
        }
        if (s.swappingIndices.length === 2) {
          BarRenderer.drawInfo(eng, 'swap [' + s.swappingIndices[0] + '] \u2194 [' + s.swappingIndices[1] + ']', COLORS.swapping);
        }
      },

      onComplete: function (eng) {
        eng.state.comparingIndices = [];
        eng.state.swappingIndices = [];
      }
    });
  })();
