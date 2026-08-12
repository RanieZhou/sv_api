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
 * 获取或动态拉取小程序站长配置的 API Key
 */
function getOrFetchApiKey(userApiKey = '') {
  return new Promise((resolve) => {
    if (userApiKey) return resolve(userApiKey);

    const cachedKey = wx.getStorageSync('user_api_key') || wx.getStorageSync('station_api_key');
    if (cachedKey) return resolve(cachedKey);

    wx.request({
      url: getApiUrl('/system/interface-config'),
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        const k = res.data?.data?.api_key || res.data?.data?.apiKey || '';
        if (k) {
          wx.setStorageSync('station_api_key', k);
        }
        resolve(k);
      },
      fail: () => resolve('')
    });
  });
}

/**
 * 解析短视频
 * @param {string} shareContent - 分享内容
 * @param {string} apiKey - 可选的 API Key
 * @returns {Promise} 解析结果
 */
function parseDouyinVideo(shareContent, apiKey = '') {
  return new Promise(async (resolve, reject) => {
    try {
      // 从包含描述的完整分享文本中提取 URL
      const cleanUrl = extractDouyinUrl(shareContent);
      if (!cleanUrl) {
        reject(new Error('未在分享内容中找到有效的视频链接'));
        return;
      }
      
      const finalApiKey = await getOrFetchApiKey(apiKey);
      console.log('正在提交解析链接:', cleanUrl, 'API Key:', finalApiKey ? finalApiKey.slice(0, 10) + '...' : '未传递');
      
      const reqData = { url: cleanUrl };
      if (finalApiKey) {
        reqData.api_key = finalApiKey;
      }
      
      wx.request({
        url: getApiUrl('/parse'),
        method: 'GET',
        data: reqData,
        timeout: 15000,
        success: (res) => {
          console.log('解析接口返回:', res);
          
          if (res.statusCode === 200 && res.data && (res.data.code === 200 || res.data.code === 0)) {
            const raw = res.data;
            const d = raw.data || raw;
            const platform = raw.platform || 'unknown';

            // ===== 作者信息（各平台兼容）=====
            // 抖音/快手/小红书: d.author = {name, id, avatar}
            // B站: d.auther(拼写), d.avatar, d.user = {name, user_img}
            // 视频号: d.author = {name, avatar}（无id）
            const authorObj = d.author || {};
            const isAuthorStr = typeof authorObj === 'string';
            const authorName = isAuthorStr
              ? authorObj
              : (authorObj.name || d.auther || d.user?.name || '未知作者');
            const authorAvatar = isAuthorStr ? '' : (
              authorObj.avatar || authorObj.avatar_url ||
              d.avatar || d.user?.user_img || ''
            );
            const authorId = isAuthorStr ? '' : String(authorObj.id || authorObj.uid || '');

            // ===== extra 嵌套对象 =====
            const extra = d.extra || {};
            const stats = extra.statistics || {};
            const authorExtra = extra.author_extra || {};

            // ===== 互动数据（各平台字段名不同）=====
            // 抖音: extra.statistics.digg_count / comment_count / collect_count / share_count
            // 快手: extra.statistics.like_count / comment_count / share_count / play_count
            // 其他平台暂无
            const likeCount   = stats.digg_count  || stats.like_count    || 0;
            const commentCount = stats.comment_count || 0;
            const collectCount = stats.collect_count || 0;
            const shareCount   = stats.share_count   || 0;

            // ===== 视频 URL（各平台）=====
            // B站: d.url 或 d.videos[0].url
            let videoUrl = d.url || d.video_url || d.play_url || '';
            if (!videoUrl && d.videos && d.videos.length > 0) {
              videoUrl = d.videos[0].url || '';
            }
            // 视频号: d.url 有时为空字符串，video_backup 里有真实地址
            // 不做代理（视频号直接下载）

            // ===== 图片列表（各平台）=====
            // 抖音/小红书/快手: d.images = ['url', ...]
            // 部分平台: d.images = [{url: '...'}] 形式
            let imgs = [];
            if (d.images && d.images.length > 0) {
              imgs = d.images
                .map(img => typeof img === 'string' ? img : (img.url || img.url_list?.[0] || ''))
                .filter(Boolean);
            }

            // ===== 内容类型 =====
            // d.type 存在则优先使用
            // 兜底：有图无视频 → images，有视频 → video
            let contentType = d.type || '';
            if (!contentType) {
              contentType = (imgs.length > 0 && !videoUrl) ? 'images' : 'video';
            }
            // 抖音图文类型为 "image"，统一为 "images"
            if (contentType === 'image') contentType = 'images';

            // ===== 时长（各平台单位不一致）=====
            // 抖音: duration 单位毫秒（>1000才需要/1000）
            // 快手: duration 已是秒
            // B站: videos[0].duration 秒, durationFormat "00:08:10"
            let duration = 0;
            if (d.duration) {
              duration = d.duration > 1000 ? Math.round(d.duration / 1000) : d.duration;
            } else if (d.videos && d.videos[0] && d.videos[0].duration) {
              duration = d.videos[0].duration; // B站已是秒
            }

            // ===== 清晰度选项（video_backup）=====
            // 不同平台的 video_backup 格式基本一致，但有些无 format 字段（视频号、快手）
            const QUALITY_ORDER = ['2160p', '1440p', '1080p', '720p', '576p', '540p', '480p', '360p', '高清', '流畅'];
            let qualityOptions = [];
            const backupList = Array.isArray(d.video_backup) ? d.video_backup : [];
            if (backupList.length > 0) {
              // 过滤：排除 dash 格式；无 format 字段的也保留（视频号/快手）
              const qualityMap = {};
              backupList.forEach(item => {
                if (!item.url) return;
                if (item.format && item.format !== 'mp4') return; // 排除 dash
                const q = item.quality || item.label || '默认';
                const br = item.bit_rate || 0;
                if (!qualityMap[q] || br > qualityMap[q].bit_rate) {
                  qualityMap[q] = { ...item, bit_rate: br };
                }
              });
              // 按预设顺序排，剩余的追加到末尾
              const ordered = [];
              QUALITY_ORDER.forEach(q => {
                if (qualityMap[q]) {
                  ordered.push({ label: q, url: qualityMap[q].url, bitRate: qualityMap[q].bit_rate });
                  delete qualityMap[q];
                }
              });
              Object.values(qualityMap).forEach(item => {
                ordered.push({ label: item.quality || item.label || '其他', url: item.url, bitRate: item.bit_rate });
              });
              qualityOptions = ordered;
            }
            if (qualityOptions.length === 0 && videoUrl) {
              qualityOptions = [{ label: '默认', url: videoUrl, bitRate: 0 }];
            }

            // ===== 话题标签（仅抖音有结构化 hashtags）=====
            const hashtags = (extra.hashtags || []).map(t => t.name || '').filter(Boolean);

            // ===== 背景音乐（仅抖音）=====
            const music = d.music || {};

            // ===== 发布时间 =====
            const createTimestamp = extra.create_time || 0;
            let createTime = '';
            if (createTimestamp) {
              const dt = new Date(createTimestamp * 1000);
              const y = dt.getFullYear();
              const mo = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : String(dt.getMonth() + 1);
              const day = dt.getDate() < 10 ? '0' + dt.getDate() : String(dt.getDate());
              createTime = y + '-' + mo + '-' + day;
            }

            // ===== 描述（小红书的 desc 独立于 title）=====
            const desc = (d.desc && d.desc !== d.title) ? d.desc : '';

            const formattedData = {
              platform,
              type: contentType,
              title: d.title || d.desc || '短视频作品',
              desc,
              // 作者
              author: authorName,
              authorAvatar,
              authorId,
              followerCount: authorExtra.follower_count || 0,
              // 媒体
              videoUrl,
              cover: d.cover || d.cover_url || '',
              proxyVideoUrl: getProxyVideoUrl(videoUrl),
              images: imgs,
              // 参数
              duration,
              // 互动
              likeCount,
              commentCount,
              collectCount,
              shareCount,
              // 附加
              hashtags,
              musicTitle: music.title || '',
              musicAuthor: music.author || '',
              createTime,
              // 清晰度
              qualityOptions,
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
 * 判断视频 URL 是否需要经过代理中转
 * 规则：只有抖音 CDN 域名需要代理，其他平台直接使用原始链接
 */
function needsProxy(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    // 抖音 CDN 域名（需要代理）
    const douyinDomains = [
      'zjcdn.com',        // 抖音主 CDN
      'douyinvod.com',    // 抖音视频 CDN
      'iesdouyin.com',    // 抖音分享域
      'douyinstatic.com', // 抖音静态资源
    ];
    return douyinDomains.some(d => host.includes(d));
  } catch (e) {
    return false;
  }
}

/**
 * 获取用于小程序播放的视频 URL
 * 抖音需要代理（有防盗链），其他平台直接使用原始链接
 */
function getProxyVideoUrl(originalUrl) {
  if (!originalUrl) return '';
  if (needsProxy(originalUrl)) {
    return 'https://shortvideo.aihubzone.cn/api/proxy?url=' + encodeURIComponent(originalUrl);
  }
  // 非抖音平台直接返回原始 URL（视频号、B站、快手、小红书均可直接播放）
  return originalUrl;
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

/**
 * 获取符合微信小程序 downloadFile 合法域名的代理下载 URL
 * 解决微信小程序 downloadFile 对 HTTP 协议以及非白名单域名的限制
 * (例如快手 http://ws2.a.kwimgs.com 等第三方 CDN)
 */
function getProxyDownloadUrl(originalUrl) {
  if (!originalUrl) return '';
  if (originalUrl.includes('shortvideo.aihubzone.cn')) {
    return originalUrl;
  }
  return getApiUrl('/proxy') + '?url=' + encodeURIComponent(originalUrl);
}

function downloadFile(url, onProgress = null) {
  return new Promise((resolve, reject) => {
    const finalUrl = getProxyDownloadUrl(url);
    const downloadTask = wx.downloadFile({
      url: finalUrl,
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
  const message = error ? (error.message || String(error)) : '操作失败';
  wx.showModal({
    title: '解析提示',
    content: message,
    showCancel: false,
    confirmText: '我知道了'
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
  getProxyDownloadUrl,
  extractDouyinUrl,
  downloadVideoWithProxy,
  checkAlbumAuth,
  debounce,
  testApiConnection,
  handleApiError
};