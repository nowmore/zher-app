/**
 * 主题管理工具
 * 负责深色模式的切换和状态管理
 */

// 获取当前主题状态
const getCurrentTheme = () => {
  return localStorage.getItem('zher_dark_mode') === 'true';
};

// 初始化主题
const initTheme = () => {
  const isDarkMode = getCurrentTheme();
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  }
  return isDarkMode;
};

// 切换主题
const toggleTheme = () => {
  const isDarkMode = !getCurrentTheme();
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('zher_dark_mode', isDarkMode);
  return isDarkMode;
};

export {
  getCurrentTheme,
  initTheme,
  toggleTheme
};
