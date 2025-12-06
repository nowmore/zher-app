<script setup>
import { onMounted } from 'vue';
import BottomNav from './components/BottomNav.vue';
import { initTheme } from './utils/theme';
import { useBackButton } from './composables/useBackButton';

// 初始化 Android 返回按钮处理
useBackButton();

onMounted(async () => {
  await initTheme();
});
</script>

<template>
  <div
    class="relative min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-300 flex flex-col"
    style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);">
    <main class="flex-1 flex flex-col overflow-y-auto pb-24">
      <PageStackRouterView />
    </main>
    <BottomNav />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
