import { ref } from 'vue';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

export const activeDownloads = ref(new Map());

export async function initDownloadManager() {
    await listen('download-started', (event) => {
        const { id, name, size } = event.payload;
        activeDownloads.value.set(id, {
            id,
            name,
            size,
            received: 0,
            progress: 0,
            status: 'downloading'
        });
    });

    await listen('download-progress', (event) => {
        const { id, received, total } = event.payload;
        const download = activeDownloads.value.get(id);
        if (download) {
            download.received = received;
            download.progress = total > 0 ? Math.round((received / total) * 100) : 0;
        }
    });

    await listen('download-completed', (event) => {
        const { id } = event.payload;
        const download = activeDownloads.value.get(id);
        if (download) {
            download.status = 'completed';
            download.progress = 100;
            
            setTimeout(() => {
                activeDownloads.value.delete(id);
            }, 3000);
        }
    });

    await listen('download-paused', (event) => {
        const { id } = event.payload;
        const download = activeDownloads.value.get(id);
        if (download) {
            download.status = 'paused';
        }
    });

    await listen('download-resumed', (event) => {
        const { id } = event.payload;
        const download = activeDownloads.value.get(id);
        if (download) {
            download.status = 'downloading';
        }
    });

    await listen('download-failed', (event) => {
        const { id, error } = event.payload;
        const download = activeDownloads.value.get(id);
        if (download) {
            download.status = 'failed';
            download.error = error;
            
            setTimeout(() => {
                activeDownloads.value.delete(id);
            }, 5000);
        }
    });
}

export async function pauseDownload(id) {
    try {
        await invoke('pause_download', { taskId: id });
    } catch (err) {
        console.error('Failed to pause download:', err);
    }
}

export async function resumeDownload(id) {
    try {
        await invoke('resume_download', { taskId: id });
    } catch (err) {
        console.error('Failed to resume download:', err);
    }
}

export async function cancelDownload(id) {
    try {
        await invoke('cancel_download', { taskId: id });
        activeDownloads.value.delete(id);
    } catch (err) {
        console.error('Failed to cancel download:', err);
    }
}

export function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
