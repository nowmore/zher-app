import { ref, nextTick } from 'vue';
import { settings } from '../utils/settings';

const PAGE_SIZE = 20;

export function useChat() {
    const messages = ref([]);
    const allMessages = ref([]);

    const filterValidMessages = (msgs) => {
        if (!Array.isArray(msgs)) return [];
        const now = Date.now();
        const tenMinutesAgo = now - 10 * 60 * 1000;
        return msgs.filter(m => m.id > tenMinutesAgo);
    };

    const saveChatHistory = () => {
        allMessages.value = filterValidMessages(allMessages.value);
        settings.cache.zher_chat_history = [...allMessages.value];
    };

    const loadChatHistory = () => {
        const stored = settings.cache.zher_chat_history;

        if (Array.isArray(stored) && stored.length > 0) {
            const validMsgs = filterValidMessages(stored);
            allMessages.value = validMsgs;
            messages.value = allMessages.value.slice(-PAGE_SIZE);
        }
    };

    const loadMoreMessages = (container) => {
        if (messages.value.length >= allMessages.value.length) return;

        const currentCount = messages.value.length;
        const totalCount = allMessages.value.length;
        const remaining = totalCount - currentCount;
        const toLoad = Math.min(remaining, PAGE_SIZE);

        const startIndex = totalCount - currentCount - toLoad;
        const endIndex = startIndex + toLoad;

        const newBatch = allMessages.value.slice(startIndex, endIndex);

        if (container) {
            const oldHeight = container.scrollHeight;
            const oldScrollTop = container.scrollTop;

            messages.value = [...newBatch, ...messages.value];

            nextTick(() => {
                const newHeight = container.scrollHeight;
                container.scrollTop = newHeight - oldHeight + oldScrollTop;
            });
        } else {
            messages.value = [...newBatch, ...messages.value];
        }
    };

    const addMessage = (msg) => {
        const exists = allMessages.value.some(m => m.id === msg.id);
        if (!exists) {
            allMessages.value.push(msg);
            messages.value.push(msg);
            saveChatHistory();
        }
    };

    return {
        messages,
        allMessages,
        saveChatHistory,
        loadChatHistory,
        loadMoreMessages,
        addMessage
    };
}
