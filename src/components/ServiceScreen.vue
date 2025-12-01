<template>
    <div class="flex-1 flex flex-col w-full h-full">
        <!-- Header -->
        <header class="px-4 py-4 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">服务</h1>
        </header>

        <!-- List -->
        <div class="flex-1 overflow-y-auto">
            <div class="px-4 py-2">
                <!-- Start Service Option -->
                <div class="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-base font-medium text-gray-900 dark:text-white">开启服务</span>
                            <span v-if="isServiceRunning" class="text-xs text-green-600 dark:text-green-400">运行中 - http://0.0.0.0:4836</span>
                        </div>
                    </div>

                    <!-- Switch -->
                    <button @click="toggleService" :disabled="isStarting"
                        class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50"
                        :class="isServiceRunning ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'">
                        <span
                            class="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
                            :class="isServiceRunning ? 'translate-x-6' : 'translate-x-1'" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';

const isServiceRunning = ref(false);
const isStarting = ref(false);

const loadServerStatus = async () => {
    try {
        const status = await invoke('get_server_status');
        isServiceRunning.value = status;
        console.log('Server status loaded:', status);
    } catch (e) {
        console.error('Failed to get server status:', e);
    }
};

const toggleService = async () => {
    if (isStarting.value) return;
    
    if (!isServiceRunning.value) {
        isStarting.value = true;
        try {
            console.log('Starting server...');
            await invoke('start_server');
            isServiceRunning.value = true;
            console.log('Server started successfully');
        } catch (e) {
            console.error('Failed to start server:', e);
            alert('启动服务失败: ' + e);
        } finally {
            isStarting.value = false;
        }
    }
};

onMounted(() => {
    loadServerStatus();
});
</script>
