(function () {
  var COLORS = AppColors;

  var eng = AnimationEngine({
    autoWireControls: false,
    generateData: function (size, engine) {
      var s = engine.state;
      s.nodes = [];
      s.nextId = 1;
      for (var i = 0; i < 6; i++) {
        s.nodes.push(Math.floor(Math.random() * 99) + 1);
      }
      s.visitedSet = new Set();
      s.foundIndex = -1;
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
      var nodes = s.nodes;
      ctx.clearRect(0, 0, w, h);

      if (nodes.length === 0) {
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '14px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Empty list \u2014 push a node to begin', w / 2, h / 2);
        drawStatus(ctx, w, s);
        return;
      }

      var positions = getLayout(w, h, nodes);
      var arrowLen = 40;

      for (var i = 0; i < nodes.length; i++) {
        var p = positions[i];
        var fillColor = COLORS.surface;
        var borderColor = COLORS.border;
        var glowing = false;

        if (s.visitedSet.has(i)) {
          fillColor = COLORS.primary;
          borderColor = COLORS.primary;
          glowing = true;
        }
        if (s.foundIndex === i) {
          fillColor = COLORS.success;
          borderColor = COLORS.success;
          glowing = true;
        }

        CanvasUtils.drawBlock(ctx, p.x, p.y, p.w, p.h, {
          fill: fillColor,
          stroke: borderColor,
          glow: glowing && fillColor,
          radius: 8
        });

        var divX = p.x + p.w * 0.7;
        ctx.beginPath();
        ctx.moveTo(divX, p.y + 4);
        ctx.lineTo(divX, p.y + p.h - 4);
        ctx.strokeStyle = (s.visitedSet.has(i) || s.foundIndex === i) ? 'rgba(255,255,255,0.3)' : COLORS.border;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 15px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nodes[i], p.x + p.w * 0.35, p.y + p.h / 2);

        var dotX = p.x + p.w * 0.85;
        var dotY = p.y + p.h / 2;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = (i < nodes.length - 1) ? COLORS.highlight : COLORS.textMuted;
        ctx.fill();

        if (i < nodes.length - 1) {
          var nextP = positions[i + 1];
          if (Math.abs(p.y - nextP.y) < 5) {
            var ax1 = p.x + p.w;
            var ay = p.y + p.h / 2;
            var ax2 = nextP.x;
            ctx.beginPath();
            ctx.moveTo(ax1, ay);
            ctx.lineTo(ax2 - 8, ay);
            ctx.strokeStyle = COLORS.highlight;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ax2 - 8, ay - 5);
            ctx.lineTo(ax2, ay);
            ctx.lineTo(ax2 - 8, ay + 5);
            ctx.fillStyle = COLORS.highlight;
            ctx.fill();
          } else {
            var ax1b = p.x + p.w;
            var ay1 = p.y + p.h / 2;
            var ax2b = nextP.x;
            var ay2 = nextP.y + nextP.h / 2;
            ctx.beginPath();
            ctx.moveTo(ax1b, ay1);
            ctx.lineTo(ax1b + 15, ay1);
            ctx.lineTo(ax1b + 15, ay2);
            ctx.lineTo(ax2b - 8, ay2);
            ctx.strokeStyle = COLORS.highlight;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ax2b - 8, ay2 - 5);
            ctx.lineTo(ax2b, ay2);
            ctx.lineTo(ax2b - 8, ay2 + 5);
            ctx.fillStyle = COLORS.highlight;
            ctx.fill();
          }
        } else {
          var nx = p.x + p.w + 10;
          var ny = p.y + p.h / 2;
          ctx.fillStyle = COLORS.textMuted;
          ctx.font = '11px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('NULL', nx, ny);
        }

        if (i === 0) {
          ctx.fillStyle = COLORS.accent;
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('HEAD', p.x + p.w / 2, p.y - 8);
          ctx.beginPath();
          ctx.moveTo(p.x + p.w / 2, p.y - 5);
          ctx.lineTo(p.x + p.w / 2, p.y);
          ctx.strokeStyle = COLORS.accent;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      drawStatus(ctx, w, s);
    }
  });

  function getLayout(w, h, nodes) {
    var nodeW = 80;
    var nodeH = 44;
    var arrowLen = 40;
    var totalPerNode = nodeW + arrowLen;
    var maxPerRow = Math.max(1, Math.floor((w - 80) / totalPerNode));
    var rows = [];
    var idx = 0;

    while (idx < nodes.length) {
      var count = Math.min(maxPerRow, nodes.length - idx);
      rows.push({ start: idx, count: count });
      idx += count;
    }

    var rowHeight = 80;
    var totalHeight = rows.length * rowHeight;
    var startY = (h - totalHeight) / 2 + 20;

    var positions = [];
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var rowWidth = row.count * nodeW + (row.count - 1) * arrowLen;
      var startX = (w - rowWidth) / 2;
      for (var c = 0; c < row.count; c++) {
        positions.push({
          x: startX + c * (nodeW + arrowLen),
          y: startY + r * rowHeight,
          w: nodeW,
          h: nodeH,
        });
      }
    }
    return positions;
  }

  function drawStatus(ctx, w, s) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('nodes=' + s.nodes.length + '  |  ' + s.statusText, 40, 24);
  }

  async function pushFront() {
    LofiSounds.init(); LofiSounds.insert(0.7);
    var s = eng.state;
    if (s.animating || s.nodes.length >= 14) return;
    s.animating = true;
    var val = Math.floor(Math.random() * 99) + 1;
    s.nodes.unshift(val);
    s.visitedSet.clear();
    s.visitedSet.add(0);
    s.statusText = 'pushed ' + val + ' to front';
    eng.draw();
    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 6); });
    s.visitedSet.clear();
    eng.draw();
    s.animating = false;
  }

  async function pushBack() {
    LofiSounds.init(); LofiSounds.insert(0.4);
    var s = eng.state;
    if (s.animating || s.nodes.length >= 14) return;
    s.animating = true;
    var val = Math.floor(Math.random() * 99) + 1;

    s.statusText = 'traversing to tail...';
    for (var i = 0; i < s.nodes.length; i++) {
      s.visitedSet.add(i);
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 3); });
    }

    s.nodes.push(val);
    s.visitedSet.clear();
    s.visitedSet.add(s.nodes.length - 1);
    s.statusText = 'pushed ' + val + ' to back';
    eng.draw();
    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });
    s.visitedSet.clear();
    eng.draw();
    s.animating = false;
  }

  async function deleteNode() {
    LofiSounds.init(); LofiSounds.remove();
    var s = eng.state;
    if (s.animating || s.nodes.length === 0) return;
    s.animating = true;
    var idx = Math.floor(Math.random() * s.nodes.length);
    var val = s.nodes[idx];

    s.statusText = 'finding node [' + idx + ']...';
    for (var i = 0; i <= idx; i++) {
      s.visitedSet.add(i);
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 3); });
    }

    s.nodes.splice(idx, 1);
    s.visitedSet.clear();
    s.statusText = 'deleted ' + val + ' from [' + idx + ']';
    eng.draw();
    s.animating = false;
  }

  async function searchNode() {
    LofiSounds.init(); LofiSounds.visit(0.5);
    var s = eng.state;
    if (s.animating || s.nodes.length === 0) return;
    s.animating = true;
    var target = s.nodes[Math.floor(Math.random() * s.nodes.length)];
    s.visitedSet.clear();
    s.foundIndex = -1;
    s.statusText = 'searching for ' + target + '...';

    for (var i = 0; i < s.nodes.length; i++) {
      s.visitedSet.add(i);
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });

      if (s.nodes[i] === target) {
        s.foundIndex = i;
        s.visitedSet.clear();
        s.statusText = 'found ' + target + ' at [' + i + ']';
        eng.draw();
        await new Promise(function (r) { setTimeout(r, eng.getDelay() * 8); });
        s.foundIndex = -1;
        eng.draw();
        s.animating = false;
        return;
      }
    }

    s.visitedSet.clear();
    s.statusText = target + ' not found';
    eng.draw();
    s.animating = false;
  }

  // Events
  document.getElementById('btnPushFront').addEventListener('click', pushFront);
  document.getElementById('btnPushBack').addEventListener('click', pushBack);
  document.getElementById('btnDelete').addEventListener('click', deleteNode);
  document.getElementById('btnSearch').addEventListener('click', searchNode);
  document.getElementById('btnReset').addEventListener('click', function () { eng.generateData(eng.n); });
  document.getElementById('speedSlider').addEventListener('input', function (e) {
    eng.speed = parseInt(e.target.value);
  });

  window.addEventListener('resize', function () { eng.resize(); eng.draw(); });
})();
