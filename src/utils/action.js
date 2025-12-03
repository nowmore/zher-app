import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { autoCopyText, autoDownload } from './settings';
import { startDownload } from './downloadManager';
const copyText = async (text) => {
    try {
        await writeText(text);
    } catch (err) {
        console.error(err);
    }
};


//TODO notify
const autoAction = async (msg, serverUrl) => {
    if (msg.text && autoCopyText.value) {
        await copyText(msg.text);
    }
    if (msg.type === 'file-meta' && autoDownload.value) {
        await startDownload(msg.fileId, msg.fileName, serverUrl);
    }
}

export {
    copyText,
    autoAction,
}