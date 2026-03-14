/**
 * Shared maze/labyrinth renderer for search algorithm animations.
 * Generates a grid maze and renders cell states with colors and labels.
 *
 * Usage:
 *   MazeRenderer.buildMaze(state, cols, rows, startCell, goalCell);
 *   MazeRenderer.drawMaze(engine, state, opts);
 *   MazeRenderer.getNeighbors(state, r, c, cols, rows);
 */
window.MazeRenderer = {

  /**
   * Build a random maze grid with guaranteed path from start to goal.
   * Sets state.grid, state.cellStates on the provided state object.
   * @param {object} s — engine.state
   * @param {number} cols
   * @param {number} rows
   * @param {{ r, c }} startCell
   * @param {{ r, c }} goalCell
   */
  buildMaze: function (s, cols, rows, startCell, goalCell) {
    s.mazeGrid = [];
    s.mazeCellStates = [];
    for (var r = 0; r < rows; r++) {
      s.mazeGrid[r] = [];
      s.mazeCellStates[r] = [];
      for (var c = 0; c < cols; c++) {
        var isWall = (r === startCell.r && c === startCell.c) || (r === goalCell.r && c === goalCell.c)
          ? false
          : Math.random() < 0.25;
        s.mazeGrid[r][c] = isWall ? 1 : 0;
        s.mazeCellStates[r][c] = isWall ? 'wall' : 'empty';
      }
    }
    s.mazeCellStates[startCell.r][startCell.c] = 'start';
    s.mazeCellStates[goalCell.r][goalCell.c] = 'goal';
    s.mazeGrid[startCell.r][startCell.c] = 0;
    s.mazeGrid[goalCell.r][goalCell.c] = 0;

    // Clear cells around start and goal to ensure reachability
    var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    for (var d = 0; d < dirs.length; d++) {
      var sr = startCell.r + dirs[d][0], sc = startCell.c + dirs[d][1];
      if (sr >= 0 && sr < rows && sc >= 0 && sc < cols) {
        s.mazeGrid[sr][sc] = 0;
        if (s.mazeCellStates[sr][sc] === 'wall') s.mazeCellStates[sr][sc] = 'empty';
      }
      var gr = goalCell.r + dirs[d][0], gc = goalCell.c + dirs[d][1];
      if (gr >= 0 && gr < rows && gc >= 0 && gc < cols) {
        s.mazeGrid[gr][gc] = 0;
        if (s.mazeCellStates[gr][gc] === 'wall') s.mazeCellStates[gr][gc] = 'empty';
      }
    }
  },

  /**
   * Get passable neighbors of a cell.
   */
  getNeighbors: function (s, r, c, cols, rows) {
    var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    var neighbors = [];
    for (var d = 0; d < dirs.length; d++) {
      var nr = r + dirs[d][0], nc = c + dirs[d][1];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && s.mazeGrid[nr][nc] === 0) {
        neighbors.push({ r: nr, c: nc });
      }
    }
    return neighbors;
  },

  /**
   * Map (r, c) to a unique key for use in Sets/Maps.
   */
  cellKey: function (r, c, cols) {
    return r * cols + c;
  },

  /**
   * Draw the maze grid.
   * @param {object} engine
   * @param {object} s — engine.state (must have mazeGrid, mazeCellStates)
   * @param {object} opts — { cols, rows, startCell, goalCell, statusText, wallColor?, closedColor? }
   */
  drawMaze: function (engine, s, opts) {
    var ctx = engine.ctx;
    var cols = opts.cols;
    var rows = opts.rows;
    var COLORS = window.AppColors;

    var padding = 30;
    var availW = engine.w - padding * 2;
    var availH = engine.h - padding * 2 - 30;
    var cellSize = Math.min(availW / cols, availH / rows);
    var gridW = cellSize * cols;
    var offsetX = (engine.w - gridW) / 2;
    var offsetY = padding + 20;

    var wallColor = opts.wallColor || COLORS.wall;
    var closedColor = opts.closedColor || COLORS.closed;
    var emptyColor = opts.emptyColor || COLORS.mazeEmpty || COLORS.elevated;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = offsetX + c * cellSize;
        var y = offsetY + r * cellSize;
        var state = s.mazeCellStates[r][c];

        var fillColor = emptyColor;
        var glow = false;
        var strokeColor = null;

        if (state === 'wall') {
          fillColor = wallColor;
        } else if (state === 'start') {
          fillColor = COLORS.success; glow = true;
        } else if (state === 'goal') {
          fillColor = COLORS.accent; glow = true;
        } else if (state === 'current') {
          fillColor = COLORS.accent; glow = true;
        } else if (state === 'open' || state === 'queued' || state === 'on-stack') {
          fillColor = COLORS.primary; glow = true;
        } else if (state === 'closed' || state === 'visited') {
          fillColor = closedColor;
        } else if (state === 'path') {
          fillColor = COLORS.success; glow = true;
        }

        var gap = 1.5;
        CanvasUtils.drawBlock(ctx, x + gap, y + gap, cellSize - gap * 2, cellSize - gap * 2, {
          fill: fillColor,
          glow: glow,
          radius: 3
        });

        // Start/Goal labels
        if (state === 'start' || (r === opts.startCell.r && c === opts.startCell.c)) {
          ctx.fillStyle = COLORS.bg;
          ctx.font = 'bold ' + Math.min(12, cellSize * 0.4) + 'px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('S', x + cellSize / 2, y + cellSize / 2);
        } else if (state === 'goal' || (r === opts.goalCell.r && c === opts.goalCell.c)) {
          ctx.fillStyle = COLORS.bg;
          ctx.font = 'bold ' + Math.min(12, cellSize * 0.4) + 'px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('G', x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    // Status
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(cols + 'x' + rows + ' maze  |  ' + (opts.statusText || 'ready'), 20, 18);
  }
};
