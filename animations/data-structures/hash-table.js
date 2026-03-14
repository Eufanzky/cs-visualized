(function () {
  var COLORS = AppColors;

  var BUCKET_COUNT = 8;
  var SAMPLE_KEYS = [
    'cat', 'dog', 'fox', 'owl', 'bee', 'ant', 'cow', 'hen',
    'eel', 'yak', 'ram', 'bat', 'jay', 'cod', 'emu', 'elk'
  ];

  function hashFn(key) {
    var h = 0;
    for (var i = 0; i < key.length; i++) {
      h = (h * 31 + key.charCodeAt(i)) | 0;
    }
    return Math.abs(h) % BUCKET_COUNT;
  }

  function getAvailableKey(usedKeys) {
    var available = SAMPLE_KEYS.filter(function (k) { return !usedKeys.has(k); });
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  function getAllEntries(buckets) {
    var entries = [];
    for (var i = 0; i < BUCKET_COUNT; i++) {
      for (var j = 0; j < buckets[i].length; j++) {
        var item = buckets[i][j];
        entries.push({ bucket: i, key: item.key, val: item.val });
      }
    }
    return entries;
  }

  var eng = AnimationEngine({
    autoWireControls: false,
    generateData: function (size, engine) {
      var s = engine.state;
      s.buckets = [];
      for (var i = 0; i < BUCKET_COUNT; i++) {
        s.buckets.push([]);
      }
      s.usedKeys = new Set();
      var initial = ['cat', 'dog', 'fox', 'owl', 'bee'];
      for (var k = 0; k < initial.length; k++) {
        var key = initial[k];
        var idx = hashFn(key);
        var val = Math.floor(Math.random() * 99) + 1;
        s.buckets[idx].push({ key: key, val: val });
        s.usedKeys.add(key);
      }
      s.highlightBucket = -1;
      s.highlightChainItem = null;
      s.hashAnimText = '';
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
      var buckets = s.buckets;
      ctx.clearRect(0, 0, w, h);

      var bucketW = 70;
      var bucketH = 44;
      var gap = 8;
      var startX = 60;
      var startY = 60;
      var chainNodeW = 80;
      var chainNodeH = 36;
      var arrowLen = 20;

      for (var i = 0; i < BUCKET_COUNT; i++) {
        var bx = startX;
        var by = startY + i * (bucketH + gap);
        var isHighlighted = s.highlightBucket === i;

        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('[' + i + ']', bx - 10, by + bucketH / 2);

        CanvasUtils.drawBlock(ctx, bx, by, bucketW, bucketH, {
          fill: isHighlighted ? COLORS.primary : COLORS.surface,
          stroke: isHighlighted ? COLORS.primary : COLORS.border,
          glow: isHighlighted && COLORS.primary
        });

        ctx.fillStyle = COLORS.text;
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var bucketLabel = buckets[i].length > 0 ? '' + buckets[i].length : '\u2014';
        ctx.fillText(bucketLabel, bx + bucketW / 2, by + bucketH / 2);

        if (buckets[i].length > 0) {
          var cx = bx + bucketW;
          var cy = by + bucketH / 2;

          for (var j = 0; j < buckets[i].length; j++) {
            var item = buckets[i][j];

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + arrowLen - 6, cy);
            ctx.strokeStyle = COLORS.highlight;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + arrowLen - 6, cy - 4);
            ctx.lineTo(cx + arrowLen, cy);
            ctx.lineTo(cx + arrowLen - 6, cy + 4);
            ctx.fillStyle = COLORS.highlight;
            ctx.fill();

            cx += arrowLen;

            var isChainHighlighted = s.highlightChainItem &&
              s.highlightChainItem.bucket === i && s.highlightChainItem.index === j;

            var cny = cy - chainNodeH / 2;

            CanvasUtils.drawBlock(ctx, cx, cny, chainNodeW, chainNodeH, {
              fill: isChainHighlighted ? COLORS.success : COLORS.surface,
              stroke: isChainHighlighted ? COLORS.success : COLORS.border,
              glow: isChainHighlighted && COLORS.success,
              radius: 5,
              lineWidth: 1.5
            });

            ctx.fillStyle = COLORS.text;
            ctx.font = '11px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.key + ':' + item.val, cx + chainNodeW / 2, cy);

            cx += chainNodeW;
          }
        }
      }

      if (s.hashAnimText) {
        ctx.fillStyle = COLORS.accent;
        ctx.font = '13px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(s.hashAnimText, w - 40, 24);
      }

      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      var totalItems = 0;
      for (var ti = 0; ti < buckets.length; ti++) totalItems += buckets[ti].length;
      ctx.fillText('entries=' + totalItems + '  buckets=' + BUCKET_COUNT + '  |  ' + s.statusText, 40, 24);
    }
  });

  async function insertEntry() {
    LofiSounds.init(); LofiSounds.insert(0.5);
    var s = eng.state;
    if (s.animating) return;
    var key = getAvailableKey(s.usedKeys);
    if (!key) { s.statusText = 'all keys used \u2014 reset'; eng.draw(); return; }
    s.animating = true;

    var val = Math.floor(Math.random() * 99) + 1;
    var idx = hashFn(key);

    s.hashAnimText = 'hash("' + key + '") = ' + idx;
    s.highlightBucket = idx;
    s.statusText = 'hashing "' + key + '"...';
    eng.draw();
    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 6); });

    s.buckets[idx].push({ key: key, val: val });
    s.usedKeys.add(key);
    s.highlightChainItem = { bucket: idx, index: s.buckets[idx].length - 1 };
    s.statusText = 'inserted "' + key + '":' + val + ' \u2192 bucket[' + idx + ']';
    eng.draw();
    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 6); });

    s.highlightBucket = -1;
    s.highlightChainItem = null;
    s.hashAnimText = '';
    eng.draw();
    s.animating = false;
  }

  async function lookupEntry() {
    LofiSounds.init(); LofiSounds.visit(0.5);
    var s = eng.state;
    if (s.animating) return;
    var entries = getAllEntries(s.buckets);
    if (entries.length === 0) return;
    s.animating = true;

    var key;
    if (Math.random() < 0.8) {
      key = entries[Math.floor(Math.random() * entries.length)].key;
    } else {
      key = 'zzz';
    }

    var idx = hashFn(key);
    s.hashAnimText = 'hash("' + key + '") = ' + idx;
    s.highlightBucket = idx;
    s.statusText = 'looking up "' + key + '"...';
    eng.draw();
    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 5); });

    var found = false;
    for (var j = 0; j < s.buckets[idx].length; j++) {
      s.highlightChainItem = { bucket: idx, index: j };
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });
      if (s.buckets[idx][j].key === key) {
        s.statusText = 'found "' + key + '" = ' + s.buckets[idx][j].val;
        found = true;
        eng.draw();
        await new Promise(function (r) { setTimeout(r, eng.getDelay() * 6); });
        break;
      }
    }

    if (!found) {
      s.statusText = '"' + key + '" not found';
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });
    }

    s.highlightBucket = -1;
    s.highlightChainItem = null;
    s.hashAnimText = '';
    eng.draw();
    s.animating = false;
  }

  async function deleteEntry() {
    LofiSounds.init(); LofiSounds.remove();
    var s = eng.state;
    if (s.animating) return;
    var entries = getAllEntries(s.buckets);
    if (entries.length === 0) return;
    s.animating = true;

    var entry = entries[Math.floor(Math.random() * entries.length)];
    var idx = hashFn(entry.key);

    s.hashAnimText = 'hash("' + entry.key + '") = ' + idx;
    s.highlightBucket = idx;
    s.statusText = 'deleting "' + entry.key + '"...';
    eng.draw();
    await new Promise(function (r) { setTimeout(r, eng.getDelay() * 5); });

    for (var j = 0; j < s.buckets[idx].length; j++) {
      s.highlightChainItem = { bucket: idx, index: j };
      eng.draw();
      await new Promise(function (r) { setTimeout(r, eng.getDelay() * 3); });
      if (s.buckets[idx][j].key === entry.key) {
        s.buckets[idx].splice(j, 1);
        s.usedKeys.delete(entry.key);
        s.statusText = 'deleted "' + entry.key + '"';
        s.highlightChainItem = null;
        eng.draw();
        await new Promise(function (r) { setTimeout(r, eng.getDelay() * 4); });
        break;
      }
    }

    s.highlightBucket = -1;
    s.highlightChainItem = null;
    s.hashAnimText = '';
    eng.draw();
    s.animating = false;
  }

  // Events
  document.getElementById('btnInsert').addEventListener('click', insertEntry);
  document.getElementById('btnLookup').addEventListener('click', lookupEntry);
  document.getElementById('btnDelete').addEventListener('click', deleteEntry);
  document.getElementById('btnReset').addEventListener('click', function () { eng.generateData(eng.n); });
  document.getElementById('speedSlider').addEventListener('input', function (e) {
    eng.speed = parseInt(e.target.value);
  });

  window.addEventListener('resize', function () { eng.resize(); eng.draw(); });
})();
