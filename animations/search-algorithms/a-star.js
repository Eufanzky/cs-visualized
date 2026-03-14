  (function () {
    var COLORS = AppColors;
    COLORS.wall = '#1a1726';
    COLORS.closed = '#2a2540';

    var COLS = 20;
    var ROWS = 12;
    var startCell = { r: 1, c: 1 };
    var goalCell = { r: ROWS - 2, c: COLS - 2 };

    function manhattan(r1, c1, r2, c2) {
      return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    }

    function buildGrid(s) {
      s.grid = [];
      s.cellStates = [];
      s.gScores = [];
      s.fScores = [];
      s.hScores = [];
      for (var r = 0; r < ROWS; r++) {
        s.grid[r] = [];
        s.cellStates[r] = [];
        s.gScores[r] = [];
        s.fScores[r] = [];
        s.hScores[r] = [];
        for (var c = 0; c < COLS; c++) {
          var isWall = (r === startCell.r && c === startCell.c) || (r === goalCell.r && c === goalCell.c)
            ? false
            : Math.random() < 0.25;
          s.grid[r][c] = isWall ? 1 : 0;
          s.cellStates[r][c] = isWall ? 'wall' : 'empty';
          s.gScores[r][c] = Infinity;
          s.fScores[r][c] = Infinity;
          s.hScores[r][c] = 0;
        }
      }
      s.cellStates[startCell.r][startCell.c] = 'start';
      s.cellStates[goalCell.r][goalCell.c] = 'goal';
      s.grid[startCell.r][startCell.c] = 0;
      s.grid[goalCell.r][goalCell.c] = 0;

      var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (var d = 0; d < dirs.length; d++) {
        var sr = startCell.r + dirs[d][0], sc = startCell.c + dirs[d][1];
        if (sr >= 0 && sr < ROWS && sc >= 0 && sc < COLS) {
          s.grid[sr][sc] = 0;
          if (s.cellStates[sr][sc] === 'wall') s.cellStates[sr][sc] = 'empty';
        }
        var gr = goalCell.r + dirs[d][0], gc = goalCell.c + dirs[d][1];
        if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS) {
          s.grid[gr][gc] = 0;
          if (s.cellStates[gr][gc] === 'wall') s.cellStates[gr][gc] = 'empty';
        }
      }
    }

    AnimationEngine({
      autoWireControls: true,
      playLabel: '\u25B6 Start Search',

      generateData: function (size, eng) {
        var s = eng.state;
        buildGrid(s);
        s.statusText = 'ready';
      },

      generateSteps: function (eng) {
        var s = eng.state;
        var steps = [];
        var gScore = Array.from({ length: ROWS }, function () { return Array(COLS).fill(Infinity); });
        var fScore = Array.from({ length: ROWS }, function () { return Array(COLS).fill(Infinity); });
        var cameFrom = Array.from({ length: ROWS }, function () { return Array(COLS).fill(null); });
        var openSet = new Set();
        var closedSet = new Set();

        var key = function (r, c) { return r * COLS + c; };

        gScore[startCell.r][startCell.c] = 0;
        var h0 = manhattan(startCell.r, startCell.c, goalCell.r, goalCell.c);
        fScore[startCell.r][startCell.c] = h0;
        openSet.add(key(startCell.r, startCell.c));

        steps.push({ type: 'open', r: startCell.r, c: startCell.c, g: 0, f: h0, h: h0 });

        while (openSet.size > 0) {
          var bestKey = -1;
          var bestF = Infinity;
          openSet.forEach(function (k) {
            var r = Math.floor(k / COLS);
            var c = k % COLS;
            if (fScore[r][c] < bestF) {
              bestF = fScore[r][c];
              bestKey = k;
            }
          });

          var cr = Math.floor(bestKey / COLS);
          var cc = bestKey % COLS;

          steps.push({ type: 'current', r: cr, c: cc });

          if (cr === goalCell.r && cc === goalCell.c) {
            var path = [];
            var pr = cr, pc = cc;
            while (cameFrom[pr][pc] !== null) {
              path.push({ r: pr, c: pc });
              var prev = cameFrom[pr][pc];
              pr = prev.r;
              pc = prev.c;
            }
            path.push({ r: startCell.r, c: startCell.c });
            path.reverse();
            steps.push({ type: 'path', cells: path });
            return steps;
          }

          openSet.delete(bestKey);
          closedSet.add(bestKey);
          steps.push({ type: 'close', r: cr, c: cc });

          var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
          for (var d = 0; d < dirs.length; d++) {
            var nr = cr + dirs[d][0];
            var nc = cc + dirs[d][1];
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
            if (s.grid[nr][nc] === 1) continue;
            var nk = key(nr, nc);
            if (closedSet.has(nk)) continue;

            var tentG = gScore[cr][cc] + 1;
            if (tentG < gScore[nr][nc]) {
              cameFrom[nr][nc] = { r: cr, c: cc };
              gScore[nr][nc] = tentG;
              var h = manhattan(nr, nc, goalCell.r, goalCell.c);
              fScore[nr][nc] = tentG + h;

              if (!openSet.has(nk)) {
                openSet.add(nk);
              }
              steps.push({ type: 'open', r: nr, c: nc, g: tentG, f: tentG + h, h: h });
            }
          }
        }

        steps.push({ type: 'no-path' });
        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'open') {
            if (!(step.r === startCell.r && step.c === startCell.c) && !(step.r === goalCell.r && step.c === goalCell.c)) {
              s.cellStates[step.r][step.c] = 'open';
            }
            s.gScores[step.r][step.c] = step.g;
            s.fScores[step.r][step.c] = step.f;
            s.hScores[step.r][step.c] = step.h;
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.3);
          } else if (step.type === 'current') {
            if (!(step.r === startCell.r && step.c === startCell.c) && !(step.r === goalCell.r && step.c === goalCell.c)) {
              s.cellStates[step.r][step.c] = 'current';
            }
            s.statusText = 'exploring (' + step.r + ',' + step.c + ')';
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'close') {
            if (!(step.r === startCell.r && step.c === startCell.c) && !(step.r === goalCell.r && step.c === goalCell.c)) {
              s.cellStates[step.r][step.c] = 'closed';
            }
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.2);
          } else if (step.type === 'path') {
            var idx = 0;
            function showNext() {
              if (idx >= step.cells.length) {
                s.statusText = 'path found! length=' + step.cells.length + ' \u2713';
                eng.draw();
                setTimeout(function () { LofiSounds.complete(); }, 150);
                resolve();
                return;
              }
              var cell = step.cells[idx];
              s.cellStates[cell.r][cell.c] = 'path';
              eng.draw();
              idx++;
              setTimeout(showNext, eng.getDelay() * 0.4);
            }
            s.statusText = 'reconstructing path...';
            showNext();
          } else if (step.type === 'no-path') {
            s.statusText = 'no path found \u2717';
            eng.draw();
            resolve();
          }
        });
      },

      draw: function (eng) {
        var s = eng.state;
        var ctx = eng.ctx;
        ctx.clearRect(0, 0, eng.w, eng.h);

        var padding = 30;
        var availW = eng.w - padding * 2;
        var availH = eng.h - padding * 2 - 30;
        var cellSize = Math.min(availW / COLS, availH / ROWS);
        var gridW = cellSize * COLS;
        var offsetX = (eng.w - gridW) / 2;
        var offsetY = padding + 20;

        for (var r = 0; r < ROWS; r++) {
          for (var c = 0; c < COLS; c++) {
            var x = offsetX + c * cellSize;
            var y = offsetY + r * cellSize;
            var state = s.cellStates[r][c];

            var fillColor = COLORS.surface;
            var glow = false;

            if (state === 'wall') {
              fillColor = COLORS.wall;
            } else if (state === 'start') {
              fillColor = COLORS.success; glow = true;
            } else if (state === 'goal') {
              fillColor = COLORS.accent; glow = true;
            } else if (state === 'current') {
              fillColor = COLORS.accent; glow = true;
            } else if (state === 'open') {
              fillColor = COLORS.primary;
            } else if (state === 'closed') {
              fillColor = COLORS.closed;
            } else if (state === 'path') {
              fillColor = COLORS.success; glow = true;
            }

            var gap = 1.5;
            var cx = x + gap;
            var cy = y + gap;
            var cw = cellSize - gap * 2;
            var ch = cellSize - gap * 2;

            CanvasUtils.drawBlock(ctx, cx, cy, cw, ch, {
              fill: fillColor,
              glow: glow,
              radius: 3
            });

            // f/g scores
            if (cellSize >= 32 && s.gScores[r][c] < Infinity && state !== 'wall' && state !== 'start' && state !== 'goal') {
              ctx.fillStyle = COLORS.textMuted;
              ctx.font = (Math.min(9, cellSize * 0.22)) + 'px JetBrains Mono, monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              var g = s.gScores[r][c];
              var f = s.fScores[r][c];
              if (cellSize >= 40) {
                ctx.fillText('f=' + f, x + cellSize / 2, y + cellSize * 0.35);
                ctx.fillText('g=' + g, x + cellSize / 2, y + cellSize * 0.65);
              } else {
                ctx.fillText('' + f, x + cellSize / 2, y + cellSize / 2);
              }
            }

            // Start/Goal labels
            if (state === 'start' || (r === startCell.r && c === startCell.c)) {
              ctx.fillStyle = COLORS.bg;
              ctx.font = 'bold ' + Math.min(12, cellSize * 0.4) + 'px JetBrains Mono, monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('S', x + cellSize / 2, y + cellSize / 2);
            } else if (state === 'goal' || (r === goalCell.r && c === goalCell.c)) {
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
        ctx.fillText(COLS + 'x' + ROWS + ' grid  |  ' + s.statusText, 20, 18);
      }
    });
  })();
