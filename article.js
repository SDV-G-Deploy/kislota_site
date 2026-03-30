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

function pushLabel(textValue, cssClass = '') {
  if (!articleLabels) return;
  const span = document.createElement('span');
  span.className = cssClass ? `label ${cssClass}` : 'label';
  span.textContent = textValue;
  articleLabels.appendChild(span);
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
  pushLabel(item.impact.toLowerCase(), item.impact === 'High' ? 'threat' : item.impact === 'Medium' ? 'hotspot' : 'alien');
  pushLabel(`conf ${item.confidence}%`, 'premium');
  pushLabel(item.storyClass, 'psychic');
  (Array.isArray(item.labels) ? item.labels : []).slice(0, 3).forEach((label) => pushLabel(label));

  if (articleTime) {
    articleTime.textContent = `Published ${item.publishedAt} · Updated ${item.updatedAt} · ${item.readTime} read · ${item.author}`;
  }

  clearElement(articleContent);
  appendSection(articleContent, 'Digest summary', item.summary || 'No summary available.');
  appendSection(articleContent, 'Product note', item.provenance?.note || 'Summary/provenance view.');
  appendSection(
    articleContent,
    'Provenance',
    `Source: ${item.sourceName}${item.sourceId ? ` · Source ID: ${item.sourceId}` : ''} · URL: ${item.sourceUrl}`
  );

  if (Array.isArray(item.topics) && item.topics.length) {
    appendSection(articleContent, 'Detected topics', item.topics.join(', '));
  }

  if (Array.isArray(item.relatedArticleIds) && item.relatedArticleIds.length) {
    const links = document.createElement('p');
    links.innerHTML = `Related digest articles: ${item.relatedArticleIds
      .map((id) => `<a href="article.html?id=${encodeURIComponent(id)}">${id.slice(0, 8)}</a>`)
      .join(' · ')}`;
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
    const response = await fetch(`./generated/articles/${encodeURIComponent(articleId)}.json`, { cache: 'no-store' });
    if (!response.ok) {
      renderError(`HTTP ${response.status} when loading generated/articles/${articleId}.json`);
      return;
    }

    const payload = await response.json();
    renderArticle(payload);
  } catch (error) {
    renderError(error instanceof Error ? error.message : 'unknown error');
  }
}

initArticle();
