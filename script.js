const grid = document.getElementById('news-grid');
const chips = document.querySelectorAll('.chip[data-category]');
const quickFilterButtons = document.querySelectorAll('.filter-toggle[data-filter]');

let activeCategory = 'All';
let activeSignal = null;

function labelsMarkup(labels = []) {
  return labels
    .map((label) => `<span class="label ${label}">${label}</span>`)
    .join('');
}

function cardMarkup(item) {
  const toneClass = item.tone ? `tone-${item.tone}` : '';
  return `
    <article class="panel card ${toneClass}" data-category="${item.category}" data-labels="${item.labels.join(' ')}">
      <div class="card-cover-line"></div>
      <p class="meta">${item.category} · ${item.time}</p>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <div class="labels">${labelsMarkup(item.labels)}</div>
    </article>
  `;
}

function getFilteredItems() {
  return window.newsItems.filter((item) => {
    const byCategory = activeCategory === 'All' || item.category === activeCategory;
    const bySignal = !activeSignal || item.labels.includes(activeSignal);
    return byCategory && bySignal;
  });
}

function render(items) {
  const list = items.length ? items : window.newsItems;
  grid.innerHTML = list.map(cardMarkup).join('');
}

function setActiveChip(category) {
  activeCategory = category;
  chips.forEach((chip) => chip.classList.toggle('active', chip.dataset.category === category));
}

function setActiveSignal(signal) {
  activeSignal = signal;
  quickFilterButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.filter === signal));
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    setActiveChip(chip.dataset.category);
    render(getFilteredItems());
  });
});

quickFilterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const signal = btn.dataset.filter;
    setActiveSignal(activeSignal === signal ? null : signal);
    render(getFilteredItems());
  });
});

render(window.newsItems);