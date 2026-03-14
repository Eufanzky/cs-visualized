/**
 * Shared color constants for CS Animations.
 * Reads from CSS custom properties defined in styles.css,
 * with hardcoded fallbacks for canvas contexts (which can't use CSS vars).
 *
 * Usage:
 *   var c = AppColors;
 *   ctx.fillStyle = c.primary;
 *   ctx.strokeStyle = c.border;
 */
window.AppColors = (function () {
  // These match the CSS custom properties in styles.css (:root)
  return {
    // Syntax palette — used as primary accents per category
    primary:   '#c8a4d4',   // --syn-keyword  (dusty lilac)
    secondary: '#e8b4a8',   // --syn-function (warm peach)
    accent:    '#e4c08a',   // --syn-number   (warm amber)
    highlight: '#8fbfb0',   // --syn-string   (sage green)
    success:   '#9cc49a',   // --syn-success  (soft sage)
    error:     '#d48a8a',   // --syn-error    (soft dusty red)
    type:      '#d4968e',   // --syn-type     (terracotta)

    // Text
    text:      '#ede6db',   // --text-primary
    textMuted: '#8a7e74',   // --text-muted
    textSecondary: '#b8a99a', // --text-secondary

    // Backgrounds & borders
    bg:        '#1a1614',   // --bg-deep
    surface:   '#231f1c',   // --bg-surface
    elevated:  '#2d2824',   // --bg-elevated
    border:    '#4a403a',   // --border
    borderSubtle: '#352e2a', // --border-subtle

    // Sorting-specific aliases (semantic names)
    comparing: '#c8a4d4',   // same as primary
    swapping:  '#e4c08a',   // same as accent
    sorted:    '#9cc49a',   // same as success
  };
})();
