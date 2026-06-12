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

// Best-effort discipline/field inference from a job title. Kept in sync with
// src/utils/jobData.ts so scraped data and client-side data label fields the
// same way. Ordered most-specific first; returns null when nothing matches.
const FIELD_RULES = [
  { label: 'Artificial Intelligence', pattern: /artificial intelligence|machine learning|deep learning|\bai\b|computer vision|natural language|\bnlp\b|reinforcement learning/ },
  { label: 'Data Science', pattern: /data science|data scientist|big data|data analyt|data engineer/ },
  { label: 'Cybersecurity', pattern: /cyber|cryptograph|cryptolog|information security|\bit[- ]security\b/ },
  { label: 'Blockchain', pattern: /blockchain|distributed ledger|\bdlt\b|cryptocurrenc/ },
  { label: 'Bioinformatics', pattern: /bioinformatic|computational biolog|systems biolog/ },
  { label: 'Computer Science', pattern: /computer science|informatic|informatik|computing|software|comput(er|ing)|\bhci\b|human[- ]computer|robotic|\bsecurity\b/ },
  { label: 'Statistics', pattern: /statistic|biostatistic|econometric/ },
  { label: 'Mathematics', pattern: /mathematic|mathematik|\bmaths?\b|stochastic|numerical analysis|geometry|algebra|topology/ },
  { label: 'Physics', pattern: /physics|physik|quantum|photonic|astrophysic|particle physic|condensed matter|\boptics\b/ },
  { label: 'Chemistry', pattern: /chemistry|chemie|chemical|electrochem|catalysis|catalytic/ },
  { label: 'Neuroscience', pattern: /neuroscience|neurolog|cognitive science/ },
  { label: 'Biology', pattern: /biolog|life science|molecular biolog|genetic|genomic|microbiolog|biochem|cell biolog|immunolog|botan|zoolog|biotechnolog/ },
  { label: 'Medicine & Health', pattern: /medicine|medical|clinical|oncolog|cardiolog|radiolog|surgery|nursing|pharmacolog|pharmac|epidemiolog|public health|healthcare|health care|psychiatr|dentist|biomedical/ },
  { label: 'Materials Science', pattern: /materials? science|nanomaterial|metallurg|polymer science/ },
  { label: 'Energy', pattern: /\benergy\b|renewable|photovoltaic|battery|hydrogen|solar|wind power|fuel cell/ },
  { label: 'Environmental Science', pattern: /environment|climate|sustainab|geoscience|geolog|geophysic|atmospher|oceanograph|hydrolog|ecolog|earth science/ },
  { label: 'Engineering', pattern: /engineering|ingenieur|mechanical|electrical|electronic|civil engineer|aerospace|mechatronic|automotive|manufacturing/ },
  { label: 'Economics & Finance', pattern: /econom|finance|financial|accounting|banking/ },
  { label: 'Business & Management', pattern: /management|business|marketing|entrepreneur|supply chain|logistic|operations research/ },
  { label: 'Law', pattern: /\blaw\b|lawyer|legal|jurisprudence|rechtswissenschaft/ },
  { label: 'Psychology', pattern: /psycholog/ },
  { label: 'Sociology', pattern: /sociolog|social science|social work/ },
  { label: 'Political Science', pattern: /political science|politics|international relations|public policy/ },
  { label: 'Education', pattern: /education|pedagog|didactic/ },
  { label: 'Linguistics', pattern: /linguistic|philolog|language science/ },
  { label: 'History', pattern: /\bhistory\b|historical/ },
  { label: 'Philosophy', pattern: /philosoph/ },
  { label: 'Arts & Humanities', pattern: /humanities|literature|art history|musicolog|cultural studies|archaeolog|theolog/ },
  { label: 'Agriculture & Food', pattern: /agricultur|agronom|forestry|horticultur|veterinar|food science/ },
  { label: 'Architecture & Planning', pattern: /architectur|urban planning|urban design|spatial planning/ },
];

function inferField(title) {
  const text = normalizeTitle(title);
  for (const rule of FIELD_RULES) {
    if (rule.pattern.test(text)) {
      return rule.label;
    }
  }
  return null;
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
  const field = inferField(cleanTitle);

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
        field ?? '',
        roleTypes.join(' '),
      ].join(' ')
    ).toLowerCase(),
    keywordTokens: tokenizeKeywords(cleanTitle),
    roleTypes,
    field,
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
