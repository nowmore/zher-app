<template>
    <div class="bg-white dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <div class="flex gap-2 items-end">
            <div
                class="relative flex-1 rounded-2xl bg-gray-100 dark:bg-gray-700 border border-transparent focus-within:bg-white dark:focus-within:bg-gray-600 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-colors">
                <textarea v-model="localInputText" rows="1" @input="autoResize" @keydown.enter.prevent="handleEnter"
                    placeholder="发送消息..."
                    class="w-full pl-4 pr-12 py-3 bg-transparent border-none focus:ring-0 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none block max-h-[120px] overflow-y-auto"
                    style="min-height: 44px" ref="textareaRef"></textarea>

                <button @click="triggerFileSelect" v-if="!isMultiLine"
                    class="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 active:text-blue-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </button>
                <input type="file" ref="fileInputRef" @change="onFileChange" class="hidden" multiple />
            </div>
            <button @click="handleSend" :disabled="!canSend"
                class="p-3 bg-blue-600 text-white rounded-full shadow-lg active:bg-blue-700 disabled:opacity-50 disabled:shadow-none shrink-0 active:scale-95 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                        d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
    modelValue: {
        type: String,
        default: '',
    },
    hasFile: {
        type: Boolean,
        default: false,
    }
});

const emit = defineEmits(['update:modelValue', 'send', 'file-selected']);

const localInputText = ref(props.modelValue);
const isMultiLine = ref(false);
const textareaRef = ref(null);
const fileInputRef = ref(null);

watch(() => props.modelValue, (val) => {
    localInputText.value = val;
    if (!val) {
        resetHeight();
    }
});

watch(localInputText, (val) => {
    emit('update:modelValue', val);
});

const canSend = computed(() => localInputText.value.trim() || props.hasFile);

const autoResize = (e) => {
    const target = e.target;
    target.style.height = 'auto';
    const newHeight = Math.min(target.scrollHeight, 120);
    target.style.height = newHeight + 'px';
    isMultiLine.value = newHeight > 50;
};

const resetHeight = () => {
    if (textareaRef.value) {
        textareaRef.value.style.height = 'auto';
        textareaRef.value.style.height = '44px'; // default height
        isMultiLine.value = false;
    }
};

const handleEnter = (e) => {
    if (!e.shiftKey) {
        handleSend();
    }
};

const handleSend = () => {
    if (canSend.value) {
        emit('send');
    }
};

const triggerFileSelect = () => {
    fileInputRef.value.click();
};

const onFileChange = (e) => {
    emit('file-selected', e);
};
</script>
