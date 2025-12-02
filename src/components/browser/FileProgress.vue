<template>
    <div v-if="isZipping" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 w-64 shadow-xl flex flex-col items-center gap-4">
            <div class="text-center w-full">
                <h3 class="font-bold text-gray-800 dark:text-white mb-1">正在打包...</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate max-w-[200px] mx-auto">
                    {{ currentZipName }}
                </p>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden relative">
                    <div class="bg-blue-500 h-4 rounded-full transition-all duration-200"
                        :style="{ width: zipProgress + '%' }"></div>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 font-mono mt-2">
                    {{ zipProgress.toFixed(0) }}%
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    isZipping: {
        type: Boolean,
        default: false,
    },
    currentZipName: {
        type: String,
        default: '',
    },
    zipProgress: {
        type: Number,
        default: 0,
    }
});
</script>