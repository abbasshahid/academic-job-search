import { reactive } from 'vue';

type Theme = 'light' | 'dark';
export const generalInfoStore = reactive({
  theme: 'light' as Theme,
});