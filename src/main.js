import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initDownloadManager } from './utils/downloadManager'
import { initStore } from './utils/appStore'
import { initDebugConsole } from './utils/debugConsole'

// Initialize store and managers
initStore().then(() => {
    initDebugConsole();
    initDownloadManager();
    createApp(App).mount('#app')
});
