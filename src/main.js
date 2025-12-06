import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { createPageStackRouter } from 'vue-page-stack-router'
import { initDownloadManager } from './utils/downloadManager'
import { initDebugConsole } from './utils/debugConsole'
import './composables/useSharedFiles'

initDebugConsole();
initDownloadManager();

const app = createApp(App);

// 创建页面栈路由
const pageStackRouter = createPageStackRouter({ 
  router,
  max: 10
});

app.use(router);
app.use(pageStackRouter);
app.mount('#app');