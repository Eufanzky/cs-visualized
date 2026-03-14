  (function () {
    var COLORS = AppColors;
    // Algorithm-specific colors not in AppColors
    COLORS.mergeLeft = AppColors.highlight;
    COLORS.mergeRight = AppColors.type;
    COLORS.mergeRegion = 'rgba(200,164,212,0.08)';

    AnimationEngine({
      generateData: function (size, eng) {
        var s = eng.state;
        s.arr = [];
        for (var i = 0; i < size; i++) s.arr.push(Math.random() * 0.85 + 0.1);
        s.sortedIndices = new Set();
        s.comparingIndices = [];
        s.swappingIndices = [];
        s.mergeRange = null;
        s.activeHalf = '';
        s.phaseLabel = '';
      },

      generateSteps: function (eng) {
        var steps = [];
        var a = eng.state.arr.slice();
        var len = a.length;

        function mergeSort(left, right) {
          if (right - left <= 1) return;
          var mid = Math.floor((left + right) / 2);
          mergeSort(left, mid);
          mergeSort(mid, right);
          merge(left, mid, right);
        }

        function merge(left, mid, right) {
          steps.push({ type: 'merge-start', left: left, mid: mid, right: right });

          var temp = [];
          var sources = [];
          var i = left, j = mid;

          while (i < mid && j < right) {
            steps.push({ type: 'compare', indices: [i, j] });
            if (a[i] <= a[j]) {
              temp.push(a[i]);
              sources.push('left');
              i++;
            } else {
              temp.push(a[j]);
              sources.push('right');
              j++;
            }
          }
          while (i < mid) {
            temp.push(a[i]);
            sources.push('left');
            i++;
          }
          while (j < right) {
            temp.push(a[j]);
            sources.push('right');
            j++;
          }

          for (var k = 0; k < temp.length; k++) {
            a[left + k] = temp[k];
            steps.push({ type: 'place', index: left + k, value: temp[k], half: sources[k] });
          }

          steps.push({ type: 'merge-end', left: left, right: right });
        }

        mergeSort(0, len);

        for (var i = 0; i < len; i++) {
          steps.push({ type: 'sorted', index: i });
        }

        return steps;
      },

      executeStep: function (step, eng) {
        var s = eng.state;
        LofiSounds.step(step);
        return new Promise(function (resolve) {
          if (step.type === 'merge-start') {
            s.mergeRange = { left: step.left, mid: step.mid, right: step.right };
            s.phaseLabel = 'merging [' + step.left + '..' + (step.right - 1) + ']';
            s.comparingIndices = [];
            s.swappingIndices = [];
            eng.draw();
            setTimeout(resolve, eng.getDelay() * 0.5);
          } else if (step.type === 'merge-end') {
            s.mergeRange = null;
            s.activeHalf = '';
            s.comparingIndices = [];
            s.swappingIndices = [];
            eng.draw();
            resolve();
          } else if (step.type === 'compare') {
            s.comparingIndices = step.indices;
            s.swappingIndices = [];
            eng.draw();
            setTimeout(resolve, eng.getDelay());
          } else if (step.type === 'place') {
            s.comparingIndices = [];
            s.swappingIndices = [step.index];
            s.activeHalf = step.half || '';
            eng.draw();
            BarRenderer.animatePlace(eng, s.arr, step.index, step.value, eng.draw).then(function () {
              s.swappingIndices = [];
              eng.draw();
              setTimeout(resolve, eng.getDelay() * 0.3);
            });
          } else if (step.type === 'sorted') {
            s.comparingIndices = [];
            s.swappingIndices = [];
            s.mergeRange = null;
            s.sortedIndices.add(step.index);
            eng.draw();
            if (s.sortedIndices.size === eng.n) {
              setTimeout(function () { LofiSounds.complete(); }, 150);
            }
            resolve();
          }
        });
      },

      draw: function (eng) {
        var s = eng.state;
        var ctx = eng.ctx;
        ctx.clearRect(0, 0, eng.w, eng.h);

        // Draw merge region overlay BEFORE bars
        if (s.mergeRange) {
          var layout = BarRenderer.getBarLayout(eng, eng.n);
          var barWidth = layout.barWidth;
          var gap = layout.gap;
          var padding = layout.padding;

          var xStart = padding + s.mergeRange.left * (barWidth + gap) - gap;
          var xEnd = padding + (s.mergeRange.right - 1) * (barWidth + gap) + barWidth + gap;
          ctx.fillStyle = COLORS.mergeRegion;
          ctx.fillRect(xStart, padding - 10, xEnd - xStart, eng.h - padding * 2 + 20);

          // Divider between left and right halves
          var midX = padding + s.mergeRange.mid * (barWidth + gap) - gap / 2;
          ctx.strokeStyle = 'rgba(200,164,212,0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(midX, padding - 5);
          ctx.lineTo(midX, eng.h - padding + 5);
          ctx.stroke();
          ctx.setLineDash([]);

          // "left" and "right" labels
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          var leftCenter = padding + ((s.mergeRange.left + s.mergeRange.mid) / 2) * (barWidth + gap);
          var rightCenter = padding + ((s.mergeRange.mid + s.mergeRange.right - 1) / 2) * (barWidth + gap);
          ctx.fillStyle = COLORS.mergeLeft;
          ctx.fillText('left', leftCenter, padding - 14);
          ctx.fillStyle = COLORS.mergeRight;
          ctx.fillText('right', rightCenter, padding - 14);
        }

        BarRenderer.drawBars(eng, {
          arr: s.arr,
          colorFn: function (i) {
            if (s.swappingIndices.includes(i)) return { color: COLORS.swapping, glow: true };
            if (s.comparingIndices.includes(i)) return { color: COLORS.comparing, glow: true };
            if (s.sortedIndices.has(i)) return { color: COLORS.sorted };
            // Color bars within merge range as left/right halves
            if (s.mergeRange && i >= s.mergeRange.left && i < s.mergeRange.right) {
              if (i < s.mergeRange.mid) return { color: COLORS.mergeLeft };
              return { color: COLORS.mergeRight };
            }
            return null;
          }
        });

        var status = 'ready';
        if (eng.running) status = s.phaseLabel || 'sorting...';
        if (s.sortedIndices.size === eng.n) status = 'sorted \u2713';
        BarRenderer.drawStatus(eng, 'n=' + eng.n + '  |  ' + status);

        if (s.comparingIndices.length === 2) {
          BarRenderer.drawInfo(eng, 'comparing left[' + s.comparingIndices[0] + '] & right[' + s.comparingIndices[1] + ']', COLORS.comparing);
        }
        if (s.swappingIndices.length > 0 && !s.comparingIndices.length) {
          var src = s.activeHalf === 'left' ? 'left' : s.activeHalf === 'right' ? 'right' : '';
          BarRenderer.drawInfo(eng, 'placing from ' + src + ' half \u2192 [' + s.swappingIndices[0] + ']', COLORS.swapping);
        }
      },

      onComplete: function (eng) {
        eng.state.comparingIndices = [];
        eng.state.swappingIndices = [];
      }
    });
  })();
