<template>
    <!-- Container background transparent to avoid black borders -->
    <div class="fixed inset-0 z-30 flex flex-col bg-transparent"
        style="padding-top: env(safe-area-inset-top, 0px); padding-bottom: 3.5rem;">

        <!-- Browser Content -->
        <div class="flex-1 relative w-full overflow-hidden">
            <iframe ref="iframeRef" :src="url" class="w-full h-full border-none block bg-gray-100 dark:bg-gray-900"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation-by-user-activation allow-downloads"
                allowfullscreen referrerpolicy="no-referrer" @load="handleIframeLoad"
                @error="handleIframeError"></iframe>

            <!-- Loading Spinner -->
            <div v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10 pointer-events-none">
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
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';

defineProps({
    url: {
        type: String,
        required: true
    }
});

defineEmits(['close']);

const isLoading = ref(true);
const iframeRef = ref(null);

const handleMessage = async (event) => {
    if (event.data && event.data.type === 'download_request') {
        const { url, fileName } = event.data;
        console.log('Received download request:', url, fileName);
        console.log('Calling Rust download_file:', url);

        try {
            await invoke('download_file', { url, filename: fileName });
            console.log('Download started successfully');
        } catch (err) {
            console.error('Download failed:', err);
        }
    } else if (event.data && event.data.type === 'console-log') {
        const { level, args } = event.data;
        console[level]('[iframe]', ...args);
    }
};

const injectTauriMock = () => {
    if (!iframeRef.value) return;

    try {
        const doc = iframeRef.value.contentDocument || iframeRef.value.contentWindow?.document;
        if (!doc) return;

        const existingScript = doc.getElementById('tauri-mock-script');
        if (existingScript) return;

        const script = doc.createElement('script');
        script.id = 'tauri-mock-script';
        script.textContent = `
            (function() {
                if (window.__TAURI_MOCK_INJECTED__) return;
                window.__TAURI_MOCK_INJECTED__ = true;
                
                window.__TAURI__ = window.__TAURI__ || {};
                window.__TAURI__.core = window.__TAURI__.core || {};
                window.__TAURI__.core.invoke = async (cmd, args) => {
                    console.log('[Tauri Mock] invoke:', cmd, args);
                    if (cmd === 'download_file') {
                        window.parent.postMessage({ 
                            type: 'download_request', 
                            url: args.url, 
                            fileName: args.fileName
                        }, '*');
                        return Promise.resolve();
                    }
                    return Promise.reject('Command not implemented: ' + cmd);
                };
                window.__TAURI__.invoke = window.__TAURI__.core.invoke;
                window.__TAURI_INTERNALS__ = { postMessage: () => {} };
                
                console.log('[Tauri Mock] Injected, __TAURI__.core.invoke available');
            })();
        `;

        if (doc.head) {
            doc.head.insertBefore(script, doc.head.firstChild);
        } else if (doc.documentElement) {
            doc.documentElement.appendChild(script);
        }

        console.log('[BrowserView] Tauri mock injected successfully');
    } catch (err) {
        console.warn('[BrowserView] Cannot inject script (CORS):', err);
    }
};

onMounted(() => {
    window.addEventListener('message', handleMessage);

    const checkAndInject = setInterval(() => {
        if (iframeRef.value) {
            injectTauriMock();
        }
    }, 100);

    setTimeout(() => clearInterval(checkAndInject), 5000);
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});

const handleIframeLoad = () => {
    isLoading.value = false;
    injectTauriMock();
    setTimeout(injectTauriMock, 100);
    setTimeout(injectTauriMock, 500);
};

const handleIframeError = () => {
    isLoading.value = false;
    console.error("Iframe failed to load content");
};
</script>
