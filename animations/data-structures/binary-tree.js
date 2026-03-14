(function () {
  var COLORS = AppColors;

  function BSTNode(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }

  function bstInsert(node, val) {
    if (!node) return new BSTNode(val);
    if (val < node.val) node.left = bstInsert(node.left, val);
    else if (val > node.val) node.right = bstInsert(node.right, val);
    return node;
  }

  function bstMin(node) {
    while (node.left) node = node.left;
    return node;
  }

  function bstDelete(node, val) {
    if (!node) return null;
    if (val < node.val) node.left = bstDelete(node.left, val);
    else if (val > node.val) node.right = bstDelete(node.right, val);
    else {
      if (!node.left) return node.right;
      if (!node.right) return node.left;
      var succ = bstMin(node.right);
      node.val = succ.val;
      node.right = bstDelete(node.right, succ.val);
    }
    return node;
  }

  function getTreeDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
  }

  function getAllValues(node, arr) {
    if (!node) return;
    arr.push(node.val);
    getAllValues(node.left, arr);
    getAllValues(node.right, arr);
  }

  function computePositions(node, x, y, hSpread, positions) {
    if (!node) return;
    positions.set(node, { x: x, y: y });
    var vGap = 65;
    var nextSpread = hSpread * 0.55;
    if (node.left) computePositions(node.left, x - hSpread, y + vGap, nextSpread, positions);
    if (node.right) computePositions(node.right, x + hSpread, y + vGap, nextSpread, positions);
  }

  function findNode(n, v) {
    if (!n) return null;
    if (n.val === v) return n;
    return v < n.val ? findNode(n.left, v) : findNode(n.right, v);
  }

  var eng = AnimationEngine({
    autoWireControls: false,
    generateData: function (size, engine) {
      var s = engine.state;
      s.root = null;
      var values = new Set();
      while (values.size < 7) {
        values.add(Math.floor(Math.random() * 99) + 1);
      }
      var arr = Array.from(values);
      arr.sort(function (a, b) { return a - b; });
      function insertBalanced(sorted) {
        if (sorted.length === 0) return;
        var mid = Math.floor(sorted.length / 2);
        s.root = bstInsert(s.root, sorted[mid]);
        insertBalanced(sorted.slice(0, mid));
        insertBalanced(sorted.slice(mid + 1));
      }
      insertBalanced(arr);
      s.visitedNodes = new Set();
      s.foundNode = null;
      s.insertedNode = null;
      s.animating = false;
      s.statusText = 'ready';
      s.nodePositions = new Map();
    },
    generateSteps: function () { return []; },
    executeStep: function () { return Promise.resolve(); },
    draw: function (engine) {
      var ctx = engine.ctx;
      var s = engine.state;
      var w = engine.w;
      var h = engine.h;
      ctx.clearRect(0, 0, w, h);

      if (!s.root) {
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '14px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Empty tree \u2014 insert a node to begin', w / 2, h / 2);
        drawStatus(ctx, w, s);
        return;
      }

      var hSpread = Math.min(w * 0.25, 160);
      s.nodePositions = new Map();
      computePositions(s.root, w / 2, 70, hSpread, s.nodePositions);

      var nodeRadius = 22;

      // Draw edges
      function drawEdges(node) {
        if (!node) return;
        var p = s.nodePositions.get(node);
        if (node.left) {
          var lp = s.nodePositions.get(node.left);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + nodeRadius);
          ctx.lineTo(lp.x, lp.y - nodeRadius);
          ctx.strokeStyle = COLORS.border;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (node.right) {
          var rp = s.nodePositions.get(node.right);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + nodeRadius);
          ctx.lineTo(rp.x, rp.y - nodeRadius);
          ctx.strokeStyle = COLORS.border;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        drawEdges(node.left);
        drawEdges(node.right);
      }
      drawEdges(s.root);

      // Draw nodes
      function drawNodes(node) {
        if (!node) return;
        var p = s.nodePositions.get(node);
        var fillColor = COLORS.surface;
        var borderColor = COLORS.border;
        var glowing = false;

        if (s.visitedNodes.has(node)) {
          fillColor = COLORS.primary;
          borderColor = COLORS.primary;
          glowing = true;
        }
        if (s.foundNode === node) {
          fillColor = COLORS.success;
          borderColor = COLORS.success;
          glowing = true;
        }
        if (s.insertedNode === node) {
          fillColor = COLORS.accent;
          borderColor = COLORS.accent;
          glowing = true;
        }

        CanvasUtils.drawNode(ctx, p.x, p.y, nodeRadius, {
          fill: fillColor,
          stroke: borderColor,
          glow: glowing && fillColor,
          label: node.val,
          labelFont: 'bold 14px JetBrains Mono, monospace'
        });

        drawNodes(node.left);
        drawNodes(node.right);
      }
      drawNodes(s.root);

      drawStatus(ctx, w, s);
    }
  });

  function drawStatus(ctx, w, s) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    var vals = [];
    getAllValues(s.root, vals);
    ctx.fillText('nodes=' + vals.length + '  depth=' + getTreeDepth(s.root) + '  |  ' + s.statusText, 40, 24);
  }

  async function insertValue() {
    LofiSounds.init(); LofiSounds.insert(0.5);
    var s = eng.state;
    if (s.animating) return;
    s.animating = true;
    var val;
    var existing = [];
    getAllValues(s.root, existing);
    do {
      val = Math.floor(Math.random() * 99) + 1;
    } while (existing.indexOf(val) !== -1);

    s.visitedNodes.clear();
    s.foundNode = null;
    s.insertedNode = null;

    var node = s.root;
    s.statusText = 'inserting ' + val + '...';
    while (node) {
      s.visitedNodes.add(node);
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });
      if (val < node.val) node = node.left;
      else node = node.right;
    }

    s.root = bstInsert(s.root, val);
    s.insertedNode = findNode(s.root, val);
    s.visitedNodes.clear();
    s.statusText = 'inserted ' + val;
    eng.draw();
    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 6); });
    s.insertedNode = null;
    eng.draw();
    s.animating = false;
  }

  async function deleteValue() {
    LofiSounds.init(); LofiSounds.remove();
    var s = eng.state;
    if (s.animating) return;
    var vals = [];
    getAllValues(s.root, vals);
    if (vals.length === 0) return;
    s.animating = true;

    var val = vals[Math.floor(Math.random() * vals.length)];
    s.visitedNodes.clear();
    s.foundNode = null;
    s.insertedNode = null;
    s.statusText = 'deleting ' + val + '...';

    var node = s.root;
    while (node) {
      s.visitedNodes.add(node);
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });
      if (val === node.val) {
        s.foundNode = node;
        s.statusText = 'found ' + val + ', removing...';
        eng.draw();
        await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });
        break;
      }
      node = val < node.val ? node.left : node.right;
    }

    s.root = bstDelete(s.root, val);
    s.visitedNodes.clear();
    s.foundNode = null;
    s.statusText = 'deleted ' + val;
    eng.draw();
    s.animating = false;
  }

  async function searchValue() {
    LofiSounds.init(); LofiSounds.visit(0.6);
    var s = eng.state;
    if (s.animating) return;
    var vals = [];
    getAllValues(s.root, vals);
    if (vals.length === 0) return;
    s.animating = true;

    var target = Math.random() < 0.7
      ? vals[Math.floor(Math.random() * vals.length)]
      : Math.floor(Math.random() * 99) + 1;

    s.visitedNodes.clear();
    s.foundNode = null;
    s.insertedNode = null;
    s.statusText = 'searching for ' + target + '...';

    var node = s.root;
    while (node) {
      s.visitedNodes.add(node);
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 5); });

      if (target === node.val) {
        s.foundNode = node;
        s.statusText = 'found ' + target + '!';
        eng.draw();
        await new Promise(function (r) { setTimeout(r, eng.getDelay() * 8); });
        s.foundNode = null;
        s.visitedNodes.clear();
        eng.draw();
        s.animating = false;
        return;
      }
      node = target < node.val ? node.left : node.right;
    }

    s.visitedNodes.clear();
    s.statusText = target + ' not found';
    eng.draw();
    s.animating = false;
  }

  // Events
  document.getElementById('btnInsert').addEventListener('click', insertValue);
  document.getElementById('btnDelete').addEventListener('click', deleteValue);
  document.getElementById('btnSearch').addEventListener('click', searchValue);
  document.getElementById('btnReset').addEventListener('click', function () { eng.generateData(eng.n); });
  document.getElementById('speedSlider').addEventListener('input', function (e) {
    eng.speed = parseInt(e.target.value);
  });

  window.addEventListener('resize', function () { eng.resize(); eng.draw(); });
})();
