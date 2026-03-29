<template>
  <v-app-bar elevation="2">
    <template #prepend>
      <router-link to="/" class="brand-link">
        <div class="d-flex align-center ga-3">
          <div class="logo-container">
            <v-img :src="logo" :width="logoSize" />
          </div>
          <v-app-bar-title :class="titleClass">Academic Jobs</v-app-bar-title>
        </div>
      </router-link>
    </template>

    <v-spacer />

    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn v-bind="props" icon tag="router-link" :to="{ name: 'Home' }">
          <v-icon>mdi-home</v-icon>
        </v-btn>
      </template>
      <span>Home</span>
    </v-tooltip>

    <v-menu offset-y>
      <template #activator="{ props }">
        <v-btn v-bind="props" variant="text" class="px-2 py-1 text-caption">
          Useful Links
          <v-icon end>mdi-menu-down</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item
          v-for="link in usefulLinks"
          :key="link.href"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
        >
          <v-list-item-title class="px-2 py-1 text-caption">
            {{ link.text }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn variant="text" tag="router-link" :to="{ name: 'Sources' }" class="px-2 py-1 text-caption">
      Sources
    </v-btn>

    <v-tooltip location="bottom">
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
import { useDisplay } from 'vuetify';
import logo from '../assets/logo.png';
import { generalInfoStore } from '../store/generalInfo';

const { xs } = useDisplay();

const logoSize = computed(() => (xs.value ? 28 : 40));
const titleClass = computed(() => (xs.value ? 'text-caption' : ''));

function toggleTheme() {
  generalInfoStore.theme = generalInfoStore.theme === 'light' ? 'dark' : 'light';
}

const icon = computed(() =>
  generalInfoStore.theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'
);
const themeClass = computed(() =>
  generalInfoStore.theme === 'light' ? 'text-yellow-darken-3' : 'text-yellow-lighten-5'
);

const usefulLinks = [
  { text: 'JobRxiv', href: 'https://jobrxiv.org/' },
  { text: 'Academics', href: 'https://www.academics.com/' },
  { text: 'jobs.ac.uk', href: 'https://www.jobs.ac.uk/' },
  { text: 'Academic Positions', href: 'https://academicpositions.com/' },
  { text: 'Find a PhD', href: 'https://www.findaphd.com/' },
  { text: 'JobbNorge', href: 'https://www.jobbnorge.no/search' },
  { text: 'Academic Jobs Online', href: 'https://academicjobsonline.org/ajo/jobs' },
  { text: 'Times Higher Education', href: 'https://www.timeshighereducation.com/unijobs/listings/' },
  { text: 'EURAXESS', href: 'https://euraxess.ec.europa.eu/jobs/search' },
  { text: 'Nature Careers', href: 'https://www.nature.com/naturecareers/jobs/' },
  { text: 'Academic Transfer', href: 'https://www.academictransfer.com/en/' },
  { text: 'Science Careers', href: 'https://www.science.org/careers' },
  { text: 'Research in Germany', href: 'https://www.research-in-germany.org/en/your-goal/advanced-research/job-portals.html' },
  { text: 'PhD Finder', href: 'https://phdfinder.com/' },
  { text: 'PhD Scanner', href: 'https://www.phdscanner.com/' },
];
</script>

<style scoped>
.brand-link {
  color: inherit;
  text-decoration: none;
}

@media (max-width: 600px) {
  .logo-container .v-image,
  .logo-container .v-img {
    width: 30px !important;
  }

  .v-app-bar-title {
    font-size: 0.75rem !important;
  }

  .v-app-bar .v-btn {
    padding: 0 6px !important;
    font-size: 0.75rem !important;
  }

  .v-app-bar .v-btn .v-icon {
    font-size: 18px !important;
  }
}
</style>
