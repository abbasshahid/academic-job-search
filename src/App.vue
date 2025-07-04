<template>
  <v-app>
    <Header />

    <!-- Replace the static SearchJobs component with router-view -->
    <v-main app>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { generalInfoStore } from './store/generalInfo';
import Header from './components/Header.vue';
import { useTheme } from 'vuetify';
import { watch } from 'vue';

// sync our theme store with Vuetify's theme system
const { global: themeGlobal } = useTheme();
watch(
  () => generalInfoStore.theme,
  (val) => {
    themeGlobal.name.value = val;
  },
  { immediate: true }
);
</script>

<style>
/* No manual theme CSS needed; Vuetify handles styles */
</style>

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
