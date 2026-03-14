/**
 * Shared color constants for CS Animations.
 * Mirrors CSS custom properties from styles.css for canvas use.
 *
 * Usage:
 *   var c = AppColors;
 *   ctx.fillStyle = c.primary;
 *   ctx.strokeStyle = c.border;
 */
window.AppColors = (function () {
  return {
    // ── Accent palette ──────────────────────────────────────
    primary:   '#c8a4d4',   // dusty lilac  — comparing, visiting
    secondary: '#e8b4a8',   // warm peach   — secondary highlights
    accent:    '#e4c08a',   // warm amber   — swapping, queued, current
    highlight: '#8fbfb0',   // sage green   — partition walls, merge halves
    success:   '#9cc49a',   // soft sage    — sorted, completed, path found
    error:     '#d48a8a',   // dusty red    — errors, not found
    type:      '#d4968e',   // terracotta   — pivots, special markers

    // ── Text ────────────────────────────────────────────────
    text:          '#ede6db',   // primary text (creamy white)
    textMuted:     '#8a7e74',   // muted labels
    textSecondary: '#b8a99a',   // secondary text

    // ── Backgrounds & borders ───────────────────────────────
    bg:            '#1a1614',   // deepest background
    surface:       '#231f1c',   // card/canvas background
    elevated:      '#2d2824',   // elevated surfaces
    border:        '#4a403a',   // borders, default edges
    borderSubtle:  '#352e2a',   // subtle borders

    // ── Semantic states (sorting) ───────────────────────────
    comparing: '#c8a4d4',   // = primary
    swapping:  '#e4c08a',   // = accent
    sorted:    '#9cc49a',   // = success

    // ── Graph/maze semantic colors ──────────────────────────
    node:      '#3d3632',   // default unvisited node (lighter than border)
    edge:      '#564b44',   // default edge (visible against bg)
    wall:      '#1a1218',   // maze wall cells (dark, distinct hue)
    closed:    '#3a2e3a',   // visited/closed cells (muted purple tint)
    dimmed:    '#2a2230',   // eliminated/searched (subtle purple tint)
    pathGlow:  '#b8e6a8',   // bright path highlight

    // ── Overlay colors ──────────────────────────────────────
    partitionZone:  'rgba(143, 191, 176, 0.22)',  // quick-sort less-than zone
    mergeRegion:    'rgba(200, 164, 212, 0.12)',  // merge-sort region
  };
})();
