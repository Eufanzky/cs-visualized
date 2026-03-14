/**
 * Shared bar-chart renderer for sorting and search animations.
 * Draws rounded-rect bars with gradient fills, glow effects,
 * value labels, and status/info HUD text.
 *
 * Usage:
 *   BarRenderer.drawBars(engine, { arr: [...], colorFn: function (i) { ... } });
 *   BarRenderer.animateSwap(engine, arr, [i, j], engine.draw);
 *   BarRenderer.animatePlace(engine, arr, index, targetValue, engine.draw);
 *   BarRenderer.drawStatus(engine, 'n=24  |  ready');
 *   BarRenderer.drawInfo(engine, 'comparing [2] & [3]', '#c8a4d4');
 */
window.BarRenderer = {

  /**
   * Compute bar positions for a given array size.
   * Returns { padding, gap, barWidth, maxBarHeight }.
   */
  getBarLayout: function (engine, n, padding) {
    padding = padding || 40;
    var gap = 2;
    var barWidth = (engine.w - padding * 2 - (n - 1) * gap) / n;
    var maxBarHeight = engine.h - padding * 2 - 30;
    return { padding: padding, gap: gap, barWidth: barWidth, maxBarHeight: maxBarHeight };
  },

  /**
   * Draw all bars.
   * opts.arr          — array of values (0-1 range)
   * opts.colorFn(i)   — return { color, topColor?, glow?, label? } or null for default
   *   label: { text, color?, bold? } — custom label under bar instead of value
   * opts.padding       — horizontal padding (default 40)
   * opts.defaultColor  — default bar color (default '#4a403a')
   * opts.defaultTopColor — default gradient top (default '#5a4e46')
   * opts.textMuted     — value label color (default '#8a7e74')
   * opts.yOffset       — shift bars up (default 0, useful for pointer labels below)
   */
  drawBars: function (engine, opts) {
    var ctx = engine.ctx;
    var arr = opts.arr;
    var n = arr.length;
    var colorFn = opts.colorFn;
    var padding = opts.padding || 40;
    var layout = this.getBarLayout(engine, n, padding);
    var barWidth = layout.barWidth;
    var gap = layout.gap;
    var maxBarHeight = layout.maxBarHeight;
    var defaultColor = opts.defaultColor || '#4a403a';
    var defaultTopColor = opts.defaultTopColor || '#5a4e46';
    var textMuted = opts.textMuted || '#8a7e74';
    var yOffset = opts.yOffset || 0;

    for (var i = 0; i < n; i++) {
      var x = padding + i * (barWidth + gap);
      var barH = arr[i] * maxBarHeight;
      var y = engine.h - padding - barH - yOffset;

      var color = defaultColor;
      var topColor = defaultTopColor;
      var glow = false;
      var label = null;

      if (colorFn) {
        var result = colorFn(i);
        if (result) {
          if (result.color) { color = result.color; topColor = result.topColor || result.color; }
          if (result.glow) glow = true;
          if (result.label) label = result.label;
        }
      }

      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
      }

      // Rounded-rect bar
      var radius = Math.min(barWidth / 2, 4);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      // Gradient fill
      var grad = ctx.createLinearGradient(x, y, x, y + barH);
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Value or custom label below bar
      if (barWidth > 18) {
        ctx.textAlign = 'center';
        if (label) {
          ctx.fillStyle = label.color || color;
          ctx.font = (label.bold ? 'bold ' : '') + Math.min(10, barWidth * 0.5) + 'px JetBrains Mono, monospace';
          ctx.fillText(label.text, x + barWidth / 2, engine.h - padding + 14 - yOffset);
        } else {
          ctx.fillStyle = textMuted;
          ctx.font = Math.min(10, barWidth * 0.4) + 'px JetBrains Mono, monospace';
          ctx.fillText(Math.round(arr[i] * 100), x + barWidth / 2, engine.h - padding + 14 - yOffset);
        }
      }
    }
  },

  /**
   * Animate a swap between arr[a] and arr[b] over 12 frames.
   * Returns a Promise that resolves when the animation completes
   * (values are finalized in arr).
   */
  animateSwap: function (engine, arr, indices, draw) {
    return new Promise(function (resolve) {
      var a = indices[0], b = indices[1];
      var startA = arr[a], startB = arr[b];
      var frames = 12;
      var frame = 0;

      function tick() {
        frame++;
        var t = engine.easeInOutCubic(frame / frames);
        arr[a] = startA + (startB - startA) * t;
        arr[b] = startB + (startA - startB) * t;
        draw();
        if (frame < frames) {
          requestAnimationFrame(tick);
        } else {
          arr[a] = startB;
          arr[b] = startA;
          resolve();
        }
      }
      tick();
    });
  },

  /**
   * Animate a single value placement: arr[index] interpolates to targetValue.
   * Returns a Promise that resolves when done.
   */
  animatePlace: function (engine, arr, index, targetValue, draw) {
    return new Promise(function (resolve) {
      var startVal = arr[index];
      var frames = 12;
      var frame = 0;

      function tick() {
        frame++;
        var t = engine.easeInOutCubic(frame / frames);
        arr[index] = startVal + (targetValue - startVal) * t;
        draw();
        if (frame < frames) {
          requestAnimationFrame(tick);
        } else {
          arr[index] = targetValue;
          resolve();
        }
      }
      tick();
    });
  },

  /** Draw left-aligned status text (e.g. "n=24  |  sorting..."). */
  drawStatus: function (engine, text, padding) {
    padding = padding || 40;
    engine.ctx.fillStyle = '#8a7e74';
    engine.ctx.font = '11px JetBrains Mono, monospace';
    engine.ctx.textAlign = 'left';
    engine.ctx.fillText(text, padding, 24);
  },

  /** Draw right-aligned info text (e.g. comparing/swapping indicators). */
  drawInfo: function (engine, text, color, padding) {
    padding = padding || 40;
    engine.ctx.fillStyle = color || '#8a7e74';
    engine.ctx.textAlign = 'right';
    engine.ctx.font = '11px JetBrains Mono, monospace';
    engine.ctx.fillText(text, engine.w - padding, 24);
  }
};
