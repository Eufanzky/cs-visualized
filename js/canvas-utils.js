/**
 * Shared canvas drawing utilities for CS Animations.
 * Eliminates duplicated drawing code across animation files.
 *
 * Usage:
 *   CanvasUtils.roundedRect(ctx, x, y, w, h, r);
 *   CanvasUtils.drawNode(ctx, x, y, radius, { fill, stroke, glow, label, labelColor });
 *   CanvasUtils.setGlow(ctx, color, blur);
 *   CanvasUtils.clearGlow(ctx);
 *   CanvasUtils.clearEffects(ctx);
 *   CanvasUtils.drawStatusText(ctx, text, x, y, color);
 *   CanvasUtils.easeInOutCubic(t);
 */
window.CanvasUtils = {

  /**
   * Draw a rounded rectangle path (does NOT fill or stroke — caller does that).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} w — width
   * @param {number} h — height
   * @param {number} r — corner radius
   */
  roundedRect: function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  /**
   * Draw a filled + stroked rounded rectangle block with optional glow.
   * Commonly used for stack blocks, queue blocks, hash table cells, etc.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {object} opts — { fill, stroke, glow, lineWidth, radius, dashed }
   */
  drawBlock: function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    var r = opts.radius || 6;
    var lineWidth = opts.lineWidth || 2;

    if (opts.dashed) {
      ctx.setLineDash(opts.dashed === true ? [4, 4] : opts.dashed);
    }

    if (opts.glow) {
      this.setGlow(ctx, opts.fill || opts.glow, 16);
    }

    this.roundedRect(ctx, x, y, w, h, r);

    if (opts.fill) {
      ctx.fillStyle = opts.fill;
      ctx.fill();
    }
    if (opts.stroke) {
      ctx.strokeStyle = opts.stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    this.clearEffects(ctx);
  },

  /**
   * Draw a circle node with optional label (for graphs, trees, heaps).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x — center x
   * @param {number} y — center y
   * @param {number} radius
   * @param {object} opts — { fill, stroke, glow, label, labelColor, labelFont, lineWidth }
   */
  drawNode: function (ctx, x, y, radius, opts) {
    opts = opts || {};

    if (opts.glow) {
      this.setGlow(ctx, opts.fill || opts.glow, 18);
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = opts.fill || '#4a403a';
    ctx.fill();
    if (opts.stroke) {
      ctx.strokeStyle = opts.stroke;
      ctx.lineWidth = opts.lineWidth || 2;
      ctx.stroke();
    }

    this.clearGlow(ctx);

    if (opts.label !== undefined && opts.label !== null) {
      ctx.fillStyle = opts.labelColor || '#ede6db';
      ctx.font = opts.labelFont || 'bold 13px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(opts.label), x, y);
    }
  },

  /**
   * Apply glow/shadow effect.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} color
   * @param {number} blur — shadow blur radius (default 16)
   */
  setGlow: function (ctx, color, blur) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur || 16;
  },

  /**
   * Clear glow/shadow effect.
   * @param {CanvasRenderingContext2D} ctx
   */
  clearGlow: function (ctx) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  },

  /**
   * Clear all canvas context effects (glow + dashes).
   * @param {CanvasRenderingContext2D} ctx
   */
  clearEffects: function (ctx) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
  },

  /**
   * Draw status text (typically top-left HUD).
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} x — default 40
   * @param {number} y — default 24
   * @param {string} color — default '#8a7e74'
   */
  drawStatusText: function (ctx, text, x, y, color) {
    ctx.fillStyle = color || '#8a7e74';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x || 40, y || 24);
  },

  /**
   * Cubic ease-in-out interpolation (0 to 1).
   * @param {number} t — progress (0..1)
   * @returns {number}
   */
  easeInOutCubic: function (t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
};
