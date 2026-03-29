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

function buildSearchableText(job: Pick<Job, 'title' | 'sourceMeta' | 'department' | 'employmentType' | 'roleTypes'>): string {
  return compactWhitespace(
    [
      job.title,
      job.sourceMeta.institution,
      job.sourceMeta.countryName,
      job.sourceMeta.platform,
      job.department ?? '',
      job.employmentType ?? '',
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
