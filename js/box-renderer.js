/**
 * Box-style renderer for sorting animations.
 * Draws numbered boxes in a row that physically swap positions,
 * showing exactly how the algorithm moves elements.
 *
 * Usage:
 *   BoxRenderer.drawBoxes(engine, { arr, colorFn, intValues });
 *   BoxRenderer.animateSwap(engine, state, indices, draw);
 *   BoxRenderer.animatePlace(engine, state, index, targetValue, draw);
 *   BoxRenderer.drawStatus(engine, text);
 *   BoxRenderer.drawInfo(engine, text, color);
 */
window.BoxRenderer = {

  /**
   * Compute box layout for a given array size.
   */
  getBoxLayout: function (engine, n, padding) {
    padding = padding || 40;
    var gap = 6;
    var maxBoxW = 60;
    var boxW = Math.min(maxBoxW, (engine.w - padding * 2 - (n - 1) * gap) / n);
    var boxH = boxW;
    var totalW = n * boxW + (n - 1) * gap;
    var startX = (engine.w - totalW) / 2;
    var baseY = engine.h / 2 + 20;
    return {
      padding: padding, gap: gap, boxW: boxW, boxH: boxH,
      startX: startX, baseY: baseY, totalW: totalW
    };
  },

  /**
   * Draw all boxes.
   * opts.arr        — array of values (0-1 range)
   * opts.intValues  — array of integer display values (e.g. Math.round(v*100))
   * opts.colorFn(i) — return { color, glow? } or null for default
   * opts.swapAnim   — { a, b, progress } if a swap animation is in progress
   */
  drawBoxes: function (engine, opts) {
    var ctx = engine.ctx;
    var arr = opts.arr;
    var n = arr.length;
    var colorFn = opts.colorFn;
    var layout = this.getBoxLayout(engine, n);
    var boxW = layout.boxW;
    var boxH = layout.boxH;
    var gap = layout.gap;
    var startX = layout.startX;
    var baseY = layout.baseY;
    var swapAnim = opts.swapAnim || null;
    var intValues = opts.intValues;

    for (var i = 0; i < n; i++) {
      var x = startX + i * (boxW + gap);
      var y = baseY;
      var val = intValues ? intValues[i] : Math.round(arr[i] * 100);

      // If this box is part of a swap animation, offset its position
      if (swapAnim && swapAnim.progress > 0) {
        var t = swapAnim.progress;
        var aIdx = swapAnim.a;
        var bIdx = swapAnim.b;
        var dist = Math.abs(bIdx - aIdx) * (boxW + gap);
        var arcHeight = Math.max(boxH * 0.8, 40);

        if (i === aIdx) {
          // Move right and arc upward
          x = startX + aIdx * (boxW + gap) + dist * t;
          y = baseY - arcHeight * Math.sin(Math.PI * t);
        } else if (i === bIdx) {
          // Move left and arc downward
          x = startX + bIdx * (boxW + gap) - dist * t;
          y = baseY + arcHeight * 0.5 * Math.sin(Math.PI * t);
        }
      }

      // Colors
      var color = '#4a403a';
      var borderColor = '#5a4e46';
      var glow = false;
      var textColor = '#ede6db';

      if (colorFn) {
        var result = colorFn(i);
        if (result) {
          if (result.color) { color = result.color; borderColor = result.color; }
          if (result.glow) glow = true;
        }
      }

      // Glow
      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
      }

      // Draw box
      var r = Math.min(8, boxW * 0.15);
      CanvasUtils.roundedRect(ctx, x, y, boxW, boxH, r);

      // Gradient fill
      var grad = ctx.createLinearGradient(x, y, x, y + boxH);
      grad.addColorStop(0, borderColor);
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.fill();

      // Border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Value label inside box
      var fontSize = Math.min(16, boxW * 0.35);
      ctx.fillStyle = textColor;
      ctx.font = 'bold ' + fontSize + 'px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(val, x + boxW / 2, y + boxH / 2);

      // Index label below box
      if (boxW > 24) {
        ctx.fillStyle = '#8a7e74';
        ctx.font = Math.min(10, boxW * 0.2) + 'px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(i, x + boxW / 2, y + boxH + 6);
      }
    }
  },

  /**
   * Animate a swap between positions a and b.
   * Boxes physically move: a arcs over the top, b slides underneath.
   * Returns a Promise.
   */
  animateSwap: function (engine, arr, indices, draw) {
    var s = engine.state;
    return new Promise(function (resolve) {
      var a = indices[0], b = indices[1];
      var frames = 20;
      var frame = 0;

      // Store the swap animation state so draw() can use it
      s._boxSwapAnim = { a: a, b: b, progress: 0 };

      function tick() {
        frame++;
        var t = engine.easeInOutCubic(frame / frames);
        s._boxSwapAnim.progress = t;
        draw();
        if (frame < frames) {
          requestAnimationFrame(tick);
        } else {
          // Finalize: swap values in array
          var tmp = arr[a];
          arr[a] = arr[b];
          arr[b] = tmp;
          // Swap display values too
          if (s._boxIntValues) {
            var tmpInt = s._boxIntValues[a];
            s._boxIntValues[a] = s._boxIntValues[b];
            s._boxIntValues[b] = tmpInt;
          }
          s._boxSwapAnim = null;
          resolve();
        }
      }
      tick();
    });
  },

  /**
   * Animate placing a value at an index (for merge sort).
   * The box fades in with new value.
   */
  animatePlace: function (engine, arr, index, targetValue, draw) {
    var s = engine.state;
    return new Promise(function (resolve) {
      var startVal = arr[index];
      var frames = 12;
      var frame = 0;

      function tick() {
        frame++;
        var t = engine.easeInOutCubic(frame / frames);
        arr[index] = startVal + (targetValue - startVal) * t;
        if (s._boxIntValues) {
          s._boxIntValues[index] = Math.round(arr[index] * 100);
        }
        draw();
        if (frame < frames) {
          requestAnimationFrame(tick);
        } else {
          arr[index] = targetValue;
          if (s._boxIntValues) {
            s._boxIntValues[index] = Math.round(targetValue * 100);
          }
          resolve();
        }
      }
      tick();
    });
  },

  /** Draw left-aligned status text. */
  drawStatus: function (engine, text, padding) {
    padding = padding || 40;
    engine.ctx.fillStyle = '#8a7e74';
    engine.ctx.font = '11px JetBrains Mono, monospace';
    engine.ctx.textAlign = 'left';
    engine.ctx.fillText(text, padding, 24);
  },

  /** Draw right-aligned info text. */
  drawInfo: function (engine, text, color, padding) {
    padding = padding || 40;
    engine.ctx.fillStyle = color || '#8a7e74';
    engine.ctx.textAlign = 'right';
    engine.ctx.font = '11px JetBrains Mono, monospace';
    engine.ctx.fillText(text, engine.w - padding, 24);
  }
};
