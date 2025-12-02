<script setup>
import { ref, computed, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { getCategoryByExtension, getAvailableCategories, groupByDate, formatFileSize, FILE_CATEGORIES } from '../utils/fileTypes';
import { activeDownloads, formatSize, pauseDownload, resumeDownload, cancelDownload } from '../utils/downloadManager';

const downloads = ref([]);
const selectedCategory = ref('ALL');
const isSearching = ref(false);
const searchQuery = ref('');
const showOptionsMenu = ref(false);
const selectedDownload = ref(null);
const showRenameDialog = ref(false);
const newFileName = ref('');

const loadDownloads = async () => {
    try {
        const stored = await invoke('get_downloads');
        downloads.value = stored || [];
    } catch (err) {}
};

const availableCategories = computed(() => getAvailableCategories(downloads.value));

const filteredDownloads = computed(() => {
    let filtered = downloads.value;
    
    if (selectedCategory.value !== 'ALL') {
        filtered = filtered.filter(d => getCategoryByExtension(d.filename) === selectedCategory.value);
    }
    
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(d => d.filename.toLowerCase().includes(query));
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
});

const groupedDownloads = computed(() => groupByDate(filteredDownloads.value));

const deleteAllDownloads = async () => {
    if (!confirm('确定要删除所有下载记录和文件吗？')) return;
    
    try {
        await invoke('delete_all_downloads');
        downloads.value = [];
    } catch (err) {}
};

const openFile = async (download) => {
    try {
        await invoke('open_download_file', { path: download.path });
    } catch (err) {
        alert('无法打开文件');
    }
};

const deleteDownload = async (download) => {
    try {
        await invoke('delete_download', { id: download.id });
        downloads.value = downloads.value.filter(d => d.id !== download.id);
        closeOptionsMenu();
    } catch (err) {}
};

const showOptions = (download) => {
    selectedDownload.value = download;
    showOptionsMenu.value = true;
};

const closeOptionsMenu = () => {
    showOptionsMenu.value = false;
    selectedDownload.value = null;
};

const openRenameDialog = () => {
    if (selectedDownload.value) {
        newFileName.value = selectedDownload.value.filename;
        showRenameDialog.value = true;
    }
};

const renameFile = async () => {
    if (!selectedDownload.value || !newFileName.value.trim()) return;
    
    try {
        await invoke('rename_download', { 
            id: selectedDownload.value.id, 
            newName: newFileName.value.trim() 
        });
        
        const index = downloads.value.findIndex(d => d.id === selectedDownload.value.id);
        if (index !== -1) {
            downloads.value[index].filename = newFileName.value.trim();
        }
        
        showRenameDialog.value = false;
        closeOptionsMenu();
    } catch (err) {
        alert('重命名失败: ' + err);
    }
};

const shareFile = async () => {
    if (!selectedDownload.value) return;
    
    try {
        await invoke('share_download', { path: selectedDownload.value.path });
        closeOptionsMenu();
    } catch (err) {
        alert('分享失败: ' + err);
    }
};

const openWith = async () => {
    if (!selectedDownload.value) return;
    
    try {
        await invoke('open_with_download', { path: selectedDownload.value.path });
        closeOptionsMenu();
    } catch (err) {
        alert('打开方式失败: ' + err);
    }
};

const hideSearchOnBlur = () => {
    if (!searchQuery.value) {
        isSearching.value = false;
    }
};

const getCategoryIcon = (category) => {
    const icons = {
        DOCUMENT: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        ARCHIVE: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
        APPLICATION: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
        IMAGE: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
        VIDEO: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
        AUDIO: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
        CODE: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
    };
    return icons[category] || 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
};

onMounted(() => {
    loadDownloads();
});
</script>

<template>
    <div class="flex-1 flex flex-col w-full h-full">
        <header class="px-4 py-4 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <div class="flex items-center justify-between">
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">下载</h1>
                <div class="flex items-center gap-2">
                    <button @click="isSearching = !isSearching"
                        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    <button @click="deleteAllDownloads"
                        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div v-if="isSearching" class="mt-3">
                <input v-model="searchQuery" type="text" placeholder="搜索下载..." @blur="hideSearchOnBlur"
                    class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
        </header>

        <div v-if="availableCategories.length > 1"
            class="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
            <div class="flex gap-2 min-w-max">
                <button @click="selectedCategory = 'ALL'"
                    :class="selectedCategory === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'"
                    class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">
                    全部
                </button>
                <button v-for="cat in availableCategories.filter(c => c !== 'ALL')" :key="cat"
                    @click="selectedCategory = cat"
                    :class="selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'"
                    class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            :d="getCategoryIcon(cat)" />
                    </svg>
                    {{ FILE_CATEGORIES[cat].name }}
                </button>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto">
            <div v-if="activeDownloads.size > 0" class="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">正在下载</h2>
                <div v-for="[id, download] in activeDownloads" :key="id"
                    class="mb-2 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{{ download.name }}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-gray-500 dark:text-gray-400">{{ download.progress }}%</span>
                            <button v-if="download.status === 'downloading'" @click="pauseDownload(id)"
                                class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            <button v-if="download.status === 'paused'" @click="resumeDownload(id)"
                                class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            <button @click="cancelDownload(id)"
                                class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600 dark:text-red-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                        <div :class="download.status === 'paused' ? 'bg-yellow-500' : download.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'" 
                            class="h-2 rounded-full transition-all" :style="{ width: download.progress + '%' }"></div>
                    </div>
                    <div class="flex items-center justify-between text-xs">
                        <span class="text-gray-500 dark:text-gray-400">
                            {{ formatSize(download.received) }} / {{ formatSize(download.size) }}
                        </span>
                        <span v-if="download.status === 'paused'" class="text-yellow-600 dark:text-yellow-400">已暂停</span>
                        <span v-if="download.status === 'failed'" class="text-red-600 dark:text-red-400">下载失败</span>
                    </div>
                </div>
            </div>

            <div v-if="Object.keys(groupedDownloads).length === 0 && activeDownloads.size === 0" class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <p class="text-sm">暂无下载记录</p>
            </div>

            <div v-for="(items, date) in groupedDownloads" :key="date" class="mb-4">
                <div class="px-4 py-2 bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ date }}</h2>
                </div>
                
                <div class="px-4 py-2 space-y-2">
                    <div v-for="download in items" :key="download.id"
                        @click="openFile(download)"
                        class="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
                        <div class="flex items-start gap-3">
                            <div class="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 dark:text-gray-400"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        :d="getCategoryIcon(getCategoryByExtension(download.filename))" />
                                </svg>
                            </div>
                            
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ download.filename }}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {{ formatFileSize(download.size) }} · {{ new Date(download.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
                                </p>
                            </div>
                            
                            <button @click.stop="showOptions(download)"
                                class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showOptionsMenu" @click="closeOptionsMenu"
            class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
            <div @click.stop class="w-full bg-white dark:bg-gray-900 rounded-t-2xl p-4 space-y-2 animate-slide-up">
                <button @click="openRenameDialog"
                    class="w-full p-4 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    重命名
                </button>
                <button @click="shareFile"
                    class="w-full p-4 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    共享
                </button>
                <button @click="openWith"
                    class="w-full p-4 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    打开方式
                </button>
                <button @click="deleteDownload(selectedDownload)"
                    class="w-full p-4 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    删除
                </button>
                <button @click="closeOptionsMenu"
                    class="w-full p-4 text-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    取消
                </button>
            </div>
        </div>

        <div v-if="showRenameDialog" @click="showRenameDialog = false"
            class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div @click.stop class="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">重命名文件</h3>
                <input v-model="newFileName" type="text" 
                    class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <div class="flex gap-3">
                    <button @click="showRenameDialog = false"
                        class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">
                        取消
                    </button>
                    <button @click="renameFile"
                        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        确定
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes slide-up {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

.animate-slide-up {
    animation: slide-up 0.3s ease-out;
}
</style>
