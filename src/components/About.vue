<template>
  <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" md="10">
        <v-card outlined elevation="2" class="mb-8">
          <v-card-title class="text-h4 font-bold">
            About the Academic Job Scraper
          </v-card-title>
          <v-card-text>
            <p>
              The Academic Job Scraper is a specialized tool for academic job seekers.
              It visits multiple university career pages on your behalf, navigates through
              pagination automatically, and filters open positions based on your keywords.
              By automating the entire process with <strong>GitHub Actions</strong> and
              <strong>Playwright</strong>, it saves you hours of manual searches and
              ensures you never miss a relevant listing. All harvested links are
              aggregated under the <router-link to="/sources">Sources</router-link>
              tab, grouped by country, and you can explore quick-access resources in the
              Useful Links section.
              View the <a href="https://github.com/abbasshahid/academic-job-search" target="_blank">
              <v-icon small class="mr-1">mdi-github</v-icon>GitHub Repository</a>
              for complete setup instructions and source code.
            </p>
          </v-card-text>
          <v-card-title class="text-h5 font-semibold">Get In Touch</v-card-title>
          <v-card-text>
            <p>
              Have feedback or want to suggest additional career pages? Email me at
              <a href="mailto:shahidabbas1260@gmail.com">shahidabbas1260@gmail.com</a>.
            </p>
            <v-list dense>
              <v-list-item>
                <v-list-item-icon><v-icon>mdi-web</v-icon></v-list-item-icon>
                <v-list-item-content>
                  <a href="https://abbasshahid.github.io/" target="_blank">
                    Personal Website
                  </a>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-icon><v-icon>mdi-linkedin</v-icon></v-list-item-icon>
                <v-list-item-content>
                  <a href="https://www.linkedin.com/in/shahidabbas76/" target="_blank">
                    LinkedIn Profile
                  </a>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
p a {
  color: var(--v-primary-base);
  text-decoration: underline;
}
</style>
    