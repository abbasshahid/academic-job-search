import { sourceCatalogByUrl } from './config.js';

function compactWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeTitle(value) {
  return compactWhitespace(value).toLowerCase();
}

function buildHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function inferRoleTypes(title, sourceTags = []) {
  const text = normalizeTitle(title);
  const roles = new Set();

  if (/ph\.?d|doctoral|doctorate|praedoc|predoc/.test(text) || sourceTags.includes('phd')) {
    roles.add('phd');
  }
  if (/postdoc|postdoctoral/.test(text) || sourceTags.includes('postdoc')) {
    roles.add('postdoc');
  }
  if (/professor|professorship|chair/.test(text)) {
    roles.add('professor');
    roles.add('faculty');
  }
  if (/lecturer|assistant professor|associate professor|senior lecturer/.test(text)) {
    roles.add('lecturer');
    roles.add('faculty');
  }
  if (/researcher|research fellow|research associate/.test(text)) {
    roles.add('researcher');
  }
  if (/assistant|wissenschaftliche[rm]? mitarbeiter|student assistant|university assistant/.test(text)) {
    roles.add('assistant');
  }

  if (!roles.size) {
    roles.add('other');
  }

  return Array.from(roles);
}

function extractDeadline(title) {
  const match = title.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function inferEmploymentType(title) {
  const text = normalizeTitle(title);
  if (text.includes('full-time')) return 'full-time';
  if (text.includes('part-time')) return 'part-time';

  const percentage = title.match(/(\d{2,3})\s?%/);
  return percentage ? `${percentage[1]}%` : null;
}

function tokenizeKeywords(title) {
  return title
    .toLowerCase()
    .split(/[\s,;/]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function isLikelyJobLink(text, href) {
  const normalizedText = normalizeTitle(text);
  if (!href || !/^https?:\/\//i.test(href)) return false;
  if (href.startsWith('javascript:') || href.startsWith('mailto:')) return false;
  if (/\.(pdf|jpg|jpeg|png)$/i.test(href)) return false;

  const blockedPhrases = [
    'privacy notice',
    'find a researcher',
    'researcher portal',
    'services for researchers',
    'graduate school',
    'find a phd supervisor',
    'postdoctoral development centre',
  ];

  return !blockedPhrases.some((phrase) => normalizedText.includes(phrase));
}

export function buildJobRecord({ title, href, sourceUrl, generatedAt }) {
  const sourceMeta = sourceCatalogByUrl.get(sourceUrl) ?? {
    url: sourceUrl,
    institution: 'Unknown source',
    countryName: 'Unknown',
    countryCode: 'unknown',
    platform: 'Direct careers page',
    tags: [],
  };
  const cleanTitle = compactWhitespace(title);
  const roleTypes = inferRoleTypes(cleanTitle, sourceMeta?.tags ?? []);

  return {
    id: buildHash(`${href}::${normalizeTitle(cleanTitle)}`),
    title: cleanTitle,
    url: href,
    source: sourceUrl,
    normalizedTitle: normalizeTitle(cleanTitle),
    searchableText: compactWhitespace(
      [
        cleanTitle,
        sourceMeta.institution,
        sourceMeta.countryName,
        sourceMeta.platform,
        roleTypes.join(' '),
      ].join(' ')
    ).toLowerCase(),
    keywordTokens: tokenizeKeywords(cleanTitle),
    roleTypes,
    sourceMeta,
    department: null,
    location: sourceMeta.countryName,
    employmentType: inferEmploymentType(cleanTitle),
    deadline: extractDeadline(cleanTitle),
    scrapedAt: generatedAt,
    discoveredAt: generatedAt,
  };
}

export function shouldKeepAnchor({ text, href, keywords }) {
  if (!text || !href || !isLikelyJobLink(text, href)) {
    return false;
  }

  const normalizedText = normalizeTitle(text);
  return keywords.some((keyword) => normalizedText.includes(String(keyword).toLowerCase()));
}
