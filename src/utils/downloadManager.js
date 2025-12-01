import { reactive } from 'vue';
import { create, BaseDirectory } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { saveSetting, getSetting } from './appStore';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

export const downloadState = reactive({
    tasks: []
});

const saveTasks = async () => {
    await saveSetting('download_history', JSON.parse(JSON.stringify(downloadState.tasks)));
};

export const initDownloadManager = async () => {
    // Load history
    try {
        const savedTasks = await getSetting('download_history');
        if (savedTasks && Array.isArray(savedTasks)) {
            downloadState.tasks = savedTasks.map(t => {
                if (t.status === 'downloading' || t.status === 'pending') {
                    return { ...t, status: 'interrupted' };
                }
                return t;
            });
        }
    } catch (e) {
        console.warn('Failed to load download history', e);
    }

    // Setup Rust Event Listeners
    listen('download-started', (event) => {
        const { id, name, size } = event.payload;
        const task = {
            id,
            name,
            url: '', // URL not sent back in event, maybe not needed for display
            size,
            received: 0,
            status: 'downloading',
            progress: 0
        };
        downloadState.tasks.unshift(task);
        saveTasks();
    });

    listen('download-progress', (event) => {
        const { id, received, total } = event.payload;
        const task = downloadState.tasks.find(t => t.id === id);
        if (task) {
            task.received = received;
            if (total > 0) {
                task.size = total;
                task.progress = Math.min(100, Math.round((received / total) * 100));
            }
        }
    });

    listen('download-completed', (event) => {
        const { id } = event.payload;
        const task = downloadState.tasks.find(t => t.id === id);
        if (task) {
            task.status = 'completed';
            task.progress = 100;
            saveTasks();
        }
    });

    // Listen for requests from Iframe (Mock API)
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'download_request') {
            const { url, fileName, cookies } = event.data;
            console.log('Calling Rust download_file:', url);
            invoke('download_file', { url, filename: fileName }) // Map fileName to filename
                .catch(err => console.error('Rust download failed:', err));
        }
    });

    // Legacy Handler (Fallback for <a> tags intercepted by Kotlin)
    // We can route this to Rust too for consistency
    window.handleDownloadRequest = async (url, disposition, mime, length, cookies) => {
        console.log('Legacy Download requested:', url);
        // Determine Filename
        let filename = 'download';
        try {
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) filename = match[1];
            } else {
                const urlPath = new URL(url).pathname;
                const name = urlPath.split('/').pop();
                if (name) filename = name;
            }
            filename = decodeURIComponent(filename);
        } catch (e) { }

        filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Use Rust command
        invoke('download_file', { url, filename })
            .catch(err => console.error('Rust download failed:', err));
    };
};
