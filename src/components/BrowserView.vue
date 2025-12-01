<template>
    <div class="fixed inset-0 z-30 flex flex-col bg-gray-50 dark:bg-gray-900"
        style="padding-top: env(safe-area-inset-top, 0px); padding-bottom: 0;">
        <!-- Header / Toolbar -->
        <div
            class="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
            <!-- URL Container -->
            <div
                class="flex-1 flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 mr-3 overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20"
                    fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd" />
                </svg>
                <span class="text-sm text-gray-600 dark:text-gray-200 truncate font-mono select-all">{{ url }}</span>
            </div>

            <!-- Close Button -->
            <button @click="$emit('close')"
                class="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 transition-colors focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd" />
                </svg>
            </button>
        </div>

        <!-- Browser Content -->
        <div class="flex-1 relative w-full bg-white dark:bg-gray-900 overflow-hidden">
            <iframe :src="url" class="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation-by-user-activation"
                allowfullscreen referrerpolicy="no-referrer" loading="lazy" @load="handleIframeLoad"
                @error="handleIframeError"></iframe>

            <!-- Loading Spinner -->
            <div v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10 pointer-events-none">
                <div class="flex flex-col items-center">
                    <svg class="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400 mb-2"
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                    <span class="text-xs text-gray-500 dark:text-gray-400">Loading content...</span>
                </div>
            </div>
        </div>

        <!-- Spacer for BottomNav -->
        <div class="w-full shrink-0 bg-white dark:bg-gray-900"
            style="height: calc(4.5rem + env(safe-area-inset-bottom, 0px));"></div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
    url: {
        type: String,
        required: true
    }
});

defineEmits(['close']);

const isLoading = ref(true);

const handleIframeLoad = () => {
    isLoading.value = false;
};

const handleIframeError = () => {
    isLoading.value = false;
    console.error("Iframe failed to load content");
};
</script>
