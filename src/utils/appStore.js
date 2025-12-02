import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

let cache = {};
const FILENAME = 'app-settings.json';

export const saveSetting = async (key, value) => {
    try {
        cache[key] = value;
        await persist();
    } catch (error) {}
};

export const getSetting = async (key, defaultValue = null) => {
    return cache[key] !== undefined ? cache[key] : defaultValue;
};

const persist = async () => {
    try {
        const content = JSON.stringify(cache);
        await writeTextFile(FILENAME, content, { baseDir: BaseDirectory.AppConfig });
    } catch (e) {}
};

export const initStore = async () => {
    try {
        const content = await readTextFile(FILENAME, { baseDir: BaseDirectory.AppConfig });
        cache = JSON.parse(content);
    } catch (e) {}
};
