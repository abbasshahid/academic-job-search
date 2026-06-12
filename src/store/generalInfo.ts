import { reactive, watch } from 'vue';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'academic-job-search:theme';

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // Fall back to the user's OS-level preference on first visit.
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

export const generalInfoStore = reactive({
  theme: readStoredTheme() as Theme,
});

// Persist theme changes so the user's choice survives reloads.
watch(
  () => generalInfoStore.theme,
  (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, value);
    }
  }
);
