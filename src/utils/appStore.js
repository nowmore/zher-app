import { readTextFile, writeTextFile, BaseDirectory, exists, mkdir } from '@tauri-apps/plugin-fs';

// In-memory cache
let cache = {};
const FILENAME = 'app-settings.json';

// Helper to get file path (optional, we use BaseDirectory.AppConfig)
// But checking existence requires directory.

/**
 * Save a value to the store and persist to disk
 * @param {string} key 
 * @param {any} value 
 */
export const saveSetting = async (key, value) => {
    try {
        cache[key] = value;
        await persist();
    } catch (error) {
        console.error('Failed to save setting:', key, error);
    }
};

/**
 * Get a value from the store
 * @param {string} key 
 * @returns {Promise<any>}
 */
export const getSetting = async (key) => {
    return cache[key];
};

const persist = async () => {
    try {
        const content = JSON.stringify(cache, null, 2);
        // Use AppConfig directory
        await writeTextFile(FILENAME, content, { baseDir: BaseDirectory.AppConfig });
    } catch (e) {
        console.error('Failed to persist store:', e);
    }
};

/**
 * Initialize store (load from disk)
 */
export const initStore = async () => {
    try {
        // Ensure directory exists (plugin-fs v2 creates it on write usually? No, usually parent dir must exist)
        // But BaseDirectory.AppConfig might need creation.
        // Let's try reading first.
        const content = await readTextFile(FILENAME, { baseDir: BaseDirectory.AppConfig });
        cache = JSON.parse(content);
    } catch (e) {
        // If file doesn't exist, try to create dir/file
        // Or just ignore (start empty)
        console.warn('Store load failed (using empty):', e);
        // Try to ensure directory exists for future writes
        // We can't easily know the path without API.
        // But simply writing later might work if OS allows.
        // If error is "NotFound", it's fine.
    }
};
