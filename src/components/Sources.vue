<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card outlined elevation="2">
          <v-card-title>
            <span class="text-h6 font-medium">Sources (Career Links of Universities)</span>
          </v-card-title>

          <v-card-text>
            <v-expansion-panels>
              <v-expansion-panel
                v-for="(links, country) in groupedLinks"
                :key="country"
              >
                <v-expansion-panel-title>
                  {{ countryNames[country] || country.toUpperCase() }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list dense>
                    <v-list-item v-for="url in links" :key="url">
                      <v-list-item-content>
                        <v-list-item-title>
                          <a :href="url" target="_blank">{{ url }}</a>
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
// Adjust path if your payload file is named differently
import payload from '../../scraper/payload.json';

export default defineComponent({
  name: 'Sources',
  setup() {
    // Group URLs by their top-level domain (e.g., 'at', 'nl')
    const groupedLinks = computed<Record<string, string[]>>(() => {
      return payload.careerPages.reduce((acc, url) => {
        try {
          const code = new URL(url).hostname.split('.').pop() || 'other';
          if (!acc[code]) acc[code] = [];
          acc[code].push(url);
        } catch {
          if (!acc.other) acc.other = [];
          acc.other.push(url);
        }
        return acc;
      }, {} as Record<string, string[]>);
    });

    // Optional: map country codes to friendly names
    const countryNames: Record<string, string> = {
      at: 'Austria',
      nl: 'Netherlands',
      de: 'Germany',
      dk: 'Denmark',
      no: 'Norway',
      se: 'Sweden',
      ch: 'switzerland',
      it: 'Italy',
      fi: 'Finland',
      au: 'Australia',
      ca: 'Canada',
      sa: 'Saudi Arabia',
      ae: 'UAE',
      qa: 'Qatar',
      ie: 'Ireland',
      cz: 'Check Republic',
      be: 'Belgium',
      es: 'Spain',
      lu: 'Lexumberg',
      cn: 'China'

    };

    return { groupedLinks, countryNames };
  }
});
</script>

<style scoped>
/* Add any scoped styles for the Sources page here */
</style>
