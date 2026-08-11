// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    // 本地开发环境使用本地后端API地址
    baseUrl: 'https://shuiyin.lingjing235.cn',
    // 广告观看状态
    adWatched: false,
    lastAdWatchTime: 0
  },

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 获取用户openid
    this.getOpenId()

    // 获取用户信息
    this.getSetting()

    // 检查广告观看状态
    this.checkAdWatchStatus()
  },

  // 检查广告观看状态
  checkAdWatchStatus() {
    const lastWatchTime = wx.getStorageSync('lastAdWatchTime') || 0
    const now = new Date().getTime()
    const today = new Date(now).setHours(0, 0, 0, 0)
    const lastWatchDay = new Date(lastWatchTime).setHours(0, 0, 0, 0)

    // 如果最后观看时间是今天，则设置为已观看
    if (lastWatchDay === today) {
      this.globalData.adWatched = true
      this.globalData.lastAdWatchTime = lastWatchTime
    } else {
      this.globalData.adWatched = false
      this.globalData.lastAdWatchTime = 0
      wx.setStorageSync('lastAdWatchTime', 0)
    }
  },

  // 更新广告观看状态
  updateAdWatchStatus(watched = true) {
    const now = new Date().getTime()
    this.globalData.adWatched = watched
    this.globalData.lastAdWatchTime = now
    wx.setStorageSync('lastAdWatchTime', now)
  },

  // 获取openid
  getOpenId() {
    const openid = wx.getStorageSync('openid')
    if (openid) {
      this.globalData.openid = openid
    } else {
      // 实际开发中需要调用后端接口获取openid
      // 这里暂时使用模拟数据
      const mockOpenId = 'mock_openid_' + Date.now()
      wx.setStorageSync('openid', mockOpenId)
      this.globalData.openid = mockOpenId
    }
  },

  // 获取用户设置
  getSetting() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },

  // 网络请求封装
  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'content-type': 'application/json',
          ...options.header
        },
        timeout: 10000, // 增加超时时间
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            console.warn(`请求失败: ${options.url}, 状态码: ${res.statusCode}`)
            reject(res)
          }
        },
        fail: (err) => {
          console.error(`网络请求失败: ${options.url}`, err)
          reject(err)
        }
      })
    })
  },

  // 显示提示信息
  showToast(title, icon = 'none') {
    wx.showToast({
      title,
      icon,
      duration: 2000
    })
  },

  // 显示加载提示
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    })
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading()
  }
}) 