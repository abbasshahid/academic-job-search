<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Job } from '../types/job';

const prebuiltJobs = ref<Job[]>([]);

async function loadJobsJson() {
  // cache-busting so GitHub Pages/CDN doesn't serve stale file
  const url = `${import.meta.env.BASE_URL}prebuilt_jobs.json?ts=${Date.now()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load prebuilt_jobs.json (${res.status})`);
  prebuiltJobs.value = await res.json();
}

// ✅ actually load the JSON
onMounted(async () => {
  try {
    await loadJobsJson();
  } catch (e) {
    console.error(e);
  }
});

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
  // ✅ use .value
  prebuiltJobs.value.forEach(j => {
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

  // ✅ use .value
  let pool = [...prebuiltJobs.value];

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