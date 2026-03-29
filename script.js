const grid = document.getElementById('latest-grid');
const chips = document.querySelectorAll('.chip[data-category]');
const quickFilterButtons = document.querySelectorAll('.filter-toggle[data-filter]');
const tickerTrack = document.getElementById('ticker-track');
const trendList = document.getElementById('trend-list');

let activeCategory = 'All';
let activeSignal = null;

function labelsMarkup(labels = []) {
  return labels.map((label) => `<span class="label ${label}">${label}</span>`).join('');
}

function cardMarkup(item) {
  const toneClass = item.tone ? `tone-${item.tone}` : '';
  return `
    <article class="panel card ${toneClass}" data-category="${item.category}" data-labels="${item.labels.join(' ')}">
      <div class="card-top">
        <p class="kicker">${item.category} · ${item.edition}</p>
        <span class="signal-badge">${item.impact}</span>
      </div>
      <h4>${item.title}</h4>
      <p class="deck">${item.deck}</p>
      <div class="meta-line">
        <span>${item.timestamp}</span>
        <span>${item.readTime} read</span>
        <span>Conf. ${item.confidence}%</span>
      </div>
      <div class="meta-line compact">
        <span>By ${item.author}</span>
        <span>${item.coverage}</span>
      </div>
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
  if (!grid) return;
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

function renderTicker() {
  if (!tickerTrack || !window.tickerItems) return;
  const content = window.tickerItems
    .map((item) => `<span class="ticker-item">${item}</span>`)
    .join('<span class="ticker-sep">✦</span>');
  tickerTrack.innerHTML = `${content}<span class="ticker-sep">✦</span>${content}`;
}

function renderTrends(items) {
  if (!trendList) return;
  const byLabel = items.reduce((acc, item) => {
    item.labels.forEach((label) => {
      acc[label] = (acc[label] || 0) + 1;
    });
    return acc;
  }, {});

  const sorted = Object.entries(byLabel)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  trendList.innerHTML = sorted
    .map(([label, count]) => `<li><span class="label ${label}">${label}</span><strong>${count} stories</strong></li>`)
    .join('');
}

function renderStats(items) {
  const total = items.length;
  const urgent = items.filter((item) => item.labels.includes('threat')).length;
  const avg = Math.round(items.reduce((sum, item) => sum + item.confidence, 0) / total);

  const totalEl = document.getElementById('total-stories');
  const urgentEl = document.getElementById('total-urgent');
  const avgEl = document.getElementById('avg-confidence');

  if (totalEl) totalEl.textContent = String(total);
  if (urgentEl) urgentEl.textContent = String(urgent);
  if (avgEl) avgEl.textContent = `${avg}%`;
}

function rerender() {
  const items = getFilteredItems();
  render(items);
  renderTrends(items.length ? items : window.newsItems);
  renderStats(items.length ? items : window.newsItems);
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    setActiveChip(chip.dataset.category);
    rerender();
  });
});

quickFilterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const signal = btn.dataset.filter;
    setActiveSignal(activeSignal === signal ? null : signal);
    rerender();
  });
});

renderTicker();
rerender();