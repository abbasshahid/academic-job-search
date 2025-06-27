<template>
  <v-app :class="generalInfoStore.theme">
    <Header />
    <!-- Wrap main content to push it below the app bar -->
    <v-main app>
      <SearchJobs />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { generalInfoStore } from './store/generalInfo';
import Header from './components/Header.vue';
import SearchJobs from './components/SearchJobs.vue';
</script>

<style>
/* Global theme classes */
.v-application.light {
  background-color: #fafafa;
}
.v-application.dark {
  background-color: #121212;
  color: #fff;
}
</style>