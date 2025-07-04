import { createRouter, createWebHistory } from 'vue-router';
import SearchJobs from '../components/SearchJobs.vue';
import Sources from '../components/Sources.vue';
import About from '../components/About.vue';

const routes = [
  { path: '/', name: 'Home', component: SearchJobs },
  { path: '/sources', name: 'Sources', component: Sources },
  { path: '/about', name: 'About', component: About },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
