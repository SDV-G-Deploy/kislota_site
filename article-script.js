function labelsMarkup(labels = []) {
  return labels.map((label) => `<span class="label ${label}">${label}</span>`).join('');
}

function classLabelTone(storyClass) {
  if (storyClass === 'threat') return 'threat';
  if (storyClass === 'premium') return 'premium';
  if (storyClass === 'anomaly') return 'acid';
  if (storyClass === 'lead') return 'psychic';
  return 'alien';
}

function renderFraming(item) {
  const framing = document.getElementById('article-framing');
  if (!framing) return;

  const laneVoice = {
    lead: 'Front-spine report: verified movement first, speculation later.',
    threat: 'Threat lane: immediate operator value, no inflated blast radius.',
    premium: 'Premium counterpoint: context that outlives the cycle.',
    anomaly: 'Anomaly desk: pattern break under watch, narrative kept on a short leash.',
    brief: 'Briefing lane: concise situational update with clear limits.'
  };

  framing.className = `article-framing class-${item.storyClass}`;
  framing.innerHTML = `
    <p class="kicker">${item.category} Desk · Kislota framing</p>
    <p>${laneVoice[item.storyClass] || laneVoice.brief}</p>
    <dl>
      <div><dt>Coverage</dt><dd>${item.coverage}</dd></div>
      <div><dt>Impact</dt><dd>${item.impact}</dd></div>
      <div><dt>Confidence</dt><dd>${item.confidence}%</dd></div>
    </dl>
  `;
}

function renderBlock(block) {
  switch (block.type) {
    case 'subhead':
      return `<h2>${block.text}</h2>`;
    case 'callout':
      return `<aside class="article-block article-callout"><p>${block.text}</p></aside>`;
    case 'signal-note':
      return `<aside class="article-block article-signal-note"><p>${block.text}</p></aside>`;
    case 'quote':
      return `<blockquote class="article-block article-quote"><p>${block.text}</p>${block.by ? `<cite>${block.by}</cite>` : ''}</blockquote>`;
    case 'list':
      return `<ul class="article-block article-list">${(block.items || []).map((item) => `<li>${item}</li>`).join('')}</ul>`;
    case 'paragraph':
    default:
      return `<p>${block.text}</p>`;
  }
}

function renderArticleBody(item) {
  const content = document.getElementById('article-content');
  const continuation = document.getElementById('article-continuation');
  if (!content) return;

  const blocks = window.articleBodies?.[item.bodyKey] || [{ type: 'paragraph', text: item.deck }];
  content.innerHTML = blocks.map(renderBlock).join('');

  if (continuation) {
    const continuationId = item.relatedIds?.[0];
    const continuationStory = window.newsItems.find((story) => story.id === continuationId);
    continuation.innerHTML = continuationStory
      ? `
      <p class="kicker">${window.editionConfig?.continuationLabel || 'Continuation'}</p>
      <p>Next lane: <a href="article.html?story=${encodeURIComponent(continuationStory.id)}"><strong>${continuationStory.title}</strong></a></p>
    `
      : '';
  }
}

function renderRelated(item) {
  const list = document.getElementById('related-list');
  if (!list) return;

  const explicitRelated = (item.relatedIds || [])
    .map((id) => window.newsItems.find((story) => story.id === id))
    .filter(Boolean)
    .slice(0, 3);

  list.innerHTML = explicitRelated
    .map((story) => `
      <li>
        <a href="article.html?story=${encodeURIComponent(story.id)}">
          <span class="label ${classLabelTone(story.storyClass)}">${story.storyClass}</span>
          <strong>${story.title}</strong>
          <small>${story.category} · ${story.readTime}</small>
        </a>
      </li>
    `)
    .join('');
}

function setupReadingProgress() {
  const bar = document.getElementById('reading-progress-bar');
  const root = document.getElementById('article-root');
  if (!bar || !root) return;

  function update() {
    const rect = root.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    const total = Math.max(1, rect.height - viewport * 0.55);
    const seen = Math.min(total, Math.max(0, -rect.top + viewport * 0.18));
    const progress = Math.max(0, Math.min(1, seen / total));
    bar.style.transform = `scaleX(${progress})`;
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
}

(function hydrateArticleFromQuery() {
  if (!window.newsItems?.length) return;

  const params = new URLSearchParams(window.location.search);
  const fallbackId = window.editionConfig?.heroStoryId || window.newsItems[0].id;
  const storyId = Number(params.get('story')) || fallbackId;
  const item = window.newsItems.find((story) => story.id === storyId) || window.newsItems[0];
  if (!item) return;

  const root = document.getElementById('article-root');
  const kicker = document.getElementById('article-kicker');
  const title = document.getElementById('article-title');
  const deck = document.getElementById('article-deck');
  const labels = document.getElementById('article-labels');

  if (root) root.classList.add(`article-${item.storyClass}`);
  if (kicker) kicker.textContent = `${item.category} Desk · ${item.storyClass.toUpperCase()} lane`;
  if (title) title.textContent = item.title;
  if (deck) deck.textContent = item.deck;

  if (labels) {
    const tags = [...item.labels.slice(0, 3)];
    labels.innerHTML = `${labelsMarkup(tags)}<span class="article-time" id="article-time">Published ${item.timestamp} · ${item.readTime} read · Conf. ${item.confidence}% · ${item.edition}</span>`;
  }

  renderFraming(item);
  renderArticleBody(item);
  renderRelated(item);
  setupReadingProgress();

  document.title = `Kislota Digest — ${item.title}`;
})();
