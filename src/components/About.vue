<template>
  <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" md="10">
        <v-card elevation="2" class="mb-8">
          <v-card-title class="text-h4 font-weight-bold">
            About the Academic Job Search
          </v-card-title>
          <v-card-text>
            <p>
              This project is a static Vue application backed by a scheduled Playwright scraper.
              The scraper collects links from curated academic career pages, enriches them with
              source metadata, and writes a publishable
              <strong>`public/prebuilt_jobs.json`</strong> file that the frontend can search without
              requiring a live backend.
            </p>
            <p>
              The current UI adds source-aware filtering, saved searches, favorites, exports, and
              “new job” tracking on top of that static dataset. The
              <router-link to="/sources">Sources</router-link>
              page now uses the shared source catalog instead of guessing country information from
              URL endings.
            </p>
            <p>
              View the
              <a href="https://github.com/abbasshahid/academic-job-search" target="_blank" rel="noopener noreferrer">
                GitHub repository
              </a>
              for the scraper, frontend, and deployment workflow.
            </p>
          </v-card-text>

          <v-card-title class="text-h5 font-weight-semibold">Get in touch</v-card-title>
          <v-card-text>
            <p>
              Have feedback or want to suggest additional career pages? Email
              <a href="mailto:shahidabbas1260@gmail.com">shahidabbas1260@gmail.com</a>.
            </p>
            <v-list>
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-web</v-icon>
                </template>
                <a href="https://abbasshahid.github.io/" target="_blank" rel="noopener noreferrer">
                  Personal Website
                </a>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-linkedin</v-icon>
                </template>
                <a href="https://www.linkedin.com/in/shahidabbas76/" target="_blank" rel="noopener noreferrer">
                  LinkedIn Profile
                </a>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
p + p {
  margin-top: 12px;
}

a {
  color: rgb(var(--v-theme-primary));
}
</style>
