<template>
</template>

<script setup>
import { onMounted } from 'vue';
import { initTheme } from '../utils/theme';

onMounted(async () => {
  await initTheme();
});
</script>
