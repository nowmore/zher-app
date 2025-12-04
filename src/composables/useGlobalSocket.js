import { reactive } from 'vue';
import { io } from 'socket.io-client';
import { settings } from '../utils/settings';
import { autoAction } from '../utils/action';

class ServerConnection {
  constructor(serverKey) {
    this.serverKey = serverKey;
    this.socket = null;
    this.users = [];
    this.currentUser = {};
    this.serverUrl = '';
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000;
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.messages = [];
    this.lastError = null;
    this.callbacks = {
      onMessage: [],
      onWelcome: [],
      onStartUpload: []
    };
  }

  addMessage(msg) {
    this.messages.push(msg);
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    this.messages = this.messages.filter(m => m.id > tenMinutesAgo);
    this.saveMessages();
  }

  async saveMessages() {
    const key = `zher_messages_${this.serverKey}`;
    settings.cache[key] = this.messages;
  }

  async loadMessages() {
    const key = `zher_messages_${this.serverKey}`;

    const stored = settings.cache[key] || [];
    if (stored.length > 0) {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      this.messages = stored.filter(m => m.id > tenMinutesAgo);

      if (this.messages.length !== stored.length) {
        settings.cache[key] = this.messages;
      }
    }
  }

  startPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping');
      }
    }, 30000);
  }

  stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  scheduleReconnect(url) {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      connectToServer(url);
    }, delay);
  }

  clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  disconnect() {
    this.clearReconnect();
    this.stopPing();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
  }
}

const connections = reactive({});

const getServerKey = (url) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}:${urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80')}`;
  } catch (e) {
    return url;
  }
};

const getSessionId = () => {
  let id = settings.cache.zher_uid
  if (!id || id === '') {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    settings.cache.zher_uid = id;
  }
  return id;
};

const setupSocketListeners = (conn, url) => {
  if (!conn.socket) return;

  conn.socket.on('connect', () => {
    conn.isConnected = true;
    conn.isConnecting = false;
    conn.reconnectAttempts = 0;
    conn.startPing();
  });

  conn.socket.on('disconnect', (reason) => {
    conn.isConnected = false;
    conn.stopPing();

    // If disconnected immediately after connection attempt, it might be a room code issue
    if (reason === 'io server disconnect' && conn.reconnectAttempts === 0) {
      // Server forcefully disconnected us, likely due to room code validation failure
      conn.lastError = new Error('Room code validation failed');
    } else if (conn.reconnectAttempts < conn.maxReconnectAttempts) {
      conn.scheduleReconnect(url);
    }
  });

  conn.socket.on('welcome', (data) => {
    conn.currentUser = data.user;
    conn.users = data.allUsers;
    if (data.serverUrl) conn.serverUrl = data.serverUrl;

    conn.callbacks.onWelcome.forEach(cb => cb(data));
  });

  conn.socket.on('user-joined', (user) => {
    if (!conn.users.some(u => u.id === user.id)) {
      conn.users.push(user);
    }
  });

  conn.socket.on('user-left', (id) => {
    conn.users = conn.users.filter(u => u.id !== id);
  });

  conn.socket.on('update-user-list', (allUsers) => {
    let list = allUsers;
    if (Array.isArray(allUsers) && Array.isArray(allUsers[0]) && allUsers.length === 1) {
      list = allUsers[0];
    }

    if (Array.isArray(list)) {
      conn.users = list;
      const me = list.find(u => u.id === conn.currentUser.id);
      if (me) conn.currentUser = me;
    }
  });

  conn.socket.on('message', async (msg) => {
    conn.addMessage(msg);
    if (msg.senderId !== conn.currentUser.id) {
      await autoAction(msg, conn.serverUrl);
    }
    conn.callbacks.onMessage.forEach(cb => cb(msg));
  });

  conn.socket.on('start-upload', (data) => {
    conn.callbacks.onStartUpload.forEach(cb => cb(data));
  });

  conn.socket.on('name-change-success', (newName) => {
    conn.currentUser.name = newName;
  });

  conn.socket.on('name-change-fail', (msg) => {
    alert(msg);
  });

  conn.socket.on('pong', () => {
  });

  conn.socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
    conn.isConnecting = false;
    conn.lastError = error;
  });
};

const connectToServer = async (url, forceReconnect = false, roomCode = null) => {
  const serverKey = getServerKey(url);

  if (connections[serverKey]) {
    const conn = connections[serverKey];
    if (conn.isConnected && !forceReconnect) {
      return conn;
    }
    if (forceReconnect && (conn.isConnected || conn.socket)) {
      conn.disconnect();
    }
    if (conn.isConnecting && !forceReconnect) {
      return conn;
    }
  } else {
    connections[serverKey] = new ServerConnection(serverKey);
  }

  const conn = connections[serverKey];

  if (forceReconnect) {
    conn.reconnectAttempts = 0;
  }

  if (conn.isConnecting) return conn;

  conn.isConnecting = true;

  await conn.loadMessages();

  try {
    const sessionId = await getSessionId();

    const auth = { sessionId };

    // Add room code if provided
    if (roomCode) {
      auth.roomCode = roomCode;
    }

    conn.socket = io(url, {
      auth,
      transports: ['websocket'],
      reconnection: false
    });

    setupSocketListeners(conn, url);

    // Wait a bit to see if connection succeeds or fails
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (conn.lastError) {
          reject(conn.lastError);
        } else if (conn.isConnected) {
          resolve();
        } else {
          resolve(); // Continue anyway
        }
      }, 1000);

      if (conn.socket) {
        conn.socket.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
        conn.socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      }
    });
  } catch (error) {
    conn.isConnecting = false;
    if (error && error.message && (error.message.includes('room code') || error.message.includes('Room code'))) {
      throw error; // Throw room code errors for caller to handle
    }
    conn.scheduleReconnect(url);
  }

  return conn;
};

const disconnectFromServer = (url) => {
  const serverKey = getServerKey(url);
  const conn = connections[serverKey];

  if (conn) {
    conn.disconnect();
    delete connections[serverKey];
  }
};

const getConnection = (url) => {
  const serverKey = getServerKey(url);
  return connections[serverKey];
};

const emit = (url, event, data) => {
  const conn = getConnection(url);
  if (conn && conn.socket && conn.isConnected) {
    conn.socket.emit(event, data);
  }
};

const requestNameChange = (url, newName) => {
  emit(url, 'request-name-change', newName);
};

const registerCallback = (url, type, callback) => {
  const conn = getConnection(url);
  if (conn && conn.callbacks[type]) {
    conn.callbacks[type].push(callback);
  }
};

const unregisterCallback = (url, type, callback) => {
  const conn = getConnection(url);
  if (conn && conn.callbacks[type]) {
    const index = conn.callbacks[type].indexOf(callback);
    if (index > -1) {
      conn.callbacks[type].splice(index, 1);
    }
  }
};

export function useGlobalSocket() {
  return {
    connect: connectToServer,
    disconnect: disconnectFromServer,
    getConnection,
    emit,
    requestNameChange,
    registerCallback,
    unregisterCallback,

    connections
  };
}
