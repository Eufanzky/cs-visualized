(function () {
  var COLORS = AppColors;

  var eng = AnimationEngine({
    autoWireControls: false,

    generateData: function (size, engine) {
      var s = engine.state;
      s.arr = [];
      s.viewMode = s.viewMode || 'bars';
      for (var i = 0; i < size; i++) s.arr.push(Math.random() * 0.85 + 0.1);
      s._boxIntValues = s.arr.map(function (v) { return Math.round(v * 100); });
      s.sortedIndices = new Set();
      s.comparingIndices = [];
      s.swappingIndices = [];
      s.passNumber = 0;
      s._boxSwapAnim = null;
    },

    generateSteps: function (engine) {
      var steps = [];
      var a = engine.state.arr.slice();
      var len = a.length;
      for (var i = 0; i < len - 1; i++) {
        steps.push({ type: 'pass', number: i + 1 });
        var swapped = false;
        for (var j = 0; j < len - 1 - i; j++) {
          steps.push({ type: 'compare', indices: [j, j + 1] });
          if (a[j] > a[j + 1]) {
            steps.push({ type: 'swap', indices: [j, j + 1] });
            var tmp = a[j]; a[j] = a[j + 1]; a[j + 1] = tmp;
            swapped = true;
          }
        }
        steps.push({ type: 'sorted', index: len - 1 - i, value: a[len - 1 - i] });
        if (!swapped) {
          for (var k = 0; k < len - 1 - i; k++) {
            steps.push({ type: 'sorted', index: k, value: a[k] });
          }
          break;
        }
      }
      steps.push({ type: 'sorted', index: 0, value: a[0] });
      return steps;
    },

    executeStep: function (step, engine) {
      var s = engine.state;
      var isBoxes = s.viewMode === 'boxes';
      var renderer = isBoxes ? BoxRenderer : BarRenderer;
      LofiSounds.step(step);
      return new Promise(function (resolve) {
        if (step.type === 'pass') {
          s.passNumber = step.number;
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
        BarRenderer.drawBars(engine, { arr: s.arr, colorFn: colorFn });
      }

      var R = s.viewMode === 'boxes' ? BoxRenderer : BarRenderer;
      var status = 'ready';
      if (engine.running) status = s.passNumber > 0 ? 'pass ' + s.passNumber : 'sorting...';
      if (s.sortedIndices.size === engine.n) status = 'sorted \u2713';
      var modeLabel = s.viewMode === 'boxes' ? '[boxes]' : '[bars]';
      R.drawStatus(engine, modeLabel + '  n=' + engine.n + '  |  ' + status);

      if (s.comparingIndices.length === 2) {
        R.drawInfo(engine, '[' + s.comparingIndices[0] + '] > [' + s.comparingIndices[1] + ']?', COLORS.comparing);
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
