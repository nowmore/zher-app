<template>
  <footer v-if="activePage"
    class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 select-none transition-transform duration-200"
    :class="{ 'translate-y-full': isKeyboardVisible }" style="padding-bottom: env(safe-area-inset-bottom, 0px);">

    <nav class="grid grid-cols-3 items-center h-18 px-0">
      <button @click="switchPage('zher')"
        class="clean-btn flex flex-col items-center justify-center w-full h-full py-2 px-1 transition-all duration-300 group relative"
        :class="activePage === 'zher' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mb-0.5 transition-transform duration-300 group-active:scale-90" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 5h12l-5 7h6l-12 8l3-7h-7z" />
          </svg>
        </div>
        <span class="text-[10px] font-medium">zher</span>
      </button>

      <button @click="switchPage('download')"
        class="clean-btn flex flex-col items-center justify-center w-full h-full py-2 px-1 transition-all duration-300 group relative"
        :class="activePage === 'download' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mb-0.5 transition-transform duration-300 group-active:scale-90" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <span class="text-[10px] font-medium">下载</span>
      </button>

      <button @click="switchPage('settings')"
        class="clean-btn flex flex-col items-center justify-center w-full h-full py-2 px-1 transition-all duration-300 group relative"
        :class="activePage === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mb-0.5 transition-transform duration-300 group-active:scale-90" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span class="text-[10px] font-medium">设置</span>
      </button>

    </nav>
  </footer>
</template>

<style scoped>
.clean-btn {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  background-color: transparent !important;
  -webkit-tap-highlight-color: transparent !important;
}

.clean-btn:focus,
.clean-btn:active,
.clean-btn:focus-visible,
.clean-btn:hover {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  background-color: transparent !important;
}
</style>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const activePage = computed(() => {
  // 如果在 browser 页面，不显示底部导航
  if (route.name === 'BrowserView') return null;
  
  // 映射路由名称到页面标识
  const nameMap = {
    'ZherView': 'zher',
    'DownloadView': 'download',
    'SettingsView': 'settings'
  };
  
  return nameMap[route.name] || 'zher';
});

const isKeyboardVisible = ref(false);

const switchPage = (page) => {
  const currentPage = activePage.value;
  if (currentPage === page) return;
  
  // 映射页面标识到路由名称
  const routeMap = {
    'zher': 'ZherView',
    'download': 'DownloadView',
    'settings': 'SettingsView'
  };
  
  // 使用 replace 而不是 push，避免在底部导航切换时堆积历史
  router.replace({ name: routeMap[page] });
};

let initialHeight = window.innerHeight;

const handleResize = () => {
  const currentHeight = window.visualViewport?.height || window.innerHeight;
  isKeyboardVisible.value = currentHeight < initialHeight * 0.75;
};

onMounted(() => {
  initialHeight = window.innerHeight;
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
  } else {
    window.addEventListener('resize', handleResize);
  }
});

onUnmounted(() => {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleResize);
  } else {
    window.removeEventListener('resize', handleResize);
  }
});
</script>

<style scoped>
.dark footer {
  background-color: #1f2937;
  border-top: 1px solid #374151;
}

button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
}

.dark button:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}
</style>
