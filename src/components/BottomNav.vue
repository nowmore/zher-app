<template>
  <footer
    class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 select-none"
    style="padding-bottom: env(safe-area-inset-bottom, 0px);">
    <!-- 
      修改点 1: 
      grid-cols-4 -> grid-cols-5 
      将总宽度分为 5 等份
    -->
    <nav class="grid grid-cols-5 items-center h-18 px-0">

      <!-- 1. Zher 按钮 -->
      <!-- 
        修改点 2: 
        添加 col-span-2
        让它占据 2/5 的空间，实现“更宽”的效果
      -->
      <button @click="switchPage('zher')"
        class="clean-btn col-span-2 flex flex-col items-center justify-center w-full h-full transition-all duration-300 group">
        <span class="font-mono font-black italic tracking-tighter text-2xl transition-all duration-300" :class="activePage === 'zher'
          ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 scale-110'
          : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400'">
          Zher
        </span>
        <span class="w-1.5 h-1.5 rounded-full mt-1 transition-all duration-300"
          :class="activePage === 'zher' ? 'bg-blue-600 dark:bg-blue-400 opacity-100' : 'opacity-0'"></span>
      </button>

      <!-- 2. 其余三个图标 -->
      <!-- 它们默认占 1 份 (col-span-1)，无需额外修改，自动平分剩下的 3/5 空间 -->

      <!-- 下载按钮 -->
      <button @click="switchPage('download')"
        class="clean-btn flex flex-col items-center justify-center w-full h-full py-2 px-1 transition-all duration-300 group relative"
        :class="activePage === 'download' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mb-0.5 transition-transform duration-300 group-active:scale-90" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <span class="text-[10px] font-medium">下载</span>
      </button>

      <!-- 服务按钮 -->
      <button @click="switchPage('service')"
        class="clean-btn flex flex-col items-center justify-center w-full h-full py-2 px-1 transition-all duration-300 group relative"
        :class="activePage === 'service' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mb-0.5 transition-transform duration-300 group-active:scale-90" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span class="text-[10px] font-medium">服务</span>
      </button>

      <!-- 设置按钮 -->
      <button @click="switchPage('settings')"
        class="clean-btn flex flex-col items-center justify-center w-full h-full py-2 px-1 transition-all duration-300 group relative"
        :class="activePage === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mb-0.5 transition-transform duration-300 group-active:scale-90" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span class="text-[10px] font-medium">设置</span>
      </button>

    </nav>
  </footer>
</template>

<style scoped>
/* 保持强制去框样式 */
.clean-btn {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  background-color: transparent !important;
  -webkit-tap-highlight-color: transparent !important;
}

.clean-btn:focus,
.clean-btn:active,
.clean-btn:focus-visible,
.clean-btn:hover {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  background-color: transparent !important;
}
</style>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: 'zher'
  }
});

// Emits
const emit = defineEmits(['update:modelValue']);

// 计算属性，兼容activePage和modelValue
const activePage = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 切换页面
const switchPage = (page) => {
  activePage.value = page;
};
</script>

<style scoped>
.dark footer {
  background-color: #1f2937;
  border-top: 1px solid #374151;
}

button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
}

.dark button:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}
</style>
