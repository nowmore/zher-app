<template>
  <div class="flex-col min-h-full flex">
    <BrowserView v-show="activePage === 'zher' && currentBrowserUrl" :url="currentBrowserUrl" @close="closeBrowser" />

    <ScannerView v-if="isScannerOpen" @scan-success="handleScanSuccess" @close="closeScanner" />

    <main class="flex-1 flex flex-col pb-24 overflow-y-auto">
      <div v-if="activePage === 'zher'" class="flex-1 flex flex-col">
        <header class="px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">可用服务</h1>
            <div class="flex items-center gap-2">
              <button @click="refreshServices" :disabled="isDiscovering"
                class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="{ 'animate-spin': isDiscovering }"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button @click="handleScan"
                class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto">
          <div v-if="isDiscovering" class="flex flex-col items-center justify-center py-12">
            <svg class="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400 mb-3" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <p class="text-sm text-gray-500 dark:text-gray-400">正在搜索服务...</p>
          </div>

          <div v-else-if="services.length === 0" class="flex flex-col items-center justify-center py-12 px-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center">未发现可用服务</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">点击刷新按钮搜索或扫描二维码添加</p>
          </div>

          <div v-else class="px-4 py-2 space-y-2">
            <div v-for="service in services" :key="service.url" @click="handleOpenBrowser(service.url)"
              class="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ service.ip }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">端口: {{ service.port }}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Download Interface -->
      <DownloadScreen v-else-if="activePage === 'download'" />

      <!-- Service Interface -->
      <ServiceScreen v-else-if="activePage === 'service'" />

      <!-- Settings Interface -->
      <SettingsScreen v-else-if="activePage === 'settings'" />
    </main>

    <!-- Bottom Navigation -->
    <BottomNav v-model="activePage" />

    <!-- Global Loading Overlay -->
    <div v-if="isLoading"
      class="fixed inset-0 bg-black/20 dark:bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow-2xl border border-gray-100 dark:border-gray-700">
        <svg class="animate-spin mb-3 h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">正在连接...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import BottomNav from './BottomNav.vue';
import BrowserView from './BrowserView.vue';
import ScannerView from './ScannerView.vue';
import DownloadScreen from './DownloadScreen.vue';
import SettingsScreen from './SettingsScreen.vue';
import ServiceScreen from './ServiceScreen.vue';

const activePage = ref('zher');
const currentBrowserUrl = ref('');
const isScannerOpen = ref(false);
const services = ref([]);
const isDiscovering = ref(false);

const refreshServices = async () => {
  isDiscovering.value = true;
  try {
    const discovered = await invoke('discover_services');
    services.value = discovered || [];
    
    const stored = localStorage.getItem('zher_services');
    if (stored) {
      const storedServices = JSON.parse(stored);
      storedServices.forEach(s => {
        if (!services.value.find(existing => existing.url === s.url)) {
          services.value.push(s);
        }
      });
    }
    
    localStorage.setItem('zher_services', JSON.stringify(services.value));
  } catch (e) {
    console.error('Failed to discover services:', e);
  } finally {
    isDiscovering.value = false;
  }
};

const handleOpenBrowser = (url) => {
  if (!url) return;
  try {
    const urlObj = new URL(url.includes('://') ? url : `http://${url}`);
    currentBrowserUrl.value = urlObj.href;
  } catch (e) {
    console.error("Invalid URL:", url);
  }
};

const closeBrowser = () => {
  currentBrowserUrl.value = '';
};

const handleScan = () => {
  isScannerOpen.value = true;
};

const handleScanSuccess = async (content) => {
  isScannerOpen.value = false;
  if (content) {
    try {
      const isValid = await invoke('validate_service_url', { url: content });
      if (isValid) {
        const urlObj = new URL(content);
        const service = {
          ip: urlObj.hostname,
          port: urlObj.port || 4836,
          url: content
        };
        
        if (!services.value.find(s => s.url === service.url)) {
          services.value.push(service);
          localStorage.setItem('zher_services', JSON.stringify(services.value));
        }
        
        handleOpenBrowser(content);
      } else {
        alert('无效的服务地址');
      }
    } catch (e) {
      console.error('Failed to validate URL:', e);
    }
  }
};

const closeScanner = () => {
  isScannerOpen.value = false;
};

const handleAndroidBack = async () => {
  if (isScannerOpen.value) {
    closeScanner();
    return;
  }

  if (activePage.value === 'zher' && currentBrowserUrl.value) {
    closeBrowser();
    return;
  }

  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  } catch (e) {
    console.error('Failed to close app', e);
  }
};

onMounted(async () => {
  window.addEventListener('android-back', handleAndroidBack);
  
  const stored = localStorage.getItem('zher_services');
  if (stored) {
    try {
      services.value = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored services', e);
    }
  }
  
  refreshServices();
});

onUnmounted(() => {
  window.removeEventListener('android-back', handleAndroidBack);
});
</script>

<style scoped>
/* Custom Scrollbar for Dashboard */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.dark .custom-scrollbar {
  scrollbar-color: rgba(75, 85, 99, 0.5) transparent;
}
</style>
