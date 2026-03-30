const grid = document.getElementById('latest-grid');
const chips = document.querySelectorAll('.chip[data-category]');
const quickFilterButtons = document.querySelectorAll('.filter-toggle[data-filter]');
const tickerTrack = document.getElementById('ticker-track');
const trendList = document.getElementById('trend-list');

const heroKicker = document.getElementById('hero-kicker');
const heroTitle = document.getElementById('hero-title');
const heroDeck = document.getElementById('hero-deck');
const heroUpdated = document.getElementById('hero-meta-updated');
const heroEdition = document.getElementById('hero-meta-edition');
const heroSignalMix = document.getElementById('hero-meta-signal-mix');
const heroPrimaryCta = document.getElementById('hero-primary-cta');

const featuredKicker = document.getElementById('featured-kicker');
const featuredTitle = document.getElementById('featured-title');
const featuredDeck = document.getElementById('featured-deck');
const featuredMeta = document.getElementById('featured-meta');
const featuredLabels = document.getElementById('featured-labels');
const featuredCta = document.getElementById('featured-cta');
const smokeStatusList = document.getElementById('smoke-status-list');
const editionNote = document.getElementById('edition-note');
const mastheadFeaturedLink = document.getElementById('masthead-featured-link');

let activeCategory = 'All';
let activeSignal = null;

const smokeState = {
  source: 'fallback',
  sourceNote: 'demo data',
  itemCount: 0,
  tickerCount: 0,
  heroHydrated: false,
  featuredHydrated: false,
  articleLinksResolvable: 0,
  articleLinksTotal: 0,
  payloadTimestamp: '',
  editionId: '',
  error: ''
};

function labelsMarkup(labels = []) {
  return labels.map((label) => `<span class="label ${label}">${label}</span>`).join('');
}

function cardMarkup(item) {
  const toneClass = item.tone ? `tone-${item.tone}` : '';
  const storyClass = item.storyClass ? `story-${item.storyClass}` : '';
  const accentRole = item.accentRole ? `accent-${item.accentRole}` : '';
  const layoutSpan = item.layoutSpan ? `span-${item.layoutSpan}` : '';
  const labels = Array.isArray(item.labels) ? item.labels : [];
  const href = sanitizeHref(item.href || `article.html?id=${encodeURIComponent(item.articleId || item.id || '')}`);
  return `
    <a class="card-link ${layoutSpan}" href="${href}">
      <article class="panel card ${toneClass} ${storyClass} ${accentRole}" data-category="${item.category}" data-labels="${labels.join(' ')}">
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
        <div class="labels">${labelsMarkup(labels)}</div>
      </article>
    </a>
  `;
}

function getFilteredItems() {
  return window.newsItems.filter((item) => {
    const byCategory = activeCategory === 'All' || item.category === activeCategory;
    const labels = Array.isArray(item.labels) ? item.labels : [];
    const bySignal = !activeSignal || labels.includes(activeSignal);
    return byCategory && bySignal;
  });
}

function render(items) {
  if (!grid) return;

  if (!items.length) {
    const categoryNote = activeCategory !== 'All' ? ` in “${activeCategory}”` : '';
    const signalNote = activeSignal ? ` with signal “${activeSignal}”` : '';
    grid.innerHTML = `
      <article class="panel card empty-state-card" role="status" aria-live="polite">
        <div class="card-top">
          <p class="kicker">No matching stories</p>
          <span class="signal-badge">Filter state</span>
        </div>
        <h4>Nothing matches the current filter set</h4>
        <p class="deck">No digest cards found${categoryNote}${signalNote}. Clear one filter to return to the latest published cards.</p>
      </article>
    `;
    return;
  }

  grid.innerHTML = items.map(cardMarkup).join('');
}

function setActiveChip(category) {
  activeCategory = category;
  chips.forEach((chip) => chip.classList.toggle('active', chip.dataset.category === category));
}

function setActiveSignal(signal) {
  activeSignal = signal;
  quickFilterButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.filter === signal));
}

let tickerCleanup = null;

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function makeTickerSegmentMarkup(items) {
  return items
    .map((item) => `<span class="ticker-item">${item}</span>`)
    .join('<span class="ticker-sep" aria-hidden="true">✦</span>');
}

function applyTickerMetrics() {
  if (!tickerTrack) return;
  const segment = tickerTrack.querySelector('.ticker-segment');
  if (!segment) return;

  const loopDistance = Math.max(1, Math.ceil(segment.getBoundingClientRect().width));
  const pxPerSecond = 68;
  const duration = Math.max(16, Math.round((loopDistance / pxPerSecond) * 10) / 10);

  tickerTrack.style.setProperty('--ticker-loop-distance', `${loopDistance}px`);
  tickerTrack.style.setProperty('--ticker-duration', `${duration}s`);
}

function initTickerMarquee() {
  if (!tickerTrack || prefersReducedMotion()) return;

  applyTickerMetrics();

  let resizeObserver = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(applyTickerMetrics);
    });
    const segment = tickerTrack.querySelector('.ticker-segment');
    if (segment) resizeObserver.observe(segment);
  }

  const onResize = () => window.requestAnimationFrame(applyTickerMetrics);
  window.addEventListener('resize', onResize);

  tickerCleanup = () => {
    window.removeEventListener('resize', onResize);
    if (resizeObserver) resizeObserver.disconnect();
  };
}

function renderTicker() {
  if (!tickerTrack) return;

  if (typeof tickerCleanup === 'function') {
    tickerCleanup();
    tickerCleanup = null;
  }

  if (!Array.isArray(window.tickerItems) || window.tickerItems.length === 0) {
    tickerTrack.classList.remove('ticker-ready');
    tickerTrack.innerHTML = '<span class="ticker-item">Live feed online</span>';
    tickerTrack.style.removeProperty('--ticker-loop-distance');
    tickerTrack.style.removeProperty('--ticker-duration');
    return;
  }

  const segmentMarkup = makeTickerSegmentMarkup(window.tickerItems);
  tickerTrack.innerHTML = `
    <span class="ticker-segment" aria-hidden="false">${segmentMarkup}</span>
    <span class="ticker-sep" aria-hidden="true">✦</span>
    <span class="ticker-segment" aria-hidden="true">${segmentMarkup}</span>
  `;
  tickerTrack.classList.add('ticker-ready');

  initTickerMarquee();
}

function renderTrends(items) {
  if (!trendList) return;
  const byLabel = items.reduce((acc, item) => {
    const labels = Array.isArray(item.labels) ? item.labels : [];
    labels.forEach((label) => {
      acc[label] = (acc[label] || 0) + 1;
    });
    return acc;
  }, {});

  const sorted = Object.entries(byLabel)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  trendList.innerHTML = sorted.length
    ? sorted
        .map(([label, count]) => `<li><span class="label ${label}">${label}</span><strong>${count} stories</strong></li>`)
        .join('')
    : '<li><strong>No active label trends</strong></li>';
}

function renderStats(items) {
  const total = items.length;
  const urgent = items.filter((item) => {
    const labels = Array.isArray(item.labels) ? item.labels : [];
    return labels.includes('threat');
  }).length;
  const avg = total ? Math.round(items.reduce((sum, item) => sum + (Number(item.confidence) || 0), 0) / total) : 0;

  const totalEl = document.getElementById('total-stories');
  const urgentEl = document.getElementById('total-urgent');
  const avgEl = document.getElementById('avg-confidence');

  if (totalEl) totalEl.textContent = String(total);
  if (urgentEl) urgentEl.textContent = String(urgent);
  if (avgEl) avgEl.textContent = `${avg}%`;
}

function rerender() {
  const items = getFilteredItems();
  const baseItems = window.newsItems;
  render(items);
  renderTrends(items.length ? items : baseItems);
  renderStats(items.length ? items : baseItems);
}

function formatIsoToUtc(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes} UTC`;
}

function sanitizeHref(href) {
  if (!href || typeof href !== 'string') return 'article.html';
  const trimmed = href.trim();
  if (!trimmed) return 'article.html';
  if (/^(\.\/|\.\.\/|\/|[a-z0-9_-]+\.html(?:\?[^#]*)?(?:#.*)?$)/i.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed, window.location.origin);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
  } catch (_) {
    return 'article.html';
  }

  return 'article.html';
}

function setSafeHref(anchor, href) {
  if (!anchor) return;
  const safeHref = sanitizeHref(href);
  anchor.setAttribute('href', safeHref);

  const isExternal = /^https?:\/\//i.test(safeHref);
  if (isExternal) {
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');
  } else {
    anchor.removeAttribute('target');
    anchor.removeAttribute('rel');
  }
}

function splitTitleForAccent(rawTitle) {
  const title = (rawTitle || '').trim();
  if (!title) return null;

  const separatorMatch = title.match(/[:—–-]\s+/);
  if (separatorMatch && separatorMatch.index !== undefined) {
    const splitAt = separatorMatch.index + separatorMatch[0].length;
    const before = title.slice(0, splitAt);
    const afterPart = title.slice(splitAt).trim();
    const words = afterPart.split(/\s+/).filter(Boolean);
    const accent = words.slice(0, Math.min(4, words.length)).join(' ');
    const after = words.slice(Math.min(4, words.length)).join(' ');
    if (accent) return { before: `${before} `, accent, after: after ? ` ${after}` : '' };
  }

  const words = title.split(/\s+/).filter(Boolean);
  if (words.length >= 6) {
    const accentStart = Math.max(1, Math.floor(words.length / 2) - 1);
    const accent = words.slice(accentStart, accentStart + 3).join(' ');
    const before = words.slice(0, accentStart).join(' ');
    const after = words.slice(accentStart + 3).join(' ');
    return { before: before ? `${before} ` : '', accent, after: after ? ` ${after}` : '' };
  }

  return { before: '', accent: title, after: '' };
}

function setAccentedHeadline(element, title, accentClass = 'hero-accent') {
  if (!element) return;
  const split = splitTitleForAccent(title);
  if (!split) return;

  element.replaceChildren();
  if (split.before) element.appendChild(document.createTextNode(split.before));

  const accent = document.createElement('span');
  accent.className = accentClass;
  accent.textContent = split.accent;
  element.appendChild(accent);

  if (split.after) element.appendChild(document.createTextNode(split.after));
}

function deriveLeadLabels(item) {
  const labels = new Set();

  const category = String(item?.category || '').toLowerCase();
  if (category.includes('security') || category.includes('policy')) labels.add('threat');
  else if (category.includes('science')) labels.add('acid');
  else if (category.includes('business')) labels.add('hotspot');
  else labels.add('psychic');

  const impact = String(item?.impact || '').toLowerCase();
  if (impact.includes('high')) labels.add('threat');
  else if (impact.includes('medium')) labels.add('hotspot');
  else labels.add('alien');

  const confidence = Number(item?.confidence) || 0;
  if (confidence >= 85) labels.add('premium');

  if (Array.isArray(item?.labels)) {
    item.labels.forEach((label) => {
      if (['psychic', 'alien', 'threat', 'acid', 'hotspot', 'premium'].includes(label)) labels.add(label);
    });
  }

  return Array.from(labels).slice(0, 3);
}

function renderFeaturedLabels(item) {
  if (!featuredLabels) return;
  const labels = deriveLeadLabels(item);
  if (!labels.length) return;

  featuredLabels.replaceChildren();
  labels.forEach((label) => {
    const span = document.createElement('span');
    span.className = `label ${label}`;
    span.textContent = label;
    featuredLabels.appendChild(span);
  });
}

function normalizeLeadItem(item) {
  if (!item || typeof item !== 'object' || !item.title) return null;

  const articleId = item.articleId ?? item.id ?? '';

  return {
    articleId,
    title: item.title,
    deck: item.deck ?? '',
    category: item.category ?? 'General',
    timestamp: item.timestamp ?? '',
    author: item.author ?? 'Desk',
    coverage: item.coverage ?? 'General',
    confidence: Number(item.confidence) || 0,
    impact: item.impact ?? 'Low',
    labels: Array.isArray(item.labels) ? item.labels : [],
    kicker: item.kicker ?? '',
    meta: item.meta ?? '',
    ctaLabel: item.ctaLabel ?? 'Read more',
    href: item.href ?? `article.html?id=${encodeURIComponent(articleId)}`
  };
}

function renderLeadPanels(hero, featured) {
  if (hero) {
    if (heroKicker) {
      heroKicker.textContent = hero.kicker || `Lead Story · ${hero.category} Desk`;
      const blip = document.createElement('span');
      blip.className = 'kicker-blip';
      blip.setAttribute('aria-hidden', 'true');
      blip.textContent = '⬢';
      heroKicker.appendChild(document.createTextNode(' '));
      heroKicker.appendChild(blip);
    }
    if (heroTitle) setAccentedHeadline(heroTitle, hero.title, 'hero-accent');
    if (heroDeck) heroDeck.textContent = hero.deck;
    if (heroUpdated) heroUpdated.textContent = formatIsoToUtc(hero.timestamp) || hero.timestamp || 'Live';
    if (heroEdition) heroEdition.textContent = `${hero.category} · ${hero.coverage} · ${hero.author}`;
    if (heroSignalMix) heroSignalMix.textContent = `${hero.impact} impact · Conf. ${hero.confidence}%`;
    if (heroPrimaryCta) {
      heroPrimaryCta.textContent = hero.ctaLabel || 'Read full cover story';
      setSafeHref(heroPrimaryCta, hero.href || 'article.html');
    }
  }

  if (featured) {
    if (featuredKicker) {
      featuredKicker.textContent = featured.kicker || 'Featured Analysis';
      const pin = document.createElement('span');
      pin.className = 'strange-pin';
      pin.setAttribute('aria-hidden', 'true');
      pin.textContent = 'acid veins';
      featuredKicker.appendChild(document.createTextNode(' '));
      featuredKicker.appendChild(pin);
    }
    if (featuredTitle) setAccentedHeadline(featuredTitle, featured.title, 'featured-accent');
    if (featuredDeck) featuredDeck.textContent = featured.deck;
    if (featuredMeta) {
      const updated = formatIsoToUtc(featured.timestamp) || 'Live';
      featuredMeta.textContent = featured.meta || `${featured.coverage} · ${featured.author} · ${updated} · Conf. ${featured.confidence}%`;
    }
    renderFeaturedLabels(featured);
    if (featuredCta) {
      featuredCta.textContent = `${featured.ctaLabel || 'Open long read'} →`;
      setSafeHref(featuredCta, featured.href || 'article.html');
    }
  }
}

function assessArticleLinks(items) {
  if (!Array.isArray(items)) return { ok: 0, total: 0 };
  const total = items.length;
  const ok = items.reduce((count, item) => {
    const href = sanitizeHref(item?.href || '');
    if (!href) return count;

    try {
      const url = new URL(href, window.location.origin);
      const isArticleRoute = /article\.html$/i.test(url.pathname) && Boolean(url.searchParams.get('id'));
      const isExternal = /^https?:$/i.test(url.protocol) && url.origin !== window.location.origin;
      return count + (isArticleRoute || isExternal ? 1 : 0);
    } catch (_) {
      return count;
    }
  }, 0);

  return { ok, total };
}

function renderSmokeStatus() {
  if (!smokeStatusList) return;

  const sourceClass = smokeState.source === 'live' ? 'smoke-ok' : 'smoke-warn';
  const tickerClass = smokeState.tickerCount > 0 ? 'smoke-ok' : 'smoke-warn';
  const leadReady = smokeState.heroHydrated && smokeState.featuredHydrated;
  const leadClass = leadReady ? 'smoke-ok' : 'smoke-warn';
  const linkRatio = smokeState.articleLinksTotal
    ? `${smokeState.articleLinksResolvable}/${smokeState.articleLinksTotal}`
    : '0/0';
  const linkClass = smokeState.articleLinksTotal > 0 && smokeState.articleLinksResolvable === smokeState.articleLinksTotal
    ? 'smoke-ok'
    : smokeState.articleLinksResolvable > 0
      ? 'smoke-warn'
      : 'smoke-bad';

  const payloadTime = smokeState.payloadTimestamp || (smokeState.source === 'live' ? 'not provided' : smokeState.sourceNote);

  smokeStatusList.innerHTML = `
    <li><span>Feed source</span><strong class="${sourceClass}">${smokeState.source === 'live' ? 'live latest.json' : 'fallback demo'}</strong></li>
    <li><span>Feed items</span><strong>${smokeState.itemCount}</strong></li>
    <li><span>Ticker</span><strong class="${tickerClass}">${smokeState.tickerCount > 0 ? `${smokeState.tickerCount} entries` : 'missing'}</strong></li>
    <li><span>Hero / featured</span><strong class="${leadClass}">${leadReady ? 'hydrated' : 'partial'}</strong></li>
    <li><span>Article links</span><strong class="${linkClass}">${linkRatio} resolvable</strong></li>
    <li><span>Payload time</span><strong>${payloadTime}</strong></li>
    <li><span>Edition id</span><strong>${smokeState.editionId || 'n/a'}</strong></li>
  `;
}

function syncCategoryChips(items) {
  const available = new Set((Array.isArray(items) ? items : []).map((item) => String(item?.category || '').trim()).filter(Boolean));

  chips.forEach((chip) => {
    const category = chip.dataset.category;
    if (!category || category === 'All') {
      chip.disabled = false;
      chip.classList.remove('chip-disabled');
      return;
    }

    const enabled = available.has(category);
    chip.disabled = !enabled;
    chip.classList.toggle('chip-disabled', !enabled);
    chip.title = enabled ? '' : `No published stories in ${category} right now`;

    if (!enabled && activeCategory === category) {
      setActiveChip('All');
    }
  });
}

function buildArtifactVersionToken({ edition, latestPayload }) {
  const raw = edition?.updatedAt || latestPayload?.generatedAt || latestPayload?.editionId || '';
  if (typeof raw !== 'string' || !raw.trim()) return '';
  return encodeURIComponent(raw.trim());
}

function artifactUrl(path, versionToken = '') {
  return versionToken ? `${path}?v=${versionToken}` : path;
}

function normalizeEditionPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (!payload.editionId || !payload.editionName) return null;
  return {
    editionId: String(payload.editionId),
    editionName: String(payload.editionName),
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : '',
    heroArticleId: payload.heroArticleId ? String(payload.heroArticleId) : '',
    featuredArticleId: payload.featuredArticleId ? String(payload.featuredArticleId) : '',
    continuationLabel: typeof payload.continuationLabel === 'string' ? payload.continuationLabel : 'Continue reading digest summaries'
  };
}

function normalizeFeedPayload(payload) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.newsItems)) {
    return null;
  }

  const normalizedNews = payload.newsItems
    .filter((item) => item && typeof item === 'object' && item.title)
    .map((item, idx) => {
      const articleId = item.articleId ?? item.id ?? idx + 1;
      return {
        id: item.id ?? idx + 1,
        articleId,
        title: item.title,
        deck: item.deck ?? '',
        category: item.category ?? 'General',
        timestamp: item.timestamp ?? '',
        edition: item.edition ?? 'Global Desk',
        readTime: item.readTime ?? '2 min',
        author: item.author ?? 'Desk',
        coverage: item.coverage ?? 'General',
        confidence: Number(item.confidence) || 0,
        impact: item.impact ?? 'Low',
        labels: Array.isArray(item.labels) ? item.labels : [],
        tone: item.tone ?? 'info',
        storyClass: item.storyClass ?? 'brief',
        accentRole: item.accentRole ?? 'brief',
        layoutSpan: item.layoutSpan ?? 'dense',
        href: item.href ?? `article.html?id=${encodeURIComponent(String(articleId))}`
      };
    });

  if (!normalizedNews.length) return null;

  return {
    newsItems: normalizedNews,
    tickerItems: Array.isArray(payload.tickerItems) ? payload.tickerItems : [],
    heroItem: normalizeLeadItem(payload.heroItem),
    featuredItem: normalizeLeadItem(payload.featuredItem)
  };
}

async function loadFeed() {
  try {
    const editionResponse = await fetch(artifactUrl('./generated/edition.json', String(Date.now())), { cache: 'no-store' });

    let edition = null;
    if (editionResponse.ok) {
      edition = normalizeEditionPayload(await editionResponse.json());
    }

    const latestVersionToken = buildArtifactVersionToken({ edition, latestPayload: null }) || String(Date.now());
    const latestResponse = await fetch(artifactUrl('./generated/latest.json', latestVersionToken), { cache: 'no-store' });

    if (!latestResponse.ok) throw new Error(`latest.json HTTP ${latestResponse.status}`);
    const latestPayload = await latestResponse.json();
    const normalized = normalizeFeedPayload(latestPayload);
    if (!normalized) throw new Error('Invalid latest feed payload');

    const finalVersionToken = buildArtifactVersionToken({ edition, latestPayload });

    window.newsItems = normalized.newsItems;
    window.tickerItems = normalized.tickerItems;
    window.heroItem = normalized.heroItem;
    window.featuredItem = normalized.featuredItem;

    if (window.heroItem?.articleId) {
      window.heroItem.href = `article.html?id=${encodeURIComponent(String(window.heroItem.articleId))}${finalVersionToken ? `&v=${finalVersionToken}` : ''}`;
    }
    if (window.featuredItem?.articleId) {
      window.featuredItem.href = `article.html?id=${encodeURIComponent(String(window.featuredItem.articleId))}${finalVersionToken ? `&v=${finalVersionToken}` : ''}`;
    }

    window.newsItems = window.newsItems.map((item) => ({
      ...item,
      href: `article.html?id=${encodeURIComponent(String(item.articleId || item.id || ''))}${finalVersionToken ? `&v=${finalVersionToken}` : ''}`
    }));

    syncCategoryChips(window.newsItems);

    if (editionNote) {
      editionNote.textContent = edition
        ? `${edition.editionName} · Updated ${formatIsoToUtc(edition.updatedAt) || edition.updatedAt}`
        : 'Live digest edition · latest.json only';
    }

    if (mastheadFeaturedLink && edition?.featuredArticleId) {
      const href = `article.html?id=${encodeURIComponent(edition.featuredArticleId)}${finalVersionToken ? `&v=${finalVersionToken}` : ''}`;
      setSafeHref(mastheadFeaturedLink, href);
    }

    const { ok, total } = assessArticleLinks(window.newsItems);
    smokeState.source = 'live';
    smokeState.sourceNote = edition ? 'edition.json + latest.json' : 'latest.json (edition missing)';
    smokeState.itemCount = window.newsItems.length;
    smokeState.tickerCount = Array.isArray(window.tickerItems) ? window.tickerItems.length : 0;
    smokeState.heroHydrated = Boolean(window.heroItem?.title);
    smokeState.featuredHydrated = Boolean(window.featuredItem?.title);
    smokeState.articleLinksResolvable = ok;
    smokeState.articleLinksTotal = total;
    smokeState.payloadTimestamp = typeof latestPayload?.generatedAt === 'string'
      ? latestPayload.generatedAt
      : (window.newsItems[0]?.timestamp || '');
    smokeState.editionId = edition?.editionId || (typeof latestPayload?.editionId === 'string' ? latestPayload.editionId : '');
    smokeState.error = '';
  } catch (error) {
    if (!Array.isArray(window.newsItems)) window.newsItems = [];
    if (!Array.isArray(window.tickerItems)) window.tickerItems = [];
    window.heroItem = null;
    window.featuredItem = null;

    syncCategoryChips(window.newsItems);

    const { ok, total } = assessArticleLinks(window.newsItems);
    smokeState.source = 'fallback';
    smokeState.sourceNote = 'edition/latest unavailable';
    smokeState.itemCount = window.newsItems.length;
    smokeState.tickerCount = Array.isArray(window.tickerItems) ? window.tickerItems.length : 0;
    smokeState.heroHydrated = false;
    smokeState.featuredHydrated = false;
    smokeState.articleLinksResolvable = ok;
    smokeState.articleLinksTotal = total;
    smokeState.payloadTimestamp = '';
    smokeState.editionId = '';
    smokeState.error = error instanceof Error ? error.message : 'unknown error';
    if (editionNote) editionNote.textContent = 'Fallback demo mode · live edition artifacts unavailable';
    if (mastheadFeaturedLink) setSafeHref(mastheadFeaturedLink, '#front-page');
  }
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    if (chip.disabled) return;
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

loadFeed().finally(() => {
  renderTicker();
  renderLeadPanels(window.heroItem, window.featuredItem);
  rerender();
  renderSmokeStatus();
});
