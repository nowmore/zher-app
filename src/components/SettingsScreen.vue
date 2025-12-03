<template>
    <div class="flex-1 flex flex-col w-full h-full">
        <!-- Header -->
        <header class="px-4 py-4 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">设置</h1>
        </header>

        <!-- Settings List -->
        <div class="flex-1 overflow-y-auto">
            <div class="px-4 py-2">
                <div class="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </div>
                        <span class="text-base font-medium text-gray-900 dark:text-white">深色模式</span>
                    </div>
                    <Switch v-model="darkMode" />
                </div>
                <div class="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                        </div>
                        <span class="text-base font-medium text-gray-900 dark:text-white">复制文本到剪贴板</span>
                    </div>
                    <Switch v-model="autoCopyText" />
                </div>
                <div class="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                        <span class="text-base font-medium text-gray-900 dark:text-white">自动下载</span>
                    </div>
                    <Switch v-model="autoDownload" />
                </div>
                <div class="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                        </div>
                        <span class="text-base font-medium text-gray-900 dark:text-white">调试模式</span>
                    </div>

                    <button @click="debugState.isEnabled = !debugState.isEnabled"
                        class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none"
                        :class="debugState.isEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'">
                        <span
                            class="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
                            :class="debugState.isEnabled ? 'translate-x-6' : 'translate-x-1'" />
                    </button>
                </div>
            </div>
        </div>
        <div v-if="debugState.isEnabled"
            class="h-1/2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col">
            <div
                class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                <span class="text-xs font-bold text-gray-500 uppercase">Console Output</span>
                <button @click="clearLogs"
                    class="text-xs text-blue-600 dark:text-blue-400 hover:underline">Clear</button>
            </div>
            <div class="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
                <div v-for="log in debugState.logs" :key="log.id" class="break-all">
                    <span class="text-gray-400">[{{ log.time }}]</span>
                    <span :class="{
                        'text-blue-600 dark:text-blue-400': log.type === 'log',
                        'text-yellow-600 dark:text-yellow-400': log.type === 'warn',
                        'text-red-600 dark:text-red-400': log.type === 'error',
                        'text-green-600 dark:text-green-400': log.type === 'info'
                    }" class="ml-2 uppercase font-bold">{{ log.type }}:</span>
                    <span class="text-gray-800 dark:text-gray-200 ml-2">{{ log.message }}</span>
                </div>
                <div v-if="debugState.logs.length === 0" class="text-gray-400 italic text-center mt-4">
                    No logs yet...
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import Switch from './Switch.vue';
import { debugState, clearLogs } from '../utils/debugConsole';
import { darkMode, autoCopyText, autoDownload } from '../utils/settings';
</script>
