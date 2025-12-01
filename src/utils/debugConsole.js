import { reactive } from 'vue';

export const debugState = reactive({
    logs: [],
    isEnabled: false
});

const MAX_LOGS = 100;

const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
};

export const initDebugConsole = () => {
    const addLog = (type, args) => {
        if (!debugState.isEnabled) return;

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

    // Listen for remote logs from iframe
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
};

export const clearLogs = () => {
    debugState.logs = [];
};
