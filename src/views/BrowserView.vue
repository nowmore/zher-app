<script>
export default {
  name: 'BrowserView'
};
</script>

<template>
  <BrowserViewComponent :url="url" :room-code="roomCode" @close="handleClose"
    @navigate-to-downloads="handleNavigateToDownloads" />
</template>

<script setup>
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';
import BrowserViewComponent from '../components/BrowserView.vue';

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

const router = useRouter();

const handleClose = () => {
  router.back();
};

const handleNavigateToDownloads = () => {
  router.push({ name: 'DownloadView' });
};
</script>
