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
                  <input type="radio" id="all" value="all" v-model="matchMode" class="ml-4" />
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
            />
            <!-- Add padding below button -->
            <div class="mt-4 mb-6">
              <v-btn
                block
                color="primary"
                :loading="loading"
                :disabled="!hasKeywords || loading"
                @click="onSearch"
              >
                Search
              </v-btn>
            </div>
          </v-card-text>

          <v-progress-linear v-if="loading" indeterminate color="primary" />
        </v-card>

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
                <a :href="item.url" target="_blank" class="blue-link">{{ item.title }}</a>
                <div class="text-caption text--secondary">Source: {{ item.source }}</div>
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
          v-if="!loading && hasSearched && uniqueJobs.length === 0"
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
import { ref, computed } from 'vue';
import type { Job } from '../types/job';
import prebuiltJobs from '../prebuilt_jobs.json';

const showFilters = ref(false);
const keywordInput = ref('');
const extraLinksInput = ref('');
const linkMode = ref<'both' | 'onlyExtra'>('both');
const matchMode = ref<'any' | 'all'>('any');
const selectedCountry = ref('All');

const jobs = ref<Job[]>([]);
const loading = ref(false);
const hasSearched = ref(false);

const itemsPerPage = 10;
const page = ref(1);

const hasKeywords = computed(() => keywordInput.value.trim().length > 0);

const countryOptions = computed(() => {
  const codes = new Set<string>();
  prebuiltJobs.forEach(j => {
    try {
      const parts = new URL(j.source).hostname.split('.');
      const code = parts[parts.length - 1]?.toUpperCase() ?? '';
      codes.add(code);
    } catch {}
  });
  return ['All', ...Array.from(codes).sort()];
});

function onSearch() {
  if (!hasKeywords.value) return;
  loading.value = true;
  hasSearched.value = true;
  page.value = 1;

  const kws = keywordInput.value
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(Boolean);

  let pool = [...prebuiltJobs];

  if (linkMode.value === 'onlyExtra') {
    const extras = extraLinksInput.value
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    pool = pool.filter(j => extras.includes(j.source));
  }

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

  const filtered = pool.filter(j => {
    const text = j.title.toLowerCase();
    return matchMode.value === 'any'
      ? kws.some(kw => text.includes(kw))
      : kws.every(kw => text.includes(kw));
  });

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique: Job[] = [];
  for (const j of filtered) {
    if (!seen.has(j.url)) {
      seen.add(j.url);
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
