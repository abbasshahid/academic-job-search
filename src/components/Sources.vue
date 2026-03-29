<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" xl="10">
        <v-card elevation="4">
          <v-card-title class="d-flex flex-wrap align-center ga-3">
            <div>
              <div class="text-h5 font-weight-medium">Source catalog</div>
              <div class="text-caption text-medium-emphasis">
                Shared metadata for the scheduled scraper and the static search UI.
              </div>
            </div>
            <v-spacer />
            <v-chip variant="tonal" color="primary">{{ sources.length }} sources</v-chip>
            <v-chip variant="tonal" color="secondary">{{ totalJobs }} jobs in current dataset</v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text class="pt-6">
            <v-row dense>
              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="text-caption text-medium-emphasis">Countries</div>
                    <div class="text-h5">{{ groupedSources.length }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="text-caption text-medium-emphasis">Low-yield sources</div>
                    <div class="text-h5">{{ lowYieldSources }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="text-caption text-medium-emphasis">Generated</div>
                    <div class="text-body-1">{{ generatedAt }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-expansion-panels class="mt-6">
              <v-expansion-panel
                v-for="group in groupedSources"
                :key="group.country"
              >
                <v-expansion-panel-title>
                  <div class="d-flex align-center ga-2">
                    <span>{{ group.country }}</span>
                    <v-chip size="small" variant="tonal">{{ group.sources.length }} sources</v-chip>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list lines="two">
                    <v-list-item
                      v-for="source in group.sources"
                      :key="source.url"
                    >
                      <template #title>
                        <div class="d-flex flex-wrap align-center ga-2">
                          <a :href="source.url" target="_blank" rel="noopener noreferrer">
                            {{ source.institution }}
                          </a>
                          <v-chip size="small" variant="outlined">{{ source.platform }}</v-chip>
                          <v-chip
                            v-if="source.tags.length"
                            size="small"
                            variant="tonal"
                          >
                            {{ source.tags.join(', ') }}
                          </v-chip>
                        </div>
                      </template>
                      <template #subtitle>
                        <div class="text-caption text-medium-emphasis">
                          {{ source.url }}
                        </div>
                        <div class="text-caption text-medium-emphasis mt-1">
                          {{ jobsBySource.get(source.url) ?? 0 }} jobs indexed
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { sourceCatalog } from '../data/sourceCatalog';
import { parsePrebuiltPayload } from '../utils/jobData';

const sources = sourceCatalog;
const jobsBySource = ref(new Map<string, number>());
const generatedAt = ref('Unavailable');

const totalJobs = computed(() =>
  Array.from(jobsBySource.value.values()).reduce((sum, count) => sum + count, 0)
);

const lowYieldSources = computed(() =>
  sources.filter((source) => (jobsBySource.value.get(source.url) ?? 0) <= 1).length
);

const groupedSources = computed(() => {
  const grouped = new Map<string, typeof sources>();

  sources.forEach((source) => {
    const existing = grouped.get(source.countryName) ?? [];
    existing.push(source);
    grouped.set(source.countryName, existing);
  });

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([country, countrySources]) => ({
      country,
      sources: [...countrySources].sort((left, right) => left.institution.localeCompare(right.institution)),
    }));
});

onMounted(async () => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}prebuilt_jobs.json`, {
      cache: 'no-cache',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return;
    }

    const payload = parsePrebuiltPayload(await response.json());
    generatedAt.value = payload.generatedAt ? new Date(payload.generatedAt).toLocaleString() : 'Unavailable';

    const counts = new Map<string, number>();
    payload.jobs.forEach((job) => {
      counts.set(job.source, (counts.get(job.source) ?? 0) + 1);
    });
    jobsBySource.value = counts;
  } catch (error) {
    console.error(error);
  }
});
</script>
