const app = getApp();

Page({
  data: {
    config: {},
    usedToday: 0,
    userId: ''
  },

  onShow() {
    let uid = wx.getStorageSync('user_id');
    if (!uid || uid.length !== 8) {
      if (app && app.initUserId) {
        app.initUserId();
        uid = app.globalData.userId;
      } else {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        uid = '';
        for (let i = 0; i < 8; i++) {
          uid += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        wx.setStorageSync('user_id', uid);
      }
    }

    this.setData({
      config: app.globalData.config || {},
      usedToday: app.globalData.usedToday || 0,
      userId: uid
    });
  },

  // 复制用户 8 位 ID
  copyUserId() {
    const uid = this.data.userId;
    if (!uid) return;
    wx.setClipboardData({
      data: uid,
      success() {
        wx.showToast({ title: '用户ID已复制', icon: 'success' });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '短视频聚合解析工具 - 极速无水印提取助手',
      path: '/pages/index/index'
    };
  }
});
