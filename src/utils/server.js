/**
 * 服务器管理工具
 * 负责服务器连接、历史记录等功能
 */

// 模拟历史服务器数据
const mockHistoryServers = [
  { id: 1, name: '4836服务器', address: '192.168.1.100:8080', lastConnected: '2024-11-30 10:30', status: 'online' },
  { id: 2, name: '开发测试服务器', address: '10.0.0.5:8000', lastConnected: '2024-11-29 15:45', status: 'offline' },
  { id: 3, name: '家庭服务器', address: '192.168.0.10:8080', lastConnected: '2024-11-28 09:20', status: 'online' }
];

// 获取历史服务器列表
const getHistoryServers = () => {
  // 实际应用中应该从localStorage或API获取
  return mockHistoryServers;
};

// 连接服务器
const connectToServer = async (address) => {
  return new Promise((resolve) => {
    console.log('连接服务器:', address);
    // 模拟连接延迟
    setTimeout(() => {
      resolve({ success: true, message: '连接成功' });
    }, 1500);
  });
};

// 连接历史服务器
const connectToHistoryServer = async (server) => {
  return new Promise((resolve) => {
    console.log('连接历史服务器:', server);
    // 模拟连接延迟
    setTimeout(() => {
      resolve({ success: true, message: '连接成功' });
    }, 1500);
  });
};

// 扫描二维码
const scanQRCode = async () => {
  return new Promise((resolve) => {
    console.log('扫码加入');
    // 模拟扫码延迟
    setTimeout(() => {
      resolve({ success: true, message: '扫码成功' });
    }, 1500);
  });
};

// 查找服务器
const searchServers = async () => {
  return new Promise((resolve) => {
    console.log('查找服务器');
    // 模拟查找延迟
    setTimeout(() => {
      resolve({ success: true, servers: mockHistoryServers });
    }, 1500);
  });
};

// 计算在线服务器数量
const countOnlineServers = (servers) => {
  return servers.filter(s => s.status === 'online').length;
};

export {
  getHistoryServers,
  connectToServer,
  connectToHistoryServer,
  scanQRCode,
  searchServers,
  countOnlineServers
};
