  (function () {
    var COLORS = AppColors;
    // Algorithm-specific color not in AppColors
    COLORS.heapRoot = AppColors.type;

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
        s.phaseLabel = '';
        s.heapSize = 0;
      },

      generateSteps: function (engine) {
        var steps = [];
        var a = engine.state.arr.slice();
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

      executeStep: function (step, engine) {
        var s = engine.state;
        var isBoxes = s.viewMode === 'boxes';
        var renderer = isBoxes ? BoxRenderer : BarRenderer;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'phase') {
            s.phaseLabel = step.label;
            s.heapSize = step.heapSize;
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
          // Draw heap boundary line overlay BEFORE bars
          if (s.heapSize > 0 && s.heapSize < engine.n) {
            var layout = BarRenderer.getBarLayout(engine, engine.n);
            var barWidth = layout.barWidth;
            var gap = layout.gap;
            var padding = layout.padding;

            var boundaryX = padding + s.heapSize * (barWidth + gap) - gap / 2;
            ctx.strokeStyle = 'rgba(212,150,142,0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(boundaryX, padding - 5);
            ctx.lineTo(boundaryX, engine.h - padding + 5);
            ctx.stroke();
            ctx.setLineDash([]);

            // Labels
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = COLORS.heapRoot;
            ctx.fillText('heap', padding + (s.heapSize / 2) * (barWidth + gap), padding - 14);
            ctx.fillStyle = COLORS.sorted;
            ctx.fillText('sorted', padding + ((s.heapSize + engine.n) / 2) * (barWidth + gap), padding - 14);
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
          R.drawInfo(engine, 'parent [' + s.comparingIndices[0] + '] vs child [' + s.comparingIndices[1] + ']', COLORS.comparing);
        }
        if (s.swappingIndices.length === 2) {
          R.drawInfo(engine, 'swap [' + s.swappingIndices[0] + '] \u2194 [' + s.swappingIndices[1] + ']', COLORS.swapping);
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
