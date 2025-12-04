import { ref } from 'vue';

const pendingFiles = ref([]);
const hasPendingFiles = ref(false);

export function useSharedFiles() {
  const setPendingFiles = (files) => {
    pendingFiles.value = files;
    hasPendingFiles.value = files.length > 0;
  };

  const clearPendingFiles = () => {
    pendingFiles.value = [];
    hasPendingFiles.value = false;
  };

  const getPendingFiles = () => {
    return pendingFiles.value;
  };

  return {
    pendingFiles,
    hasPendingFiles,
    setPendingFiles,
    clearPendingFiles,
    getPendingFiles
  };
}

// Global handlers for Android
if (typeof window !== 'undefined') {
  window.handleSharedFile = (path, name, size, type) => {
    console.log('Received shared file:', { path, name, size, type });
    const { setPendingFiles } = useSharedFiles();
    setPendingFiles([{ path, name, size, type }]);
  };

  window.handleSharedFiles = (files) => {
    console.log('Received shared files:', files);
    const { setPendingFiles } = useSharedFiles();
    setPendingFiles(files);
  };
}
