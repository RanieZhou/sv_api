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
    remainingQuota: 5
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

  // 检查剪贴板
  checkClipboardData() {
    const that = this;
    wx.getClipboardData({
      success(res) {
        const text = res.data || '';
        if (text && (text.includes('http://') || text.includes('https://'))) {
          // 如果与当前输入框内容不同，则提示一键粘贴
          if (text !== that.data.inputUrl) {
            wx.showModal({
              title: '检测到复制链接',
              content: '是否直接识别并粘贴剪贴板中的链接？',
              confirmText: '粘贴解析',
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

  // 发起解析
  startParse() {
    const that = this;
    const urlText = this.data.inputUrl.trim();
    if (!urlText) {
      wx.showToast({ title: '请先输入或粘贴链接', icon: 'none' });
      return;
    }

    // 检查额度
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

          // 扣减本地免费额度
          app.globalData.usedToday += 1;
          wx.setStorageSync('used_today', app.globalData.usedToday);
          that.setData({
            remainingQuota: Math.max(0, cfg.daily_free_quota - app.globalData.usedToday)
          });

          wx.showToast({ title: '解析成功', icon: 'success' });
        } else {
          wx.showModal({
            title: '解析失败',
            content: (res.data && res.data.msg) || '上游接口未能成功提取视频，请检查链接',
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

  // 保存视频到本地相册
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

  // 激励广告解封额度
  showAdReward() {
    const adVideoId = app.globalData.config.ad_video_id;
    if (!adVideoId) {
      wx.showToast({ title: '广告加载中，请稍后再试', icon: 'none' });
      return;
    }
    // 微信小程序广告代码逻辑
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
  }
});
