<template>
    <!-- Overlay Container -->
    <div class="fixed inset-0 z-50 flex flex-col pointer-events-none">

        <!-- Scanner UI (Transparency Mask) -->
        <!-- Top Dim Area -->
        <div class="w-full bg-black/60 flex-1 flex items-end justify-center pb-4">
            <p class="text-white text-sm font-medium mb-2">请将二维码对准框内</p>
        </div>

        <!-- Middle Row -->
        <div class="w-full h-72 flex">
            <!-- Left Dim -->
            <div class="flex-1 bg-black/60"></div>

            <!-- Scanning Window (Transparent) -->
            <div
                class="relative w-72 h-72 bg-transparent border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                <!-- Corner Markers -->
                <div class="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                <div class="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                <div class="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                <div class="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>

                <!-- Scan Line Animation -->
                <div class="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div class="w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
                </div>
            </div>

            <!-- Right Dim -->
            <div class="flex-1 bg-black/60"></div>
        </div>

        <!-- Bottom Dim Area -->
        <div class="w-full bg-black/60 flex-1 flex items-start justify-center pt-10 pointer-events-auto">
            <!-- Controls -->
            <button @click="handleCancel"
                class="px-8 py-3 rounded-full bg-gray-800/80 text-white border border-gray-500 hover:bg-gray-700 backdrop-blur-sm transition-all flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd" />
                </svg>
                取消扫描
            </button>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { scan, checkPermissions, requestPermissions } from '@tauri-apps/plugin-barcode-scanner';

const emit = defineEmits(['scan-success', 'close']);

onMounted(async () => {
    document.body.classList.add('barcode-scanner-active');
    setTimeout(() => {
        startScan();
    }, 100);
});

onUnmounted(() => {
    document.body.classList.remove('barcode-scanner-active');
});

const startScan = async () => {
    try {
        let permission = await checkPermissions();

        if (permission === 'prompt' || permission === 'prompt-with-rationale') {
            permission = await requestPermissions();
        }

        if (permission !== 'granted') {
            alert('需要相机权限才能扫描二维码');
            emit('close');
            return;
        }

        const result = await scan({ formats: [] });

        if (result.content) {
            emit('scan-success', result.content);
        } else {
            emit('close');
        }
    } catch (error) {
        emit('close');
    }
};

const handleCancel = () => {
    emit('close');
};
</script>

<style scoped>
.animate-scan {
    animation: scan-line 2s linear infinite;
}

@keyframes scan-line {
    0% {
        transform: translateY(0);
    }

    100% {
        transform: translateY(288px);
    }
}
</style>
