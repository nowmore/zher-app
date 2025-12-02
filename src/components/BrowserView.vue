<template>
  <div
    class="fixed inset-0 z-50 flex flex-col font-sans overflow-hidden text-gray-800 dark:text-gray-100 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
    :style="{ 
      paddingTop: 'env(safe-area-inset-top, 0px)', 
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      height: viewportHeight + 'px'
    }">

    <!-- Zipping Progress -->
    <FileProgress :is-zipping="isZipping" :current-zip-name="currentZipName" :zip-progress="zipProgress" />

    <!-- Mobile Users List Modal -->
    <UserList :show="showMobileUsers" :users="users" :current-user="currentUser" v-model:is-editing-name="isEditingName"
      @close="showMobileUsers = false" @change-name="handleChangeName" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex justify-between items-center z-10 shrink-0">
        <div class="flex items-center gap-3">
          <button @click="emit('close')"
            class="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-lg font-bold text-gray-800 dark:text-white">这儿 <span
              class="text-sm font-normal text-gray-400 ml-2">zhe'r</span></h1>
        </div>
        <button @click="showMobileUsers = true"
          class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          在线: {{ onlineCount }}
        </button>
      </header>

      <!-- Chat Container -->
      <div ref="chatContainer" @scroll="handleScroll" class="flex-1 overflow-y-auto p-4 space-y-4">
        <ChatMessage v-for="msg in messages" :key="msg.id" :msg="msg" :current-user="currentUser"
          :copied-message-id="copiedMessageId" @copy="handleCopy" @download="handleDownload" />
      </div>

      <!-- Input Area -->
      <ChatInput v-model="inputText" :has-file="!!selectedFile" @send="handleSendMessage"
        @file-selected="handleFileSelect" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useGlobalSocket } from '../composables/useGlobalSocket';
import { useChat } from '../composables/useChat';
import { useFileTransfer } from '../composables/useFileTransfer';
import { copyText as copyToClipboard } from '../utils/textUtils';

// Components
import FileProgress from './browser/FileProgress.vue';
import UserList from './browser/UserList.vue';
import ChatMessage from './browser/ChatMessage.vue';
import ChatInput from './browser/ChatInput.vue';

const props = defineProps({
  url: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close']);

const chatContainer = ref(null);
const inputText = ref('');
const copiedMessageId = ref(null);
const showMobileUsers = ref(false);
const isEditingName = ref(false);
const connection = ref(null);
const viewportHeight = ref(window.innerHeight);

const {
  connect,
  getConnection,
  emit: socketEmit,
  requestNameChange: socketRequestNameChange,
  registerCallback,
  unregisterCallback
} = useGlobalSocket();

const users = computed(() => connection.value?.users || []);
const currentUser = computed(() => connection.value?.currentUser || {});
const serverUrl = computed(() => connection.value?.serverUrl || '');

const { messages, loadMoreMessages, addMessage, loadChatHistory } = useChat();

const realSendMessage = () => {
  if (selectedFile.value) {
    const file = selectedFile.value;
    const fileId = Math.random().toString(36).substr(2, 9);
    addSharedFile(fileId, file);

    socketEmit(props.url, 'file-meta', {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    inputText.value = '';
    selectedFile.value = null;
  } else if (inputText.value.trim()) {
    socketEmit(props.url, 'text-message', inputText.value);
    inputText.value = '';
  }

  scrollToBottom();
};

const sendMessage = realSendMessage;

const {
  selectedFile, isZipping, zipProgress, currentZipName, currentZipFile,
  handleFileChange, handleStartUpload, addSharedFile
} = useFileTransfer(sendMessage);

const handleSendMessage = () => {
  sendMessage();
};

const handleFileSelect = (e) => {
  handleFileChange(e);
};

const handleChangeName = (newName) => {
  socketRequestNameChange(props.url, newName);
};

const handleDownload = async (fileId, fileName) => {
  try {
    const baseUrl = props.url.endsWith('/') ? props.url.slice(0, -1) : props.url;
    const url = `${baseUrl}/api/download/${fileId}`;
    await invoke('download_file', { url, filename: fileName });
  } catch (err) { }
};

const handleCopy = (text, msgId) => {
  copyToClipboard(text, () => {
    copiedMessageId.value = msgId;
    setTimeout(() => {
      if (copiedMessageId.value === msgId) {
        copiedMessageId.value = null;
      }
    }, 2000);
  }, () => { });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const onlineCount = computed(() => users.value.length);

const handleScroll = (e) => {
  if (e.target.scrollTop <= 10) {
    loadMoreMessages(e.target);
  }
};

const handleAndroidBack = () => {
  emit('close');
  return false; // 返回 false 表示已处理，不执行默认行为
};

const onMessageCallback = (msg) => {
  addMessage(msg);
  scrollToBottom();
};

const onWelcomeCallback = (data) => {
  scrollToBottom();
};

const onStartUploadCallback = (data) => {
  handleStartUpload(data, props.url);
};

const handleViewportResize = () => {
  if (window.visualViewport) {
    viewportHeight.value = window.visualViewport.height;
  } else {
    viewportHeight.value = window.innerHeight;
  }
  // 输入法弹出时滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
};

onMounted(async () => {
  window.handleAndroidBack = handleAndroidBack;

  // 监听 viewport 变化（输入法弹出/收起）
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize);
    viewportHeight.value = window.visualViewport.height;
  } else {
    window.addEventListener('resize', handleViewportResize);
  }

  connection.value = getConnection(props.url);

  if (!connection.value || !connection.value.isConnected) {
    // 如果没有连接或连接已断开，强制重连
    connection.value = await connect(props.url, true);
  } else {
    if (connection.value.messages && connection.value.messages.length > 0) {
      connection.value.messages.forEach(msg => {
        addMessage(msg);
      });
    }
  }

  registerCallback(props.url, 'onMessage', onMessageCallback);
  registerCallback(props.url, 'onWelcome', onWelcomeCallback);
  registerCallback(props.url, 'onStartUpload', onStartUploadCallback);

  scrollToBottom();
});

onUnmounted(() => {
  // 清理安卓返回键处理函数
  if (window.handleAndroidBack === handleAndroidBack) {
    delete window.handleAndroidBack;
  }

  // 移除 viewport 监听
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleViewportResize);
  } else {
    window.removeEventListener('resize', handleViewportResize);
  }

  // 取消注册回调
  unregisterCallback(props.url, 'onMessage', onMessageCallback);
  unregisterCallback(props.url, 'onWelcome', onWelcomeCallback);
  unregisterCallback(props.url, 'onStartUpload', onStartUploadCallback);

  // 注意：不断开连接，保持 WebSocket 活跃并继续接收消息
});
</script>