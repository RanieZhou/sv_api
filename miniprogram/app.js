App({
  globalData: {
    // 默认回退配置
    config: {
      mp_title: '极速去水印助手',
      mp_notice: '复制抖音、快手、小红书、B站等链接，打开即可一键解析！',
      parse_api_url: 'http://localhost:3005/api/parse',
      api_key: 'sk_test_00000000000000000000000000000001',
      subscribe_url: 'https://shortvideo.aihubzone.cn/',
      daily_free_quota: 5,
      ad_banner_id: '',
      ad_video_id: '',
      ad_interstitial_id: '',
      contact_wechat: 'admin',
      disclaimer: '本小程序仅供个人学习交流使用，作品版权归原作者所有。'
    },
    // 小程序后台配置 API 地址（部署后修改为你的小程序后台域名，如 https://mp.yourdomain.com/api/mp/config）
    configApiUrl: 'http://localhost:3008/api/mp/config',
    usedToday: 0
  },

  onLaunch() {
    this.loadRemoteConfig();
    this.checkDailyQuota();
  },

  // 动态从小程序后台拉取配置（标题、广告ID、API Key、订阅链接等）
  loadRemoteConfig() {
    const that = this;
    wx.request({
      url: that.globalData.configApiUrl,
      method: 'GET',
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          that.globalData.config = Object.assign({}, that.globalData.config, res.data.data);
          // 动态更新导航栏标题
          if (that.globalData.config.mp_title) {
            wx.setNavigationBarTitle({ title: that.globalData.config.mp_title });
          }
        }
      },
      fail() {
        console.log('拉取远程小程序配置失败，使用默认配置');
      }
    });
  },

  // 校验今日使用次数
  checkDailyQuota() {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = wx.getStorageSync('quota_date');
    if (lastDate !== today) {
      wx.setStorageSync('quota_date', today);
      wx.setStorageSync('used_today', 0);
      this.globalData.usedToday = 0;
    } else {
      this.globalData.usedToday = wx.getStorageSync('used_today') || 0;
    }
  }
});
