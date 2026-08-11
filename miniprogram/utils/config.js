/**
 * 小程序配置管理工具
 * 从后台动态获取系统配置，包括代理域名等
 */

// 默认配置
const DEFAULT_CONFIG = {
  // 后台管理系统域名（固定）
  ADMIN_BASE_URL: 'http://localhost:3000',
  
  // 默认代理配置（后备方案）
  DEFAULT_PROXY_DOMAIN: 'https://api1.lingjing235.cn',
  DEFAULT_PROXY_PATH: '/api/video/proxy',
  
  // 缓存配置
  CACHE_KEY: 'system_config',
  API_KEY_CACHE_KEY: 'api_key_config',
  CACHE_EXPIRE_TIME: 5 * 60 * 1000, // 5分钟缓存
}

// 全局配置对象
let systemConfig = {
  // 小程序配置
  appName: '去水印工具',
  noticeText: '',
  
  // 代理配置
  proxyDomain: DEFAULT_CONFIG.DEFAULT_PROXY_DOMAIN,
  proxyPath: DEFAULT_CONFIG.DEFAULT_PROXY_PATH,
  proxyEnabled: true,
  
  // API密钥配置
  apiKey: '',
  
  // 内部状态
  _loaded: false,
  _loading: false,
  _lastUpdate: 0
}

/**
 * 从后台获取系统配置
 * @returns {Promise<Object>} 系统配置
 */
function fetchSystemConfig() {
  return new Promise((resolve, reject) => {
    const url = `${DEFAULT_CONFIG.ADMIN_BASE_URL}/api/system/config`;
    
    console.log('🔄 正在获取系统配置...', url);
    
    wx.request({
      url: url,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        console.log('✅ 系统配置获取成功:', res);
        
        if (res.statusCode === 200 && res.data.success) {
          const configData = res.data.data;
          
          // 更新系统配置
          systemConfig.appName = configData.appName || systemConfig.appName;
          systemConfig.noticeText = configData.noticeText || '';
          
          // 关键：更新代理配置
          if (configData.proxyUrl) {
            // 如果后台配置了完整的代理URL，解析出域名和路径
            try {
              const proxyUrlObj = new URL(configData.proxyUrl);
              systemConfig.proxyDomain = `${proxyUrlObj.protocol}//${proxyUrlObj.host}`;
              systemConfig.proxyPath = proxyUrlObj.pathname;
              systemConfig.proxyEnabled = true;
              
              console.log('🎯 使用后台配置的代理:', {
                domain: systemConfig.proxyDomain,
                path: systemConfig.proxyPath
              });
            } catch (error) {
              console.warn('⚠️ 代理URL解析失败，使用默认配置:', error);
            }
          } else {
            console.log('📝 未配置代理URL，使用默认代理');
          }
          
          // 更新状态
          systemConfig._loaded = true;
          systemConfig._loading = false;
          systemConfig._lastUpdate = Date.now();
          
          // 缓存配置
          wx.setStorageSync(DEFAULT_CONFIG.CACHE_KEY, {
            config: systemConfig,
            timestamp: systemConfig._lastUpdate
          });
          
          resolve(systemConfig);
        } else {
          reject(new Error('获取系统配置失败'));
        }
      },
      fail: (err) => {
        console.error('❌ 获取系统配置失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 从后台获取API密钥配置
 * @returns {Promise<string>} API密钥
 */
function fetchApiKeyConfig() {
  return new Promise((resolve, reject) => {
    const url = `${DEFAULT_CONFIG.ADMIN_BASE_URL}/api/key/config`;
    
    console.log('🔄 正在获取API密钥配置...', url);
    
    wx.request({
      url: url,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const apiKey = res.data.data.api_key;
          if (apiKey) {
            // 更新并缓存API密钥
            systemConfig.apiKey = apiKey;
            wx.setStorageSync(DEFAULT_CONFIG.API_KEY_CACHE_KEY, apiKey);
            resolve(apiKey);
          } else {
            reject(new Error('未配置API密钥'));
          }
        } else {
          reject(new Error('获取API密钥配置失败'));
        }
      },
      fail: (err) => {
        console.error('❌ 获取API密钥配置失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 获取当前API密钥
 * @returns {string} API密钥
 */
function getApiKey() {
  return systemConfig.apiKey || wx.getStorageSync(DEFAULT_CONFIG.API_KEY_CACHE_KEY) || '';
}

/**
 * 获取缓存的配置
 * @returns {Object|null} 缓存的配置或null
 */
function getCachedConfig() {
  try {
    const cached = wx.getStorageSync(DEFAULT_CONFIG.CACHE_KEY);
    if (cached && cached.timestamp) {
      const age = Date.now() - cached.timestamp;
      if (age < DEFAULT_CONFIG.CACHE_EXPIRE_TIME) {
        console.log('📋 找到有效缓存配置');
        return cached.config;
      } else {
        console.log('📋 缓存已过期');
        wx.removeStorageSync(DEFAULT_CONFIG.CACHE_KEY);
      }
    }
  } catch (error) {
    console.warn('获取缓存配置失败:', error);
  }
  return null;
}

/**
 * 初始化系统配置
 * 小程序启动时调用
 * @returns {Promise<Object>} 系统配置
 */
function initSystemConfig() {
  return new Promise((resolve) => {
    // 如果正在加载，等待加载完成
    if (systemConfig._loading) {
      const checkInterval = setInterval(() => {
        if (!systemConfig._loading) {
          clearInterval(checkInterval);
          resolve(systemConfig);
        }
      }, 100);
      return;
    }
    
    // 如果已经加载过，直接返回
    if (systemConfig._loaded) {
      resolve(systemConfig);
      return;
    }
    
    systemConfig._loading = true;
    
    // 先尝试使用缓存
    const cached = getCachedConfig();
    if (cached) {
      console.log('🚀 使用缓存配置快速启动');
      Object.assign(systemConfig, cached);
      systemConfig._loaded = true;
      systemConfig._loading = false;
      resolve(systemConfig);
      
      // 后台异步更新配置
      fetchSystemConfig().catch(() => {
        console.log('后台更新配置失败，继续使用缓存');
      });
    } else {
      // 首次启动，必须获取配置
      fetchSystemConfig()
        .then(resolve)
        .catch(() => {
          // 如果获取失败，使用默认配置
          console.log('🔄 使用默认配置启动');
          systemConfig._loaded = true;
          systemConfig._loading = false;
          resolve(systemConfig);
        });
    }
  });
}

/**
 * 获取当前系统配置
 * @returns {Object} 当前配置
 */
function getSystemConfig() {
  return systemConfig;
}

/**
 * 获取代理视频URL
 * 使用动态配置的代理域名
 * @param {string} originalUrl - 原始视频URL
 * @returns {string} 代理后的URL
 */
function getProxyVideoUrl(originalUrl) {
  if (!originalUrl) return '';
  
  if (!systemConfig.proxyEnabled) {
    console.warn('⚠️ 代理功能已禁用，返回原始URL');
    return originalUrl;
  }
  
  const proxyBaseUrl = systemConfig.proxyDomain.replace(/\/$/, '') + systemConfig.proxyPath;
  const encodedUrl = encodeURIComponent(originalUrl);
  const proxyUrl = `${proxyBaseUrl}?url=${encodedUrl}`;
  
  console.log('🎯 生成代理URL:', {
    原始URL: originalUrl,
    代理域名: systemConfig.proxyDomain,
    代理路径: systemConfig.proxyPath,
    代理URL: proxyUrl
  });
  
  return proxyUrl;
}

/**
 * 手动刷新系统配置
 * 用于后台配置更新后的手动刷新
 * @returns {Promise<Object>} 最新配置
 */
function refreshSystemConfig() {
  systemConfig._loaded = false;
  systemConfig._loading = false;
  wx.removeStorageSync(DEFAULT_CONFIG.CACHE_KEY);
  
  return fetchSystemConfig();
}

/**
 * 获取解析接口URL
 * 暂时保持固定，未来可配置
 * @returns {string} 解析接口URL
 */
function getParseApiUrl() {
  // 暂时使用固定域名，未来可以从后台配置
  return 'https://api1.lingjing235.cn/api/douyin/parse';
}

// 导出模块
module.exports = {
  DEFAULT_CONFIG,
  systemConfig,
  initSystemConfig,
  getSystemConfig,
  getProxyVideoUrl,
  getParseApiUrl,
  refreshSystemConfig,
  fetchApiKeyConfig,
  getApiKey,
  
  // 兼容旧接口
  getConfig: getSystemConfig
} 