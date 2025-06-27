<template>
  <v-app-bar app elevation="2">
    <template #prepend>
      <v-card class="mx-auto elevation-0" to="/">
        <template #prepend>
          <div class="logo-container">
            <v-img :src="logo" width="40" class="d-none d-sm-flex" />
          </div>
        </template>
        <template #append>
          <v-app-bar-title class="d-none d-sm-flex">Academic Jobs</v-app-bar-title>
        </template>
      </v-card>
    </template>

    <v-spacer />

    <v-tooltip bottom>
      <template #activator="{ props }">
        <v-btn v-bind="props" icon to="/">
          <v-icon>mdi-home</v-icon>
        </v-btn>
      </template>
      <span>Home</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template #activator="{ props }">
        <v-btn v-bind="props" icon @click="toggleTheme" :class="themeClass">
          <v-icon>{{ icon }}</v-icon>
        </v-btn>
      </template>
      <span>Switch theme</span>
    </v-tooltip>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { generalInfoStore } from '../store/generalInfo';
import logo from '../assets/logo.png';

function toggleTheme() {
  generalInfoStore.theme = generalInfoStore.theme === 'light' ? 'dark' : 'light';
}

const icon = computed(() =>
  generalInfoStore.theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'
);
const themeClass = computed(() =>
  generalInfoStore.theme === 'light' ? 'text-yellow-darken-3' : 'text-yellow-lighten-5'
);
</script>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}
</style>
