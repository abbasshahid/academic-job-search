<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" xl="10">
        <v-card elevation="6">
          <v-card-title class="d-flex flex-wrap align-center ga-3">
            <div>
              <div class="text-h5 font-weight-medium">Academic job search</div>
              <div class="text-caption text-medium-emphasis">
                Static dataset with scheduled scraping, enriched source metadata, saved searches, and exports.
              </div>
            </div>
            <v-spacer />
            <v-chip color="primary" variant="tonal">
              {{ dataset.stats.jobCount }} jobs
            </v-chip>
            <v-chip color="secondary" variant="tonal">
              {{ dataset.stats.sourceCount }} sources
            </v-chip>
            <v-chip variant="outlined">
              Updated {{ formattedGeneratedAt }}
            </v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text class="pt-6">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="keywordInput"
                  label="Keywords"
                  placeholder="e.g. postdoc, blockchain, machine learning"
                  variant="outlined"
                  clearable
                  :disabled="!jobsLoaded"
                  @keyup.enter="onSearch"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedCountry"
                  :items="countryOptions"
                  label="Country"
                  variant="outlined"
                  :disabled="!jobsLoaded"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedInstitution"
                  :items="institutionOptions"
                  label="Institution"
                  variant="outlined"
                  :disabled="!jobsLoaded"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedRoleTypes"
                  :items="roleTypeOptions"
                  label="Role types"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                  :disabled="!jobsLoaded"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="sortBy"
                  :items="sortOptions"
                  label="Sort results"
                  variant="outlined"
                  :disabled="!jobsLoaded"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-radio-group
                  v-model="matchMode"
                  inline
                  label="Keyword matching"
                  :disabled="!jobsLoaded"
                >
                  <v-radio label="Any keyword" value="any" />
                  <v-radio label="All keywords" value="all" />
                </v-radio-group>
              </v-col>
            </v-row>

            <v-row dense class="mt-1">
              <v-col cols="12" md="4">
                <v-switch
                  v-model="onlyFavorites"
                  color="warning"
                  label="Only favorites"
                  :disabled="!jobsLoaded"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-switch
                  v-model="onlyNew"
                  color="success"
                  label="Only new jobs"
                  :disabled="!jobsLoaded"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-switch
                  v-model="onlyWithDeadline"
                  color="info"
                  label="Only jobs with deadline"
                  :disabled="!jobsLoaded"
                />
              </v-col>
            </v-row>

            <div class="d-flex flex-wrap ga-3 mt-2">
              <v-btn
                color="primary"
                :loading="loading"
                :disabled="!jobsLoaded || loading"
                @click="onSearch"
              >
                Search
              </v-btn>
              <v-btn
                variant="outlined"
                :disabled="!jobsLoaded || loading"
                @click="resetFilters"
              >
                Reset filters
              </v-btn>
              <v-btn
                variant="tonal"
                color="success"
                :disabled="!searchResults.length"
                @click="markCurrentResultsSeen"
              >
                Mark current results seen
              </v-btn>
              <v-btn
                variant="tonal"
                color="secondary"
                :disabled="!searchResults.length"
                @click="exportResults('csv')"
              >
                Export CSV
              </v-btn>
              <v-btn
                variant="tonal"
                color="secondary"
                :disabled="!searchResults.length"
                @click="exportResults('json')"
              >
                Export JSON
              </v-btn>
            </div>

            <v-divider class="my-6" />

            <v-row dense>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="savedSearchName"
                  label="Saved search name"
                  placeholder="e.g. Austria postdocs"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="8" class="d-flex flex-wrap align-center ga-2">
                <v-btn
                  color="primary"
                  variant="tonal"
                  :disabled="!jobsLoaded"
                  @click="saveCurrentSearch"
                >
                  Save current filters
                </v-btn>
                <v-chip
                  v-for="search in savedSearches"
                  :key="search.id"
                  class="saved-search-chip"
                  closable
                  @click="applySavedSearch(search)"
                  @click:close="deleteSavedSearch(search.id)"
                >
                  {{ search.name }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-text>

          <v-progress-linear v-if="loading" indeterminate color="primary" />
        </v-card>

        <v-alert v-if="loadError" type="error" class="mt-4">
          {{ loadError }}
        </v-alert>

        <v-row class="mt-4" dense>
          <v-col cols="12" md="4">
            <v-card variant="outlined">
              <v-card-text>
                <div class="text-caption text-medium-emphasis">Visible results</div>
                <div class="text-h5">{{ searchResults.length }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card variant="outlined">
              <v-card-text>
                <div class="text-caption text-medium-emphasis">Favorites</div>
                <div class="text-h5">{{ favoriteIds.length }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card variant="outlined">
              <v-card-text>
                <div class="text-caption text-medium-emphasis">New in results</div>
                <div class="text-h5">{{ newResultsCount }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-card class="mt-6" elevation="2">
          <v-data-table
            :headers="headers"
            :items="paginatedJobs"
            :items-per-page="itemsPerPage"
            class="elevation-0"
            hide-default-footer
          >
            <template #item.title="{ item }">
              <div class="py-2">
                <div class="d-flex flex-wrap align-center ga-2">
                  <a
                    :href="item.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="job-link"
                    @click="markJobSeen(item.id)"
                  >
                    {{ item.title }}
                  </a>
                  <v-chip
                    v-if="isNewJob(item)"
                    size="small"
                    color="success"
                    variant="flat"
                  >
                    New
                  </v-chip>
                  <v-chip
                    v-for="role in item.roleTypes"
                    :key="`${item.id}-${role}`"
                    size="small"
                    variant="tonal"
                  >
                    {{ formatRole(role) }}
                  </v-chip>
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ item.sourceMeta.institution }} · {{ item.sourceMeta.countryName }} · {{ item.sourceMeta.platform }}
                </div>
              </div>
            </template>

            <template #item.deadline="{ item }">
              <span>{{ formatDeadline(item.deadline) }}</span>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex justify-end">
                <v-btn
                  size="small"
                  variant="text"
                  :icon="favoriteIdSet.has(item.id) ? 'mdi-star' : 'mdi-star-outline'"
                  :color="favoriteIdSet.has(item.id) ? 'warning' : undefined"
                  @click="toggleFavorite(item.id)"
                />
              </div>
            </template>
          </v-data-table>

          <v-divider />

          <v-card-actions class="justify-space-between flex-wrap ga-3">
            <div class="text-caption text-medium-emphasis">
              Showing {{ paginatedJobs.length }} of {{ searchResults.length }} results
            </div>
            <v-pagination
              v-model="page"
              :length="pageCount"
              total-visible="5"
            />
          </v-card-actions>
        </v-card>

        <v-alert
          v-if="!loading && hasSearched && !searchResults.length && jobsLoaded"
          type="info"
          class="mt-4"
        >
          No results matched the current keywords and filters.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { parsePrebuiltPayload, tokenizeKeywords } from '../utils/jobData';
import type { Job, PrebuiltJobPayload, RoleType, SavedSearch, SearchSort } from '../types/job';

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
  savedSearches: 'academic-job-search:saved-searches',
  seenJobIds: 'academic-job-search:seen-job-ids',
  searchState: 'academic-job-search:search-state',
} as const;

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
const savedSearchName = ref('');

const loading = ref(false);
const hasSearched = ref(false);
const searchResults = ref<Job[]>([]);

const favoriteIds = ref<string[]>([]);
const seenJobIds = ref<string[]>([]);
const savedSearches = ref<SavedSearch[]>([]);

const itemsPerPage = 15;
const page = ref(1);

const headers = [
  { title: 'Job', key: 'title', sortable: false },
  { title: 'Deadline', key: 'deadline', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];

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

const countryOptions = computed(() => {
  const countries = new Set(dataset.value.sources.map((source) => source.countryName));
  return ['All', ...Array.from(countries).sort((left, right) => left.localeCompare(right))];
});

const institutionOptions = computed(() => {
  const institutions = new Set(dataset.value.sources.map((source) => source.institution));
  return ['All', ...Array.from(institutions).sort((left, right) => left.localeCompare(right))];
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
const newResultsCount = computed(() => searchResults.value.filter((job) => isNewJob(job)).length);

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
  savedSearches.value = readStorage<SavedSearch[]>(STORAGE_KEYS.savedSearches, []);
  seenJobIds.value = readStorage<string[]>(STORAGE_KEYS.seenJobIds, []);

  const state = readStorage<Partial<SavedSearch>>(STORAGE_KEYS.searchState, {});
  keywordInput.value = state.keywords ?? '';
  matchMode.value = state.matchMode ?? 'any';
  selectedCountry.value = state.country ?? 'All';
  selectedInstitution.value = state.institution ?? 'All';
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
    institution: selectedInstitution.value,
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
    await onSearch();
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

async function onSearch() {
  if (!jobsLoaded.value) {
    return;
  }

  loading.value = true;
  hasSearched.value = true;
  page.value = 1;
  persistCurrentState();
  await nextTick();

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
  loading.value = false;
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
  savedSearchName.value = '';
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

function createSavedSearch(): SavedSearch {
  return {
    id: `search-${Date.now()}`,
    name: savedSearchName.value.trim() || keywordInput.value.trim() || 'Saved search',
    keywords: keywordInput.value,
    matchMode: matchMode.value,
    country: selectedCountry.value,
    institution: selectedInstitution.value,
    roleTypes: [...selectedRoleTypes.value],
    sortBy: sortBy.value,
    onlyFavorites: onlyFavorites.value,
    onlyNew: onlyNew.value,
    onlyWithDeadline: onlyWithDeadline.value,
  };
}

function saveCurrentSearch() {
  const savedSearch = createSavedSearch();
  savedSearches.value = [
    savedSearch,
    ...savedSearches.value.filter((search) => search.name !== savedSearch.name),
  ];
  savedSearchName.value = '';
}

function applySavedSearch(search: SavedSearch) {
  keywordInput.value = search.keywords;
  matchMode.value = search.matchMode;
  selectedCountry.value = search.country;
  selectedInstitution.value = search.institution;
  selectedRoleTypes.value = [...search.roleTypes];
  sortBy.value = search.sortBy;
  onlyFavorites.value = search.onlyFavorites;
  onlyNew.value = search.onlyNew;
  onlyWithDeadline.value = search.onlyWithDeadline;
  onSearch();
}

function deleteSavedSearch(id: string) {
  savedSearches.value = savedSearches.value.filter((search) => search.id !== id);
}

function downloadFile(filename: string, content: string, type: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const blob = new Blob([content], { type });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(objectUrl);
}

function exportResults(format: 'csv' | 'json') {
  if (!searchResults.value.length) {
    return;
  }

  if (format === 'json') {
    downloadFile(
      'academic-jobs.json',
      JSON.stringify(searchResults.value, null, 2),
      'application/json'
    );
    return;
  }

  const header = ['Title', 'URL', 'Institution', 'Country', 'Deadline', 'Roles'];
  const rows = searchResults.value.map((job) => [
    `"${job.title.replaceAll('"', '""')}"`,
    job.url,
    `"${job.sourceMeta.institution.replaceAll('"', '""')}"`,
    job.sourceMeta.countryName,
    job.deadline ?? '',
    job.roleTypes.join('|'),
  ]);

  const csv = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
  downloadFile('academic-jobs.csv', csv, 'text/csv;charset=utf-8');
}

watch(favoriteIds, (value) => writeStorage(STORAGE_KEYS.favorites, value), { deep: true });
watch(savedSearches, (value) => writeStorage(STORAGE_KEYS.savedSearches, value), { deep: true });
watch(seenJobIds, (value) => writeStorage(STORAGE_KEYS.seenJobIds, value), { deep: true });

onMounted(async () => {
  restorePersistedState();
  await loadJobsJson();
});
</script>

<style scoped>
.job-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.job-link:hover {
  text-decoration: underline;
}

.saved-search-chip {
  cursor: pointer;
}
</style>
