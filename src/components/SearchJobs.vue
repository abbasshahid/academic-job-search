<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card outlined elevation="6">
          <v-card-title>
            <span class="text-h5 font-medium">Job Search</span>
            <v-spacer />
          </v-card-title>

          <v-divider />

          <v-row>
            <v-col cols="6" sm="4" class="pl-12">
              <label class="font-medium mb-1">Keywords Matching Mode:</label>
              <div class="d-flex align-center">
                <input type="radio" id="any" value="any" v-model="matchMode" />
                <label for="any" class="ml-1">Any</label>

                <input
                  type="radio"
                  id="all"
                  value="all"
                  v-model="matchMode"
                  class="ml-4"
                />
                <label for="all" class="ml-1">All</label>
              </div>
            </v-col>

            <v-col cols="6" sm="4">
              <v-select
                v-model="selectedCountry"
                :items="countryOptions"
                label="Country"
                dense
                outlined
                :disabled="!jobsLoaded"
              />
            </v-col>
          </v-row>

          <v-card-text class="pb-0">
            <v-text-field
              v-model="keywordInput"
              label="Keywords (comma-separated)"
              placeholder="e.g. professor, researcher"
              dense
              outlined
              @keyup.enter="onSearch"
              :disabled="!jobsLoaded"
            />

            <div class="mt-4 mb-6">
              <v-btn
                block
                color="primary"
                :loading="loading"
                :disabled="!hasKeywords || loading || !jobsLoaded"
                @click="onSearch"
              >
                Search
              </v-btn>
            </div>
          </v-card-text>

          <v-progress-linear v-if="loading" indeterminate color="primary" />
        </v-card>

        <!-- Load error -->
        <v-alert
          v-if="loadError"
          type="error"
          class="mt-4"
        >
          {{ loadError }}
        </v-alert>

        <!-- Results Table -->
        <v-card outlined class="mt-6">
          <v-data-table
            :headers="[{ title: 'Job Listings', key: 'job' }]"
            :items="paginatedJobs"
            :items-per-page="itemsPerPage"
            class="elevation-1"
            hide-default-footer
          >
            <template #item.job="{ item }">
              <div>
                <a :href="item.url" target="_blank" class="blue-link">
                  {{ item.title }}
                </a>
                <div class="text-caption text--secondary">
                  Source: {{ item.source }}
                </div>
              </div>
            </template>
          </v-data-table>

          <!-- Pagination Controls -->
          <v-card-actions class="justify-center">
            <v-pagination
              v-model="page"
              :length="pageCount"
              total-visible="4"
            />
          </v-card-actions>
        </v-card>

        <!-- No Results -->
        <v-alert
          v-if="!loading && hasSearched && uniqueJobs.length === 0 && jobsLoaded"
          type="info"
          class="mt-4"
        >
          No results found.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Job } from '../types/job';

const prebuiltJobs = ref<Job[]>([]);
const jobsLoaded = ref(false);
const loadError = ref<string>('');

// ---------- Load JSON on mount ----------
async function loadJobsJson() {
  try {
    loadError.value = '';
    const url = `${import.meta.env.BASE_URL}prebuilt_jobs.json?ts=${Date.now()}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to load prebuilt_jobs.json (${res.status})`);
    }

    prebuiltJobs.value = await res.json();
    jobsLoaded.value = true;
  } catch (e: any) {
    jobsLoaded.value = false;
    loadError.value = e?.message || 'Failed to load jobs JSON.';
    console.error(e);
  }
}

onMounted(loadJobsJson);

// ---------- UI state ----------
const keywordInput = ref('');
const extraLinksInput = ref('');
const linkMode = ref<'both' | 'onlyExtra'>('both');
const matchMode = ref<'any' | 'all'>('any');
const selectedCountry = ref('All');

const jobs = ref<Job[]>([]);
const loading = ref(false);
const hasSearched = ref(false);

// ---------- Pagination ----------
const itemsPerPage = 10;
const page = ref(1);

// ---------- Computeds ----------
const hasKeywords = computed(() => keywordInput.value.trim().length > 0);

const countryOptions = computed(() => {
  const codes = new Set<string>();
  prebuiltJobs.value.forEach(j => {
    try {
      const parts = new URL(j.source).hostname.split('.');
      const code = parts[parts.length - 1]?.toUpperCase() ?? '';
      if (code) codes.add(code);
    } catch {}
  });
  return ['All', ...Array.from(codes).sort()];
});

function normalizeTitle(t: string) {
  return (t ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- Search ----------
function onSearch() {
  if (!hasKeywords.value || !jobsLoaded.value) return;

  loading.value = true;
  hasSearched.value = true;
  page.value = 1;

  const kws = keywordInput.value
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(Boolean);

  let pool = [...prebuiltJobs.value];

  // If onlyExtra mode, keep sources matching extraLinksInput
  if (linkMode.value === 'onlyExtra') {
    const extras = extraLinksInput.value
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    pool = pool.filter(j => extras.includes(j.source));
  }

  // Country filter
  if (selectedCountry.value !== 'All') {
    pool = pool.filter(j => {
      try {
        const parts = new URL(j.source).hostname.split('.');
        return parts[parts.length - 1]?.toUpperCase() === selectedCountry.value;
      } catch {
        return false;
      }
    });
  }

  // Keyword filtering (normalized)
  const filtered = pool.filter(j => {
    const text = normalizeTitle(j.title);

    return matchMode.value === 'any'
      ? kws.some(kw => text.includes(kw))
      : kws.every(kw => text.includes(kw));
  });

  // ✅ Deduplicate by URL + Title, not URL alone
  const seen = new Set<string>();
  const unique: Job[] = [];

  for (const j of filtered) {
    const key = `${j.url}::${normalizeTitle(j.title)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(j);
    }
  }

  jobs.value = unique;
  loading.value = false;
}

const uniqueJobs = computed(() => jobs.value);
const pageCount = computed(() => Math.ceil(uniqueJobs.value.length / itemsPerPage));
const paginatedJobs = computed(() =>
  uniqueJobs.value.slice((page.value - 1) * itemsPerPage, page.value * itemsPerPage)
);
</script>

<style scoped>
.blue-link {
  color: blue;
  text-decoration: underline;
}
</style>
