/**
 * Ambient background — soft floating particles with gentle drift.
 * Warm bokeh dots in the palette colors, slow and cozy.
 */

(function () {
  const canvas = document.getElementById('ambientBg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Palette — translucent versions of the syntax colors
  const COLORS = [
    { r: 203, g: 178, b: 237 }, // lavender
    { r: 240, g: 198, b: 195 }, // soft rose
    { r: 168, g: 216, b: 223 }, // soft teal
    { r: 247, g: 204, b: 147 }, // warm gold
    { r: 240, g: 173, b: 169 }, // soft coral
    { r: 179, g: 228, b: 165 }, // soft green
  ];

  let particles = [];
  let w, h, dpr;
  let mouse = { x: -1000, y: -1000 };
  let animId;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticle(startY) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const size = Math.random() * 4 + 2;                  // 2 – 6px
    const opacity = Math.random() * 0.12 + 0.04;        // 0.04 – 0.16
    const y = startY !== undefined ? startY : Math.random() * h;

    return {
      x: Math.random() * w,
      y: y,
      size: size,
      baseOpacity: opacity,
      opacity: opacity,
      color: color,
      // Slow drift
      vx: (Math.random() - 0.5) * 0.15,
      vy: -(Math.random() * 0.12 + 0.04),              // gently rise
      // Soft pulsing
      pulseOffset: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.004 + 0.002,
      // Gentle sway
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.003 + 0.001,
      swayAmount: Math.random() * 0.3 + 0.1,
    };
  }

  function init() {
    resize();
    particles = [];
    // Scale count to screen area, keep it sparse
    const count = Math.floor((w * h) / 18000);
    for (let i = 0; i < count; i++) {
      particles.push(createParticle());
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      // Update position
      p.x += p.vx + Math.sin(time * p.swaySpeed + p.swayOffset) * p.swayAmount;
      p.y += p.vy;

      // Pulse opacity
      const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset);
      p.opacity = p.baseOpacity + pulse * p.baseOpacity * 0.5;

      // Gentle mouse repel — very subtle, just a nudge
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.3;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      // Recycle particles that drift off screen
      if (p.y < -20 || p.x < -20 || p.x > w + 20) {
        particles[i] = createParticle(h + 10);
        continue;
      }

      // Draw soft bokeh dot
      const { r, g, b } = p.color;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.opacity})`);
      grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.4})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Occasional thin connection lines between nearby particles
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = dx * dx + dy * dy;
        const threshold = 14000; // ~118px
        if (dist < threshold) {
          const alpha = (1 - dist / threshold) * 0.06;
          const cr = Math.round((a.color.r + b.color.r) / 2);
          const cg = Math.round((a.color.g + b.color.g) / 2);
          const cb = Math.round((a.color.b + b.color.b) / 2);
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  // Track mouse for gentle repel
  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.addEventListener('mouseleave', function () {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // Pause when tab is hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      animId = requestAnimationFrame(draw);
    }
  });

  window.addEventListener('resize', function () {
    resize();
    // Re-seed particles for new dimensions
    const count = Math.floor((w * h) / 18000);
    while (particles.length < count) particles.push(createParticle());
    while (particles.length > count) particles.pop();
  });

  init();
  animId = requestAnimationFrame(draw);
})();
