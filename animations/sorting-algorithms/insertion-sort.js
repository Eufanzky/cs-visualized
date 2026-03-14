  (function () {
    var COLORS = AppColors;

    AnimationEngine({
      generateData: function (size, eng) {
        var s = eng.state;
        s.arr = [];
        for (var i = 0; i < size; i++) s.arr.push(Math.random() * 0.85 + 0.1);
        s.sortedIndices = new Set();
        s.comparingIndices = [];
        s.swappingIndices = [];
        s.insertingIndex = -1;
      },

      generateSteps: function (eng) {
        var steps = [];
        var a = eng.state.arr.slice();
        var len = a.length;

        steps.push({ type: 'sorted', index: 0 });

        for (var i = 1; i < len; i++) {
          steps.push({ type: 'insert-start', index: i });
          var j = i;
          while (j > 0) {
            steps.push({ type: 'compare', indices: [j - 1, j] });
            if (a[j - 1] > a[j]) {
              steps.push({ type: 'swap', indices: [j - 1, j] });
              var tmp = a[j]; a[j] = a[j - 1]; a[j - 1] = tmp;
              j--;
            } else {
              break;
            }
          }
          for (var k = 0; k <= i; k++) {
            steps.push({ type: 'sorted', index: k });
          }
        }

        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'insert-start') {
            s.insertingIndex = step.index;
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
        eng.ctx.clearRect(0, 0, eng.w, eng.h);

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
        if (eng.running) {
          status = s.insertingIndex >= 0 ? 'inserting element [' + s.insertingIndex + ']' : 'sorting...';
        }
        if (s.sortedIndices.size === eng.n) status = 'sorted \u2713';
        BarRenderer.drawStatus(eng, 'n=' + eng.n + '  |  ' + status);

        if (s.comparingIndices.length === 2) {
          BarRenderer.drawInfo(eng, 'is [' + s.comparingIndices[1] + '] < [' + s.comparingIndices[0] + ']?', COLORS.comparing);
        }
        if (s.swappingIndices.length === 2) {
          BarRenderer.drawInfo(eng, 'shifting [' + s.swappingIndices[0] + '] right', COLORS.swapping);
        }
      },

      onComplete: function (eng) {
        eng.state.comparingIndices = [];
        eng.state.swappingIndices = [];
      }
    });
  })();
