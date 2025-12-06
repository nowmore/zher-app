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
    <UserList :show="showMobileUsers" :users="users" :current-user="currentUser" :server-url="serverUrl"
      v-model:is-editing-name="isEditingName" @close="showMobileUsers = false" @change-name="handleChangeName" />

    <!-- Room Code Modal -->
    <div v-if="showRoomCodeModal"
      class="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in">
        <div class="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-bold text-gray-800 dark:text-white text-lg">🔒 需要房间码</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">此服务器需要房间码才能连接</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-gray-600 dark:text-gray-400">请输入6位数字房间码</label>
            <div class="flex gap-2">
              <input 
                v-for="(digit, index) in roomCodeDigits" 
                :key="index"
                :ref="el => setRoomCodeInputRef(el, index)"
                v-model="roomCodeDigits[index]"
                type="text"
                maxlength="1"
                @input="handleRoomCodeDigitInput(index, $event)"
                @keydown="handleRoomCodeKeyDown(index, $event)"
                @paste="handleRoomCodePaste($event)"
                class="w-12 h-12 text-center text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                :class="roomCodeError ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'" />
            </div>
            <p v-if="roomCodeError" class="text-sm text-red-500">{{ roomCodeError }}</p>
          </div>
          
          <div class="flex gap-2">
            <button @click="handleRoomCodeCancel"
              class="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
              取消
            </button>
            <button @click="handleRoomCodeSubmit"
              :disabled="roomCodeDigits.join('').length !== 6"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              连接
            </button>
          </div>
        </div>
      </div>
    </div>

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
          <h1 class="text-lg font-bold text-gray-800 dark:text-white">{{ hostname }}
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <button @click="goToDownloads"
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 14l-7 7m0 0l-7-7m7 7V3m-7 18h14" />
            </svg>
          </button>
          <button @click="showMobileUsers = true"
            class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            在线: {{ onlineCount }}
          </button>
        </div>
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';

import { useGlobalSocket } from '../composables/useGlobalSocket';
import { useChat } from '../composables/useChat';
import { useFileTransfer } from '../composables/useFileTransfer';
import { useSharedFiles } from '../composables/useSharedFiles';
import { initDownloadManager, startDownload } from '../utils/downloadManager';
import { copyText } from '../utils/action';
// Components
import FileProgress from './browser/FileProgress.vue';
import UserList from './browser/UserList.vue';
import ChatMessage from './browser/ChatMessage.vue';
import ChatInput from './browser/ChatInput.vue';

const props = defineProps({
  url: {
    type: String,
    required: true
  },
  roomCode: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['close', 'navigate-to-downloads']);

const chatContainer = ref(null);
const inputText = ref('');
const copiedMessageId = ref(null);
const showMobileUsers = ref(false);
const isEditingName = ref(false);
const connection = ref(null);
const viewportHeight = ref(window.innerHeight);

// Room code modal
const showRoomCodeModal = ref(false);
const roomCodeDigits = ref(['', '', '', '', '', '']);
const roomCodeInputRefs = ref([]);
const roomCodeError = ref('');
const pendingRoomCodeReconnect = ref(false);

// Shared files handling
const { hasPendingFiles, getPendingFiles, clearPendingFiles } = useSharedFiles();

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

const { messages, loadMoreMessages, addMessage } = useChat();

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

const {
  selectedFile, isZipping, zipProgress, currentZipName, currentZipFile,
  handleFileChange, handleStartUpload, addSharedFile
} = useFileTransfer(realSendMessage);

const handleSendMessage = () => {
  realSendMessage();
};

const handleFileSelect = (e) => {
  handleFileChange(e);
};

const handleChangeName = (newName) => {
  socketRequestNameChange(props.url, newName);
};

const goToDownloads = () => {
  emit('navigate-to-downloads');
};

// Room code input handlers
const setRoomCodeInputRef = (el, index) => {
  if (el) {
    roomCodeInputRefs.value[index] = el;
  }
};

const handleRoomCodeDigitInput = (index, event) => {
  const value = event.target.value;
  
  if (!/^\d*$/.test(value)) {
    event.target.value = roomCodeDigits.value[index];
    return;
  }
  
  roomCodeDigits.value[index] = value;
  roomCodeError.value = '';
  
  if (value && index < 5) {
    nextTick(() => {
      if (roomCodeInputRefs.value[index + 1]) {
        roomCodeInputRefs.value[index + 1].focus();
      }
    });
  }
};

const handleRoomCodeKeyDown = (index, event) => {
  if (event.key === 'Backspace' && !roomCodeDigits.value[index] && index > 0) {
    nextTick(() => {
      if (roomCodeInputRefs.value[index - 1]) {
        roomCodeInputRefs.value[index - 1].focus();
      }
    });
  }
  
  if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault();
    roomCodeInputRefs.value[index - 1].focus();
  }
  if (event.key === 'ArrowRight' && index < 5) {
    event.preventDefault();
    roomCodeInputRefs.value[index + 1].focus();
  }
  
  if (event.key === 'Enter' && roomCodeDigits.value.join('').length === 6) {
    handleRoomCodeSubmit();
  }
};

const handleRoomCodePaste = (event) => {
  event.preventDefault();
  const text = event.clipboardData.getData('text');
  const digits = text.replace(/\D/g, '').slice(0, 6).split('');
  
  for (let i = 0; i < 6; i++) {
    roomCodeDigits.value[i] = digits[i] || '';
  }
  
  const lastFilledIndex = digits.length - 1;
  const nextIndex = Math.min(lastFilledIndex + 1, 5);
  nextTick(() => {
    if (roomCodeInputRefs.value[nextIndex]) {
      roomCodeInputRefs.value[nextIndex].focus();
    }
  });
};

const handleRoomCodeSubmit = async () => {
  const code = roomCodeDigits.value.join('');
  if (code.length !== 6) {
    roomCodeError.value = '请输入完整的6位房间码';
    return;
  }
  
  showRoomCodeModal.value = false;
  pendingRoomCodeReconnect.value = false;
  
  // Reconnect with room code
  try {
    connection.value = await connect(props.url, true, code);
    
    // Save room code to cache only if connection succeeds
    try {
      const urlObj = new URL(props.url);
      const serverKey = `${urlObj.hostname}:${urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80')}`;
      const cacheKey = `zher_room_code_${serverKey}`;
      settings.cache[cacheKey] = code;
    } catch (e) {
      console.error('Failed to save room code:', e);
    }
  } catch (error) {
    roomCodeError.value = '连接失败，请检查房间码是否正确';
    showRoomCodeModal.value = true;
  }
};

const handleRoomCodeCancel = () => {
  showRoomCodeModal.value = false;
  pendingRoomCodeReconnect.value = false;
  roomCodeDigits.value = ['', '', '', '', '', ''];
  roomCodeError.value = '';
  emit('close');
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



const handleCopy = async (text, messageId) => {
  await copyText(text);
  copiedMessageId.value = messageId;
  setTimeout(() => {
    copiedMessageId.value = null;
  }, 2000);
};

const handleDownload = async (fileId, fileName) => {
  await startDownload(fileId, fileName, props.url);
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
  nextTick(() => {
    scrollToBottom();
  });
};

const getHostname = () => {
  try {
    const urlStr = props.url.startsWith('http')
      ? props.url
      : `https://${props.url}`;
    return new URL(urlStr).hostname;
  } catch (e) {
    return 'Invalid URL';
  }
};

const hostname = getHostname();

const loadSharedFilesAsFileObjects = async () => {
  const sharedFiles = getPendingFiles();
  if (sharedFiles.length === 0) return;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    
    const fileObjects = await Promise.all(
      sharedFiles.map(async (fileInfo) => {
        try {
          const fileData = await invoke('read_shared_file', { path: fileInfo.path });
          const blob = new Blob([new Uint8Array(fileData)], { type: fileInfo.type });
          return new File([blob], fileInfo.name, { type: fileInfo.type });
        } catch (error) {
          console.error(`Failed to read file ${fileInfo.name}:`, error);
          return null;
        }
      })
    );

    const validFiles = fileObjects.filter(f => f !== null);
    
    if (validFiles.length === 0) {
      clearPendingFiles();
      return;
    }

    if (validFiles.length === 1) {
      selectedFile.value = validFiles[0];
    } else {
      // Multiple files - will be zipped by handleFileChange
      const dataTransfer = new DataTransfer();
      validFiles.forEach(file => dataTransfer.items.add(file));
      const fakeEvent = { target: { files: dataTransfer.files, value: '' } };
      await handleFileChange(fakeEvent);
      clearPendingFiles();
      return; // handleFileChange will trigger send
    }

    clearPendingFiles();
    
    // Auto send after a short delay to ensure UI is ready
    nextTick(() => {
      setTimeout(() => {
        if (selectedFile.value) {
          handleSendMessage();
        }
      }, 500);
    });
  } catch (error) {
    console.error('Failed to load shared files:', error);
    clearPendingFiles();
  }
};

onMounted(async () => {
  await initDownloadManager();

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize);
    viewportHeight.value = window.visualViewport.height;
  } else {
    window.addEventListener('resize', handleViewportResize);
  }

  connection.value = getConnection(props.url);

  if (!connection.value || !connection.value.isConnected) {
    // Determine room code with correct priority:
    // 1. URL parameter (highest priority - user explicitly provided)
    // 2. Props (passed from parent component)
    // 3. Cache (lowest priority - previously used code)
    let roomCode = null;
    let serverKey = '';
    let cacheKey = '';
    
    try {
      const urlObj = new URL(props.url);
      serverKey = `${urlObj.hostname}:${urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80')}`;
      cacheKey = `zher_room_code_${serverKey}`;
      
      // Priority 1: URL parameter
      roomCode = urlObj.searchParams.get('code');
      
      // Priority 2: Props
      if (!roomCode && props.roomCode) {
        roomCode = props.roomCode;
      }
      
      // Priority 3: Cache
      if (!roomCode) {
        roomCode = settings.cache[cacheKey];
      }
    } catch (e) {
      // Invalid URL, ignore
    }
    
    try {
      connection.value = await connect(props.url, true, roomCode);
    } catch (error) {
      // If connection fails due to room code issue
      if (error && error.message && (error.message.includes('room code') || error.message.includes('Room code'))) {
        // Clear invalid cached room code
        if (cacheKey && settings.cache[cacheKey]) {
          delete settings.cache[cacheKey];
        }
        
        // Show room code input modal
        showRoomCodeModal.value = true;
        nextTick(() => {
          if (roomCodeInputRefs.value[0]) {
            roomCodeInputRefs.value[0].focus();
          }
        });
      }
    }
  }

  // 只在首次加载时从 connection 加载历史消息
  if (connection.value.messages && connection.value.messages.length > 0 && messages.value.length === 0) {
    connection.value.messages.forEach(msg => {
      addMessage(msg);
    });
  }

  registerCallback(props.url, 'onMessage', onMessageCallback);
  registerCallback(props.url, 'onWelcome', onWelcomeCallback);
  registerCallback(props.url, 'onStartUpload', onStartUploadCallback);

  scrollToBottom();
  
  // Handle shared files if any
  if (hasPendingFiles.value) {
    await loadSharedFilesAsFileObjects();
  }
});

onUnmounted(() => {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleViewportResize);
  } else {
    window.removeEventListener('resize', handleViewportResize);
  }

  unregisterCallback(props.url, 'onMessage', onMessageCallback);
  unregisterCallback(props.url, 'onWelcome', onWelcomeCallback);
  unregisterCallback(props.url, 'onStartUpload', onStartUploadCallback);

});
</script>