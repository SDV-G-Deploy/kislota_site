const articleBrandMeta = document.getElementById('article-brand-meta');
const articleKicker = document.getElementById('article-kicker');
const articleTitle = document.getElementById('article-title');
const articleDeck = document.getElementById('article-deck');
const articleLabels = document.getElementById('article-labels');
const articleTime = document.getElementById('article-time');
const articleContent = document.getElementById('article-content');
const articleSmokeStatus = document.getElementById('article-smoke-status');

function qs() {
  return new URLSearchParams(window.location.search);
}

function clearElement(el) {
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
}

function appendSection(root, heading, body) {
  const h2 = document.createElement('h2');
  h2.textContent = heading;
  root.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = body;
  root.appendChild(p);
}

function appendSectionNode(root, heading, node) {
  const h2 = document.createElement('h2');
  h2.textContent = heading;
  root.appendChild(h2);
  root.appendChild(node);
}

function pushLabel(textValue, cssClass = '') {
  if (!articleLabels) return;
  const span = document.createElement('span');
  span.className = cssClass ? `label ${cssClass}` : 'label';
  span.textContent = textValue;
  articleLabels.appendChild(span);
}

function safeHttpUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch (_) {
    return '';
  }
}

function normalizeArticlePayload(payload, expectedId) {
  if (!payload || typeof payload !== 'object') return null;

  const id = String(payload.id || '').trim();
  const title = String(payload.title || '').trim();
  const sourceUrl = safeHttpUrl(payload.sourceUrl);

  if (!id || !title || !sourceUrl) return null;
  if (expectedId && id !== expectedId) return null;

  return {
    id,
    title,
    category: String(payload.category || 'General'),
    deck: String(payload.deck || ''),
    summary: String(payload.summary || ''),
    publishedAt: String(payload.publishedAt || payload.timestamp || 'n/a'),
    updatedAt: String(payload.updatedAt || payload.timestamp || 'n/a'),
    readTime: String(payload.readTime || 'n/a'),
    author: String(payload.author || payload.sourceName || 'Desk'),
    sourceName: String(payload.sourceName || 'Unknown source'),
    sourceId: typeof payload.sourceId === 'string' ? payload.sourceId : '',
    sourceUrl,
    confidence: Number(payload.confidence) || 0,
    impact: String(payload.impact || 'Low'),
    storyClass: String(payload.storyClass || 'brief'),
    labels: Array.isArray(payload.labels) ? payload.labels.map(String) : [],
    topics: Array.isArray(payload.topics) ? payload.topics.map(String) : [],
    relatedArticleIds: Array.isArray(payload.relatedArticleIds) ? payload.relatedArticleIds.map(String) : [],
    provenance: payload.provenance && typeof payload.provenance === 'object' ? payload.provenance : {}
  };
}

function buildArtifactVersionToken(edition) {
  const queryToken = qs().get('v');
  if (queryToken && queryToken.trim()) return encodeURIComponent(queryToken.trim());
  const raw = edition?.updatedAt || edition?.editionId || '';
  return raw ? encodeURIComponent(raw) : '';
}

function artifactUrl(path, versionToken = '') {
  return versionToken ? `${path}?v=${versionToken}` : path;
}

function renderError(reason) {
  if (articleBrandMeta) articleBrandMeta.textContent = 'Stable publish artifact missing';
  if (articleKicker) articleKicker.textContent = 'Digest article unavailable';
  if (articleTitle) articleTitle.textContent = 'Article not found in generated publish artifacts';
  if (articleDeck) articleDeck.textContent = 'Open a story card from the homepage after publish-static runs.';
  if (articleTime) articleTime.textContent = 'No fallback longform is rendered in this mode.';

  clearElement(articleLabels);
  pushLabel('missing-artifact', 'threat');

  clearElement(articleContent);
  appendSection(articleContent, 'Why this appears', reason || 'The requested generated/articles/<id>.json file was not found.');
  appendSection(
    articleContent,
    'Honest mode',
    'This route only renders stable generated article artifacts. It does not silently synthesize a fake fallback article.'
  );

  if (articleSmokeStatus) {
    articleSmokeStatus.innerHTML = 'Live smoke: <strong class="smoke-bad">artifact missing</strong>';
  }
}

function renderArticle(item) {
  if (articleBrandMeta) articleBrandMeta.textContent = `${item.category} · ${item.id}`;
  if (articleKicker) articleKicker.textContent = `Digest summary · ${item.category}`;
  if (articleTitle) articleTitle.textContent = item.title;
  if (articleDeck) articleDeck.textContent = item.deck || 'Summary/provenance digest payload.';

  clearElement(articleLabels);
  const impactClass = item.impact === 'High' ? 'threat' : item.impact === 'Medium' ? 'hotspot' : 'alien';
  pushLabel(item.impact.toLowerCase(), impactClass);
  pushLabel(`conf ${item.confidence}%`, 'premium');
  pushLabel(item.storyClass, 'psychic');
  (Array.isArray(item.labels) ? item.labels : []).slice(0, 3).forEach((label) => pushLabel(label));

  if (articleTime) {
    articleTime.textContent = `Published ${item.publishedAt} · Updated ${item.updatedAt} · ${item.readTime} read · ${item.author}`;
  }

  clearElement(articleContent);
  appendSection(articleContent, 'Digest summary', item.summary || 'No summary available.');
  appendSection(articleContent, 'Product note', item.provenance?.note || 'Summary/provenance view.');

  const provenance = document.createElement('p');
  provenance.appendChild(document.createTextNode(`Source: ${item.sourceName}`));
  if (item.sourceId) provenance.appendChild(document.createTextNode(` · Source ID: ${item.sourceId}`));
  provenance.appendChild(document.createTextNode(' · URL: '));

  const sourceUrlAnchor = document.createElement('a');
  sourceUrlAnchor.href = item.sourceUrl;
  sourceUrlAnchor.target = '_blank';
  sourceUrlAnchor.rel = 'noopener noreferrer';
  sourceUrlAnchor.textContent = item.sourceUrl;
  provenance.appendChild(sourceUrlAnchor);

  appendSectionNode(articleContent, 'Provenance', provenance);

  if (Array.isArray(item.topics) && item.topics.length) {
    appendSection(articleContent, 'Detected topics', item.topics.join(', '));
  }

  if (Array.isArray(item.relatedArticleIds) && item.relatedArticleIds.length) {
    const links = document.createElement('p');
    links.appendChild(document.createTextNode('Related digest articles: '));

    item.relatedArticleIds.forEach((id, idx) => {
      if (idx > 0) links.appendChild(document.createTextNode(' · '));
      const link = document.createElement('a');
      link.href = `article.html?id=${encodeURIComponent(id)}`;
      link.textContent = id.slice(0, 8);
      links.appendChild(link);
    });

    articleContent.appendChild(links);
  }

  const sourceLink = document.createElement('a');
  sourceLink.href = item.sourceUrl;
  sourceLink.target = '_blank';
  sourceLink.rel = 'noopener noreferrer';
  sourceLink.textContent = 'Open original source ↗';
  articleContent.appendChild(sourceLink);

  if (articleSmokeStatus) {
    articleSmokeStatus.innerHTML = 'Live smoke: <strong class="smoke-ok">generated article loaded</strong>';
  }
}

async function initArticle() {
  const articleId = qs().get('id');
  if (!articleId) {
    renderError('Missing ?id= query parameter.');
    return;
  }

  try {
    const editionResponse = await fetch(artifactUrl('./generated/edition.json', String(Date.now())), { cache: 'no-store' });
    const edition = editionResponse.ok ? await editionResponse.json() : null;
    const versionToken = buildArtifactVersionToken(edition);

    const response = await fetch(artifactUrl(`./generated/articles/${encodeURIComponent(articleId)}.json`, versionToken), { cache: 'no-store' });
    if (!response.ok) {
      renderError(`HTTP ${response.status} when loading generated/articles/${articleId}.json`);
      return;
    }

    const payload = await response.json();
    const normalized = normalizeArticlePayload(payload, articleId);
    if (!normalized) {
      renderError('Generated artifact is malformed or mismatched for this article id.');
      return;
    }

    renderArticle(normalized);
  } catch (error) {
    renderError(error instanceof Error ? error.message : 'unknown error');
  }
}

initArticle();
