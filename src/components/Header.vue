<template>
  <v-app-bar
    flat
    :height="xs ? 82 : 94"
    color="transparent"
    class="app-header"
    absolute
  >
    <div :class="['header-shell', `header-shell--${currentTheme}`]">
      <router-link to="/" class="brand-link">
        <div class="brand-cluster">
          <div class="logo-container">
            <v-img :src="logo" :width="logoSize" />
          </div>
          <div class="brand-copy">
            <span class="brand-kicker">Curated Research Careers</span>
            <span :class="['brand-title', titleClass]">Academic Jobs</span>
          </div>
        </div>
      </router-link>

      <div class="header-actions">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              tag="router-link"
              :to="{ name: 'Home' }"
              class="header-icon-btn"
            >
              <v-icon>mdi-home-outline</v-icon>
            </v-btn>
          </template>
          <span>Home</span>
        </v-tooltip>

        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="text" class="header-nav-btn">
              Useful Links
              <v-icon end>mdi-menu-down</v-icon>
            </v-btn>
          </template>

          <v-list class="header-menu-list">
            <v-list-item
              v-for="link in usefulLinks"
              :key="link.href"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
            >
              <v-list-item-title class="text-caption">
                {{ link.text }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn variant="text" tag="router-link" :to="{ name: 'Sources' }" class="header-nav-btn">
          Sources
        </v-btn>

        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              @click="toggleTheme"
              :class="['header-icon-btn', themeClass]"
            >
              <v-icon>{{ icon }}</v-icon>
            </v-btn>
          </template>
          <span>Switch theme</span>
        </v-tooltip>
      </div>
    </div>
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
const currentTheme = computed(() => generalInfoStore.theme);

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
.app-header {
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  padding: 0;
  background: transparent !important;
  box-shadow: none !important;
}

.header-shell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: min(1240px, 100%);
  margin: 0 auto;
  padding: 10px 16px;
  border-radius: 0 0 24px 24px;
  border: 1px solid rgba(102, 122, 154, 0.12);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  box-shadow: 0 18px 42px rgba(27, 47, 78, 0.08);
}

.header-shell--light {
  background: rgba(255, 255, 255, 0.8);
}

.header-shell--dark {
  background: rgba(17, 25, 39, 0.82);
  border-color: rgba(146, 167, 201, 0.14);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
}

.brand-link {
  color: inherit;
  text-decoration: none;
}

.brand-cluster {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  min-height: 54px;
  padding: 8px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 8px 18px rgba(18, 44, 79, 0.08);
}

.header-shell--dark .logo-container {
  background: rgba(255, 255, 255, 0.08);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-kicker {
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
}

.header-shell--dark .brand-kicker {
  color: #8fa1bc;
}

.brand-title {
  color: #10284a;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.4rem;
  line-height: 1;
  font-weight: 700;
}

.header-shell--dark .brand-title {
  color: #f2f6fb;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-nav-btn {
  min-height: 40px;
  border-radius: 14px;
  padding-inline: 12px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.header-shell--dark .header-nav-btn {
  color: #dbe7ff;
}

.header-icon-btn {
  border-radius: 14px;
}

.header-menu-list {
  border-radius: 16px;
  padding: 6px;
}

@media (max-width: 600px) {
  .header-shell {
    padding: 10px 12px;
    border-radius: 0 0 18px 18px;
  }

  .brand-kicker {
    font-size: 0.58rem;
  }

  .brand-title {
    font-size: 1rem;
  }

  .header-actions {
    gap: 4px;
  }

  .header-nav-btn {
    padding-inline: 8px;
    font-size: 0.74rem;
  }

  .header-icon-btn {
    width: 36px;
    height: 36px;
  }
}
</style>
