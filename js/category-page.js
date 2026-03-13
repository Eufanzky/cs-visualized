/**
 * Shared script for category index pages.
 * Reads the category ID from a data attribute and renders animation cards.
 */

(function () {
  const grid = document.getElementById('animGrid');
  const catId = grid.dataset.category;
  const cat = CATEGORIES.find(c => c.id === catId);

  if (!cat) return;

  cat.animations.forEach(anim => {
    const card = document.createElement('a');
    card.className = 'anim-card';
    card.href = anim.status === 'ready' ? `${anim.id}.html` : '#';
    if (anim.status !== 'ready') card.style.opacity = '0.5';

    card.innerHTML = `
      <div class="anim-card__status anim-card__status--${anim.status}">
        ${anim.status === 'ready' ? '● ready' : '○ coming soon'}
      </div>
      <h3 class="anim-card__title">${anim.title}</h3>
      <span class="anim-card__complexity">${anim.complexity}</span>
    `;

    grid.appendChild(card);
  });
})();
