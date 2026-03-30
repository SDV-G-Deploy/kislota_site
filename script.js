const grid = document.getElementById('latest-grid');
const chips = document.querySelectorAll('.chip[data-category]');
const quickFilterButtons = document.querySelectorAll('.filter-toggle[data-filter]');
const tickerTrack = document.getElementById('ticker-track');
const trendList = document.getElementById('trend-list');
const classMix = document.getElementById('class-mix');
const deskNotes = document.getElementById('desk-notes');

let activeCategory = 'All';
let activeSignal = null;

const storyClassMeta = {
  lead: { name: 'Lead', cue: 'Front spine', tone: 'psychic' },
  threat: { name: 'Threat', cue: 'Escalation watch', tone: 'threat' },
  premium: { name: 'Premium', cue: 'Deep analysis', tone: 'premium' },
  anomaly: { name: 'Anomaly', cue: 'Pattern break', tone: 'acid' },
  brief: { name: 'Brief', cue: 'Operational update', tone: 'alien' }
};

function labelsMarkup(labels = []) {
  return labels.map((label) => `<span class="label ${label}">${label}</span>`).join('');
}

function baseCardTop(item) {
  const meta = storyClassMeta[item.storyClass] || storyClassMeta.brief;
  return `
    <div class="card-top">
      <p class="kicker">${item.category} · ${item.edition}</p>
      <span class="signal-badge">${item.impact}</span>
    </div>
    <div class="card-class-mark">
      <span class="label ${meta.tone}">${meta.name}</span>
      <small>${meta.cue}</small>
    </div>
  `;
}

function cardWrapper(item, variantClass, inner) {
  const href = `article.html?story=${encodeURIComponent(item.id)}`;
  const toneClass = item.tone ? `tone-${item.tone}` : '';
  const spanClass = item.layoutSpan ? `span-${item.layoutSpan}` : '';
  const accentClass = item.accentRole ? `accent-${item.accentRole}` : '';
  return `
    <article class="panel card ${toneClass} class-${item.storyClass} ${variantClass} ${spanClass} ${accentClass}" data-category="${item.category}" data-labels="${item.labels.join(' ')}" data-story-class="${item.storyClass}">
      <a class="card-link" href="${href}" aria-label="Open story: ${item.title}">
        ${inner}
      </a>
    </article>
  `;
}

function leadCard(item) {
  return cardWrapper(item, 'card-lead', `
    ${baseCardTop(item)}
    <h4>${item.title}</h4>
    <p class="deck">${item.deck}</p>
    <div class="meta-line emphasis">
      <span>Conf. ${item.confidence}%</span>
      <span>${item.readTime} read</span>
      <span>By ${item.author}</span>
    </div>
    <div class="labels">${labelsMarkup(item.labels)}</div>
  `);
}

function threatCard(item) {
  return cardWrapper(item, 'card-threat', `
    ${baseCardTop(item)}
    <h4>${item.title}</h4>
    <p class="deck">${item.deck}</p>
    <div class="alert-row">
      <strong>Action window:</strong>
      <span>${item.timestamp} · ${item.coverage}</span>
    </div>
    <div class="meta-line compact">
      <span>Conf. ${item.confidence}%</span>
      <span>${item.readTime}</span>
    </div>
    <div class="labels">${labelsMarkup(item.labels)}</div>
  `);
}

function premiumCard(item) {
  return cardWrapper(item, 'card-premium', `
    ${baseCardTop(item)}
    <h4>${item.title}</h4>
    <p class="deck">${item.deck}</p>
    <div class="meta-line compact">
      <span>Context note: ${item.coverage}</span>
      <span>${item.readTime} read</span>
    </div>
    <div class="meta-line compact">
      <span>By ${item.author}</span>
      <span>Conf. ${item.confidence}%</span>
    </div>
    <div class="labels">${labelsMarkup(item.labels)}</div>
  `);
}

function anomalyCard(item) {
  return cardWrapper(item, 'card-anomaly', `
    ${baseCardTop(item)}
    <h4>${item.title}</h4>
    <p class="deck">${item.deck}</p>
    <div class="anomaly-row">
      <span class="label acid">anomaly</span>
      <span>${item.coverage}</span>
      <span>${item.timestamp}</span>
    </div>
    <div class="meta-line compact">
      <span>${item.readTime}</span>
      <span>Conf. ${item.confidence}%</span>
    </div>
  `);
}

function briefCard(item) {
  return cardWrapper(item, 'card-brief', `
    ${baseCardTop(item)}
    <h4>${item.title}</h4>
    <p class="deck">${item.deck}</p>
    <div class="meta-line compact">
      <span>${item.timestamp}</span>
      <span>${item.readTime}</span>
      <span>${item.coverage}</span>
    </div>
    <div class="labels">${labelsMarkup(item.labels)}</div>
  `);
}

function cardMarkup(item) {
  switch (item.storyClass) {
    case 'lead':
      return leadCard(item);
    case 'threat':
      return threatCard(item);
    case 'premium':
      return premiumCard(item);
    case 'anomaly':
      return anomalyCard(item);
    case 'brief':
    default:
      return briefCard(item);
  }
}

function emptyStateMarkup() {
  const signalNote = activeSignal ? ` + ${activeSignal}` : '';

  return `
    <article class="panel empty-state" role="status" aria-live="polite">
      <p class="kicker">No cards in this lane</p>
      <h4>0 stories match <span>${activeCategory}${signalNote}</span></h4>
      <p>Try another section or clear the pulse filter to widen the stream.</p>
    </article>
  `;
}

function getFilteredItems() {
  return window.newsItems
    .filter((item) => {
      const byCategory = activeCategory === 'All' || item.category === activeCategory;
      const bySignal = !activeSignal || item.labels.includes(activeSignal);
      return byCategory && bySignal;
    })
    .sort((a, b) => (b.layoutWeight || 0) - (a.layoutWeight || 0));
}

function render(items) {
  if (!grid) return;
  if (!items.length) {
    grid.innerHTML = emptyStateMarkup();
    return;
  }
  grid.innerHTML = items.map(cardMarkup).join('');
}

function setPressedState(buttons, predicate) {
  buttons.forEach((btn) => {
    const isActive = predicate(btn);
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function setActiveChip(category) {
  activeCategory = category;
  setPressedState(chips, (chip) => chip.dataset.category === category);
}

function setActiveSignal(signal) {
  activeSignal = signal;
  setPressedState(quickFilterButtons, (btn) => btn.dataset.filter === signal);
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

  if (!items.length) {
    trendList.innerHTML = '<li class="trend-empty"><strong>No active tags for this filter</strong></li>';
    return;
  }

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

function renderClassMix(items) {
  if (!classMix) return;
  const counts = items.reduce((acc, item) => {
    acc[item.storyClass] = (acc[item.storyClass] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) {
    classMix.innerHTML = '<li class="trend-empty"><strong>No class mix for this filter</strong></li>';
    return;
  }

  classMix.innerHTML = sorted
    .map(([storyClass, count]) => {
      const meta = storyClassMeta[storyClass] || storyClassMeta.brief;
      return `<li><span class="label ${meta.tone}">${meta.name}</span><strong>${count} cards</strong></li>`;
    })
    .join('');
}

function renderDeskNotes(items) {
  if (!deskNotes) return;
  const urgent = items.filter((item) => item.storyClass === 'threat').length;
  const premium = items.filter((item) => item.storyClass === 'premium').length;
  const anomaly = items.filter((item) => item.storyClass === 'anomaly').length;

  deskNotes.innerHTML = `
    <li><span>Escalation lane</span><strong>${urgent || 0} active</strong></li>
    <li><span>Premium depth</span><strong>${premium || 0} queued</strong></li>
    <li><span>Anomaly checks</span><strong>${anomaly || 0} flagged</strong></li>
  `;
}

function renderStats(items) {
  const total = items.length;
  const urgent = items.filter((item) => item.storyClass === 'threat').length;
  const avg = total ? Math.round(items.reduce((sum, item) => sum + item.confidence, 0) / total) : 0;

  const totalEl = document.getElementById('total-stories');
  const urgentEl = document.getElementById('total-urgent');
  const avgEl = document.getElementById('avg-confidence');

  if (totalEl) totalEl.textContent = String(total);
  if (urgentEl) urgentEl.textContent = String(urgent);
  if (avgEl) avgEl.textContent = `${avg}%`;
}

function getStoryById(storyId) {
  return window.newsItems.find((item) => item.id === storyId);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatHeroTitle(story) {
  const baseTitle = escapeHtml(story.title || '');
  const accent = (story.heroAccentPhrase || '').trim();
  if (!accent) return baseTitle;
  return `${baseTitle} <span class="hero-accent">${escapeHtml(accent)}</span>`;
}

function hydrateHero() {
  const heroRoot = document.getElementById('hero-story');
  if (!heroRoot || !window.editionConfig) return;

  const story = getStoryById(window.editionConfig.heroStoryId) || window.newsItems[0];
  if (!story) return;

  heroRoot.querySelector('[data-hero-kicker]').textContent = `Lead Story · ${story.edition}`;
  heroRoot.querySelector('[data-hero-title]').innerHTML = formatHeroTitle(story);
  heroRoot.querySelector('[data-hero-deck]').textContent = story.deck;

  const meta = heroRoot.querySelectorAll('[data-hero-meta]');
  if (meta[0]) meta[0].innerHTML = `<span>Updated</span> ${story.timestamp}`;
  if (meta[1]) meta[1].innerHTML = `<span>Edition</span> #${window.editionConfig.editionId} / ${window.editionConfig.editionName}`;
  if (meta[2]) meta[2].innerHTML = `<span>Signal mix</span> ${story.labels.slice(0, 3).join(' · ')}`;

  const readLink = heroRoot.querySelector('[data-hero-link]');
  if (readLink) readLink.setAttribute('href', `article.html?story=${encodeURIComponent(story.id)}`);
}

function hydrateFeatured() {
  const featuredRoot = document.getElementById('featured-premium');
  if (!featuredRoot || !window.editionConfig) return;

  const story = getStoryById(window.editionConfig.featuredStoryId) || window.newsItems.find((item) => item.storyClass === 'premium') || window.newsItems[0];
  if (!story) return;

  const link = `article.html?story=${encodeURIComponent(story.id)}`;
  featuredRoot.querySelector('[data-featured-title]').textContent = story.title;
  featuredRoot.querySelector('[data-featured-deck]').textContent = story.deck;
  featuredRoot.querySelector('[data-featured-meta]').textContent = `${story.edition} · ${story.readTime} · Conf. ${story.confidence}%`;

  const cta = featuredRoot.querySelector('[data-featured-link]');
  if (cta) cta.setAttribute('href', link);

  const mastheadFeaturedLink = document.querySelector('[data-masthead-featured-link]');
  if (mastheadFeaturedLink) mastheadFeaturedLink.setAttribute('href', link);
}

function rerender() {
  const items = getFilteredItems();
  render(items);
  renderTrends(items);
  renderClassMix(items);
  renderDeskNotes(items);
  renderStats(items);
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
hydrateHero();
hydrateFeatured();
setActiveChip(activeCategory);
setActiveSignal(activeSignal);
rerender();
