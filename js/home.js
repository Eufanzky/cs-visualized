/**
 * Homepage — renders category cards with mouse-tracking glow effect,
 * progress indicators, and staggered entrance animations.
 */

(function () {
  const grid = document.getElementById('categoriesGrid');

  CATEGORIES.forEach((cat, i) => {
    const card = document.createElement('a');
    card.href = `animations/${cat.id}/index.html`;
    card.className = 'category-card';
    card.style.setProperty('--card-accent', cat.accent);
    card.style.setProperty('--card-glow', cat.glow);

    const readyCount = cat.animations.filter(a => a.status === 'ready').length;
    const totalCount = cat.animations.length;
    const progressPct = totalCount > 0 ? (readyCount / totalCount) * 100 : 0;

    card.innerHTML = `
      <div class="card__icon">${cat.icon}</div>
      <h3 class="card__title">
        ${cat.title}
        <span class="card__arrow">&rarr;</span>
      </h3>
      <p class="card__desc">${cat.description}</p>
      <div class="card__progress">
        <div class="card__progress-bar">
          <div class="card__progress-fill" style="width: ${progressPct}%"></div>
        </div>
        <span class="card__progress-label">
          <span class="ready-count">${readyCount}</span>/${totalCount} ready
        </span>
      </div>
      <div class="card__topics">
        ${cat.animations.map(a =>
          `<span class="card__tag${a.status === 'ready' ? ' card__tag--ready' : ''}">${a.title}</span>`
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

  // ── Staggered cascade entrance via IntersectionObserver ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = Array.from(grid.children).indexOf(entry.target);
        entry.target.style.opacity = '0';
        entry.target.style.animation = `cardCascade 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${
          idx * 0.07
        }s forwards`;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll('.category-card').forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
  });
})();
