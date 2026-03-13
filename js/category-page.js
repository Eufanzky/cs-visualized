/**
 * Shared script for category index pages.
 * Reads the category ID from a data attribute and renders animation cards
 * with status-aware styling and staggered entrance animations.
 */

(function () {
  const grid = document.getElementById('animGrid');
  const catId = grid.dataset.category;
  const cat = CATEGORIES.find(c => c.id === catId);

  if (!cat) return;

  cat.animations.forEach(anim => {
    const isReady = anim.status === 'ready';
    const card = document.createElement('a');
    // Apply status-specific modifier class for styling
    card.className = `anim-card anim-card--${anim.status}`;
    card.href = isReady ? `${anim.id}.html` : '#';

    // Prevent navigation on coming-soon cards
    if (!isReady) {
      card.addEventListener('click', (e) => e.preventDefault());
    }

    card.innerHTML = `
      <div class="anim-card__status anim-card__status--${anim.status}">
        ${isReady ? '● ready' : '○ coming soon'}
      </div>
      <h3 class="anim-card__title">${anim.title}</h3>
      <span class="anim-card__complexity">${anim.complexity}</span>
    `;

    grid.appendChild(card);
  });
})();
