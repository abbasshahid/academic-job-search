<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card outlined elevation="2">
          <v-card-title>
            <span class="text-h5 font-medium">Job Search</span>
            <v-spacer />
            <v-btn icon @click="showFilters = !showFilters">
              <v-icon>{{ showFilters ? 'mdi-filter-off' : 'mdi-filter' }}</v-icon>
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
                      :items="['All', ...countries.map(c => c.toUpperCase())]"
                      label="Country"
                      dense
                      outlined
                    />
                  </v-col>

                  <v-col cols="12" sm="4">
                    <v-radio-group v-model="matchMode" row>
                      <v-radio label="Any" value="any" />
                      <v-radio label="All" value="all" />
                    </v-radio-group>
                  </v-col>

                  <v-col cols="12" sm="4">
                    <v-radio-group v-model="linkMode">
                      <v-radio label="Existing + Additional" value="both" />
                      <v-radio label="Only Additional" value="onlyExtra" />
                    </v-radio-group>
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

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import type { Job } from '../types/job';
import prebuiltJobs from '../prebuilt_jobs.json';

export default defineComponent({
  name: 'SearchJobs',
  setup() {
    console.log('Bootstrapped job count:', prebuiltJobs.length);
    const showFilters = ref(false);
    const keywordInput = ref('');
    const extraLinksInput = ref('');
    const linkMode = ref<'onlyExtra' | 'both'>('both');
    const matchMode = ref<'any' | 'all'>('any');
    const selectedCountry = ref<string>('All');

    const jobs = ref<Job[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const hasSearched = ref(false);

    const hasKeywords = computed(() => keywordInput.value.trim().length > 0);

    const countries = computed(() => {
      const set = new Set<string>();
      prebuiltJobs.forEach(j => {
        try {
          const code = new URL(j.source).hostname.split('.').pop() || '';
          set.add(code.toLowerCase());
        } catch {}
      });
      return Array.from(set).sort();
    });

    function onSearch() {
      console.log('Searching for:', keywordInput.value);
      if (!hasKeywords.value) return;
      loading.value = true;
      error.value = null;
      hasSearched.value = true;

      const kws = keywordInput.value
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k);

      let pool = prebuiltJobs;
      console.log('Initial pool:', pool.length);
      if (linkMode.value === 'onlyExtra') {
        const extras = extraLinksInput.value.split('\n').map(l => l.trim()).filter(l => l);
        pool = pool.filter(j => extras.includes(j.source));
      }
      console.log('After extra links:', pool.length);
      if (selectedCountry.value !== 'All') {
        pool = pool.filter(j => {
          try {
            return (new URL(j.source).hostname.split('.').pop() || '') === selectedCountry.value;
          } catch {
            return false;
          }
        });
      }
      console.log('After country:', pool.length);

      const filtered = pool.filter(j => {
        const text = j.title.toLowerCase();
        return matchMode.value === 'any'
          ? kws.some(kw => text.includes(kw))
          : kws.every(kw => text.includes(kw));
      });
      console.log('Filtered results:', filtered.length);
      jobs.value = filtered;
      loading.value = false;
    }

    return {
      showFilters,
      keywordInput,
      extraLinksInput,
      linkMode,
      matchMode,
      selectedCountry,
      countries,
      jobs,
      loading,
      error,
      hasKeywords,
      hasSearched,
      onSearch
    };
  }
});
</script>

<style scoped>
/* Vuetify assumed globally in main.ts */
</style>
