import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initDownloadManager } from './utils/downloadManager'
import { initDebugConsole } from './utils/debugConsole'

initDebugConsole();
initDownloadManager();
createApp(App).mount('#app')