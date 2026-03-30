<template>
  <v-container fluid :class="['sources-page', `sources-page--${currentTheme}`]">
    <div class="sources-orb sources-orb-left" />
    <div class="sources-orb sources-orb-right" />

    <div class="sources-shell">
      <section class="sources-hero">
        <div>
          <p class="sources-eyebrow">Source Intelligence</p>
          <h1 class="sources-title">Source catalog</h1>
          <p class="sources-text">
            Shared metadata for the scheduled scraper and the static search UI, organized by country,
            platform, and current dataset coverage.
          </p>
        </div>

        <div class="sources-stats">
          <div class="sources-stat-card">
            <span class="sources-stat-label">Countries</span>
            <strong class="sources-stat-value">{{ groupedSources.length }}</strong>
          </div>
          <div class="sources-stat-card">
            <span class="sources-stat-label">Low-yield sources</span>
            <strong class="sources-stat-value">{{ lowYieldSources }}</strong>
          </div>
          <div class="sources-stat-card sources-stat-wide">
            <span class="sources-stat-label">Generated</span>
            <strong class="sources-stat-value sources-stat-small">{{ generatedAt }}</strong>
          </div>
        </div>
      </section>

      <section class="sources-panel">
        <div class="sources-summary-row">
          <v-chip variant="flat" color="primary">{{ sources.length }} sources</v-chip>
          <v-chip variant="tonal" color="secondary">{{ totalJobs }} jobs in current dataset</v-chip>
        </div>

        <div class="sources-groups">
          <article
            v-for="group in groupedSources"
            :key="group.country"
            class="country-card"
          >
            <button
              type="button"
              class="country-card-header country-toggle"
              @click="toggleCountry(group.country)"
            >
              <div>
                <p class="country-label">Country</p>
                <h2 class="country-name">{{ group.country }}</h2>
              </div>
              <div class="country-toggle-side">
                <v-chip size="small" variant="tonal">{{ group.sources.length }} sources</v-chip>
                <v-icon size="18">
                  {{ expandedCountries[group.country] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                </v-icon>
              </div>
            </button>

            <v-expand-transition>
              <div v-if="expandedCountries[group.country]" class="country-source-list">
                <div
                  v-for="source in group.sources"
                  :key="source.url"
                  class="source-item"
                >
                  <div class="source-item-main">
                    <a
                      :href="source.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="source-link"
                    >
                      {{ source.institution }}
                    </a>
                    <div class="source-meta">
                      <v-chip size="x-small" variant="outlined">{{ source.platform }}</v-chip>
                      <v-chip
                        v-if="source.tags.length"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ source.tags.join(', ') }}
                      </v-chip>
                    </div>
                    <div class="source-url">{{ source.url }}</div>
                  </div>

                  <div class="source-item-side">
                    <span class="source-jobs-label">Indexed jobs</span>
                    <strong class="source-jobs-value">{{ jobsBySource.get(source.url) ?? 0 }}</strong>
                  </div>
                </div>
              </div>
            </v-expand-transition>
          </article>
        </div>
      </section>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { generalInfoStore } from '../store/generalInfo';
import { sourceCatalog } from '../data/sourceCatalog';
import { parsePrebuiltPayload } from '../utils/jobData';

const sources = sourceCatalog;
const jobsBySource = ref(new Map<string, number>());
const generatedAt = ref('Unavailable');
const expandedCountries = ref<Record<string, boolean>>({});

const currentTheme = computed(() => generalInfoStore.theme);

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

function toggleCountry(country: string) {
  expandedCountries.value = {
    ...expandedCountries.value,
    [country]: !expandedCountries.value[country],
  };
}

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
    expandedCountries.value = Object.fromEntries(
      groupedSources.value.map((group, index) => [group.country, index < 3])
    );
  } catch (error) {
    console.error(error);
  }
});
</script>

<style scoped>
.sources-page {
  position: relative;
  min-height: 100vh;
  padding: 116px 16px 56px;
  background:
    radial-gradient(circle at top left, rgba(214, 227, 255, 0.95), transparent 32%),
    radial-gradient(circle at top right, rgba(194, 235, 224, 0.75), transparent 28%),
    linear-gradient(180deg, #f5f7fb 0%, #eef2f6 100%);
  overflow: hidden;
}

.sources-shell {
  position: relative;
  z-index: 1;
  max-width: 1240px;
  margin: 0 auto;
}

.sources-orb {
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  filter: blur(8px);
  opacity: 0.5;
}

.sources-orb-left {
  top: 84px;
  left: -120px;
  background: rgba(112, 158, 255, 0.18);
}

.sources-orb-right {
  top: 180px;
  right: -100px;
  background: rgba(69, 191, 150, 0.18);
}

.sources-hero {
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

.sources-eyebrow {
  margin: 0 0 6px;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #56657d;
  font-weight: 700;
}

.sources-title {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.25rem, 4vw, 4rem);
  line-height: 0.95;
  letter-spacing: -0.04em;
  color: #10284a;
}

.sources-text {
  max-width: 760px;
  margin: 22px 0 0;
  font-size: 1.05rem;
  line-height: 1.75;
  color: #455368;
}

.sources-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.sources-stat-card {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(11, 34, 67, 0.96);
  color: #f4f7fb;
}

.sources-stat-wide {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #24466f, #153150);
}

.sources-stat-label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.76rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(232, 239, 248, 0.74);
}

.sources-stat-value {
  font-size: 1.65rem;
  line-height: 1.1;
}

.sources-stat-small {
  font-size: 1rem;
}

.sources-panel {
  margin-top: 26px;
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(102, 122, 154, 0.12);
  box-shadow: 0 20px 48px rgba(27, 47, 78, 0.06);
  backdrop-filter: blur(16px);
}

.sources-summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.sources-groups {
  display: grid;
  gap: 18px;
}

.country-card {
  padding: 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 252, 0.94));
  border: 1px solid rgba(96, 117, 150, 0.12);
  box-shadow: 0 12px 28px rgba(26, 45, 78, 0.06);
}

.country-card-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-bottom: 18px;
}

.country-toggle {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.country-toggle-side {
  display: flex;
  align-items: center;
  gap: 10px;
}

.country-label {
  margin: 0 0 4px;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #69788d;
}

.country-name {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.3rem, 2vw, 1.8rem);
  color: #10284a;
}

.country-source-list {
  display: grid;
  gap: 12px;
}

.source-item {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(241, 245, 251, 0.78);
  border: 1px solid rgba(96, 117, 150, 0.08);
}

.source-item-main {
  min-width: 0;
}

.source-link {
  color: #10284a;
  text-decoration: none;
  font-weight: 700;
}

.source-link:hover {
  color: #24466f;
}

.source-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.source-url {
  margin-top: 8px;
  color: #5c6b80;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.source-item-side {
  min-width: 100px;
  text-align: right;
}

.source-jobs-label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #69788d;
}

.source-jobs-value {
  color: #10284a;
}

.sources-page--dark {
  background:
    radial-gradient(circle at top left, rgba(71, 98, 152, 0.28), transparent 32%),
    radial-gradient(circle at top right, rgba(43, 114, 90, 0.22), transparent 28%),
    linear-gradient(180deg, #0f1724 0%, #121d2b 100%);
}

.sources-page--dark .sources-hero,
.sources-page--dark .sources-panel {
  background: rgba(17, 25, 39, 0.84);
  border-color: rgba(146, 167, 201, 0.14);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.22);
}

.sources-page--dark .sources-title,
.sources-page--dark .country-name,
.sources-page--dark .source-link,
.sources-page--dark .source-jobs-value {
  color: #f2f6fb;
}

.sources-page--dark .sources-text,
.sources-page--dark .source-url {
  color: #c2cddd;
}

.sources-page--dark .sources-eyebrow,
.sources-page--dark .country-label,
.sources-page--dark .source-jobs-label {
  color: #8fa1bc;
}

.sources-page--dark .sources-stat-card {
  background: rgba(34, 49, 74, 0.96);
}

.sources-page--dark .sources-stat-wide {
  background: linear-gradient(135deg, #314d74, #203753);
}

.sources-page--dark .country-card {
  background: linear-gradient(180deg, rgba(21, 30, 46, 0.98), rgba(18, 27, 41, 0.94));
  border-color: rgba(146, 167, 201, 0.14);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
}

.sources-page--dark .source-item {
  background: rgba(240, 244, 250, 0.08);
  border-color: rgba(168, 185, 214, 0.12);
}

.sources-page--dark .source-link:hover {
  color: #adc7f7;
}

@media (max-width: 960px) {
  .sources-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .sources-page {
    padding: 98px 8px 40px;
  }

  .sources-hero,
  .sources-panel {
    padding: 18px;
    border-radius: 22px;
  }

  .country-card-header,
  .source-item {
    flex-direction: column;
    align-items: start;
  }

  .source-item-side {
    min-width: 0;
    text-align: left;
  }
}
</style>
