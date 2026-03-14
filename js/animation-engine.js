/**
 * Shared animation engine for CS Animations.
 * Handles canvas setup, DPI scaling, play/pause/step/reset state machine,
 * step queue execution, and standard control wiring.
 *
 * Usage:
 *   var engine = AnimationEngine({
 *     generateData: function (size, engine) { ... },
 *     generateSteps: function (engine) { return [...steps]; },
 *     executeStep: function (step, engine) { return Promise; },
 *     draw: function (engine) { ... },
 *     onComplete: function (engine) { ... },      // optional cleanup
 *     canvasHeight: 500,                           // optional, default 500
 *     initialSize: 24,                             // optional, default 24
 *     autoWireControls: true,                      // optional, default true
 *     playBtnId: 'btnPlay',                        // optional
 *     playLabel: '▶ Play',                         // optional
 *     pauseLabel: '❚❚ Pause',                      // optional
 *   });
 */
window.AnimationEngine = function (config) {
  var canvas = config.canvas || document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var canvasHeight = config.canvasHeight || 500;

  var engine = {
    canvas: canvas,
    ctx: ctx,
    state: {},
    w: 0,
    h: canvasHeight,
    running: false,
    speed: 50,
    stepQueue: [],
    n: config.initialSize || 24,

    resize: function () {
      var container = canvas.parentElement;
      var dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = canvasHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = container.clientWidth + 'px';
      canvas.style.height = canvasHeight + 'px';
      engine.w = container.clientWidth;
    },

    getDelay: function () {
      return Math.max(10, 500 - (engine.speed / 100) * 490);
    },

    easeInOutCubic: function (t) {
      // Delegates to CanvasUtils if available, otherwise inline
      if (window.CanvasUtils && CanvasUtils.easeInOutCubic) return CanvasUtils.easeInOutCubic(t);
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    draw: function () {
      config.draw(engine);
    },

    generateData: function (size) {
      engine.n = size;
      engine.running = false;
      engine.stepQueue = [];
      config.generateData(size, engine);
      engine.updatePlayBtn();
      engine.draw();
    },

    play: async function () {
      if (engine.running) {
        engine.running = false;
        engine.updatePlayBtn();
        return;
      }

      if (engine.stepQueue.length === 0) {
        engine.stepQueue = config.generateSteps(engine);
      }

      engine.running = true;
      engine.updatePlayBtn();

      while (engine.stepQueue.length > 0 && engine.running) {
        var step = engine.stepQueue.shift();
        await config.executeStep(step, engine);
      }

      if (engine.stepQueue.length === 0) {
        engine.running = false;
        if (config.onComplete) config.onComplete(engine);
        engine.draw();
      }
      engine.updatePlayBtn();
    },

    step: async function () {
      if (engine.running) return;
      if (engine.stepQueue.length === 0) {
        engine.stepQueue = config.generateSteps(engine);
      }
      if (engine.stepQueue.length > 0) {
        var s = engine.stepQueue.shift();
        await config.executeStep(s, engine);
        if (engine.stepQueue.length === 0) {
          if (config.onComplete) config.onComplete(engine);
          engine.draw();
        }
      }
    },

    updatePlayBtn: function () {
      var btn = document.getElementById(config.playBtnId || 'btnPlay');
      if (!btn) return;
      var playLabel = config.playLabel || '\u25B6 Play';
      var pauseLabel = config.pauseLabel || '\u275A\u275A Pause';
      btn.textContent = engine.running ? pauseLabel : playLabel;
    }
  };

  // Auto-wire standard controls
  if (config.autoWireControls !== false) {
    var playBtn = document.getElementById(config.playBtnId || 'btnPlay');
    var stepBtn = document.getElementById('btnStep');
    var resetBtn = document.getElementById('btnReset');
    var speedSlider = document.getElementById('speedSlider');
    var sizeSlider = document.getElementById('sizeSlider');

    if (playBtn) playBtn.addEventListener('click', engine.play);
    if (stepBtn) stepBtn.addEventListener('click', engine.step);
    if (resetBtn) resetBtn.addEventListener('click', function () {
      engine.generateData(engine.n);
    });
    if (speedSlider) speedSlider.addEventListener('input', function (e) {
      engine.speed = parseInt(e.target.value);
    });
    if (sizeSlider) sizeSlider.addEventListener('input', function (e) {
      engine.generateData(parseInt(e.target.value));
    });

    window.addEventListener('resize', function () {
      engine.resize();
      engine.draw();
    });
  }

  // Init
  engine.resize();
  engine.generateData(engine.n);

  return engine;
};
