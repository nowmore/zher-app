import { watch } from 'vue';
import { darkMode } from './settings';

export const initTheme = () => {
  watch(
    darkMode,
    (val) => {
      if (val) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    },
    { immediate: true }
  );
};