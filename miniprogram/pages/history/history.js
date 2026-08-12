// pages/history/history.js
const app = getApp()

Page({
  data: {
    historyList: []
  },

  onShow() {
    this.loadHistory()
  },

  // 从本地缓存加载历史记录
  loadHistory() {
    try {
      const list = wx.getStorageSync('parse_history') || []
      this.setData({ historyList: list })
    } catch (e) {
      console.error('获取历史记录失败:', e)
    }
  },

  // 点击记录进入详情结果页
  onItemTap(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.historyList[index]
    if (item && item.parseResult) {
      app.globalData.lastParseResult = item.parseResult
      wx.navigateTo({
        url: '/pages/result/result'
      })
    }
  },

  // 删除单条记录
  deleteItem(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条解析记录吗？',
      confirmText: '删除',
      confirmColor: '#EF4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          try {
            let list = [...this.data.historyList]
            list.splice(index, 1)
            wx.setStorageSync('parse_history', list)
            this.setData({ historyList: list })
            wx.showToast({ title: '已删除', icon: 'success' })
          } catch (err) {
            console.error('删除记录失败:', err)
          }
        }
      }
    })
  },

  // 清空全部历史记录
  clearAllHistory() {
    wx.showModal({
      title: '清空确认',
      content: '确定要清空全部解析历史记录吗？',
      confirmText: '清空',
      confirmColor: '#EF4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('parse_history')
            this.setData({ historyList: [] })
            wx.showToast({ title: '已清空历史', icon: 'success' })
          } catch (err) {
            console.error('清空历史记录失败:', err)
          }
        }
      }
    })
  },

  // 返回首页
  goHome() {
    wx.navigateBack({
      fail: () => {
        wx.redirectTo({ url: '/pages/index/index' })
      }
    })
  }
})
