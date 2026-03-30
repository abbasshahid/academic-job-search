<template>
  <v-container fluid :class="['search-page', `search-page--${currentTheme}`]">
    <div class="page-orb page-orb-left" />
    <div class="page-orb page-orb-right" />

    <div class="page-shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <div class="hero-brand">
            <img :src="logo" alt="Academic job search logo" class="hero-logo">
            <div>
              <p class="hero-eyebrow">Curated Academic Openings</p>
              <h1 class="hero-title">Academic job search</h1>
            </div>
          </div>
          <p class="hero-text">
            Explore a continuously refreshed collection of academic roles, postdoctoral positions,
            fellowships, and faculty openings from international university job boards.
          </p>
        </div>

        <div class="hero-stats">
          <div class="hero-stat-card">
            <span class="hero-stat-label">Indexed jobs</span>
            <strong class="hero-stat-value">{{ dataset.stats.jobCount }}</strong>
          </div>
          <div class="hero-stat-card">
            <span class="hero-stat-label">Tracked sources</span>
            <strong class="hero-stat-value">{{ dataset.stats.sourceCount }}</strong>
          </div>
          <div class="hero-stat-card hero-stat-wide">
            <span class="hero-stat-label">Last refreshed</span>
            <strong class="hero-stat-value hero-stat-small">{{ formattedGeneratedAt }}</strong>
          </div>
        </div>
      </section>

      <v-alert v-if="loadError" type="error" class="mt-6">
        {{ loadError }}
      </v-alert>

      <section class="search-panel">
        <div class="search-grid">
          <div class="search-column">
            <div class="keyword-match-row">
              <span class="control-label">Keyword matching</span>
              <v-radio-group
                v-model="matchMode"
                inline
                hide-details
                class="ma-0 keyword-match-inline"
                :disabled="!jobsLoaded"
              >
                <v-radio label="Any keyword" value="any" />
                <v-radio label="All keywords" value="all" />
              </v-radio-group>
            </div>

            <v-text-field
              v-model="keywordInput"
              label="Search jobs"
              placeholder="e.g. postdoc, blockchain, molecular biology"
              variant="solo-filled"
              flat
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              class="keyword-field"
              :disabled="!jobsLoaded"
            />

            <div v-if="recentKeywords.length" class="recent-keyword-row">
              <v-chip
                v-for="keyword in recentKeywords"
                :key="keyword"
                size="small"
                closable
                class="recent-keyword-chip"
                @click="applyRecentKeyword(keyword)"
                @click:close="deleteRecentKeyword(keyword)"
              >
                {{ keyword }}
              </v-chip>
            </div>

            <div class="switch-row">
              <v-switch
                v-model="onlyFavorites"
                color="warning"
                label="Only favorites"
                density="compact"
                hide-details
                inset
                class="filter-switch"
                :disabled="!jobsLoaded"
              />
              <v-switch
                v-model="onlyNew"
                color="success"
                label="Only new jobs"
                density="compact"
                hide-details
                inset
                class="filter-switch"
                :disabled="!jobsLoaded"
              />
              <v-switch
                v-model="onlyWithDeadline"
                color="info"
                label="Only jobs with deadline"
                density="compact"
                hide-details
                inset
                class="filter-switch"
                :disabled="!jobsLoaded"
              />
            </div>
          </div>

          <div class="search-note">
            <div class="search-note-card">
              <p class="search-note-label">Search rhythm</p>
              <p class="search-note-text">
                Filters apply immediately. Keyword history is saved only after typing pauses, so it does
                not store every single character.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="results-shell">
        <div class="results-toolbar">
          <div class="toolbar-grid">
            <v-select
              v-model="selectedCountry"
              :items="countryOptions"
              label="Country"
              variant="solo-filled"
              flat
              hide-details
              class="toolbar-field"
              :disabled="!jobsLoaded"
            />
            <v-select
              v-model="selectedUsefulLink"
              :items="usefulLinkOptions"
              item-title="title"
              item-value="value"
              label="Useful links"
              variant="solo-filled"
              flat
              hide-details
              class="toolbar-field"
              :disabled="!jobsLoaded"
            />
            <v-select
              v-model="selectedRoleTypes"
              :items="roleTypeOptions"
              label="Role types"
              variant="solo-filled"
              flat
              hide-details
              multiple
              chips
              closable-chips
              class="toolbar-field"
              :disabled="!jobsLoaded"
            />
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              label="Sort results"
              variant="solo-filled"
              flat
              hide-details
              class="toolbar-field"
              :disabled="!jobsLoaded"
            />
          </div>

          <div class="toolbar-actions">
            <v-btn
              variant="text"
              class="action-btn subtle-btn"
              :disabled="!jobsLoaded || loading"
              @click="resetFilters"
            >
              Reset filters
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              class="action-btn"
              :disabled="!searchResults.length"
              @click="markCurrentResultsSeen"
            >
              Mark current results seen
            </v-btn>
          </div>
        </div>

        <div class="results-header">
          <div>
            <p class="results-eyebrow">Current openings</p>
            <h2 class="results-title">Matching roles</h2>
          </div>
          <div class="results-summary">
            Showing {{ paginatedJobs.length }} of {{ searchResults.length }} results
          </div>
        </div>

        <div class="results-list">
          <article
            v-for="job in paginatedJobs"
            :key="job.id"
            class="job-card"
          >
            <div class="job-card-top">
              <div class="job-main">
                <div class="job-chip-row">
                  <v-chip
                    v-if="isNewJob(job)"
                    size="x-small"
                    color="success"
                    variant="flat"
                  >
                    New
                  </v-chip>
                  <v-chip
                    v-for="role in job.roleTypes"
                    :key="`${job.id}-${role}`"
                    size="x-small"
                    variant="tonal"
                    class="role-chip"
                  >
                    {{ formatRole(role) }}
                  </v-chip>
                </div>

                <a
                  :href="job.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="job-title-link"
                  @click="markJobSeen(job.id)"
                >
                  {{ job.title }}
                </a>

                <div class="job-meta-row">
                  <span>{{ job.sourceMeta.institution }}</span>
                  <span>{{ job.sourceMeta.countryName }}</span>
                  <span>{{ job.sourceMeta.platform }}</span>
                </div>
              </div>

              <div class="job-side">
                <v-btn
                  size="small"
                  variant="text"
                  :icon="favoriteIdSet.has(job.id) ? 'mdi-star' : 'mdi-star-outline'"
                  :color="favoriteIdSet.has(job.id) ? 'warning' : undefined"
                  @click="toggleFavorite(job.id)"
                />
                <div class="deadline-block">
                  <span class="deadline-label">Deadline</span>
                  <strong class="deadline-value">{{ formatDeadline(job.deadline) }}</strong>
                </div>
              </div>
            </div>

            <div class="job-card-footer">
              <v-btn
                size="small"
                variant="text"
                class="details-btn"
                @click="toggleDescription(job.id)"
              >
                {{ expandedDescriptions[job.id] ? 'Hide details' : 'Show details' }}
              </v-btn>
            </div>

            <v-expand-transition>
              <div
                v-if="expandedDescriptions[job.id]"
                class="job-details"
              >
                {{ buildJobSummary(job) }}
              </div>
            </v-expand-transition>
          </article>
        </div>

        <v-alert
          v-if="!loading && hasSearched && !searchResults.length && jobsLoaded"
          type="info"
          class="mt-6"
        >
          No results matched the current keywords and filters.
        </v-alert>

        <div class="pagination-shell">
          <v-pagination
            v-model="page"
            :length="pageCount"
            total-visible="5"
          />
        </div>
      </section>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import logo from '../assets/logo.png';
import { generalInfoStore } from '../store/generalInfo';
import { parsePrebuiltPayload, tokenizeKeywords } from '../utils/jobData';
import type { Job, PrebuiltJobPayload, RoleType, SearchSort } from '../types/job';

const DEFAULT_DATASET: PrebuiltJobPayload = {
  generatedAt: '',
  jobs: [],
  sources: [],
  stats: {
    generatedAt: '',
    jobCount: 0,
    sourceCount: 0,
  },
};

const STORAGE_KEYS = {
  favorites: 'academic-job-search:favorites',
  recentKeywords: 'academic-job-search:recent-keywords',
  seenJobIds: 'academic-job-search:seen-job-ids',
  searchState: 'academic-job-search:search-state',
} as const;

const USEFUL_LINKS = [
  { title: 'JobRxiv', value: 'https://jobrxiv.org/' },
  { title: 'Academics', value: 'https://www.academics.com/' },
  { title: 'jobs.ac.uk', value: 'https://www.jobs.ac.uk/' },
  { title: 'Academic Positions', value: 'https://academicpositions.com/' },
  { title: 'Find a PhD', value: 'https://www.findaphd.com/' },
  { title: 'JobbNorge', value: 'https://www.jobbnorge.no/search' },
  { title: 'Academic Jobs Online', value: 'https://academicjobsonline.org/ajo/jobs' },
  { title: 'EURAXESS', value: 'https://euraxess.ec.europa.eu/jobs/search' },
  { title: 'Nature Careers', value: 'https://www.nature.com/naturecareers/jobs/' },
  { title: 'Science Careers', value: 'https://www.science.org/careers' },
];

const dataset = ref<PrebuiltJobPayload>(DEFAULT_DATASET);
const jobsLoaded = ref(false);
const loadError = ref('');

const keywordInput = ref('');
const matchMode = ref<'any' | 'all'>('any');
const selectedCountry = ref('All');
const selectedInstitution = ref('All');
const selectedRoleTypes = ref<RoleType[]>([]);
const sortBy = ref<SearchSort>('relevance');
const onlyFavorites = ref(false);
const onlyNew = ref(false);
const onlyWithDeadline = ref(false);
const selectedUsefulLink = ref<string | null>(null);

const loading = ref(false);
const hasSearched = ref(false);
const searchResults = ref<Job[]>([]);
const expandedDescriptions = ref<Record<string, boolean>>({});

const favoriteIds = ref<string[]>([]);
const seenJobIds = ref<string[]>([]);
const recentKeywords = ref<string[]>([]);
let recentKeywordSaveTimer: ReturnType<typeof setTimeout> | null = null;

const itemsPerPage = 15;
const page = ref(1);

const roleTypeOptions = [
  { title: 'PhD', value: 'phd' },
  { title: 'Postdoc', value: 'postdoc' },
  { title: 'Professor', value: 'professor' },
  { title: 'Lecturer', value: 'lecturer' },
  { title: 'Researcher', value: 'researcher' },
  { title: 'Assistant', value: 'assistant' },
  { title: 'Faculty', value: 'faculty' },
  { title: 'Other', value: 'other' },
];

const sortOptions = [
  { title: 'Relevance', value: 'relevance' },
  { title: 'Deadline (soonest first)', value: 'deadline-asc' },
  { title: 'Deadline (latest first)', value: 'deadline-desc' },
  { title: 'Newest scraped first', value: 'recent' },
  { title: 'Title (A-Z)', value: 'title-asc' },
  { title: 'Country (A-Z)', value: 'country-asc' },
  { title: 'Institution (A-Z)', value: 'institution-asc' },
];

const favoriteIdSet = computed(() => new Set(favoriteIds.value));
const seenJobIdSet = computed(() => new Set(seenJobIds.value));
const usefulLinkOptions = computed(() => USEFUL_LINKS);
const currentTheme = computed(() => generalInfoStore.theme);

const countryOptions = computed(() => {
  const countries = new Set(dataset.value.sources.map((source) => source.countryName));
  return ['All', ...Array.from(countries).sort((left, right) => left.localeCompare(right))];
});

const formattedGeneratedAt = computed(() =>
  dataset.value.generatedAt
    ? new Date(dataset.value.generatedAt).toLocaleString()
    : 'Unavailable'
);

const pageCount = computed(() => Math.max(1, Math.ceil(searchResults.value.length / itemsPerPage)));
const paginatedJobs = computed(() =>
  searchResults.value.slice((page.value - 1) * itemsPerPage, page.value * itemsPerPage)
);

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function restorePersistedState() {
  favoriteIds.value = readStorage<string[]>(STORAGE_KEYS.favorites, []);
  recentKeywords.value = readStorage<string[]>(STORAGE_KEYS.recentKeywords, []);
  seenJobIds.value = readStorage<string[]>(STORAGE_KEYS.seenJobIds, []);

  const state = readStorage<{
    keywords?: string;
    matchMode?: 'any' | 'all';
    country?: string;
    institution?: string;
    roleTypes?: RoleType[];
    sortBy?: SearchSort;
    onlyFavorites?: boolean;
    onlyNew?: boolean;
    onlyWithDeadline?: boolean;
  }>(STORAGE_KEYS.searchState, {});

  keywordInput.value = state.keywords ?? '';
  matchMode.value = state.matchMode ?? 'any';
  selectedCountry.value = state.country ?? 'All';
  selectedInstitution.value = 'All';
  selectedRoleTypes.value = state.roleTypes ?? [];
  sortBy.value = state.sortBy ?? 'relevance';
  onlyFavorites.value = state.onlyFavorites ?? false;
  onlyNew.value = state.onlyNew ?? false;
  onlyWithDeadline.value = state.onlyWithDeadline ?? false;
}

function persistCurrentState() {
  writeStorage(STORAGE_KEYS.searchState, {
    keywords: keywordInput.value,
    matchMode: matchMode.value,
    country: selectedCountry.value,
    institution: 'All',
    roleTypes: selectedRoleTypes.value,
    sortBy: sortBy.value,
    onlyFavorites: onlyFavorites.value,
    onlyNew: onlyNew.value,
    onlyWithDeadline: onlyWithDeadline.value,
  });
}

async function loadJobsJson() {
  try {
    loadError.value = '';
    const response = await fetch(`${import.meta.env.BASE_URL}prebuilt_jobs.json`, {
      cache: 'no-cache',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to load prebuilt_jobs.json (${response.status})`);
    }

    const rawPayload = await response.json();
    dataset.value = parsePrebuiltPayload(rawPayload);
    jobsLoaded.value = true;
    onSearch();
  } catch (error) {
    jobsLoaded.value = false;
    loadError.value = error instanceof Error ? error.message : 'Failed to load jobs JSON.';
    console.error(error);
  }
}

function roleMatches(job: Job): boolean {
  if (!selectedRoleTypes.value.length) {
    return true;
  }
  return selectedRoleTypes.value.some((role) => job.roleTypes.includes(role));
}

function keywordMatches(job: Job, keywords: string[]): boolean {
  if (!keywords.length) {
    return true;
  }

  return matchMode.value === 'all'
    ? keywords.every((keyword) => job.searchableText.includes(keyword))
    : keywords.some((keyword) => job.searchableText.includes(keyword));
}

function calculateRelevance(job: Job, keywords: string[]): number {
  if (!keywords.length) {
    return 0;
  }

  return keywords.reduce((score, keyword) => {
    if (!job.searchableText.includes(keyword)) {
      return score;
    }
    return score + (job.normalizedTitle.includes(keyword) ? 2 : 1);
  }, 0);
}

function sortJobs(jobs: Job[], keywords: string[]): Job[] {
  const sorted = [...jobs];
  sorted.sort((left, right) => {
    switch (sortBy.value) {
      case 'deadline-asc':
        return (left.deadline ?? '9999-12-31').localeCompare(right.deadline ?? '9999-12-31');
      case 'deadline-desc':
        return (right.deadline ?? '').localeCompare(left.deadline ?? '');
      case 'title-asc':
        return left.title.localeCompare(right.title);
      case 'country-asc':
        return left.sourceMeta.countryName.localeCompare(right.sourceMeta.countryName);
      case 'institution-asc':
        return left.sourceMeta.institution.localeCompare(right.sourceMeta.institution);
      case 'recent':
        return (right.scrapedAt ?? '').localeCompare(left.scrapedAt ?? '');
      case 'relevance':
      default:
        return calculateRelevance(right, keywords) - calculateRelevance(left, keywords);
    }
  });
  return sorted;
}

function onSearch() {
  if (!jobsLoaded.value) {
    return;
  }

  hasSearched.value = true;
  page.value = 1;
  persistCurrentState();

  const keywords = tokenizeKeywords(keywordInput.value);
  const favoriteSet = favoriteIdSet.value;

  const filtered = dataset.value.jobs.filter((job) => {
    if (selectedCountry.value !== 'All' && job.sourceMeta.countryName !== selectedCountry.value) {
      return false;
    }
    if (selectedInstitution.value !== 'All' && job.sourceMeta.institution !== selectedInstitution.value) {
      return false;
    }
    if (!roleMatches(job)) {
      return false;
    }
    if (!keywordMatches(job, keywords)) {
      return false;
    }
    if (onlyFavorites.value && !favoriteSet.has(job.id)) {
      return false;
    }
    if (onlyNew.value && !isNewJob(job)) {
      return false;
    }
    if (onlyWithDeadline.value && !job.deadline) {
      return false;
    }
    return true;
  });

  const deduped = Array.from(new Map(filtered.map((job) => [job.id, job])).values());
  searchResults.value = sortJobs(deduped, keywords);
}

function resetFilters() {
  keywordInput.value = '';
  matchMode.value = 'any';
  selectedCountry.value = 'All';
  selectedInstitution.value = 'All';
  selectedRoleTypes.value = [];
  sortBy.value = 'relevance';
  onlyFavorites.value = false;
  onlyNew.value = false;
  onlyWithDeadline.value = false;
  onSearch();
}

function toggleFavorite(jobId: string) {
  const next = favoriteIdSet.value;
  if (next.has(jobId)) {
    favoriteIds.value = favoriteIds.value.filter((id) => id !== jobId);
  } else {
    favoriteIds.value = [...favoriteIds.value, jobId];
  }
}

function toggleDescription(jobId: string) {
  expandedDescriptions.value = {
    ...expandedDescriptions.value,
    [jobId]: !expandedDescriptions.value[jobId],
  };
}

function isNewJob(job: Job): boolean {
  return !seenJobIdSet.value.has(job.id);
}

function markJobSeen(jobId: string) {
  if (seenJobIdSet.value.has(jobId)) {
    return;
  }
  seenJobIds.value = [...seenJobIds.value, jobId];
}

function markCurrentResultsSeen() {
  const merged = new Set(seenJobIds.value);
  searchResults.value.forEach((job) => merged.add(job.id));
  seenJobIds.value = Array.from(merged);
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) {
    return 'N/A';
  }
  return new Date(deadline).toLocaleDateString();
}

function formatRole(role: RoleType): string {
  if (role === 'phd') return 'PhD';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function cleanText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function buildJobSummary(job: Job): string {
  const details = [
    job.department ? `Department: ${job.department}` : null,
    job.location ? `Location: ${job.location}` : null,
    job.employmentType ? `Employment: ${job.employmentType}` : null,
    job.roleTypes.length ? `Role: ${job.roleTypes.map((role) => formatRole(role)).join(', ')}` : null,
    job.deadline ? `Deadline: ${formatDeadline(job.deadline)}` : null,
    `Institution: ${job.sourceMeta.institution}`,
    `Country: ${job.sourceMeta.countryName}`,
    `Platform: ${job.sourceMeta.platform}`,
    `Link: ${job.url}`,
  ]
    .map((value) => cleanText(value))
    .filter(Boolean);

  return details.join(' • ');
}

function saveRecentKeyword(keyword: string) {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) {
    return;
  }

  recentKeywords.value = [
    normalizedKeyword,
    ...recentKeywords.value.filter(
      (existingKeyword) => existingKeyword.toLowerCase() !== normalizedKeyword.toLowerCase()
    ),
  ].slice(0, 12);
}

function scheduleRecentKeywordSave() {
  if (recentKeywordSaveTimer) {
    clearTimeout(recentKeywordSaveTimer);
  }

  recentKeywordSaveTimer = setTimeout(() => {
    saveRecentKeyword(keywordInput.value);
    recentKeywordSaveTimer = null;
  }, 900);
}

function applyRecentKeyword(keyword: string) {
  keywordInput.value = keyword;
}

function deleteRecentKeyword(keyword: string) {
  recentKeywords.value = recentKeywords.value.filter((entry) => entry !== keyword);
}

function openUsefulLink(url: string | null) {
  if (!url || typeof window === 'undefined') {
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  selectedUsefulLink.value = null;
}

watch(favoriteIds, (value) => writeStorage(STORAGE_KEYS.favorites, value), { deep: true });
watch(recentKeywords, (value) => writeStorage(STORAGE_KEYS.recentKeywords, value), { deep: true });
watch(seenJobIds, (value) => writeStorage(STORAGE_KEYS.seenJobIds, value), { deep: true });
watch(keywordInput, () => scheduleRecentKeywordSave());
watch(selectedUsefulLink, (value) => openUsefulLink(value));
watch(
  [
    keywordInput,
    matchMode,
    selectedCountry,
    selectedRoleTypes,
    sortBy,
    onlyFavorites,
    onlyNew,
    onlyWithDeadline,
    favoriteIds,
    seenJobIds,
  ],
  () => {
    if (!jobsLoaded.value) {
      return;
    }
    onSearch();
  },
  { deep: true }
);

onMounted(async () => {
  restorePersistedState();
  await loadJobsJson();
});

onBeforeUnmount(() => {
  if (recentKeywordSaveTimer) {
    clearTimeout(recentKeywordSaveTimer);
  }
});
</script>

<style scoped>
.search-page {
  position: relative;
  min-height: 100vh;
  padding: 116px 16px 56px;
  background:
    radial-gradient(circle at top left, rgba(214, 227, 255, 0.95), transparent 32%),
    radial-gradient(circle at top right, rgba(194, 235, 224, 0.75), transparent 28%),
    linear-gradient(180deg, #f5f7fb 0%, #eef2f6 100%);
  overflow: hidden;
}

.page-shell {
  position: relative;
  z-index: 1;
  max-width: 1240px;
  margin: 0 auto;
}

.page-orb {
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  filter: blur(8px);
  opacity: 0.5;
}

.page-orb-left {
  top: 84px;
  left: -120px;
  background: rgba(112, 158, 255, 0.18);
}

.page-orb-right {
  top: 180px;
  right: -100px;
  background: rgba(69, 191, 150, 0.18);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 24px;
  align-items: stretch;
  padding: 28px;
  border: 1px solid rgba(69, 95, 136, 0.12);
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(236, 241, 248, 0.92));
  box-shadow: 0 24px 60px rgba(20, 41, 74, 0.08);
}

.hero-brand {
  display: flex;
  align-items: center;
  gap: 18px;
}

.hero-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  box-shadow: 0 10px 24px rgba(18, 44, 79, 0.12);
}

.hero-eyebrow,
.results-eyebrow {
  margin: 0 0 6px;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #56657d;
  font-weight: 700;
}

.hero-title,
.results-title {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.25rem, 4vw, 4rem);
  line-height: 0.95;
  letter-spacing: -0.04em;
  color: #10284a;
}

.hero-text {
  max-width: 760px;
  margin: 22px 0 0;
  font-size: 1.05rem;
  line-height: 1.75;
  color: #455368;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.hero-stat-card {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(11, 34, 67, 0.96);
  color: #f4f7fb;
}

.hero-stat-wide {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #24466f, #153150);
}

.hero-stat-label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.76rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(232, 239, 248, 0.74);
}

.hero-stat-value {
  font-size: 1.65rem;
  line-height: 1.1;
}

.hero-stat-small {
  font-size: 1rem;
}

.search-panel,
.results-shell {
  margin-top: 26px;
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(102, 122, 154, 0.12);
  box-shadow: 0 20px 48px rgba(27, 47, 78, 0.06);
  backdrop-filter: blur(16px);
}

.search-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(240px, 0.7fr);
  gap: 24px;
}

.control-label {
  font-size: 0.84rem;
  font-weight: 700;
  color: #10284a;
}

.keyword-match-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 6px;
}

.keyword-field :deep(.v-field) {
  border-radius: 20px;
  background: #f7f9fc;
  box-shadow: inset 0 0 0 1px rgba(93, 112, 142, 0.08);
}

.keyword-field :deep(.v-field__input) {
  min-height: 56px;
  padding-top: 0;
  padding-bottom: 0;
}

.recent-keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 10px;
}

.recent-keyword-chip {
  background: #eef3fa;
  color: #153150;
}

.keyword-match-inline :deep(.v-input__control) {
  min-height: auto;
}

.keyword-match-inline :deep(.v-selection-control-group) {
  gap: 14px;
}

.keyword-match-inline :deep(.v-selection-control) {
  min-height: 28px;
}

.switch-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-top: 6px;
}

.filter-switch {
  margin: 0;
}

.filter-switch :deep(.v-selection-control) {
  min-height: 30px;
}

.search-note-card {
  height: 100%;
  padding: 18px 20px;
  border-radius: 24px;
  background: linear-gradient(180deg, #eff5ff, #edf6f2);
  border: 1px solid rgba(76, 107, 154, 0.12);
}

.search-note-label {
  margin: 0 0 10px;
  font-size: 0.76rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
  color: #4f5f76;
}

.search-note-text {
  margin: 0;
  line-height: 1.7;
  color: #31435e;
}

.results-toolbar {
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(97, 117, 146, 0.12);
}

.toolbar-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.toolbar-field :deep(.v-field) {
  border-radius: 18px;
  background: #f7f9fc;
  box-shadow: inset 0 0 0 1px rgba(93, 112, 142, 0.08);
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.action-btn {
  min-height: 42px;
  border-radius: 14px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

.subtle-btn {
  color: #8c2c2c;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin: 24px 0 18px;
}

.results-title {
  font-size: clamp(1.7rem, 3vw, 2.4rem);
}

.results-summary {
  color: #5d6b80;
  font-size: 0.95rem;
}

.results-list {
  display: grid;
  gap: 18px;
}

.job-card {
  padding: 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 252, 0.94));
  border: 1px solid rgba(96, 117, 150, 0.12);
  box-shadow: 0 12px 28px rgba(26, 45, 78, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.job-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 36px rgba(26, 45, 78, 0.1);
}

.job-card-top {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.job-main {
  flex: 1;
  min-width: 0;
}

.job-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.role-chip {
  background: rgba(32, 68, 111, 0.08);
}

.job-title-link {
  display: inline-block;
  color: #10284a;
  text-decoration: none;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.15rem, 2vw, 1.55rem);
  line-height: 1.28;
  font-weight: 700;
}

.job-title-link:hover {
  color: #24466f;
}

.job-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 12px;
  color: #5c6b80;
  font-size: 0.94rem;
}

.job-side {
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 10px;
  min-width: 120px;
}

.deadline-block {
  text-align: right;
}

.deadline-label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #69788d;
}

.deadline-value {
  color: #10284a;
}

.job-card-footer {
  display: flex;
  justify-content: end;
  margin-top: 16px;
}

.details-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

.job-details {
  margin-top: 14px;
  padding-top: 16px;
  border-top: 1px solid rgba(96, 117, 150, 0.12);
  color: #445268;
  line-height: 1.7;
}

.pagination-shell {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

.saved-search-chip {
  cursor: pointer;
}

@media (max-width: 960px) {
  .hero-panel,
  .search-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .search-page {
    padding: 98px 8px 40px;
  }

  .hero-panel,
  .search-panel,
  .results-shell {
    padding: 18px;
    border-radius: 22px;
  }

  .hero-brand {
    align-items: start;
  }

  .hero-logo {
    width: 58px;
    height: 58px;
  }

  .results-header,
  .job-card-top {
    flex-direction: column;
    align-items: start;
  }

  .job-side {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .toolbar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.search-page--dark {
  background:
    radial-gradient(circle at top left, rgba(71, 98, 152, 0.28), transparent 32%),
    radial-gradient(circle at top right, rgba(43, 114, 90, 0.22), transparent 28%),
    linear-gradient(180deg, #0f1724 0%, #121d2b 100%);
}

.search-page--dark .hero-panel,
.search-page--dark .search-panel,
.search-page--dark .results-shell {
  background: rgba(17, 25, 39, 0.84);
  border-color: rgba(146, 167, 201, 0.14);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.22);
}

.search-page--dark .hero-title,
.search-page--dark .results-title,
.search-page--dark .control-label,
.search-page--dark .job-title-link,
.search-page--dark .deadline-value {
  color: #f2f6fb;
}

.search-page--dark .hero-text,
.search-page--dark .results-summary,
.search-page--dark .job-meta-row,
.search-page--dark .job-details,
.search-page--dark .search-note-text {
  color: #c2cddd;
}

.search-page--dark .hero-eyebrow,
.search-page--dark .results-eyebrow,
.search-page--dark .deadline-label,
.search-page--dark .search-note-label {
  color: #8fa1bc;
}

.search-page--dark .hero-logo {
  background: rgba(255, 255, 255, 0.08);
}

.search-page--dark .hero-stat-card {
  background: rgba(34, 49, 74, 0.96);
}

.search-page--dark .hero-stat-wide {
  background: linear-gradient(135deg, #314d74, #203753);
}

.search-page--dark .keyword-field :deep(.v-field),
.search-page--dark .toolbar-field :deep(.v-field) {
  background: rgba(240, 244, 250, 0.08);
  box-shadow: inset 0 0 0 1px rgba(168, 185, 214, 0.12);
}

.search-page--dark .recent-keyword-chip,
.search-page--dark .role-chip {
  background: rgba(173, 199, 247, 0.12);
  color: #dbe7ff;
}

.search-page--dark .search-note-card {
  background: linear-gradient(180deg, rgba(38, 55, 83, 0.9), rgba(24, 44, 56, 0.9));
  border-color: rgba(146, 167, 201, 0.14);
}

.search-page--dark .results-toolbar,
.search-page--dark .job-details {
  border-color: rgba(146, 167, 201, 0.14);
}

.search-page--dark .job-card {
  background: linear-gradient(180deg, rgba(21, 30, 46, 0.98), rgba(18, 27, 41, 0.94));
  border-color: rgba(146, 167, 201, 0.14);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
}

.search-page--dark .job-title-link:hover {
  color: #adc7f7;
}
</style>
