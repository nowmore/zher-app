import { reactive } from 'vue';
import { listen } from '@tauri-apps/api/event';

export const debugState = reactive({
    logs: [],
    isEnabled: false
});

const MAX_LOGS = 500;

const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
};

export const initDebugConsole = () => {
    const addLog = (type, args) => {
        const message = args.map(arg => {
            try {
                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
            } catch (e) {
                return '[Circular/Unserializable]';
            }
        }).join(' ');

        debugState.logs.unshift({
            id: Date.now() + Math.random(),
            time: new Date().toLocaleTimeString(),
            type,
            message
        });

        if (debugState.logs.length > MAX_LOGS) {
            debugState.logs.pop();
        }
    };

    console.log = (...args) => {
        originalConsole.log(...args);
        addLog('log', args);
    };

    console.warn = (...args) => {
        originalConsole.warn(...args);
        addLog('warn', args);
    };

    console.error = (...args) => {
        originalConsole.error(...args);
        addLog('error', args);
    };

    console.info = (...args) => {
        originalConsole.info(...args);
        addLog('info', args);
    };

    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'console-log') {
            const args = event.data.args || [];
            const message = '[Remote] ' + args.join(' ');

            debugState.logs.unshift({
                id: Date.now() + Math.random(),
                time: new Date().toLocaleTimeString(),
                type: event.data.level || 'log',
                message
            });

            if (debugState.logs.length > MAX_LOGS) {
                debugState.logs.pop();
            }
        }
    });

    // Listen for Tauri log events (Rust backend logs)
    try {
        listen('log://log', (event) => {
            const payload = event.payload;
            let type = 'rust';
            let message = payload.message || String(payload);

            // Determine log level from payload
            if (payload.level) {
                const level = payload.level.toLowerCase();
                if (level.includes('error')) type = 'error';
                else if (level.includes('warn')) type = 'warn';
                else if (level.includes('info')) type = 'info';
            }

            debugState.logs.unshift({
                id: Date.now() + Math.random(),
                time: new Date().toLocaleTimeString(),
                type,
                message: `[Rust] ${message}`
            });

            if (debugState.logs.length > MAX_LOGS) {
                debugState.logs.pop();
            }
        });

        // Listen for Android logcat (if available)
        listen('android://logcat', (event) => {
            const payload = event.payload;
            const message = payload.message || String(payload);

            debugState.logs.unshift({
                id: Date.now() + Math.random(),
                time: new Date().toLocaleTimeString(),
                type: 'android',
                message: `[Android] ${message}`
            });

            if (debugState.logs.length > MAX_LOGS) {
                debugState.logs.pop();
            }
        });
    } catch (e) {
        console.error('Failed to setup Tauri log listeners:', e);
    }
};

export const clearLogs = () => {
    debugState.logs = [];
};
