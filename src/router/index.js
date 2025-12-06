import { createRouter, createWebHashHistory } from 'vue-router';
import ZherView from '../views/ZherView.vue';
import DownloadView from '../views/DownloadView.vue';
import SettingsView from '../views/SettingsView.vue';
import BrowserView from '../views/BrowserView.vue';

const routes = [
  {
    path: '/',
    redirect: '/zher'
  },
  {
    path: '/zher',
    name: 'ZherView',
    component: ZherView,
    meta: {
      title: '服务',
      keepAlive: true
    }
  },
  {
    path: '/download',
    name: 'DownloadView',
    component: DownloadView,
    meta: {
      title: '下载',
      keepAlive: true
    }
  },
  {
    path: '/settings',
    name: 'SettingsView',
    component: SettingsView,
    meta: {
      title: '设置',
      keepAlive: true
    }
  },
  {
    path: '/browser',
    name: 'BrowserView',
    component: BrowserView,
    props: route => ({ url: route.query.url, roomCode: route.query.code }),
    meta: {
      title: '浏览器',
      keepAlive: true
    }
  }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
