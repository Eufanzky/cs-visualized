  (function () {
    var COLORS = AppColors;
    COLORS.dimmed = AppColors.dimmed;

    var Y_OFFSET = 30;

    AnimationEngine({
      playBtnId: 'btnSearch',
      playLabel: '\u25B6 Search',

      generateData: function (size, eng) {
        var s = eng.state;
        s.arr = [];
        for (var i = 0; i < size; i++) s.arr.push(Math.random() * 0.85 + 0.1);
        s.arr.sort(function (a, b) { return a - b; });
        s.target = -1;
        s.lowIdx = -1;
        s.highIdx = -1;
        s.midIdx = -1;
        s.foundIdx = -1;
        s.notFound = false;
        s.eliminated = new Set();
      },

      generateSteps: function (eng) {
        var s = eng.state;
        var steps = [];

        // Reset visual state for a new search
        s.lowIdx = -1;
        s.highIdx = -1;
        s.midIdx = -1;
        s.foundIdx = -1;
        s.notFound = false;
        s.eliminated = new Set();

        // Pick a random target — 70% chance it exists in array
        if (Math.random() < 0.7) {
          var idx = Math.floor(Math.random() * eng.n);
          s.target = s.arr[idx];
        } else {
          s.target = Math.random() * 0.85 + 0.1;
        }

        var a = s.arr;
        var lo = 0, hi = eng.n - 1;
        while (lo <= hi) {
          var mid = Math.floor((lo + hi) / 2);
          steps.push({ type: 'range', low: lo, high: hi, mid: mid });
          if (a[mid] === s.target) {
            steps.push({ type: 'found', index: mid });
            return steps;
          } else if (a[mid] < s.target) {
            steps.push({ type: 'eliminate', from: lo, to: mid });
            lo = mid + 1;
          } else {
            steps.push({ type: 'eliminate', from: mid, to: hi });
            hi = mid - 1;
          }
        }
        steps.push({ type: 'not-found' });
        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'range') {
            s.lowIdx = step.low;
            s.highIdx = step.high;
            s.midIdx = step.mid;
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'eliminate') {
            for (var i = step.from; i <= step.to; i++) {
              s.eliminated.add(i);
            }
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.5);
          } else if (step.type === 'found') {
            s.foundIdx = step.index;
            s.midIdx = -1;
            eng.draw();
            setTimeout(function () { LofiSounds.complete(); }, 150);
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'not-found') {
            s.notFound = true;
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          }
        });
      },

      draw: function (eng) {
        var s = eng.state;
        var ctx = eng.ctx;
        ctx.clearRect(0, 0, eng.w, eng.h);

        BarRenderer.drawBars(eng, {
          arr: s.arr,
          yOffset: Y_OFFSET,
          colorFn: function (i) {
            if (i === s.foundIdx) return { color: COLORS.success, glow: true };
            if (s.notFound && s.foundIdx === -1 && i === s.midIdx) return { color: COLORS.error, glow: true };
            if (i === s.midIdx && s.foundIdx === -1) return { color: COLORS.primary, glow: true };
            if (s.eliminated.has(i)) return { color: COLORS.dimmed, topColor: COLORS.dimmed };
            return null;
          }
        });

        // Low/High/Mid pointer labels
        if (s.lowIdx >= 0 && s.highIdx >= 0 && s.foundIdx === -1 && !s.notFound) {
          var layout = BarRenderer.getBarLayout(eng, eng.n);
          var barWidth = layout.barWidth;
          var gap = layout.gap;
          var padding = layout.padding;
          var labelY = eng.h - padding + 8;
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';

          var lowX = padding + s.lowIdx * (barWidth + gap) + barWidth / 2;
          ctx.fillStyle = COLORS.accent;
          ctx.fillText('L', lowX, labelY);

          var highX = padding + s.highIdx * (barWidth + gap) + barWidth / 2;
          ctx.fillStyle = COLORS.accent;
          ctx.fillText('H', highX, labelY);

          if (s.midIdx >= 0) {
            var midX = padding + s.midIdx * (barWidth + gap) + barWidth / 2;
            ctx.fillStyle = COLORS.primary;
            ctx.fillText('M', midX, labelY);
          }
        }

        // Status
        var status = 'ready';
        if (eng.running) status = 'searching...';
        if (s.foundIdx >= 0) status = 'found at index ' + s.foundIdx + ' \u2713';
        if (s.notFound) status = 'not found \u2717';
        BarRenderer.drawStatus(eng, 'n=' + eng.n + '  |  ' + status);

        if (s.target >= 0) {
          BarRenderer.drawInfo(eng, 'target: ' + Math.round(s.target * 100), COLORS.primary);
        }
      },

      onComplete: function (eng) {
        var s = eng.state;
        s.lowIdx = -1;
        s.highIdx = -1;
      }
    });
  })();
