(function () {
  var COLORS = AppColors;

  function getNodePosition(index, heap, w) {
    var level = Math.floor(Math.log2(index + 1));
    var posInLevel = index - (Math.pow(2, level) - 1);
    var nodesInLevel = Math.pow(2, level);

    var treeTop = 60;
    var levelHeight = 70;
    var y = treeTop + level * levelHeight;

    var totalSpread = Math.min(w - 80, 600);
    var levelSpread = totalSpread / nodesInLevel;
    var x = w / 2 - totalSpread / 2 + levelSpread * (posInLevel + 0.5);

    return { x: x, y: y };
  }

  var eng = AnimationEngine({
    autoWireControls: false,
    generateData: function (size, engine) {
      var s = engine.state;
      s.heap = [];
      var vals = [];
      for (var i = 0; i < 7; i++) {
        vals.push(Math.floor(Math.random() * 99) + 1);
      }
      for (var vi = 0; vi < vals.length; vi++) {
        s.heap.push(vals[vi]);
        var idx = s.heap.length - 1;
        while (idx > 0) {
          var parent = Math.floor((idx - 1) / 2);
          if (s.heap[idx] < s.heap[parent]) {
            var tmp = s.heap[idx]; s.heap[idx] = s.heap[parent]; s.heap[parent] = tmp;
            idx = parent;
          } else break;
        }
      }
      s.comparingIndices = [];
      s.swappingIndices = [];
      s.insertedIndex = -1;
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
      var heap = s.heap;
      ctx.clearRect(0, 0, w, h);

      if (heap.length === 0) {
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '14px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Empty heap \u2014 insert a value to begin', w / 2, 200);
        drawArrayView(ctx, w, h, s);
        drawStatus(ctx, w, s);
        return;
      }

      var nodeRadius = 22;

      // Draw edges
      for (var i = 0; i < heap.length; i++) {
        var pos = getNodePosition(i, heap, w);
        var left = 2 * i + 1;
        var right = 2 * i + 2;

        if (left < heap.length) {
          var lp = getNodePosition(left, heap, w);
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y + nodeRadius);
          ctx.lineTo(lp.x, lp.y - nodeRadius);
          ctx.strokeStyle = COLORS.border;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (right < heap.length) {
          var rp = getNodePosition(right, heap, w);
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y + nodeRadius);
          ctx.lineTo(rp.x, rp.y - nodeRadius);
          ctx.strokeStyle = COLORS.border;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Draw nodes
      for (var ni = 0; ni < heap.length; ni++) {
        var npos = getNodePosition(ni, heap, w);
        var fillColor = COLORS.surface;
        var borderColor = COLORS.border;
        var glowing = false;

        if (ni === 0) {
          borderColor = COLORS.success;
        }

        if (s.comparingIndices.indexOf(ni) !== -1) {
          fillColor = COLORS.primary;
          borderColor = COLORS.primary;
          glowing = true;
        }
        if (s.swappingIndices.indexOf(ni) !== -1) {
          fillColor = COLORS.accent;
          borderColor = COLORS.accent;
          glowing = true;
        }
        if (s.insertedIndex === ni) {
          fillColor = COLORS.highlight;
          borderColor = COLORS.highlight;
          glowing = true;
        }

        CanvasUtils.drawNode(ctx, npos.x, npos.y, nodeRadius, {
          fill: fillColor,
          stroke: borderColor,
          glow: glowing && fillColor,
          label: heap[ni],
          labelFont: 'bold 14px JetBrains Mono, monospace'
        });
      }

      // Min label
      if (heap.length > 0) {
        var rootPos = getNodePosition(0, heap, w);
        ctx.fillStyle = COLORS.success;
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('MIN', rootPos.x, rootPos.y - nodeRadius - 4);
      }

      drawArrayView(ctx, w, h, s);
      drawStatus(ctx, w, s);
    }
  });

  function drawArrayView(ctx, w, h, s) {
    var heap = s.heap;
    var arrY = h - 60;
    var cellW = 36;
    var cellH = 28;
    var gap = 3;
    var totalW = heap.length * (cellW + gap) - (heap.length > 0 ? gap : 0);
    var startX = (w - totalW) / 2;

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('array:', startX - 50, arrY + cellH / 2 + 4);

    for (var i = 0; i < heap.length; i++) {
      var x = startX + i * (cellW + gap);
      var y = arrY;

      var fillColor = COLORS.surface;
      var borderColor = COLORS.border;

      if (s.comparingIndices.indexOf(i) !== -1) {
        fillColor = COLORS.primary;
        borderColor = COLORS.primary;
      }
      if (s.swappingIndices.indexOf(i) !== -1) {
        fillColor = COLORS.accent;
        borderColor = COLORS.accent;
      }
      if (s.insertedIndex === i) {
        fillColor = COLORS.highlight;
        borderColor = COLORS.highlight;
      }

      CanvasUtils.drawBlock(ctx, x, y, cellW, cellH, {
        fill: fillColor,
        stroke: borderColor,
        radius: 4,
        lineWidth: 1
      });

      ctx.fillStyle = COLORS.text;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(heap[i], x + cellW / 2, y + cellH / 2);

      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(i, x + cellW / 2, y + cellH + 12);
    }
  }

  function drawStatus(ctx, w, s) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('size=' + s.heap.length + '  |  ' + s.statusText, 40, 24);
  }

  async function insertValue() {
    LofiSounds.init(); LofiSounds.insert(0.6);
    var s = eng.state;
    if (s.animating || s.heap.length >= 15) return;
    s.animating = true;
    var val = Math.floor(Math.random() * 99) + 1;
    s.heap.push(val);
    var idx = s.heap.length - 1;
    s.insertedIndex = idx;
    s.statusText = 'inserted ' + val + ', bubbling up...';
    eng.draw();
    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });

    // Bubble up
    while (idx > 0) {
      var parent = Math.floor((idx - 1) / 2);
      s.comparingIndices = [idx, parent];
      s.insertedIndex = -1;
      s.statusText = 'comparing ' + s.heap[idx] + ' with parent ' + s.heap[parent];
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 5); });

      if (s.heap[idx] < s.heap[parent]) {
        s.swappingIndices = [idx, parent];
        s.comparingIndices = [];
        s.statusText = 'swapping ' + s.heap[idx] + ' and ' + s.heap[parent];
        eng.draw();
        await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });

        var tmp = s.heap[idx]; s.heap[idx] = s.heap[parent]; s.heap[parent] = tmp;
        s.swappingIndices = [];
        idx = parent;
        eng.draw();
        await new Promise(function (r) { setTimeout(r, eng.getDelay() * 2); });
      } else {
        s.comparingIndices = [];
        s.statusText = s.heap[idx] + ' >= ' + s.heap[parent] + ', heap property satisfied';
        eng.draw();
        break;
      }
    }

    s.comparingIndices = [];
    s.swappingIndices = [];
    s.insertedIndex = -1;
    s.statusText = 'inserted ' + val;
    eng.draw();
    s.animating = false;
  }

  async function extractMin() {
    LofiSounds.init(); LofiSounds.sorted(0.3);
    var s = eng.state;
    if (s.animating || s.heap.length === 0) return;
    s.animating = true;
    var min = s.heap[0];
    s.statusText = 'extracting min ' + min + '...';

    if (s.heap.length === 1) {
      s.heap.pop();
      s.statusText = 'extracted ' + min;
      eng.draw();
      s.animating = false;
      return;
    }

    s.heap[0] = s.heap.pop();
    s.insertedIndex = 0;
    s.statusText = 'moved ' + s.heap[0] + ' to root, bubbling down...';
    eng.draw();
    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });
    s.insertedIndex = -1;

    // Bubble down
    var idx = 0;
    while (true) {
      var left = 2 * idx + 1;
      var right = 2 * idx + 2;
      var smallest = idx;

      if (left < s.heap.length) {
        s.comparingIndices = [idx, left];
        s.statusText = 'comparing ' + s.heap[idx] + ' with left child ' + s.heap[left];
        eng.draw();
        await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });
        if (s.heap[left] < s.heap[smallest]) smallest = left;
      }

      if (right < s.heap.length) {
        s.comparingIndices = [idx, right];
        s.statusText = 'comparing ' + s.heap[idx] + ' with right child ' + s.heap[right];
        eng.draw();
        await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });
        if (s.heap[right] < s.heap[smallest]) smallest = right;
      }

      if (smallest !== idx) {
        s.swappingIndices = [idx, smallest];
        s.comparingIndices = [];
        s.statusText = 'swapping ' + s.heap[idx] + ' and ' + s.heap[smallest];
        eng.draw();
        await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });

        var tmp = s.heap[idx]; s.heap[idx] = s.heap[smallest]; s.heap[smallest] = tmp;
        s.swappingIndices = [];
        idx = smallest;
        eng.draw();
        await new Promise(function (r) { setTimeout(r, eng.getDelay() * 2); });
      } else {
        s.comparingIndices = [];
        break;
      }
    }

    s.comparingIndices = [];
    s.swappingIndices = [];
    s.statusText = 'extracted min ' + min;
    eng.draw();
    s.animating = false;
  }

  // Events
  document.getElementById('btnInsert').addEventListener('click', insertValue);
  document.getElementById('btnExtract').addEventListener('click', extractMin);
  document.getElementById('btnReset').addEventListener('click', function () { eng.generateData(eng.n); });
  document.getElementById('speedSlider').addEventListener('input', function (e) {
    eng.speed = parseInt(e.target.value);
  });

  window.addEventListener('resize', function () { eng.resize(); eng.draw(); });
})();
