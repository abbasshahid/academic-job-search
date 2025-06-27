// main.ts
import { createApp } from 'vue';
import App from './App.vue';

// Vuetify styles & icons
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

// Vuetify framework
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const vuetify = createVuetify({
  components,
  directives,
  icons: { defaultSet: 'mdi' },
});

createApp(App)
  .use(vuetify)
  .mount('#app');