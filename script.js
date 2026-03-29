const grid = document.getElementById('news-grid');
const chips = document.querySelectorAll('.chip[data-category]');
const quickFilterButtons = document.querySelectorAll('.filter-toggle[data-filter]');

function labelsMarkup(labels = []) {
  return labels
    .map(label => `<span class="label ${label}">${label}</span>`)
    .join('');
}

function cardMarkup(item) {
  return `
    <article class="panel card" data-category="${item.category}" data-labels="${item.labels.join(' ')}">
      <p class="meta">${item.category} · ${item.time}</p>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <div class="labels">${labelsMarkup(item.labels)}</div>
    </article>
  `;
}

function render(items) {
  grid.innerHTML = items.map(cardMarkup).join('');
}

function setActiveChip(category) {
  chips.forEach(chip => chip.classList.toggle('active', chip.dataset.category === category));
}

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    const category = chip.dataset.category;
    setActiveChip(category);
    const items = category === 'All'
      ? window.newsItems
      : window.newsItems.filter(item => item.category === category);
    render(items);
  });
});

quickFilterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const kind = btn.dataset.filter;
    const filtered = window.newsItems.filter(item => item.labels.includes(kind));
    render(filtered.length ? filtered : window.newsItems);
  });
});

render(window.newsItems);
