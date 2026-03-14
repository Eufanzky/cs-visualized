(function () {
  var COLORS = AppColors;

  var MAX_SIZE = 12;

  var eng = AnimationEngine({
    autoWireControls: false,
    generateData: function (size, engine) {
      var s = engine.state;
      s.queue = [];
      for (var i = 0; i < 5; i++) {
        s.queue.push(Math.floor(Math.random() * 99) + 1);
      }
      s.peekIndex = -1;
      s.enqueueAnim = { active: false, progress: 0, value: 0 };
      s.dequeueAnim = { active: false, progress: 0, value: 0 };
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
      var queue = s.queue;
      ctx.clearRect(0, 0, w, h);

      var blockW = 70;
      var blockH = 50;
      var gap = 6;
      var totalW = queue.length * (blockW + gap) - (queue.length > 0 ? gap : 0);
      var startX = (w - totalW) / 2;
      var centerY = 230;

      if (queue.length === 0 && !s.enqueueAnim.active && !s.dequeueAnim.active) {
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '14px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Empty queue \u2014 enqueue to begin', w / 2, h / 2);
        drawStatus(ctx, w, s);
        return;
      }

      // Direction arrow
      if (queue.length > 1) {
        var arrowY = centerY + blockH + 50;
        var ax1 = startX + 20;
        var ax2 = startX + totalW - 20;
        ctx.beginPath();
        ctx.moveTo(ax1, arrowY);
        ctx.lineTo(ax2, arrowY);
        ctx.strokeStyle = COLORS.textMuted;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(ax1 + 8, arrowY - 5);
        ctx.lineTo(ax1, arrowY);
        ctx.lineTo(ax1 + 8, arrowY + 5);
        ctx.fillStyle = COLORS.textMuted;
        ctx.fill();

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('dequeue direction', (ax1 + ax2) / 2, arrowY + 8);
      }

      // Draw queue blocks
      for (var i = 0; i < queue.length; i++) {
        var x = startX + i * (blockW + gap);
        var y = centerY;
        var isFront = i === 0;
        var isRear = i === queue.length - 1;
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
        ctx.fillText(queue[i], x + blockW / 2, y + blockH / 2);

        if (isFront) {
          ctx.fillStyle = COLORS.success;
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('FRONT', x + blockW / 2, y - 12);
          ctx.beginPath();
          ctx.moveTo(x + blockW / 2, y - 10);
          ctx.lineTo(x + blockW / 2, y - 2);
          ctx.strokeStyle = COLORS.success;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + blockW / 2 - 4, y - 6);
          ctx.lineTo(x + blockW / 2, y - 1);
          ctx.lineTo(x + blockW / 2 + 4, y - 6);
          ctx.fillStyle = COLORS.success;
          ctx.fill();
        }
        if (isRear) {
          ctx.fillStyle = COLORS.accent;
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('REAR', x + blockW / 2, y - 12);
          if (!isFront) {
            ctx.beginPath();
            ctx.moveTo(x + blockW / 2, y - 10);
            ctx.lineTo(x + blockW / 2, y - 2);
            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + blockW / 2 - 4, y - 6);
            ctx.lineTo(x + blockW / 2, y - 1);
            ctx.lineTo(x + blockW / 2 + 4, y - 6);
            ctx.fillStyle = COLORS.accent;
            ctx.fill();
          }
        }
      }

      // Enqueue animation
      if (s.enqueueAnim.active) {
        var targetX = startX + queue.length * (blockW + gap);
        var fromX = w + blockW;
        var te = engine.easeInOutCubic(s.enqueueAnim.progress);
        var xe = fromX + (targetX - fromX) * te;
        var ye = centerY;

        CanvasUtils.drawBlock(ctx, xe, ye, blockW, blockH, {
          fill: COLORS.accent,
          stroke: COLORS.accent,
          glow: COLORS.accent
        });

        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.enqueueAnim.value, xe + blockW / 2, ye + blockH / 2);
      }

      // Dequeue animation
      if (s.dequeueAnim.active) {
        var fromXd = startX;
        var toXd = -blockW * 2;
        var td = engine.easeInOutCubic(s.dequeueAnim.progress);
        var xd = fromXd + (toXd - fromXd) * td;
        var yd = centerY;
        var alpha = 1 - td;

        ctx.globalAlpha = alpha;

        CanvasUtils.drawBlock(ctx, xd, yd, blockW, blockH, {
          fill: COLORS.secondary,
          stroke: COLORS.secondary,
          glow: COLORS.secondary
        });

        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.dequeueAnim.value, xd + blockW / 2, yd + blockH / 2);

        ctx.globalAlpha = 1;
      }

      drawStatus(ctx, w, s);
    }
  });

  function drawStatus(ctx, w, s) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('size=' + s.queue.length + '  |  ' + s.statusText, 40, 24);
  }

  async function enqueue() {
    LofiSounds.init(); LofiSounds.insert(0.6);
    var s = eng.state;
    if (s.animating || s.queue.length >= MAX_SIZE) return;
    s.animating = true;
    var val = Math.floor(Math.random() * 99) + 1;
    s.enqueueAnim.value = val;
    s.enqueueAnim.active = true;
    s.statusText = 'enqueuing ' + val + '...';

    var frames = 30;
    for (var f = 0; f <= frames; f++) {
      s.enqueueAnim.progress = f / frames;
      eng.draw();
      await new Promise(function (r) { requestAnimationFrame(r); });
    }

    s.queue.push(val);
    s.enqueueAnim.active = false;
    s.statusText = 'enqueued ' + val + ' at rear';
    eng.draw();
    s.animating = false;
  }

  async function dequeue() {
    LofiSounds.init(); LofiSounds.remove();
    var s = eng.state;
    if (s.animating || s.queue.length === 0) return;
    s.animating = true;
    var val = s.queue.shift();
    s.dequeueAnim.value = val;
    s.dequeueAnim.active = true;
    s.statusText = 'dequeuing ' + val + '...';

    var frames = 30;
    for (var f = 0; f <= frames; f++) {
      s.dequeueAnim.progress = f / frames;
      eng.draw();
      await new Promise(function (r) { requestAnimationFrame(r); });
    }

    s.dequeueAnim.active = false;
    s.statusText = 'dequeued ' + val + ' from front';
    eng.draw();
    s.animating = false;
  }

  async function peek() {
    LofiSounds.init(); LofiSounds.found();
    var s = eng.state;
    if (s.animating || s.queue.length === 0) return;
    s.animating = true;
    s.peekIndex = 0;
    s.statusText = 'peek \u2192 ' + s.queue[0] + ' (front)';
    eng.draw();

    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 10); });

    s.peekIndex = -1;
    eng.draw();
    s.animating = false;
  }

  // Events
  document.getElementById('btnEnqueue').addEventListener('click', enqueue);
  document.getElementById('btnDequeue').addEventListener('click', dequeue);
  document.getElementById('btnPeek').addEventListener('click', peek);
  document.getElementById('btnReset').addEventListener('click', function () { eng.generateData(eng.n); });
  document.getElementById('speedSlider').addEventListener('input', function (e) {
    eng.speed = parseInt(e.target.value);
  });

  window.addEventListener('resize', function () { eng.resize(); eng.draw(); });
})();
