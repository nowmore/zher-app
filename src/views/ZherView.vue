<script>
export default {
  name: 'ZherView'
};
</script>

<template>
  <div class="flex-1 flex flex-col">
    <header class="px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">服务</h1>
        <button @click="refreshServices" :disabled="isDiscovering"
          class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="{ 'animate-spin': isDiscovering }"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto">
      <div class="px-4 py-2 space-y-2">
        <!-- Server Toggle -->
        <div class="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600 dark:text-green-400" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">作为服务器</p>
            </div>
            <button @click.stop="toggleServer"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              :class="isServerRunning ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="isServerRunning ? 'translate-x-6' : 'translate-x-1'"></span>
            </button>
          </div>
        </div>

        <!-- Pending Files Alert -->
        <div v-if="hasPendingFiles && services.length > 0"
          class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-blue-900 dark:text-blue-100">有文件待发送</p>
              <p class="text-xs text-blue-700 dark:text-blue-300 mt-0.5">点击下方服务发送文件</p>
            </div>
          </div>
        </div>

        <!-- Discovered Services -->
        <div v-if="services.length > 0" class="space-y-2">
          <div v-for="service in services" :key="service.url" @click="handleOpenBrowser(service.url)"
            class="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
            :class="{ 'ring-2 ring-blue-500': hasPendingFiles }">
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
              <div class="flex items-center gap-2 mr-2">
                <div class="w-2 h-2 rounded-full"
                  :class="getServiceConnectionStatus(service) ? 'bg-green-500' : 'bg-gray-400'">
                </div>
                <span class="text-xs"
                  :class="getServiceConnectionStatus(service) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">
                  {{ getServiceConnectionStatus(service) ? '已连接' : '未连接' }}
                </span>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import { useGlobalSocket } from '../composables/useGlobalSocket';
import { useSharedFiles } from '../composables/useSharedFiles';

const router = useRouter();
const services = ref([]);
const isDiscovering = ref(false);
const isServerRunning = ref(false);

const { connections } = useGlobalSocket();
const { hasPendingFiles } = useSharedFiles();

const getServiceConnectionStatus = (service) => {
  const serverKey = `${service.ip}:${service.port}`;
  const conn = connections[serverKey];
  return conn?.isConnected || false;
};

const refreshServices = async () => {
  isDiscovering.value = true;
  try {
    const discovered = await invoke('discover_services');
    services.value = discovered || [];
  } catch (e) {
    console.error('Service discovery failed:', e);
  } finally {
    isDiscovering.value = false;
  }
};

const toggleServer = async () => {
  try {
    if (isServerRunning.value) {
      await invoke('stop_server');
      isServerRunning.value = false;
    } else {
      await invoke('start_server');
      isServerRunning.value = true;
    }
    refreshServices();
  } catch (e) {
    console.error('Failed to toggle server:', e);
  }
};

const checkServerStatus = async () => {
  try {
    isServerRunning.value = await invoke('get_server_status');
  } catch (e) {
    console.error('Failed to check server status:', e);
  }
};

const handleOpenBrowser = (url) => {
  if (!url) return;
  try {
    const urlObj = new URL(url.includes('://') ? url : `http://${url}`);
    router.push({
      name: 'BrowserView',
      query: { url: urlObj.href }
    });
  } catch (e) {
    console.error('Invalid URL:', e);
  }
};

onMounted(async () => {
  await checkServerStatus();
  refreshServices();
});
</script>
