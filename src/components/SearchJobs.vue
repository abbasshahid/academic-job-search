<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card outlined elevation="6">
          <v-card-title>
            <span class="text-h5 font-medium">Job Search</span>
            <v-spacer />
            <v-btn text @click="showFilters = !showFilters">
              {{ showFilters ? 'Hide Filters' : 'Show Filters' }}
            </v-btn>
          </v-card-title>

          <v-expand-transition>
            <div v-if="showFilters">
              <v-divider />
              <v-card-text>
                <v-row dense>
                  <v-col cols="12" sm="4">
                    <v-select
                      v-model="selectedCountry"
                      :items="countryOptions"
                      label="Country"
                      dense
                      outlined
                    />
                  </v-col>

                  <v-col cols="12" sm="4">
                    <label class="font-medium mb-1">Match Mode:</label>
                    <div class="d-flex align-center">
                      <input type="radio" id="any" value="any" v-model="matchMode" />
                      <label for="any" class="ml-1">Any</label>
                      <input type="radio" id="all" value="all" v-model="matchMode" class="ml-4" />
                      <label for="all" class="ml-1">All</label>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="4">
                    <label class="font-medium mb-1">Link Mode:</label>
                    <div class="d-flex align-center">
                      <input type="radio" id="both" value="both" v-model="linkMode" />
                      <label for="both" class="ml-1">Existing + Additional</label>
                      <input type="radio" id="onlyExtra" value="onlyExtra" v-model="linkMode" class="ml-4" />
                      <label for="onlyExtra" class="ml-1">Only Additional</label>
                    </div>
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="extraLinksInput"
                      label="Additional Links (one per line)"
                      rows="2"
                      dense
                      outlined
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </div>
          </v-expand-transition>

          <v-divider />

          <v-card-text>
            <v-text-field
              v-model="keywordInput"
              label="Keywords (comma-separated)"
              placeholder="e.g. professor, researcher"
              dense
              outlined
              @keyup.enter="onSearch"
            />
            <v-btn
              block
              color="primary"
              class="mt-4"
              :loading="loading"
              :disabled="!hasKeywords || loading"
              @click="onSearch"
            >
              Search
            </v-btn>
          </v-card-text>

          <v-progress-linear v-if="loading" indeterminate color="primary" />

          <v-card-text>
            <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>

            <v-list two-line v-if="jobs.length">
              <v-list-item v-for="job in jobs" :key="job.url">
                <v-list-item-content>
                  <v-list-item-title>
                    <a :href="job.url" target="_blank">{{ job.title }}</a>
                  </v-list-item-title>
                  <v-list-item-subtitle>Source: {{ job.source }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>

            <v-alert v-else-if="!loading && hasSearched" type="info" dense>
              No results found.
            </v-alert>
          </v-card-text>
        </v-card>
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
const linkMode = ref<'onlyExtra' | 'both'>('both');
const matchMode = ref<'any' | 'all'>('any');
const selectedCountry = ref('All');

const jobs = ref<Job[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const hasSearched = ref(false);

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
  error.value = null;
  hasSearched.value = true;

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

  jobs.value = filtered;
  loading.value = false;
}
</script>

<style scoped>
/* Add component-specific styles here */
</style>
