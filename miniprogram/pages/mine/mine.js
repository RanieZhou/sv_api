const app = getApp();

Page({
  data: {
    config: {},
    usedToday: 0
  },

  onShow() {
    this.setData({
      config: app.globalData.config,
      usedToday: app.globalData.usedToday || 0
    });
  },

  openSubscribeModal() {
    const cfg = this.data.config;
    wx.showModal({
      title: '订阅 / 购买专属 API Key',
      content: `可在以下网站订阅无限额度 Key 或联系管理员微信号：${cfg.contact_wechat || 'admin'}\n订阅链接：${cfg.subscribe_url || 'https://shortvideo.aihubzone.cn/'}`,
      confirmText: '复制链接',
      cancelText: '关闭',
      success(res) {
        if (res.confirm) {
          wx.setClipboardData({
            data: cfg.subscribe_url || 'https://shortvideo.aihubzone.cn/',
            success() {
              wx.showToast({ title: '订阅链接已复制', icon: 'success' });
            }
          });
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: this.data.config.mp_title || '免费短视频去水印/图集下载助手',
      path: '/pages/index/index'
    };
  }
});
