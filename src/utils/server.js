
const connectToServer = async (address) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: '连接成功' });
    }, 1500);
  });
};

const connectToHistoryServer = async (server) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: '连接成功' });
    }, 1500);
  });
};

const scanQRCode = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: '扫码成功' });
    }, 1500);
  });
};

const searchServers = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, servers: mockHistoryServers });
    }, 1500);
  });
};

const countOnlineServers = (servers) => {
  return servers.filter(s => s.status === 'online').length;
};

export {
  connectToServer,
  connectToHistoryServer,
  scanQRCode,
  searchServers,
  countOnlineServers
};
