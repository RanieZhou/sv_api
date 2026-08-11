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

  // 查看历史记录 (匹配草图按钮)
  openHistoryModal() {
    const history = wx.getStorageSync('parse_history') || [];
    if (history.length === 0) {
      wx.showModal({
        title: '📜 解析历史记录',
        content: '暂无历史解析记录，快去首页粘贴链接提取吧！',
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }

    const latestList = history.slice(0, 5).map((item, index) => `${index + 1}. ${item.title}\n(${item.time})`).join('\n\n');

    wx.showModal({
      title: '📜 最近解析历史',
      content: `${latestList}\n\n[提示: 点击确定可清空历史记录]`,
      confirmText: '清空历史',
      cancelText: '关闭',
      success(res) {
        if (res.confirm) {
          wx.removeStorageSync('parse_history');
          wx.showToast({ title: '历史记录已清空', icon: 'success' });
        }
      }
    });
  },

  // 卡密兑换 (匹配草图按钮)
  openRedeemModal() {
    const cfg = this.data.config;
    wx.showModal({
      title: '🔑 卡密兑换 / 绑定',
      content: `可用兑换码或订阅专属无限额度 API Key。\n当前绑定Key: ${cfg.api_key ? cfg.api_key.slice(0, 12) + '...' : '内置测试Key'}\n订阅/兑换网址：${cfg.subscribe_url || 'https://shortvideo.aihubzone.cn/'}`,
      confirmText: '复制订阅网址',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          wx.setClipboardData({
            data: cfg.subscribe_url || 'https://shortvideo.aihubzone.cn/',
            success() {
              wx.showToast({ title: '订阅网址已复制', icon: 'success' });
            }
          });
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '短视频聚合解析工具 - 极速无水印提取',
      path: '/pages/index/index'
    };
  }
});
