/**
 * 短视频去水印解析工具
 * 对应服务端：https://shortvideo.aihubzone.cn
 *
 * 注意：抖音视频直链含防盗链签名，小程序不能直接播放。
 * 必须通过 /api/proxy?url=<encodeURIComponent(原链)> 服务端中转才能正常加载。
 */

const { getApiUrl } = require('../config/env.js');

const DEFAULT_API_KEY = 'sk_test_00000000000000000000000000000001';

/**
 * 提取文本中的视频链接 (从完整分享文字中自动提取纯 http/https 链接)
 * @param {string} text - 输入文本
 * @returns {string} 提取到的纯链接
 */
function extractDouyinUrl(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // 匹配文本中的 http:// 或 https:// 链接
  const match = text.match(/https?:\/\/[^\s\u4e00-\u9fa5]+/i);
  if (match && match[0]) {
    return match[0].trim();
  }
  
  return text.trim();
}

/**
 * 测试接口连通性
 * @returns {Promise}
 */
function testApiConnection() {
  return new Promise((resolve) => {
    const testUrl = 'https://v.douyin.com/iJoSKqrx/';
    wx.request({
      url: `${getApiUrl('/parse')}?url=${encodeURIComponent(testUrl)}&api_key=${DEFAULT_API_KEY}`,
      method: 'GET',
      timeout: 15000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          resolve({
            success: true,
            statusCode: res.statusCode,
            message: '✅ 连接 shortvideo.aihubzone.cn 服务端成功！'
          });
        } else {
          resolve({
            success: false,
            statusCode: res.statusCode,
            message: `⚠️ 服务端连接正常，但响应报错：${res.data?.msg || '未知错误'}`
          });
        }
      },
      fail: (err) => {
        resolve({
          success: false,
          error: err.errMsg,
          message: `❌ 连接失败：${err.errMsg}`
        });
      }
    });
  });
}

/**
 * 解析短视频
 * @param {string} shareContent - 分享内容
 * @param {string} apiKey - 可选的 API Key
 * @returns {Promise} 解析结果
 */
function parseDouyinVideo(shareContent, apiKey = DEFAULT_API_KEY) {
  return new Promise((resolve, reject) => {
    try {
      // 从包含描述的完整分享文本中提取 URL
      const cleanUrl = extractDouyinUrl(shareContent);
      if (!cleanUrl) {
        reject(new Error('未在分享内容中找到有效的视频链接'));
        return;
      }
      
      console.log('正在提交解析链接:', cleanUrl);
      
      wx.request({
        url: getApiUrl('/parse'),
        method: 'GET',
        data: {
          url: cleanUrl,
          api_key: apiKey
        },
        timeout: 15000,
        success: (res) => {
          console.log('解析接口返回:', res);
          
          if (res.statusCode === 200 && res.data && (res.data.code === 200 || res.data.code === 0)) {
            const d = res.data.data || res.data;
            const videoUrl = d.url || d.video_url || d.play_url || (d.video_urls && d.video_urls[0]) || '';
            const authorObj = d.author || {};
            const authorName = typeof authorObj === 'string' ? authorObj : (authorObj.name || '未知作者');
            const extra = d.extra || {};
            const stats = extra.statistics || {};
            const authorExtra = extra.author_extra || {};

            // 图集模式：提取图片列表（过滤空项）
            let imgs = [];
            if (d.images && d.images.length > 0) {
              imgs = d.images
                .map(img => typeof img === 'string' ? img : (img.url || img.url_list?.[0] || ''))
                .filter(Boolean);
            }

            // 内容类型：video / images
            const contentType = (imgs.length > 0 && !videoUrl) ? 'images' : (d.type || 'video');

            // 清晰度选项（从 video_backup 提取）
            const QUALITY_ORDER = ['2160p','1440p','1080p','720p','576p','540p','480p','360p'];
            let qualityOptions = [];
            if (d.video_backup && d.video_backup.length > 0) {
              // 只保留 mp4 格式，按质量分组后取最高码率的
              const qualityMap = {};
              d.video_backup.forEach(item => {
                if (item.format !== 'mp4' || !item.url || !item.quality) return;
                const q = item.quality;
                if (!qualityMap[q] || item.bit_rate > qualityMap[q].bit_rate) {
                  qualityMap[q] = item;
                }
              });
              // 按预设顺序排列
              qualityOptions = QUALITY_ORDER
                .filter(q => qualityMap[q])
                .map(q => ({ label: q, url: qualityMap[q].url, bitRate: qualityMap[q].bit_rate }));
            }
            // 如果没有 video_backup，用原始 url 作为唯一选项
            if (qualityOptions.length === 0 && videoUrl) {
              qualityOptions = [{ label: '默认', url: videoUrl, bitRate: 0 }];
            }

            const hashtags = (extra.hashtags || []).map(t => t.name || '').filter(Boolean);

            // 背景音乐
            const music = d.music || {};

            // 发布时间（unix秒 → 格式化）
            const createTimestamp = extra.create_time || 0;
            let createTime = '';
            if (createTimestamp) {
              const dt = new Date(createTimestamp * 1000);
              createTime = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
            }

            const formattedData = {
              type: contentType,
              title: d.title || d.desc || '短视频作品',
              // 作者信息
              author: authorName,
              authorAvatar: typeof authorObj === 'object' ? (authorObj.avatar || authorObj.avatar_url || '') : '',
              authorId: typeof authorObj === 'object' ? (String(authorObj.id || authorObj.uid || '')) : '',
              followerCount: authorExtra.follower_count || 0,
              // 媒体资源
              videoUrl: videoUrl,
              cover: d.cover || d.cover_url || '',
              proxyVideoUrl: getProxyVideoUrl(videoUrl),
              images: imgs,
              // 视频参数
              duration: d.duration ? Math.round(d.duration / 1000) : 0,
              size: d.size || 0,
              // 互动数据（正确路径：extra.statistics）
              likeCount: stats.digg_count || 0,
              commentCount: stats.comment_count || 0,
              collectCount: stats.collect_count || 0,
              shareCount: stats.share_count || 0,
              // 附加信息
              hashtags: hashtags,
              musicTitle: music.title || '',
              musicAuthor: music.author || '',
              createTime: createTime,
              // 清晰度选项
              qualityOptions: qualityOptions,
            };
            
            resolve(formattedData);
          } else {
            const errorMessage = res.data?.msg || res.data?.message || '解析失败，上游未响应有效内容';
            reject(new Error(errorMessage));
          }
        },
        fail: (err) => {
          let errorMessage = '网络请求失败，请检查网络设置';
          if (err.errMsg && err.errMsg.includes('domain')) {
            errorMessage = '❌ 域名未配置在小程序合法域名列表中！请在微信后台添加 shortvideo.aihubzone.cn';
          } else if (err.errMsg) {
            errorMessage = `网络错误：${err.errMsg}`;
          }
          reject(new Error(errorMessage));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 获取代理视频URL（必须使用！）
 * 将抖音原始直链通过我们自己的服务器中转，绕过防盗链限制。
 * 小程序 <video> 组件无法直接加载带防盗链的抖音 CDN 直链，必须走此代理。
 */
function getProxyVideoUrl(originalUrl) {
  if (!originalUrl) return '';
  return `https://shortvideo.aihubzone.cn/api/proxy?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * 使用视频链接保存到相册
 */
function downloadVideoWithProxy(videoUrl, title = '短视频', onProgress = null) {
  return new Promise(async (resolve, reject) => {
    if (!videoUrl) {
      reject(new Error('视频链接不能为空'));
      return;
    }

    const hasAuth = await checkAlbumAuth();
    if (!hasAuth) {
      reject(new Error('需要授权访问相册才能保存视频'));
      return;
    }

    try {
      if (onProgress) onProgress({ percent: 10, stage: 'downloading' });

      const downloadResult = await downloadFile(videoUrl, onProgress);

      if (downloadResult.statusCode === 200) {
        if (onProgress) onProgress({ percent: 95, stage: 'saving' });
        await saveVideoToAlbum(downloadResult.tempFilePath);
        if (onProgress) onProgress({ percent: 100, stage: 'completed' });
        resolve(downloadResult.tempFilePath);
      } else {
        throw new Error(`下载失败，状态码：${downloadResult.statusCode}`);
      }
    } catch (error) {
      if (onProgress) onProgress({ percent: 0, stage: 'failed' });
      reject(error);
    }
  });
}

function checkAlbumAuth() {
  return new Promise((resolve) => {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.writePhotosAlbum'] === false) {
          wx.showModal({
            title: '需要授权',
            content: '需要您授权访问相册才能保存视频，请在设置中开启',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) wx.openSetting();
              resolve(false);
            }
          });
        } else if (res.authSetting['scope.writePhotosAlbum'] === undefined) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => resolve(true),
            fail: () => resolve(false)
          });
        } else {
          resolve(true);
        }
      },
      fail: () => resolve(false)
    });
  });
}

function downloadFile(url, onProgress = null) {
  return new Promise((resolve, reject) => {
    const downloadTask = wx.downloadFile({
      url: url,
      success: resolve,
      fail: reject
    });

    if (onProgress) {
      downloadTask.onProgressUpdate((res) => {
        const downloadPercent = Math.floor((res.progress * 90) / 100);
        onProgress({ 
          percent: downloadPercent, 
          stage: 'downloading',
          totalBytesWritten: res.totalBytesWritten,
          totalBytesExpectedToWrite: res.totalBytesExpectedToWrite
        });
      });
    }
  });
}

function saveVideoToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveVideoToPhotosAlbum({
      filePath: filePath,
      success: resolve,
      fail: reject
    });
  });
}

function handleApiError(error, context = '') {
  console.error(`${context} 错误:`, error);
  const message = error.message || '操作失败';
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2500
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

module.exports = {
  parseDouyinVideo,
  getProxyVideoUrl,
  extractDouyinUrl,
  downloadVideoWithProxy,
  checkAlbumAuth,
  debounce,
  testApiConnection,
  handleApiError
};