// import { defineStore } from 'pinia';

// export const useGeneralStore = defineStore({
//   id: 'generalInfo',
//   state: () => ({
//     theme: 'light',
//     errorDialog: false,
//     error: '',
//     confirmDialog: false,
//     confirmDecision: null as any,
//     confirmParameters: null as unknown as any[],
//     informationDialog: false,
//     information: ''
//   })
// });

import { reactive } from 'vue';

type Theme = 'light' | 'dark';
export const generalInfoStore = reactive({
  theme: 'light' as Theme,
});
