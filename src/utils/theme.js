import { saveSetting, getSetting } from './appStore';

const applyTheme = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const getCurrentTheme = () => {
  return localStorage.getItem('zher_dark_mode') === 'true';
};

const initTheme = async () => {
  let isDarkMode = getCurrentTheme();
  applyTheme(isDarkMode);

  try {
    const storedTheme = await getSetting('zher_dark_mode');
    if (storedTheme !== null && storedTheme !== isDarkMode) {
      isDarkMode = storedTheme === true;
      applyTheme(isDarkMode);
      localStorage.setItem('zher_dark_mode', isDarkMode);
    }
  } catch (e) {}

  return isDarkMode;
};

const toggleTheme = async () => {
  const isDarkMode = !getCurrentTheme();
  applyTheme(isDarkMode);
  localStorage.setItem('zher_dark_mode', isDarkMode);
  await saveSetting('zher_dark_mode', isDarkMode);
  return isDarkMode;
};

export {
  getCurrentTheme,
  initTheme,
  toggleTheme
};
