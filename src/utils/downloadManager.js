import { ref } from 'vue';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

export const activeDownloads = ref(new Map());

const taskIdToFileId = new Map();

export async function initDownloadManager() {
    await listen('download-started', (event) => {
        const { id, name, size } = event.payload;
        const taskIdStr = String(id);
        const fileId = taskIdToFileId.get(taskIdStr);
        
        if (fileId) {
            const newMap = new Map(activeDownloads.value);
            newMap.set(fileId, {
                taskId: taskIdStr,
                name,
                size,
                received: 0,
                progress: 0,
                status: 'downloading'
            });
            activeDownloads.value = newMap;
        }
    });

    await listen('download-progress', (event) => {
        const { id, received, total } = event.payload;
        const taskIdStr = String(id);
        const fileId = taskIdToFileId.get(taskIdStr);
        
        if (fileId) {
            const download = activeDownloads.value.get(fileId);
            if (download) {
                const newMap = new Map(activeDownloads.value);
                newMap.set(fileId, {
                    ...download,
                    received,
                    progress: total > 0 ? Math.round((received / total) * 100) : 0
                });
                activeDownloads.value = newMap;
            }
        }
    });

    await listen('download-completed', (event) => {
        const { id } = event.payload;
        const taskIdStr = String(id);
        const fileId = taskIdToFileId.get(taskIdStr);
        
        if (fileId) {
            const download = activeDownloads.value.get(fileId);
            if (download) {
                const newMap = new Map(activeDownloads.value);
                newMap.set(fileId, {
                    ...download,
                    status: 'completed',
                    progress: 100
                });
                activeDownloads.value = newMap;

                setTimeout(() => {
                    const finalMap = new Map(activeDownloads.value);
                    finalMap.delete(fileId);
                    activeDownloads.value = finalMap;
                    taskIdToFileId.delete(taskIdStr);
                }, 3000);
            }
        }
    });

    await listen('download-paused', (event) => {
        const { id } = event.payload;
        const taskIdStr = String(id);
        const fileId = taskIdToFileId.get(taskIdStr);
        
        if (fileId) {
            const download = activeDownloads.value.get(fileId);
            if (download) {
                const newMap = new Map(activeDownloads.value);
                newMap.set(fileId, {
                    ...download,
                    status: 'paused'
                });
                activeDownloads.value = newMap;
            }
        }
    });

    await listen('download-resumed', (event) => {
        const { id } = event.payload;
        const taskIdStr = String(id);
        const fileId = taskIdToFileId.get(taskIdStr);
        
        if (fileId) {
            const download = activeDownloads.value.get(fileId);
            if (download) {
                const newMap = new Map(activeDownloads.value);
                newMap.set(fileId, {
                    ...download,
                    status: 'downloading'
                });
                activeDownloads.value = newMap;
            }
        }
    });

    await listen('download-failed', (event) => {
        const { id, error } = event.payload;
        const taskIdStr = String(id);
        const fileId = taskIdToFileId.get(taskIdStr);
        
        if (fileId) {
            const download = activeDownloads.value.get(fileId);
            if (download) {
                const newMap = new Map(activeDownloads.value);
                newMap.set(fileId, {
                    ...download,
                    status: 'failed',
                    error
                });
                activeDownloads.value = newMap;

                setTimeout(() => {
                    const finalMap = new Map(activeDownloads.value);
                    finalMap.delete(fileId);
                    activeDownloads.value = finalMap;
                    taskIdToFileId.delete(taskIdStr);
                }, 5000);
            }
        }
    });
}

export async function startDownload (fileId, fileName, serverUrl) {
    try {
        const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
        const url = `${baseUrl}/api/download/${fileId}`;
        const taskId = await invoke('download_file', { url, filename: fileName });
        
        if (taskId && fileId) {
            const taskIdStr = String(taskId);
            taskIdToFileId.set(taskIdStr, fileId);
        }
        
        return taskId ? String(taskId) : null;
    } catch (err) {
        console.error('Download failed:', err);
        return null;
    }
};

export async function pauseDownload(fileId) {
    try {
        const download = activeDownloads.value.get(fileId);
        if (download && download.taskId) {
            const taskId = typeof download.taskId === 'string' ? parseInt(download.taskId) : download.taskId;
            await invoke('pause_download', { taskId });
        }
    } catch (err) {
        console.error('Pause download failed:', err);
    }
}

export async function resumeDownload(fileId) {
    try {
        const download = activeDownloads.value.get(fileId);
        if (download && download.taskId) {
            const taskId = typeof download.taskId === 'string' ? parseInt(download.taskId) : download.taskId;
            await invoke('resume_download', { taskId });
        }
    } catch (err) {
        console.error('Resume download failed:', err);
    }
}

export async function cancelDownload(fileId) {
    try {
        const download = activeDownloads.value.get(fileId);
        if (download && download.taskId) {
            const taskId = typeof download.taskId === 'string' ? parseInt(download.taskId) : download.taskId;
            await invoke('cancel_download', { taskId });
            
            const newMap = new Map(activeDownloads.value);
            newMap.delete(fileId);
            activeDownloads.value = newMap;
            taskIdToFileId.delete(download.taskId);
        }
    } catch (err) {
        console.error('Cancel download failed:', err);
    }
}


