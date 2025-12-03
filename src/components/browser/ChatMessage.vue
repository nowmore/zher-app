<template>
    <div class="flex items-start gap-2 max-w-full" :class="{ 'flex-row-reverse': isSelf }">
        <!-- Avatar -->
        <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0"
            :style="{ backgroundColor: msg.senderColor }">
            <span class="text-white text-xs font-bold">{{ msg.senderName.substring(0, 1) }}</span>
        </div>

        <!-- Message Content -->
        <div class="flex flex-col max-w-[75%]" :class="{ 'items-end': isSelf }">
            <span class="text-[10px] text-gray-400 mb-1 px-1">{{ msg.senderName }}</span>
            <div class="px-4 py-2.5 rounded-2xl shadow-sm text-sm break-words w-full" :class="isSelf
                ? 'bg-blue-500 text-white rounded-tr-none'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none'
                ">
                <!-- Text Message -->
                <div v-if="msg.text" class="flex gap-3 items-end min-w-[60px]">
                    <div class="whitespace-pre-wrap leading-relaxed flex-1 break-all min-w-0">
                        <template v-for="(part, index) in parsedMessage" :key="index">
                            <a v-if="part.type === 'link'" :href="part.url" target="_blank"
                                class="underline hover:opacity-80"
                                :class="isSelf ? 'text-white' : 'text-blue-600 dark:text-blue-400'">{{ part.content
                                }}</a>
                            <span v-else>{{ part.content }}</span>
                        </template>
                    </div>
                    <button @click="$emit('copy', msg.text, msg.id)"
                        class="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                        <svg v-if="isCopied" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>

                <!-- File Message -->
                <div v-else-if="msg.type === 'file-meta'"
                    class="mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 min-w-[200px]">
                    <div class="flex items-center gap-3 min-w-0 overflow-hidden">
                        <div
                            class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div class="flex flex-col min-w-0">
                            <span class="text-sm font-medium truncate text-gray-800 dark:text-gray-100">{{ msg.fileName
                            }}</span>
                            <span class="text-[10px] text-gray-400">{{ formattedSize }}</span>
                        </div>
                    </div>
                    <!-- Download Button with Progress -->
                    <div class="relative shrink-0">
                        <!-- Completed State -->
                        <button v-if="isCompleted"
                            class="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                                    d="M5 13l4 4L19 7" />
                            </svg>
                        </button>

                        <!-- Downloading State -->
                        <button v-else-if="isDownloading" @click="handlePause"
                            class="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white shadow-sm transition-colors relative overflow-hidden">
                            <!-- Progress Ring -->
                            <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)"
                                    stroke-width="2" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="white" stroke-width="2"
                                    stroke-dasharray="100" :stroke-dashoffset="100 - (downloadStatus?.progress || 0)"
                                    stroke-linecap="round" class="transition-all duration-300" />
                            </svg>
                            <!-- Pause Icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 relative z-10" fill="currentColor"
                                viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        </button>

                        <!-- Paused State -->
                        <button v-else-if="isPaused" @click="handleResume"
                            class="w-9 h-9 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-white shadow-sm transition-colors relative overflow-hidden">
                            <!-- Progress Ring -->
                            <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)"
                                    stroke-width="2" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="white" stroke-width="2"
                                    stroke-dasharray="100" :stroke-dashoffset="100 - (downloadStatus?.progress || 0)"
                                    stroke-linecap="round" />
                            </svg>
                            <!-- Play Icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 relative z-10" fill="currentColor"
                                viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </button>

                        <!-- Default Download State -->
                        <button v-else @click="handleDownload"
                            class="w-9 h-9 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-sm transition-colors active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                                    d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </button>

                        <!-- Progress Text -->
                        <div v-if="isDownloading || isPaused"
                            class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {{ downloadStatus?.progress || 0 }}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { parseMessage } from '../../utils/textUtils';
import { activeDownloads, pauseDownload, resumeDownload } from '../../utils/downloadManager';
import { formatFileSize } from '../../utils/fileTypes';
const props = defineProps({
    msg: {
        type: Object,
        required: true,
    },
    currentUser: {
        type: Object,
        required: true,
    },
    copiedMessageId: {
        type: [String, Number, null],
        default: null,
    },
});

const emit = defineEmits(['copy', 'download']);

const isSelf = computed(() => props.msg.senderId === props.currentUser.id);
const isCopied = computed(() => props.copiedMessageId === props.msg.id);
const parsedMessage = computed(() => parseMessage(props.msg.text));

const formattedSize = computed(() => {
    return formatFileSize(props.msg.fileSize);
});

const downloadStatus = computed(() => {
    return activeDownloads.value.get(props.msg.fileId);
});

const isDownloading = computed(() => downloadStatus.value?.status === 'downloading');
const isPaused = computed(() => downloadStatus.value?.status === 'paused');
const isCompleted = computed(() => downloadStatus.value?.status === 'completed');

const handleDownload = () => {
    emit('download', props.msg.fileId, props.msg.fileName);
};

const handlePause = () => {
    pauseDownload(props.msg.fileId);
};

const handleResume = () => {
    resumeDownload(props.msg.fileId);
};
</script>
