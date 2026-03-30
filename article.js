const articleBrandMeta = document.getElementById('article-brand-meta');
const articleKicker = document.getElementById('article-kicker');
const articleTitle = document.getElementById('article-title');
const articleDeck = document.getElementById('article-deck');
const articleLabels = document.getElementById('article-labels');
const articleTime = document.getElementById('article-time');
const articleContent = document.getElementById('article-content');

function qs() {
  return new URLSearchParams(window.location.search);
}

function text(value, fallback = '') {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function normalizeItem(item) {
  if (!item || typeof item !== 'object') return null;

  const id = text(item.id);
  const sourceUrl = text(item.sourceUrl || item.url || item.href || item.canonicalUrl);
  if (!id && !sourceUrl) return null;

  const labels = Array.isArray(item.labels) ? item.labels.filter((entry) => typeof entry === 'string').slice(0, 6) : [];
  const topics = Array.isArray(item.topics) ? item.topics.filter((entry) => typeof entry === 'string').slice(0, 8) : [];

  return {
    id,
    title: text(item.title, 'Untitled story'),
    deck: text(item.deck),
    summary: text(item.summary || item.deck),
    timestamp: text(item.timestamp),
    category: text(item.category, 'General'),
    author: text(item.author, 'Desk'),
    sourceName: text(item.sourceName || item.coverage, 'Unknown source'),
    sourceId: text(item.sourceId),
    sourceUrl,
    coverage: text(item.coverage, 'General'),
    confidence: Number(item.confidence) || 0,
    impact: text(item.impact, 'Low'),
    labels,
    topics,
    readTime: text(item.readTime, '2 min')
  };
}

function normalizeCard(item) {
  if (!item || typeof item !== 'object') return null;
  const id = text(item.articleId || item.id);
  const url = text(item.url || item.sourceUrl || item.href);
  if (!id && !url) return null;

  const href = text(item.href);
  let sourceUrl = url;
  if (!sourceUrl && href) {
    try {
      const hrefUrl = new URL(href, window.location.origin);
      sourceUrl = hrefUrl.searchParams.get('url') || '';
    } catch (_) {
      sourceUrl = '';
    }
  }

  return normalizeItem({
    id,
    title: item.title,
    deck: item.deck,
    summary: item.deck,
    timestamp: item.timestamp,
    category: item.category,
    author: item.author,
    coverage: item.coverage,
    confidence: item.confidence,
    impact: item.impact,
    labels: item.labels,
    sourceUrl,
    sourceName: item.coverage
  });
}

async function loadFeedPayload() {
  try {
    const response = await fetch('./generated/latest.json', { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch (_) {
    return null;
  }
}

function buildArticlePool(payload) {
  const pool = [];

  if (payload && Array.isArray(payload.articleDetails)) {
    payload.articleDetails.forEach((item) => {
      const normalized = normalizeItem(item);
      if (normalized) pool.push(normalized);
    });
  }

  if (payload && Array.isArray(payload.newsItems)) {
    payload.newsItems.forEach((item) => {
      const normalized = normalizeCard(item);
      if (normalized) pool.push(normalized);
    });
  }

  if (payload && payload.heroItem) {
    const normalized = normalizeCard(payload.heroItem);
    if (normalized) pool.push(normalized);
  }

  if (payload && payload.featuredItem) {
    const normalized = normalizeCard(payload.featuredItem);
    if (normalized) pool.push(normalized);
  }

  if (Array.isArray(window.newsItems)) {
    window.newsItems.forEach((item) => {
      const normalized = normalizeCard(item);
      if (normalized) pool.push(normalized);
    });
  }

  return pool;
}

function resolveArticle(pool, searchParams) {
  const id = text(searchParams.get('id'));
  const url = text(searchParams.get('url'));

  if (id) {
    const byId = pool.find((item) => item.id === id);
    if (byId) return byId;
  }

  if (url) {
    const byUrl = pool.find((item) => item.sourceUrl === url);
    if (byUrl) return byUrl;
  }

  return null;
}

function appendSection(root, heading, body) {
  const h2 = document.createElement('h2');
  h2.textContent = heading;
  root.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = body;
  root.appendChild(p);
}

function clearElement(el) {
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
}

function pushLabel(textValue, cssClass = '') {
  if (!articleLabels) return;
  const span = document.createElement('span');
  span.className = cssClass ? `label ${cssClass}` : 'label';
  span.textContent = textValue;
  articleLabels.appendChild(span);
}

function renderArticle(item) {
  if (!articleTitle || !articleDeck || !articleContent || !articleTime) return;

  if (articleBrandMeta) articleBrandMeta.textContent = `${item.category} · Live article`; 
  if (articleKicker) articleKicker.textContent = `Cover Story · ${item.category}`;
  articleTitle.textContent = item.title;
  articleDeck.textContent = item.deck || 'This is an MVP live article view composed from digest metadata.';

  clearElement(articleLabels);
  pushLabel(item.impact.toLowerCase(), item.impact === 'High' ? 'threat' : item.impact === 'Medium' ? 'hotspot' : 'alien');
  pushLabel(`conf ${item.confidence}%`, 'premium');
  pushLabel(item.category.toLowerCase(), 'psychic');
  item.labels.slice(0, 3).forEach((label) => pushLabel(label));

  articleTime.textContent = `Published ${item.timestamp || 'n/a'} · ${item.readTime} read · ${item.author}`;

  clearElement(articleContent);
  appendSection(
    articleContent,
    'What we know (MVP digest view)',
    item.summary || 'Detailed body rewrite is not available yet. This view reflects current digest fields and source metadata.'
  );

  appendSection(
    articleContent,
    'Editorial context',
    `Category: ${item.category}. Coverage: ${item.coverage}. Impact: ${item.impact}. Confidence: ${item.confidence}%.`
  );

  const provenanceLines = [
    `Source: ${item.sourceName}`,
    item.sourceId ? `Source ID: ${item.sourceId}` : '',
    item.sourceUrl ? `Original URL: ${item.sourceUrl}` : ''
  ].filter(Boolean);

  appendSection(articleContent, 'Provenance', provenanceLines.join(' · '));

  if (item.topics.length) {
    appendSection(articleContent, 'Detected topics', item.topics.join(', '));
  }

  if (item.sourceUrl) {
    const sourceLink = document.createElement('a');
    sourceLink.href = item.sourceUrl;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.textContent = 'Open original source ↗';
    articleContent.appendChild(sourceLink);
  }
}

function renderFallback() {
  if (articleBrandMeta) articleBrandMeta.textContent = 'Edition 118 · Static fallback';
  if (articleKicker) articleKicker.textContent = 'Cover Story · Premium Flash';
  if (articleTitle) articleTitle.textContent = 'From pretty layouts to editorial systems: why v3 feels like a media brand';
  if (articleDeck) {
    articleDeck.textContent =
      'The jump from v2 to v3 is structural: masthead identity, front-page rhythm, metadata-rich cards, and product rails guiding reading behavior.';
  }

  clearElement(articleLabels);
  pushLabel('premium', 'premium');
  pushLabel('lead', 'psychic');
  pushLabel('analysis', 'alien');

  if (articleTime) articleTime.textContent = 'Published 06:25 UTC · 6 min read';

  clearElement(articleContent);
  appendSection(
    articleContent,
    'Fallback mode',
    'Live article data was not found for this link yet. This static feature story remains available so the page never breaks.'
  );
  appendSection(
    articleContent,
    'How to open live stories',
    'Open an article from the front page hero, featured module, or latest cards after latest.json is regenerated.'
  );
}

async function initArticle() {
  const payload = await loadFeedPayload();
  const pool = buildArticlePool(payload);
  const selected = resolveArticle(pool, qs());

  if (!selected) {
    renderFallback();
    return;
  }

  renderArticle(selected);
}

initArticle();
