
import { reactive, watch, toRefs } from 'vue';
import { readTextFile, writeTextFile, BaseDirectory, exists } from '@tauri-apps/plugin-fs';

const FILENAME = 'app-settings.json';

class SettingsManager {
    constructor(defaults = {}) {
        this.cache = reactive({ ...defaults });
        this.isReady = false;
        this.init();
    }

    async init() {
        await this.load();
        this.isReady = true;

        watch(
            () => this.cache,
            () => this.persist(),
            { deep: true }
        );
    }

    async load() {
        try {
            const fileExists = await exists(FILENAME, { baseDir: BaseDirectory.AppConfig });

            if (fileExists) {
                const content = await readTextFile(FILENAME, { baseDir: BaseDirectory.AppConfig });
                const saved = JSON.parse(content);
                Object.assign(this.cache, { ...this.cache, ...saved });
            } else {
                console.log('配置文件不存在，使用默认配置');
            }
        } catch (e) {
            console.error('加载配置失败:', e);
        }
    }

    async persist() {
        if (!this.isReady) return;
        try {
            await writeTextFile(
                FILENAME,
                JSON.stringify(this.cache, null, 2),
                { baseDir: BaseDirectory.AppConfig }
            );
        } catch (e) {
            console.error('保存配置失败:', e);
        }
    }
}

const manager = new SettingsManager({
    zher_uid: '',
    zher_auto_copy: false,
    zher_auto_download: false,
    zher_dark_mode: false,
    zher_chat_history: []
});


const stateRefs = toRefs(manager.cache);

export const settings = manager;

export const autoCopyText = stateRefs.zher_auto_copy;
export const autoDownload = stateRefs.zher_auto_download;
export const darkMode = stateRefs.zher_dark_mode;
export const uid = stateRefs.zher_uid;