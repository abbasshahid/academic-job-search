<template>
  <section class="p-4">
    <label for="kw" class="block font-medium mb-2">Keywords (comma-separated):</label>
    <input
      id="kw"
      v-model="keywordInput"
      @keyup.enter="onSearch"
      type="text"
      placeholder="e.g. professor, researcher"
      class="w-full p-2 border rounded mb-4"
    />

    <button
      @click="onSearch"
      :disabled="loading || !hasKeywords"
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {{ loading ? `Searching... (${currentIndex}/${totalPages})` : 'Search' }}
    </button>

    <p v-if="loading" class="mt-2 text-sm text-gray-600">
      Processing page: <span class="font-mono">{{ currentPage }}</span>
    </p>

    <ul v-if="error" class="mt-4 text-red-600">
      <li>{{ error }}</li>
    </ul>

    <ul v-else-if="jobs.length" class="mt-6 space-y-4">
      <li
        v-for="job in jobs"
        :key="job.url"
        class="bg-white p-4 rounded shadow-sm"
      >
        <a
          :href="job.url"
          target="_blank"
          class="text-lg font-semibold text-blue-700 hover:underline"
        >
          {{ job.title }}
        </a>
        <p class="text-sm text-gray-600 mt-1">Source: {{ job.source }}</p>
      </li>
    </ul>

    <p v-else-if="!loading && hasSearched" class="mt-6 text-gray-500">
      No results found.
    </p>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import type { Job } from '../types/job';
import pagesData from '../../career_pages.json';

export default defineComponent({
  name: 'SearchJobs',
  setup() {
    const keywordInput = ref('');
    const jobs = ref<Job[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const hasSearched = ref(false);
    const currentPage = ref('');
    const currentIndex = ref(0);
    const totalPages = ref(0);

    const hasKeywords = computed(() => keywordInput.value.trim().length > 0);

    async function onSearch() {
      if (!hasKeywords.value) return;
      loading.value = true;
      error.value = null;
      hasSearched.value = true;
      jobs.value = [];

      // Prepare keywords
      const kws = keywordInput.value
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length);

      try {
        const pages: string[] = pagesData.career_pages;
        totalPages.value = pages.length;
        currentIndex.value = 0;

        for (const url of pages) {
          currentIndex.value++;
          currentPage.value = url;

          try {
            const res = await fetch(url);
            if (!res.ok) {
              console.warn(`Failed to fetch ${url}: ${res.status}`);
              continue;
            }
            const html = await res.text();

            // Parse HTML and extract links
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const anchors = Array.from(doc.querySelectorAll('a'));

            const pageJobs: Job[] = [];
            anchors.forEach(a => {
              const title = a.textContent?.trim() || '';
              const href = a.getAttribute('href');
              if (!title || !href) return;
              const textLower = title.toLowerCase();
              // Check keywords
              if (kws.some(kw => textLower.includes(kw))) {
                // Resolve absolute URL
                const fullUrl = new URL(href, url).href;
                pageJobs.push({ title, url: fullUrl, source: url });
              }
            });

            if (pageJobs.length) {
              jobs.value.push(...pageJobs);
            }
          } catch (pageErr: any) {
            console.warn(`Error processing ${url}: ${pageErr.message}`);
            continue;
          }
        }
      } catch (err: any) {
        error.value = err.message || 'Unknown error';
      } finally {
        loading.value = false;
      }
    }

    return {
      keywordInput,
      jobs,
      loading,
      error,
      hasKeywords,
      hasSearched,
      currentPage,
      currentIndex,
      totalPages,
      onSearch,
    };
  },
});
</script>

<style scoped>
/* Add any scoped styles here */
</style>
