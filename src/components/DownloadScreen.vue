<template>
    <div class="flex-1 flex flex-col w-full h-full">
        <!-- Header -->
        <header class="px-4 py-4 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">下载</h1>
        </header>

        <!-- Content Area -->
        <div class="flex-1 flex flex-col w-full overflow-y-auto">

            <!-- Empty State -->
            <div v-if="downloadState.tasks.length === 0" class="flex-1 flex flex-col items-center justify-center p-4">
                <div class="flex flex-col items-center text-gray-400 dark:text-gray-500">
                    <div class="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                    <span class="text-sm font-medium">无下载任务</span>
                </div>
            </div>

            <!-- Task List -->
            <div v-else class="flex-1 pb-20">
                <div v-for="task in downloadState.tasks" :key="task.id"
                    class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                    <!-- File Icon -->
                    <div
                        class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400"
                            viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>

                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate pr-2">{{ task.name
                                }}</h3>
                            <span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">{{ formatSize(task.received)
                                }} / {{ task.size > 0 ? formatSize(task.size) : 'Unknown' }}</span>
                        </div>

                        <!-- Progress Bar -->
                        <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div class="h-full bg-blue-500 transition-all duration-300 rounded-full"
                                :style="{ width: task.progress + '%' }"></div>
                        </div>

                        <!-- Status Line -->
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{ task.status }}</span>
                            <span class="text-xs text-gray-400">{{ task.progress }}%</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { downloadState } from '../utils/downloadManager';

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
</script>
