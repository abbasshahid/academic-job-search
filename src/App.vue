<template>
  <main class="p-4 max-w-3xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">University Job Search</h1>
    <SearchJobs />
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import SearchJobs from "@/components/SearchJobs.vue";

export default defineComponent({
  name: "App",
  components: { SearchJobs }
});
</script>

<style>
body {
  font-family: system-ui, sans-serif;
  background: #f9f9f9;
  color: #333;
}
</style>
