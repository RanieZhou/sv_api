const app = getApp();

Page({
  data: {
    config: {},
    inputUrl: '',
    loading: false,
    hasResult: false,
    resultData: null,
    videoUrl: '',
    imageList: [],
    remainingQuota: 5,
    banners: [
      {
        badge: '✨ 全网强力解析',
        title: '短视频/图集 无水印提取',
        desc: '支持抖音、快手、小红书、B站等多平台链接解析',
        bgClass: 'bg-gradient-1'
      },
      {
        badge: '🖼️ 高清无损',
        title: '高清图集 一键导出相册',
        desc: '原图画质一键保存，手机壁纸画报轻松获取',
        bgClass: 'bg-gradient-2'
      },
      {
        badge: '⚡ 智能识别',
        title: '自动识别 剪贴板一键提取',
        desc: '直接粘贴App复制的完整分享文本即可自动解析',
        bgClass: 'bg-gradient-3'
      }
    ]
  },

  onShow() {
    this.setData({
      config: app.globalData.config,
      remainingQuota: Math.max(0, app.globalData.config.daily_free_quota - app.globalData.usedToday)
    });
    this.checkClipboardData();
  },

  onInputChange(e) {
    this.setData({ inputUrl: e.detail.value });
  },

  // 自动检测剪贴板
  checkClipboardData() {
    const that = this;
    wx.getClipboardData({
      success(res) {
        const text = res.data || '';
        if (text && (text.includes('http://') || text.includes('https://'))) {
          if (text !== that.data.inputUrl) {
            wx.showModal({
              title: '检测到复制链接',
              content: '是否直接粘贴并开始提取？',
              confirmText: '粘贴并提取',
              cancelText: '取消',
              success(modalRes) {
                if (modalRes.confirm) {
                  that.setData({ inputUrl: text });
                  that.startParse();
                }
              }
            });
          }
        }
      }
    });
  },

  pasteClipboard() {
    const that = this;
    wx.getClipboardData({
      success(res) {
        if (res.data) {
          that.setData({ inputUrl: res.data });
          wx.showToast({ title: '已粘贴', icon: 'success' });
        } else {
          wx.showToast({ title: '剪贴板为空', icon: 'none' });
        }
      }
    });
  },

  clearInput() {
    this.setData({ inputUrl: '', hasResult: false, resultData: null, videoUrl: '', imageList: [] });
  },

  // 发起解析 (开始提取)
  startParse() {
    const that = this;
    const urlText = this.data.inputUrl.trim();
    if (!urlText) {
      wx.showToast({ title: '请先输入或粘贴链接', icon: 'none' });
      return;
    }

    if (this.data.remainingQuota <= 0) {
      wx.showModal({
        title: '今日解析额度已用完',
        content: '观看一次短视频广告可免费增加解析额度！',
        confirmText: '看广告解锁',
        cancelText: '取消',
        success(res) {
          if (res.confirm) {
            that.showAdReward();
          }
        }
      });
      return;
    }

    const cfg = app.globalData.config;
    const targetApi = `${cfg.parse_api_url}?url=${encodeURIComponent(urlText)}&api_key=${encodeURIComponent(cfg.api_key)}`;

    this.setData({ loading: true });

    wx.request({
      url: targetApi,
      method: 'GET',
      success(res) {
        that.setData({ loading: false });
        if (res.statusCode === 200 && res.data && (res.data.code === 200 || res.data.code === 0)) {
          const d = res.data.data || res.data;
          const video = d.video_url || d.url || d.play_url || (d.video_urls && d.video_urls[0]) || '';
          
          let imgs = [];
          if (d.images && d.images.length > 0) {
            imgs = d.images.map(img => typeof img === 'string' ? img : (img.url || img.url_list?.[0] || ''));
          }

          that.setData({
            hasResult: true,
            resultData: d,
            videoUrl: video,
            imageList: imgs
          });

          // 保存到历史记录
          that.saveHistoryRecord({
            title: d.title || d.desc || '短视频解析作品',
            author: d.author?.name || '未知作者',
            videoUrl: video,
            time: new Date().toLocaleString()
          });

          // 扣减本地免费额度
          app.globalData.usedToday += 1;
          wx.setStorageSync('used_today', app.globalData.usedToday);
          that.setData({
            remainingQuota: Math.max(0, cfg.daily_free_quota - app.globalData.usedToday)
          });

          wx.showToast({ title: '提取成功', icon: 'success' });
        } else {
          wx.showModal({
            title: '提取失败',
            content: (res.data && res.data.msg) || '未能成功提取无水印资源，请检查链接是否正确',
            showCancel: false
          });
        }
      },
      fail() {
        that.setData({ loading: false });
        wx.showToast({ title: '网络连接失败', icon: 'error' });
      }
    });
  },

  // 写入历史记录缓存
  saveHistoryRecord(record) {
    let history = wx.getStorageSync('parse_history') || [];
    history.unshift(record);
    if (history.length > 30) history = history.slice(0, 30);
    wx.setStorageSync('parse_history', history);
  },

  // 打开使用教程弹窗
  openTutorialModal() {
    wx.showModal({
      title: '📖 使用教程',
      content: '1️⃣ 打开抖音、快手、小红书等 App\n2️⃣ 点击【分享】按钮，选择【复制链接】\n3️⃣ 打开本小程序，点击【一键粘贴】，再点击【开始提取】即可无水印下载视频或保存高清图集到相册！',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 打开常见问题弹窗
  openFaqModal() {
    wx.showModal({
      title: '💡 常见问题解答',
      content: 'Q1: 保存视频到相册提示失败？\nA: 请在手机设置中检查是否已允许微信访问系统相册权限。\n\nQ2: 提示链接解析失败？\nA: 请确认复制的是作品分享链接，勿包含非相关字符或私密作品链接。\n\nQ3: 是否收费？\nA: 本工具提供每日免费解析额度，无需登录开箱即用。',
      showCancel: false,
      confirmText: '关闭'
    });
  },

  // 保存视频到相册
  saveVideo() {
    const videoUrl = this.data.videoUrl;
    if (!videoUrl) return;

    wx.showLoading({ title: '正在下载视频...', mask: true });

    wx.downloadFile({
      url: videoUrl,
      success(res) {
        if (res.statusCode === 200) {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success() {
              wx.hideLoading();
              wx.showToast({ title: '已保存至手机相册', icon: 'success' });
            },
            fail() {
              wx.hideLoading();
              wx.showToast({ title: '保存失败/未开启权限', icon: 'none' });
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({ title: '下载文件失败', icon: 'none' });
        }
      },
      fail() {
        wx.hideLoading();
        wx.showToast({ title: '网络下载失败', icon: 'none' });
      }
    });
  },

  // 批量保存图集
  saveAllImages() {
    const images = this.data.imageList;
    if (!images || images.length === 0) return;

    wx.showLoading({ title: `保存中 (0/${images.length})...`, mask: true });

    let count = 0;
    images.forEach((imgUrl, idx) => {
      wx.downloadFile({
        url: imgUrl,
        success(res) {
          if (res.statusCode === 200) {
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success() {
                count++;
                wx.showLoading({ title: `保存中 (${count}/${images.length})...`, mask: true });
                if (count === images.length) {
                  wx.hideLoading();
                  wx.showToast({ title: '全部图集已保存到相册', icon: 'success' });
                }
              },
              fail() {
                count++;
                if (count === images.length) wx.hideLoading();
              }
            });
          }
        },
        fail() {
          count++;
          if (count === images.length) wx.hideLoading();
        }
      });
    });
  },

  // 复制直链
  copyLink() {
    wx.setClipboardData({
      data: this.data.videoUrl,
      success() {
        wx.showToast({ title: '链接已复制', icon: 'success' });
      }
    });
  },

  // 预览大图
  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    wx.previewImage({
      current: src,
      urls: this.data.imageList
    });
  },

  // 激励广告增加额度
  showAdReward() {
    const adVideoId = app.globalData.config.ad_video_id;
    if (!adVideoId) {
      wx.showToast({ title: '广告加载中，请稍后再试', icon: 'none' });
      return;
    }
    if (wx.createRewardedVideoAd) {
      const rewardAd = wx.createRewardedVideoAd({ adUnitId: adVideoId });
      rewardAd.onClose(res => {
        if (res && res.isEnded) {
          app.globalData.usedToday = Math.max(0, app.globalData.usedToday - 5);
          wx.setStorageSync('used_today', app.globalData.usedToday);
          wx.showToast({ title: '已增加 5 次解析额度！', icon: 'success' });
        }
      });
      rewardAd.show().catch(() => rewardAd.load().then(() => rewardAd.show()));
    }
  },

  onShareAppMessage() {
    return {
      title: '短视频聚合解析工具 - 极速无水印提取',
      path: '/pages/index/index'
    };
  }
});
