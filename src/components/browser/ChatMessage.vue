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
                    <button @click="$emit('download', msg.fileId, msg.fileName)"
                        class="w-9 h-9 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-sm shrink-0 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                                d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { parseMessage } from '../../utils/textUtils';

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

defineEmits(['copy', 'download']);

const isSelf = computed(() => props.msg.senderId === props.currentUser.id);
const isCopied = computed(() => props.copiedMessageId === props.msg.id);
const parsedMessage = computed(() => parseMessage(props.msg.text));

const formattedSize = computed(() => {
    const bytes = props.msg.fileSize;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});
</script>
