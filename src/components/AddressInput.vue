<template>
  <!-- 这里的 mt-[20vh] 表示距离顶部 20% 的视口高度 -->
  <!-- 你也可以用 mt-20, mt-32 等固定数值 -->
  <div class="w-full px-4 mt-[20vh]">
    <div class="relative flex items-center gap-3 max-w-3xl mx-auto">
      <div class="relative flex-1 w-full">
        <input v-model="serverAddress" type="text" placeholder="http://localhost:4836"
          class="w-full pl-4 pr-12 py-3 border shadow-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
          :class="{
            'border-gray-300 dark:border-gray-600 rounded-full': !isInvalid,
            'border-red-500 dark:border-red-400 rounded-full focus:ring-red-500 dark:focus:ring-red-400': isInvalid
          }" required @keyup.enter="handleAction" />
        <button @click="handleScan"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="barcodeScan">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3H9V9H3V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M15 3H21V9H15V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M3 15H9V21H3V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M15 15H17V17H15V15Z" fill="currentColor" />
            <path d="M19 19H21V21H19V19Z" fill="currentColor" />
            <path d="M15 19H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M19 15H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <button @click="handleAction" :disabled="isLoading"
        class="relative group w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        aria-label="openURL">
        <span
          class="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-50 rounded-full transform scale-105 group-hover:scale-110 transition-transform duration-300"></span>
        <span class="relative z-10">
          <svg v-if="isLoading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </span>
      </button>
    </div>
    <div v-if="isInvalid" class="text-red-500 dark:text-red-400 text-sm mt-1 max-w-3xl mx-auto text-center">
      请输入合法的地址
    </div>
  </div>

</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  initialAddress: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['connect', 'scan', 'open-browser']);

const serverAddress = ref(props.initialAddress);

watch(() => props.initialAddress, (newVal) => {
  if (newVal !== serverAddress.value) {
    serverAddress.value = newVal;
    handleAction();
  }
});

const isLoading = ref(false);
const isInvalid = ref(false);

const urlRegex = /^(https?:\/\/)?((([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})|((\d{1,3}\.){3}\d{1,3})|localhost)(?::(?:[1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?(\/[^\s]*)?$/i;

const openUrl = (url) => {
  try {
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `http://${finalUrl}`;
    }
    emit('open-browser', finalUrl);
  } catch (error) {
    console.error('打开URL错误:', error);
  }
};

const handleAction = () => {
  if (isLoading.value) return;

  const val = serverAddress.value.trim();

  if (!val) {
    isInvalid.value = false;
    openUrl("http://localhost:4836");
    return;
  }

  if (!urlRegex.test(val)) {
    isInvalid.value = true;
    return;
  }

  isInvalid.value = false;
  openUrl(val);
};

const handleScan = () => {
  emit('scan');
};

</script>
