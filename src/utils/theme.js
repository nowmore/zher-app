import { saveSetting, getSetting } from './appStore';

/**
 * 主题管理工具
 * 负责深色模式的切换和状态管理
 */

// Apply theme class to document
const applyTheme = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// 获取当前主题状态 (同步，从LocalStorage)
const getCurrentTheme = () => {
  return localStorage.getItem('zher_dark_mode') === 'true';
};

// 初始化主题 (异步，优先LocalStorage，再同步Store)
const initTheme = async () => {
  // 1. Load from LocalStorage (Fast init)
  let isDarkMode = getCurrentTheme();
  applyTheme(isDarkMode);

  // 2. Load from Store (Persistence check)
  try {
    const storedTheme = await getSetting('zher_dark_mode');
    if (storedTheme !== null && storedTheme !== isDarkMode) {
      isDarkMode = storedTheme === true;
      applyTheme(isDarkMode);
      localStorage.setItem('zher_dark_mode', isDarkMode);
    }
  } catch (e) {
    console.warn('Failed to sync theme from store', e);
  }

  return isDarkMode;
};

// 切换主题
const toggleTheme = async () => {
  const isDarkMode = !getCurrentTheme();

  // Apply immediately
  applyTheme(isDarkMode);
  localStorage.setItem('zher_dark_mode', isDarkMode);

  // Persist async
  await saveSetting('zher_dark_mode', isDarkMode);

  return isDarkMode;
};

export {
  getCurrentTheme,
  initTheme,
  toggleTheme
};
