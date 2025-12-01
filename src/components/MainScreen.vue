<template>
  <div class="flex-col min-h-full flex">
    <!-- Browser Interface Overlay -->
    <BrowserView v-show="activePage === 'zher' && currentBrowserUrl" :url="currentBrowserUrl" @close="closeBrowser" />

    <!-- Scanner Interface Overlay -->
    <ScannerView v-if="isScannerOpen" @scan-success="handleScanSuccess" @close="closeScanner" />

    <!-- Standard Dashboard Interface -->
    <main class="flex-1 flex flex-col px-4 py-6 pb-24 overflow-y-auto">
      <!-- Zher Chat / Connect Interface -->
      <div v-if="activePage === 'zher'" class="flex-1 flex flex-col">
        <section class="mt-8 mb-12">
          <AddressInput :initial-address="serverAddress" @connect="handleConnect" @scan="handleScan"
            @open-browser="handleOpenBrowser" />
        </section>

        <!-- Instructions/Empty State -->
        <div class="mt-auto mb-8 text-center px-6 opacity-60">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Enter a server address or scan a QR code to connect.
          </p>
        </div>
      </div>

      <!-- Download Interface -->
      <DownloadScreen v-else-if="activePage === 'download'" />

      <!-- Service Interface -->
      <ServiceScreen v-else-if="activePage === 'service'" />

      <!-- Settings Interface -->
      <SettingsScreen v-else-if="activePage === 'settings'" />
    </main>

    <!-- Bottom Navigation -->
    <BottomNav v-model="activePage" />

    <!-- Global Loading Overlay -->
    <div v-if="isLoading"
      class="fixed inset-0 bg-black/20 dark:bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow-2xl border border-gray-100 dark:border-gray-700">
        <svg class="animate-spin mb-3 h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">正在连接...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import AddressInput from './AddressInput.vue';
import BottomNav from './BottomNav.vue';
import BrowserView from './BrowserView.vue';
import ScannerView from './ScannerView.vue';
import DownloadScreen from './DownloadScreen.vue';
import SettingsScreen from './SettingsScreen.vue';
import ServiceScreen from './ServiceScreen.vue';
import { scanQRCode, connectToServer } from '../utils/server';

// State
const activePage = ref('zher');
const serverAddress = ref('');
const isLoading = ref(false);
const currentBrowserUrl = ref('');
const isScannerOpen = ref(false);

// Methods

/**
 * Opens the browser overlay with the specified URL
 * @param {string} url - Valid URL to open
 */
const handleOpenBrowser = (url) => {
  if (!url) return;
  try {
    // Basic URL validation/formatting
    const urlObj = new URL(url.includes('://') ? url : `http://${url}`);
    currentBrowserUrl.value = urlObj.href;
  } catch (e) {
    console.error("Invalid URL:", url);
  }
};

/**
 * Closes the browser overlay and resets state
 */
const closeBrowser = () => {
  currentBrowserUrl.value = '';
};

// Handle Android Back Button
onMounted(async () => {
  window.addEventListener('android-back', handleAndroidBack);
});

onUnmounted(() => {
  window.removeEventListener('android-back', handleAndroidBack);
});

const handleAndroidBack = async () => {
  if (isScannerOpen.value) {
    closeScanner();
    return;
  }

  if (activePage.value === 'zher' && currentBrowserUrl.value) {
    closeBrowser();
    return;
  }

  // Default: Exit App
  try {
    // Dynamic import to avoid build issues on non-tauri envs if any
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  } catch (e) {
    console.error('Failed to close app', e);
  }
};

/**
 * Handles QR Code scanning
 */
const handleScan = () => {
  isScannerOpen.value = true;
};

/**
 * Handles successful scan
 */
const handleScanSuccess = (content) => {
  isScannerOpen.value = false;
  if (content) {
    console.log('Scan Success:', content);
    serverAddress.value = content;
    // Auto open browser if it's a URL (AddressInput will handle validation/open via watcher? No.)
    // AddressInput watches initialAddress and triggers validateUrl().
    // validateUrl checks validity and emits open-browser (which calls MainScreen.handleOpenBrowser)
    // Wait, validateUrl DOES emit open-browser if valid.
    // So updating serverAddress here -> AddressInput watcher -> validateUrl -> emit open-browser -> handleOpenBrowser.
    // This flow is correct.
  }
};

const closeScanner = () => {
  isScannerOpen.value = false;
};

/**
 * Handles Server Connection
 * @param {string} address - Server address
 */
const handleConnect = async (address) => {
  if (!address || !address.trim()) return;

  isLoading.value = true;
  try {
    await connectToServer(address.trim());
    console.log('Connected to:', address);
    // Optionally open browser immediately if connection implies it
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Custom Scrollbar for Dashboard */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.dark .custom-scrollbar {
  scrollbar-color: rgba(75, 85, 99, 0.5) transparent;
}
</style>
