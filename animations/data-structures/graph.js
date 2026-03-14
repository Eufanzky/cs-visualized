(function () {
  var COLORS = AppColors;

  function getAdjacencyList(nodes, edges) {
    var adj = {};
    for (var i = 0; i < nodes.length; i++) adj[nodes[i].id] = [];
    for (var j = 0; j < edges.length; j++) {
      adj[edges[j].from].push(edges[j].to);
      adj[edges[j].to].push(edges[j].from);
    }
    return adj;
  }

  function edgeKey(a, b) {
    return Math.min(a, b) + '-' + Math.max(a, b);
  }

  var eng = AnimationEngine({
    autoWireControls: false,
    generateData: function (size, engine) {
      var s = engine.state;
      var w = engine.w;
      var h = engine.h;
      s.nodes = [];
      s.edges = [];
      s.nextLabel = 0;

      var cx = w / 2;
      var cy = h / 2;
      var radius = Math.min(w, h) * 0.3;
      var count = 7;

      for (var i = 0; i < count; i++) {
        var angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        s.nodes.push({
          id: i,
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
          label: String.fromCharCode(65 + i),
        });
        s.nextLabel = i + 1;
      }

      var edgePairs = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[0,3],[1,4],[2,5]];
      for (var ep = 0; ep < edgePairs.length; ep++) {
        s.edges.push({ from: edgePairs[ep][0], to: edgePairs[ep][1] });
      }

      s.visitedNodes = new Set();
      s.visitedEdges = new Set();
      s.currentNode = -1;
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
      var edges = s.edges;
      ctx.clearRect(0, 0, w, h);

      if (nodes.length === 0) {
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '14px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Empty graph \u2014 add a node to begin', w / 2, h / 2);
        drawStatus(ctx, w, s);
        return;
      }

      var nodeRadius = 24;

      // Draw edges
      for (var ei = 0; ei < edges.length; ei++) {
        var e = edges[ei];
        var from = null, to = null;
        for (var fi = 0; fi < nodes.length; fi++) {
          if (nodes[fi].id === e.from) from = nodes[fi];
          if (nodes[fi].id === e.to) to = nodes[fi];
        }
        if (!from || !to) continue;

        var key = edgeKey(e.from, e.to);
        var isVisited = s.visitedEdges.has(key);

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = isVisited ? COLORS.accent : COLORS.border;
        ctx.lineWidth = isVisited ? 3 : 2;
        ctx.stroke();

        if (isVisited) {
          ctx.shadowColor = COLORS.accent;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = COLORS.accent;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }

      // Draw nodes
      for (var ni = 0; ni < nodes.length; ni++) {
        var n = nodes[ni];
        var fillColor = COLORS.surface;
        var borderColor = COLORS.border;
        var glowing = false;

        if (s.visitedNodes.has(n.id)) {
          fillColor = COLORS.primary;
          borderColor = COLORS.primary;
          glowing = true;
        }
        if (s.currentNode === n.id) {
          fillColor = COLORS.success;
          borderColor = COLORS.success;
          glowing = true;
        }

        CanvasUtils.drawNode(ctx, n.x, n.y, nodeRadius, {
          fill: fillColor,
          stroke: borderColor,
          glow: glowing && fillColor,
          label: n.label,
          labelFont: 'bold 16px JetBrains Mono, monospace'
        });
      }

      drawStatus(ctx, w, s);
    }
  });

  function drawStatus(ctx, w, s) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('V=' + s.nodes.length + '  E=' + s.edges.length + '  |  ' + s.statusText, 40, 24);
  }

  function addNode() {
    var s = eng.state;
    if (s.animating || s.nodes.length >= 12) return;
    var w = eng.w;
    var h = eng.h;
    var padding = 60;
    var x = padding + Math.random() * (w - padding * 2);
    var y = padding + 40 + Math.random() * (h - padding * 2 - 40);
    var label = String.fromCharCode(65 + s.nextLabel);
    s.nodes.push({ id: s.nextLabel, x: x, y: y, label: label });
    s.nextLabel++;
    s.statusText = 'added node ' + label;
    eng.draw();
  }

  function addEdge() {
    var s = eng.state;
    if (s.animating || s.nodes.length < 2) return;
    var attempts = 50;
    for (var a = 0; a < attempts; a++) {
      var i = Math.floor(Math.random() * s.nodes.length);
      var j = Math.floor(Math.random() * s.nodes.length);
      if (i === j) continue;
      var fromId = s.nodes[i].id;
      var toId = s.nodes[j].id;
      var exists = false;
      for (var k = 0; k < s.edges.length; k++) {
        if ((s.edges[k].from === fromId && s.edges[k].to === toId) ||
            (s.edges[k].from === toId && s.edges[k].to === fromId)) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        s.edges.push({ from: fromId, to: toId });
        s.statusText = 'added edge ' + s.nodes[i].label + '\u2014' + s.nodes[j].label;
        eng.draw();
        return;
      }
    }
    s.statusText = 'no new edges possible';
    eng.draw();
  }

  async function bfs() {
    LofiSounds.init();
    var s = eng.state;
    if (s.animating || s.nodes.length === 0) return;
    s.animating = true;
    s.visitedNodes.clear();
    s.visitedEdges.clear();
    s.currentNode = -1;

    var startId = s.nodes[0].id;
    var adj = getAdjacencyList(s.nodes, s.edges);
    var queue = [startId];
    var visited = new Set([startId]);
    s.statusText = 'BFS from ' + s.nodes[0].label + '...';

    while (queue.length > 0) {
      var nodeId = queue.shift();
      s.currentNode = nodeId;
      s.visitedNodes.add(nodeId);
      var node = null;
      for (var ni = 0; ni < s.nodes.length; ni++) {
        if (s.nodes[ni].id === nodeId) { node = s.nodes[ni]; break; }
      }
      s.statusText = 'BFS visiting ' + node.label;
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 6); });

      s.currentNode = -1;

      var neighbors = adj[nodeId] || [];
      for (var k = 0; k < neighbors.length; k++) {
        var neighborId = neighbors[k];
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
          s.visitedEdges.add(edgeKey(nodeId, neighborId));
          eng.draw();
          await new Promise(function (r) { setTimeout(r, eng.getDelay() * 3); });
        }
      }
    }

    s.statusText = 'BFS complete \u2014 visited ' + s.visitedNodes.size + ' nodes';
    eng.draw();
    s.animating = false;
  }

  async function dfs() {
    LofiSounds.init();
    var s = eng.state;
    if (s.animating || s.nodes.length === 0) return;
    s.animating = true;
    s.visitedNodes.clear();
    s.visitedEdges.clear();
    s.currentNode = -1;

    var startId = s.nodes[0].id;
    var adj = getAdjacencyList(s.nodes, s.edges);
    var stack = [startId];
    var visited = new Set();
    s.statusText = 'DFS from ' + s.nodes[0].label + '...';

    while (stack.length > 0) {
      var nodeId = stack.pop();
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      s.currentNode = nodeId;
      s.visitedNodes.add(nodeId);
      var node = null;
      for (var ni = 0; ni < s.nodes.length; ni++) {
        if (s.nodes[ni].id === nodeId) { node = s.nodes[ni]; break; }
      }
      s.statusText = 'DFS visiting ' + node.label;
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 6); });

      s.currentNode = -1;

      var neighbors = (adj[nodeId] || []).slice().reverse();
      for (var k = 0; k < neighbors.length; k++) {
        var neighborId = neighbors[k];
        if (!visited.has(neighborId)) {
          stack.push(neighborId);
          s.visitedEdges.add(edgeKey(nodeId, neighborId));
          eng.draw();
          await new Promise(function (r) { setTimeout(r, eng.getDelay() * 2); });
        }
      }
    }

    s.statusText = 'DFS complete \u2014 visited ' + s.visitedNodes.size + ' nodes';
    eng.draw();
    s.animating = false;
  }

  // Events
  document.getElementById('btnAddNode').addEventListener('click', addNode);
  document.getElementById('btnAddEdge').addEventListener('click', addEdge);
  document.getElementById('btnBFS').addEventListener('click', bfs);
  document.getElementById('btnDFS').addEventListener('click', dfs);
  document.getElementById('btnReset').addEventListener('click', function () { eng.resize(); eng.generateData(eng.n); });
  document.getElementById('speedSlider').addEventListener('input', function (e) {
    eng.speed = parseInt(e.target.value);
  });

  window.addEventListener('resize', function () { eng.resize(); eng.generateData(eng.n); });
})();
