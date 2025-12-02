<template>
  <div
    class="fixed inset-0 z-30 flex flex-col font-sans overflow-hidden text-gray-800 dark:text-gray-100 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
    style="padding-top: env(safe-area-inset-top, 0px); padding-bottom: 3.5rem;">

    <!-- Zipping Progress -->
    <FileProgress :is-zipping="isZipping" :current-zip-name="currentZipName" :zip-progress="zipProgress" />

    <!-- Mobile Users List Modal -->
    <UserList :show="showMobileUsers" :users="users" :current-user="currentUser" v-model:is-editing-name="isEditingName"
      @close="showMobileUsers = false" @change-name="handleChangeName" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex justify-between items-center z-10 shrink-0">
        <h1 class="text-lg font-bold text-gray-800 dark:text-white">这儿 <span
            class="text-sm font-normal text-gray-400 ml-2">zhe'r</span></h1>
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
import { useSocket } from '../composables/useSocket';
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

const {
  users, currentUser, serverUrl, isEditingName,
  connect, disconnect, emit: socketEmit, requestNameChange
} = useSocket();

const { messages, loadMoreMessages, addMessage, loadChatHistory } = useChat();

const realSendMessage = () => {
  if (selectedFile.value) {
    const file = selectedFile.value;
    const fileId = Math.random().toString(36).substr(2, 9);
    addSharedFile(fileId, file);

    socketEmit('file-meta', {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    inputText.value = '';
    selectedFile.value = null;
  } else if (inputText.value.trim()) {
    socketEmit('text-message', inputText.value);
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
  requestNameChange(newName);
};

const handleDownload = async (fileId, fileName) => {
  try {
    const baseUrl = props.url.endsWith('/') ? props.url.slice(0, -1) : props.url;
    const url = `${baseUrl}/api/download/${fileId}`;
    await invoke('download_file', { url, filename: fileName });
  } catch (err) {}
};

const handleCopy = (text, msgId) => {
  copyToClipboard(text, () => {
    copiedMessageId.value = msgId;
    setTimeout(() => {
      if (copiedMessageId.value === msgId) {
        copiedMessageId.value = null;
      }
    }, 2000);
  }, () => {});
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

onMounted(async () => {
  await loadChatHistory();

  await connect(props.url, {
    onMessage: (msg) => {
      addMessage(msg);
      scrollToBottom();
    },
    onWelcome: (data) => {
      scrollToBottom();
    },
    onStartUpload: (data) => handleStartUpload(data, props.url)
  });
});

onUnmounted(() => {
  disconnect();
});
</script>