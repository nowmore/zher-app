export const FILE_CATEGORIES = {
  DOCUMENT: {
    name: '文档',
    icon: 'document',
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx', '.csv']
  },
  ARCHIVE: {
    name: '存档',
    icon: 'archive',
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.zst', '.iso']
  },
  APPLICATION: {
    name: '应用程序',
    icon: 'application',
    extensions: ['.apk', '.exe', '.dmg', '.deb', '.rpm', '.msi', '.app']
  },
  IMAGE: {
    name: '图片',
    icon: 'image',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.heic']
  },
  VIDEO: {
    name: '视频',
    icon: 'video',
    extensions: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg']
  },
  AUDIO: {
    name: '音频',
    icon: 'audio',
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.opus']
  },
  CODE: {
    name: '代码',
    icon: 'code',
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html', '.json', '.xml', '.yaml', '.yml', '.sh', '.rs']
  }
};

export function getCategoryByExtension(filename) {
  const ext = ('.' + filename.split('.').pop()).toLowerCase();
  
  for (const [key, category] of Object.entries(FILE_CATEGORIES)) {
    if (category.extensions.includes(ext)) {
      return key;
    }
  }
  
  return 'OTHER';
}

export function getAvailableCategories(downloads) {
  const categories = new Set(['ALL']);
  
  downloads.forEach(download => {
    const category = getCategoryByExtension(download.filename);
    if (category !== 'OTHER') {
      categories.add(category);
    }
  });
  
  return Array.from(categories);
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function groupByDate(downloads) {
  const groups = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  downloads.forEach(download => {
    const downloadDate = new Date(download.timestamp);
    downloadDate.setHours(0, 0, 0, 0);
    
    let label;
    if (downloadDate.getTime() === today.getTime()) {
      label = '今天';
    } else if (downloadDate.getTime() === yesterday.getTime()) {
      label = '昨天';
    } else {
      label = downloadDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(download);
  });
  
  return groups;
}
