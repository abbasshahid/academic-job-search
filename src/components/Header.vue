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
    <!-- Useful Links dropdown -->
    <v-menu offset-y>
      <!-- activator: the text or button you click on -->
      <template #activator="{ props }">
        <v-btn v-bind="props" text>
          Useful Links
          <v-icon right>mdi-menu-down</v-icon>
        </v-btn>
      </template>

      <!-- the dropdown items -->
      <v-list>
        <v-list-item
          v-for="(link, i) in usefulLinks"
          :key="i"
          :href="link.href"
          target="_blank"
        >
          <v-list-item-title>{{ link.text }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

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
import { computed, ref } from 'vue';
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
/** New: define your useful links here **/
const usefulLinks = ref([
  { text: 'JobRxiv', href: 'https://jobrxiv.org/' },
  { text: 'Academics', href: 'https://www.academics.com/' },
  { text: 'AC.UK', href: 'https://www.jobs.ac.uk' },
  { text: 'Academic Positions', href: 'https://jobrxiv.org/' },
  { text: 'Find a PhD', href: 'https://www.findaphd.com/' },
  { text: 'JobbNorge', href: 'https://www.jobbnorge.no/search' },
  { text: 'Academic Jobs Online', href: 'https://academicjobsonline.org/ajo/jobs' },
  { text: 'Varbi', href: 'https://uu.varbi.com/' },
  { text: 'TimesHigherEducation', href: 'https://www.timeshighereducation.com/unijobs/listings/' },
  { text: 'Euraxess', href: 'https://euraxess.ec.europa.eu/jobs/search' },
  { text: 'Eapls', href: 'https://eapls.org/jobs/vacancies/' },
  { text: 'Owlindex', href: 'https://www.owlindex.com' },
  { text: 'PhD Finder', href: ' https://phdfinder.com/' },
  { text: 'Career Center', href: 'https://careercenter.cra.org/' },
  { text: 'Nature Careers', href: 'https://www.nature.com/naturecareers/jobs/' },
  { text: 'Academic Transfer', href: 'https://www.academictransfer.com/en/' },
  { text: 'Science', href: 'https://www.science.org/careers' },
  { text: 'Germany Jobs', href: 'https://hu-berlin.stellenticket.de/de/offers/' },
]);
</script>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}
</style>
