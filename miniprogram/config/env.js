// 小程序环境配置
const ENV_CONFIG = {
  // 开发环境
  development: {
    API_BASE_URL: 'https://shortvideo.aihubzone.cn/api',
    SERVER_URL: 'https://shortvideo.aihubzone.cn'
  },
  
  // 生产环境
  production: {
    API_BASE_URL: 'https://shortvideo.aihubzone.cn/api',
    SERVER_URL: 'https://shortvideo.aihubzone.cn'
  }
};

// 当前环境
const CURRENT_ENV = 'production';

// 获取当前环境配置
function getConfig() {
  return ENV_CONFIG[CURRENT_ENV];
}

// 获取API地址
function getApiUrl(path = '') {
  const config = getConfig();
  return path ? `${config.API_BASE_URL}${path}` : config.API_BASE_URL;
}

// 获取服务器地址（用于图片等静态资源）
function getServerUrl(path = '') {
  const config = getConfig();
  return path ? `${config.SERVER_URL}${path}` : config.SERVER_URL;
}

module.exports = {
  getConfig,
  getApiUrl,
  getServerUrl,
  CURRENT_ENV
};