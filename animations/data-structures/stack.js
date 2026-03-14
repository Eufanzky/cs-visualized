(function () {
  var COLORS = AppColors;

  var MAX_SIZE = 10;

  var eng = AnimationEngine({
    autoWireControls: false,
    generateData: function (size, engine) {
      var s = engine.state;
      s.stack = [];
      for (var i = 0; i < 4; i++) {
        s.stack.push(Math.floor(Math.random() * 99) + 1);
      }
      s.peekIndex = -1;
      s.pushAnim = { active: false, progress: 0, value: 0 };
      s.popAnim = { active: false, progress: 0, value: 0 };
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
      var stack = s.stack;
      ctx.clearRect(0, 0, w, h);

      var blockW = 120;
      var blockH = 40;
      var gap = 4;
      var baseY = h - 60;
      var centerX = w / 2;

      // Draw stack base
      ctx.beginPath();
      ctx.moveTo(centerX - blockW / 2 - 10, baseY + 4);
      ctx.lineTo(centerX + blockW / 2 + 10, baseY + 4);
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw stack blocks (bottom to top)
      for (var i = 0; i < stack.length; i++) {
        var x = centerX - blockW / 2;
        var y = baseY - (i + 1) * (blockH + gap);
        var isTop = i === stack.length - 1;
        var isPeeked = s.peekIndex === i;

        var fillColor = COLORS.surface;
        var borderColor = COLORS.border;
        var glowing = false;

        if (isPeeked) {
          fillColor = COLORS.highlight;
          borderColor = COLORS.highlight;
          glowing = true;
        }

        CanvasUtils.drawBlock(ctx, x, y, blockW, blockH, {
          fill: fillColor,
          stroke: borderColor,
          glow: glowing && fillColor
        });

        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stack[i], centerX, y + blockH / 2);

        if (isTop && !s.pushAnim.active && !s.popAnim.active) {
          ctx.fillStyle = COLORS.accent;
          ctx.font = 'bold 12px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          var ptrX = centerX + blockW / 2 + 20;
          var ptrY = y + blockH / 2;
          ctx.fillText('TOP', ptrX + 12, ptrY);
          ctx.beginPath();
          ctx.moveTo(ptrX + 8, ptrY);
          ctx.lineTo(centerX + blockW / 2 + 4, ptrY);
          ctx.strokeStyle = COLORS.accent;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(centerX + blockW / 2 + 4, ptrY - 5);
          ctx.lineTo(centerX + blockW / 2 - 2, ptrY);
          ctx.lineTo(centerX + blockW / 2 + 4, ptrY + 5);
          ctx.fillStyle = COLORS.accent;
          ctx.fill();
        }
      }

      // Push animation
      if (s.pushAnim.active) {
        var targetY = baseY - (stack.length) * (blockH + gap);
        var startXp = w;
        var endXp = centerX - blockW / 2;
        var tp = engine.easeInOutCubic(s.pushAnim.progress);
        var xp = startXp + (endXp - startXp) * tp;
        var yp = targetY;

        CanvasUtils.drawBlock(ctx, xp, yp, blockW, blockH, {
          fill: COLORS.accent,
          stroke: COLORS.accent,
          glow: COLORS.accent
        });

        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.pushAnim.value, xp + blockW / 2, yp + blockH / 2);
      }

      // Pop animation
      if (s.popAnim.active) {
        var startYo = baseY - (stack.length + 1) * (blockH + gap);
        var startXo = centerX - blockW / 2;
        var endXo = w;
        var to = engine.easeInOutCubic(s.popAnim.progress);
        var xo = startXo + (endXo - startXo) * to;
        var yo = startYo;
        var alpha = 1 - to;

        ctx.globalAlpha = alpha;

        CanvasUtils.drawBlock(ctx, xo, yo, blockW, blockH, {
          fill: COLORS.secondary,
          stroke: COLORS.secondary,
          glow: COLORS.secondary
        });

        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.popAnim.value, xo + blockW / 2, yo + blockH / 2);

        ctx.globalAlpha = 1;
      }

      // Empty stack slots (dashed outline)
      for (var ei = stack.length + (s.pushAnim.active ? 1 : 0); ei < MAX_SIZE; ei++) {
        var ex = centerX - blockW / 2;
        var ey = baseY - (ei + 1) * (blockH + gap);

        CanvasUtils.drawBlock(ctx, ex, ey, blockW, blockH, {
          stroke: COLORS.border,
          lineWidth: 1,
          dashed: true
        });
      }

      // Status
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('size=' + stack.length + '  capacity=' + MAX_SIZE + '  |  ' + s.statusText, 40, 24);
    }
  });

  async function push() {
    LofiSounds.init(); LofiSounds.insert(0.6);
    var s = eng.state;
    if (s.animating || s.stack.length >= MAX_SIZE) return;
    s.animating = true;
    var val = Math.floor(Math.random() * 99) + 1;
    s.pushAnim.value = val;
    s.pushAnim.active = true;
    s.statusText = 'pushing ' + val + '...';

    var frames = 30;
    for (var f = 0; f <= frames; f++) {
      s.pushAnim.progress = f / frames;
      eng.draw();
      await new Promise(function (r) { requestAnimationFrame(r); });
    }

    s.stack.push(val);
    s.pushAnim.active = false;
    s.statusText = 'pushed ' + val;
    eng.draw();
    s.animating = false;
  }

  async function pop() {
    LofiSounds.init(); LofiSounds.remove();
    var s = eng.state;
    if (s.animating || s.stack.length === 0) return;
    s.animating = true;
    var val = s.stack.pop();
    s.popAnim.value = val;
    s.popAnim.active = true;
    s.statusText = 'popping ' + val + '...';

    var frames = 30;
    for (var f = 0; f <= frames; f++) {
      s.popAnim.progress = f / frames;
      eng.draw();
      await new Promise(function (r) { requestAnimationFrame(r); });
    }

    s.popAnim.active = false;
    s.statusText = 'popped ' + val;
    eng.draw();
    s.animating = false;
  }

  async function peek() {
    LofiSounds.init(); LofiSounds.found();
    var s = eng.state;
    if (s.animating || s.stack.length === 0) return;
    s.animating = true;
    s.peekIndex = s.stack.length - 1;
    s.statusText = 'peek \u2192 ' + s.stack[s.peekIndex];
    eng.draw();

    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 10); });

    s.peekIndex = -1;
    eng.draw();
    s.animating = false;
  }

  // Events
  document.getElementById('btnPush').addEventListener('click', push);
  document.getElementById('btnPop').addEventListener('click', pop);
  document.getElementById('btnPeek').addEventListener('click', peek);
  document.getElementById('btnReset').addEventListener('click', function () { eng.generateData(eng.n); });
  document.getElementById('speedSlider').addEventListener('input', function (e) {
    eng.speed = parseInt(e.target.value);
  });

  window.addEventListener('resize', function () { eng.resize(); eng.draw(); });
})();
