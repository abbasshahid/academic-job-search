<template>
  <v-app-bar app elevation="2">
    <template #prepend>
      <v-card class="mx-auto elevation-0" to="/">
        <template #prepend>
          <div class="logo-container">
            <v-img :src="logo"d :width="logoSize" />
          </div>
        </template>
        <template #append>
          <v-app-bar-title :class="titleClass">Academic Jobs</v-app-bar-title>
        </template>
      </v-card>
    </template>

    <v-spacer />

    <v-tooltip bottom>
      <template #activator="{ props }">
        <v-btn text class="about-btn" tag="router-link" :to="{ name: 'About' }">
          <v-icon>mdi-home</v-icon>
        </v-btn>
      </template>
      <span>Home</span>
    </v-tooltip>
    <!-- Useful Links dropdown -->
    <v-menu offset-y>
      <!-- activator: the text or button you click on -->
      <template #activator="{ props }">
        <v-btn v-bind="props" text  class="px-2 py-1 text-caption"   >
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
          <v-list-item-title class="px-2 py-1 text-caption">{{ link.text }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn text tag="router-link" :to="{ name: 'Sources' }" class="px-2 py-1 text-caption">Sources</v-btn>

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
import { useDisplay } from 'vuetify';

const { xs, sm } = useDisplay();

const xsOnly = computed(() => xs.value && !sm.value);

const logoSize = computed(() => xsOnly.value ? 28 : 40);
const titleClass = computed(() => xsOnly.value ? 'text-caption' : '');

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
  { text: 'Daad', href: 'https://www.daad.de/en/' },
  { text: 'Researh in Germany', href: 'https://www.research-in-germany.org/en/your-goal/advanced-research/job-portals.html' },
  { text: 'Italian Calls', href: 'https://bandi.miur.it/doctorate.php/public/cercaFellowship'},
  { text: 'PhD Scanner', href: ' https://www.phdscanner.com/'}

]);
</script>

<style scoped>
@media (max-width: 600px) {
  /* shrink the logo */
  .logo-container .v-image, 
  .logo-container .v-img {
    width: 30px !important;
  }

  /* shrink the title text */
  .v-app-bar-title {
    font-size: 0.7rem !important; /* ~14px */
  }

  /* shrink every button in the app-bar */
  .v-app-bar .v-btn {
    padding: 0 6px !important;
    font-size: 0.75rem !important; /* ~12px */
  }

  /* shrink the icons inside buttons */
  .v-app-bar .v-btn .v-icon {
    font-size: 18px !important;
  }
   .about-btn {
    padding: 0 6px !important;
    font-size: 0.75rem !important;  /* ~12px text */
  }
  .about-btn .v-icon {
    font-size: 18px !important;
  }
}
</style>
