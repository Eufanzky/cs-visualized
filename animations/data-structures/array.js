(function () {
  var COLORS = AppColors;

  var eng = AnimationEngine({
    autoWireControls: false,
    generateData: function (size, engine) {
      var s = engine.state;
      s.arr = [];
      var count = 8;
      for (var i = 0; i < count; i++) {
        s.arr.push(Math.floor(Math.random() * 99) + 1);
      }
      s.maxSize = 16;
      s.highlightIndex = -1;
      s.highlightColor = '';
      s.highlightAlpha = 0;
      s.deletingIndex = -1;
      s.deleteAlpha = 1;
      s.insertAnim = { active: false, progress: 0 };
      s.animating = false;
      s.statusText = 'ready';
    },
    generateSteps: function () { return []; },
    executeStep: function () { return Promise.resolve(); },
    draw: function (engine) {
      var ctx = engine.ctx;
      var s = engine.state;
      var w = engine.w;
      var h = engine.h;
      var arr = s.arr;
      var maxSize = s.maxSize;
      ctx.clearRect(0, 0, w, h);

      var padding = 40;
      var cellSize = Math.min(60, (w - padding * 2) / maxSize - 4);
      var gap = 4;
      var totalWidth = arr.length * (cellSize + gap) - gap;
      var startX = (w - totalWidth) / 2;
      var startY = 200;

      // Draw cells
      for (var i = 0; i < arr.length; i++) {
        var x = startX + i * (cellSize + gap);
        var y = startY;
        var alpha = 1;

        if (s.deletingIndex === i) {
          alpha = s.deleteAlpha;
        }

        ctx.globalAlpha = alpha;

        var fillColor = COLORS.surface;
        var borderColor = COLORS.border;
        var glowing = false;

        if (s.highlightIndex === i && s.highlightAlpha > 0) {
          fillColor = s.highlightColor;
          borderColor = s.highlightColor;
          glowing = true;
        }

        if (s.insertAnim.active && i === arr.length - 1) {
          fillColor = COLORS.accent;
          borderColor = COLORS.accent;
          glowing = true;
        }

        CanvasUtils.drawBlock(ctx, x, y, cellSize, cellSize, {
          fill: fillColor,
          stroke: borderColor,
          glow: glowing && fillColor
        });

        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(arr[i], x + cellSize / 2, y + cellSize / 2);

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillText(i, x + cellSize / 2, y + cellSize + 18);

        ctx.globalAlpha = 1;
      }

      // Draw empty slots
      for (var j = arr.length; j < maxSize; j++) {
        var ex = startX + j * (cellSize + gap);
        var ey = startY;

        CanvasUtils.drawBlock(ctx, ex, ey, cellSize, cellSize, {
          stroke: COLORS.border,
          lineWidth: 1,
          dashed: true
        });

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(j, ex + cellSize / 2, ey + cellSize + 18);
      }

      // Status
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('length=' + arr.length + '  capacity=' + maxSize + '  |  ' + s.statusText, 40, 24);
    }
  });

  async function animateInsert() {
    LofiSounds.init(); LofiSounds.insert(0.5);
    var s = eng.state;
    if (s.animating || s.arr.length >= s.maxSize) return;
    s.animating = true;
    var val = Math.floor(Math.random() * 99) + 1;
    s.arr.push(val);
    s.insertAnim.active = true;
    s.statusText = 'inserted ' + val + ' at [' + (s.arr.length - 1) + ']';

    var frames = 20;
    for (var f = 0; f < frames; f++) {
      await new Promise(function (r) { requestAnimationFrame(r); });
      eng.draw();
    }
    s.insertAnim.active = false;
    eng.draw();
    s.animating = false;
  }

  async function animateDelete() {
    LofiSounds.init(); LofiSounds.remove();
    var s = eng.state;
    if (s.animating || s.arr.length === 0) return;
    s.animating = true;
    s.deletingIndex = s.arr.length - 1;
    s.statusText = 'deleting [' + s.deletingIndex + ']';

    var frames = 20;
    for (var f = 0; f <= frames; f++) {
      s.deleteAlpha = 1 - eng.easeInOutCubic(f / frames);
      eng.draw();
      await new Promise(function (r) { requestAnimationFrame(r); });
    }

    var removed = s.arr.pop();
    s.deletingIndex = -1;
    s.deleteAlpha = 1;
    s.statusText = 'deleted ' + removed;
    eng.draw();
    s.animating = false;
  }

  async function animateAccess() {
    LofiSounds.init(); LofiSounds.visit(0.5);
    var s = eng.state;
    if (s.animating || s.arr.length === 0) return;
    s.animating = true;
    var idx = Math.floor(Math.random() * s.arr.length);
    s.highlightIndex = idx;
    s.highlightColor = COLORS.primary;
    s.highlightAlpha = 1;
    s.statusText = 'accessing [' + idx + '] \u2192 ' + s.arr[idx];
    eng.draw();

    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 8); });

    var frames = 20;
    for (var f = 0; f <= frames; f++) {
      s.highlightAlpha = 1 - eng.easeInOutCubic(f / frames);
      if (s.highlightAlpha <= 0) s.highlightIndex = -1;
      eng.draw();
      await new Promise(function (r) { requestAnimationFrame(r); });
    }

    s.highlightIndex = -1;
    s.statusText = 'accessed [' + idx + '] = ' + s.arr[idx];
    eng.draw();
    s.animating = false;
  }

  // Events
  document.getElementById('btnInsert').addEventListener('click', animateInsert);
  document.getElementById('btnDelete').addEventListener('click', animateDelete);
  document.getElementById('btnAccess').addEventListener('click', animateAccess);
  document.getElementById('btnReset').addEventListener('click', function () { eng.generateData(eng.n); });
  document.getElementById('speedSlider').addEventListener('input', function (e) {
    eng.speed = parseInt(e.target.value);
  });

  window.addEventListener('resize', function () { eng.resize(); eng.draw(); });
})();
