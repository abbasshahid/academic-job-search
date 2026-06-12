import { getSourceMetadata, sourceCatalog } from '../data/sourceCatalog';
import type { Job, PrebuiltJobPayload, RoleType, SourceMetadata } from '../types/job';

interface RawJob {
  id?: string;
  title: string;
  url: string;
  source?: string;
  sourceUrl?: string;
  normalizedTitle?: string;
  searchableText?: string;
  keywordTokens?: string[];
  roleTypes?: RoleType[];
  field?: string | null;
  sourceMeta?: SourceMetadata;
  department?: string | null;
  location?: string | null;
  employmentType?: string | null;
  deadline?: string | null;
  scrapedAt?: string | null;
  discoveredAt?: string | null;
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeTitle(value: string): string {
  return compactWhitespace(value).toLowerCase();
}

function buildHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function buildJobId(job: Pick<RawJob, 'title' | 'url'>): string {
  return buildHash(`${job.url}::${normalizeTitle(job.title)}`);
}

export function tokenizeKeywords(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[\s,;/]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function inferRoleTypes(title: string, sourceTags: string[] = []): RoleType[] {
  const text = normalizeTitle(title);
  const roles = new Set<RoleType>();

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
  if (/lecturer|teaching fellow|assistant professor|associate professor|senior lecturer/.test(text)) {
    roles.add('lecturer');
    roles.add('faculty');
  }
  if (/researcher|research fellow|research associate/.test(text)) {
    roles.add('researcher');
  }
  if (/assistant|wissenschaftliche[rm]? mitarbeiter|university assistant|student assistant/.test(text)) {
    roles.add('assistant');
  }

  if (roles.size === 0) {
    roles.add('other');
  }

  return Array.from(roles);
}

// Best-effort discipline/field inference from a job title, ordered from most
// specific to most general so compound topics win (e.g. "machine learning"
// resolves to AI rather than the broader Computer Science). Returns null when
// nothing matches confidently, so the UI simply shows no field label.
const FIELD_RULES: Array<{ label: string; pattern: RegExp }> = [
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

export function inferField(title: string): string | null {
  const text = normalizeTitle(title);
  for (const rule of FIELD_RULES) {
    if (rule.pattern.test(text)) {
      return rule.label;
    }
  }
  return null;
}

export function extractDeadline(title: string): string | null {
  const match = title.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export function inferEmploymentType(title: string): string | null {
  const text = normalizeTitle(title);
  if (text.includes('full-time')) return 'full-time';
  if (text.includes('part-time')) return 'part-time';

  const percentage = title.match(/(\d{2,3})\s?%/);
  if (percentage) {
    return `${percentage[1]}%`;
  }

  return null;
}

function buildSearchableText(job: Pick<Job, 'title' | 'sourceMeta' | 'department' | 'employmentType' | 'roleTypes' | 'field'>): string {
  return compactWhitespace(
    [
      job.title,
      job.sourceMeta.institution,
      job.sourceMeta.countryName,
      job.sourceMeta.platform,
      job.department ?? '',
      job.employmentType ?? '',
      job.field ?? '',
      job.roleTypes.join(' '),
    ].join(' ')
  ).toLowerCase();
}

export function enrichJob(rawJob: RawJob, generatedAt: string): Job {
  const source = rawJob.source ?? rawJob.sourceUrl ?? '';
  const sourceMeta = rawJob.sourceMeta ?? getSourceMetadata(source);
  const normalized = rawJob.normalizedTitle ?? normalizeTitle(rawJob.title);
  const roleTypes = rawJob.roleTypes?.length ? rawJob.roleTypes : inferRoleTypes(rawJob.title, sourceMeta.tags);
  const employmentType = rawJob.employmentType ?? inferEmploymentType(rawJob.title);
  const deadline = rawJob.deadline ?? extractDeadline(rawJob.title);

  const job: Job = {
    id: rawJob.id ?? buildJobId(rawJob),
    title: compactWhitespace(rawJob.title),
    url: rawJob.url,
    source,
    normalizedTitle: normalized,
    searchableText: rawJob.searchableText ?? '',
    keywordTokens: rawJob.keywordTokens?.length ? rawJob.keywordTokens : tokenizeKeywords(rawJob.title),
    roleTypes,
    field: rawJob.field ?? inferField(rawJob.title),
    sourceMeta,
    department: rawJob.department ?? null,
    location: rawJob.location ?? null,
    employmentType,
    deadline,
    scrapedAt: rawJob.scrapedAt ?? generatedAt,
    discoveredAt: rawJob.discoveredAt ?? generatedAt,
  };

  job.searchableText = rawJob.searchableText ?? buildSearchableText(job);
  return job;
}

export function parsePrebuiltPayload(rawData: unknown): PrebuiltJobPayload {
  const generatedAt = new Date().toISOString();

  if (Array.isArray(rawData)) {
    const jobs = rawData
      .filter((item): item is RawJob => Boolean(item && typeof item === 'object'))
      .map((item) => enrichJob(item, generatedAt));

    return {
      generatedAt,
      jobs,
      sources: sourceCatalog,
      stats: {
        generatedAt,
        jobCount: jobs.length,
        sourceCount: sourceCatalog.length,
      },
    };
  }

  const payload = rawData as Partial<PrebuiltJobPayload> & { jobs?: RawJob[] };
  const payloadGeneratedAt = payload.generatedAt ?? generatedAt;
  const jobs = (payload.jobs ?? []).map((job) => enrichJob(job, payloadGeneratedAt));
  const sources = payload.sources?.length ? payload.sources : sourceCatalog;

  return {
    generatedAt: payloadGeneratedAt,
    jobs,
    sources,
    stats: payload.stats ?? {
      generatedAt: payloadGeneratedAt,
      jobCount: jobs.length,
      sourceCount: sources.length,
    },
  };
}

export function isLikelyJobUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) && !url.startsWith('javascript:');
}
