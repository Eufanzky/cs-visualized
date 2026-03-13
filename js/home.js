/**
 * Homepage — renders category cards with mouse-tracking glow effect.
 */

(function () {
  const grid = document.getElementById('categoriesGrid');

  CATEGORIES.forEach((cat, i) => {
    const card = document.createElement('a');
    card.href = `animations/${cat.id}/index.html`;
    card.className = 'category-card';
    card.style.setProperty('--card-accent', cat.accent);
    card.style.setProperty('--card-glow', cat.glow);
    card.style.animationDelay = `${i * 0.08}s`;

    const readyCount = cat.animations.filter(a => a.status === 'ready').length;
    const totalCount = cat.animations.length;

    card.innerHTML = `
      <div class="card__icon">${cat.icon}</div>
      <h3 class="card__title">
        ${cat.title}
        <span class="card__arrow">&rarr;</span>
      </h3>
      <p class="card__desc">${cat.description}</p>
      <div class="card__topics">
        ${cat.animations.map(a =>
          `<span class="card__tag">${a.title}</span>`
        ).join('')}
      </div>
    `;

    // Mouse-tracking glow
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });

    grid.appendChild(card);
  });

  // ── Stagger entrance ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '0';
        entry.target.style.animation = `fadeSlideUp 0.5s ease ${
          Array.from(grid.children).indexOf(entry.target) * 0.08
        }s forwards`;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.category-card').forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
  });
})();
