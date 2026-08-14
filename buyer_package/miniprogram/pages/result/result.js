const app = getApp()
const { parseDouyinVideo, downloadVideoWithProxy, getProxyVideoUrl, getProxyDownloadUrl, extractDouyinUrl, handleApiError } = require('../../utils/douyin.js')

Page({
  data: {
    parseResult: null,   // 解析结果
    inputUrl: '',        // 顶部输入框内容
    canParse: false,
    isLoading: false,
    activeTab: 'video',  // 当前 Tab：video | images | info
    // 下载进度
    isDownloading: false,
    downloadProgress: 0,
    downloadStage: '',
    downloadStageText: '',
  },

  onLoad() {
    // 开启页面分享与朋友圈转发功能
    if (wx.showShareMenu) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    }
    // 从 globalData 取上一次解析结果
    const result = app.globalData.lastParseResult
    if (result) {
      this.setData({
        parseResult: result,
        inputUrl: result.originalUrl || '',
        // 图集优先展示图片 Tab
        activeTab: result.type === 'images' ? 'images' : 'video',
      })
      this.checkCanParse()
    }
    // 初始化流量主激励视频广告
    this.initRewardedAd()
  },

  // 初始化微信原生激励视频广告
  initRewardedAd() {
    const adConfig = app.globalData.adConfig || wx.getStorageSync('ad_config') || {}
    const adUnitId = (adConfig.rewardedAdId || adConfig.rewardedVideoAdUnitId || '').trim()

    if (wx.createRewardedVideoAd && adUnitId) {
      try {
        console.log('正在创建激励视频广告, adUnitId =', adUnitId)
        const videoAd = wx.createRewardedVideoAd({ adUnitId })

        videoAd.onLoad(() => {
          console.log('激励视频广告加载成功')
        })

        videoAd.onError((err) => {
          console.error('激励视频广告加载失败:', err)
        })

        videoAd.onClose((res) => {
          // 用户是否完整观看广告
          if (res && res.isEnded) {
            console.log('用户已完整观看广告，给予奖励解锁')
            if (app.updateAdWatchStatus) {
              app.updateAdWatchStatus(true)
            }
            wx.showToast({ title: '已解锁24小时无限使用！', icon: 'success', duration: 2000 })
            if (this._pendingAdCallback) {
              const cb = this._pendingAdCallback
              this._pendingAdCallback = null
              cb()
            }
          } else {
            console.log('用户中途关闭广告，不给予奖励')
            wx.showToast({ title: '需要完整观看广告才能解锁哦', icon: 'none', duration: 2500 })
          }
        })

        this._rewardedVideoAd = videoAd
      } catch (err) {
        console.error('创建激励视频广告失败:', err)
      }
    }
  },

  // ===== 输入区逻辑 =====
  onUrlInput(e) {
    const v = e.detail.value
    const extracted = extractDouyinUrl(v)
    this.setData({ inputUrl: extracted || v })
    this.checkCanParse()
  },

  pasteUrl() {
    wx.getClipboardData({
      success: (res) => {
        const extracted = extractDouyinUrl(res.data || '')
        const final = extracted || res.data || ''
        this.setData({ inputUrl: final })
        this.checkCanParse()
        if (final) wx.showToast({ title: '已粘贴', icon: 'success' })
      },
      fail: () => wx.showToast({ title: '粘贴失败', icon: 'none' })
    })
  },

  clearUrl() {
    this.setData({ inputUrl: '' })
    this.checkCanParse()
  },

  checkCanParse() {
    const url = (this.data.inputUrl || '').trim()
    this.setData({ canParse: url.startsWith('http://') || url.startsWith('https://') })
  },

  // ===== 重新解析 =====
  async doExtract() {
    if (!this.data.canParse || this.data.isLoading) return
    const inputUrl = this.data.inputUrl.trim()

    this.setData({ isLoading: true })
    wx.showLoading({ title: '正在解析...', mask: true })

    try {
      const videoData = await parseDouyinVideo(inputUrl)

      const rawCover = videoData.cover || ''
      const rawImages = videoData.images || []
      const proxyCover = getProxyDownloadUrl(rawCover)
      const proxyImages = rawImages.map(img => getProxyDownloadUrl(img))

      const formattedData = {
        success: true,
        type: videoData.type || 'video',
        title: videoData.title || '短视频作品',
        author: videoData.author || '未知作者',
        authorAvatar: videoData.authorAvatar || '',
        authorId: videoData.authorId || '',
        followerCount: videoData.followerCount || 0,
        videoUrl: videoData.videoUrl || '',
        cover: rawCover,
        proxyCover: proxyCover,
        proxyVideoUrl: videoData.proxyVideoUrl,
        images: rawImages,
        proxyImages: proxyImages,
        duration: videoData.duration || 0,
        size: videoData.size || 0,
        likeCount: videoData.likeCount || 0,
        commentCount: videoData.commentCount || 0,
        collectCount: videoData.collectCount || 0,
        shareCount: videoData.shareCount || 0,
        hashtags: videoData.hashtags || [],
        musicTitle: videoData.musicTitle || '',
        musicAuthor: videoData.musicAuthor || '',
        createTime: videoData.createTime || '',
        qualityOptions: videoData.qualityOptions || [],
        originalUrl: inputUrl
      }

      app.globalData.lastParseResult = formattedData
      this.setData({
        parseResult: formattedData,
        activeTab: formattedData.type === 'images' ? 'images' : 'video',
      })

      wx.hideLoading()
      wx.showToast({ title: '解析成功！', icon: 'success' })

    } catch (error) {
      console.error('解析失败:', error)
      wx.hideLoading()
      handleApiError(error, '视频解析')
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // ===== Tab 切换 =====
  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  // ===== 视频下载（带清晰度选择） =====
  async downloadVideo() {
    const { parseResult } = this.data
    if (!parseResult || !parseResult.videoUrl) {
      wx.showToast({ title: '无效的视频链接', icon: 'none' })
      return
    }
    const options = parseResult.qualityOptions || []
    if (options.length <= 1) {
      this._checkAdAndExecute(() => this.proceedWithDownload(options[0]?.url || parseResult.videoUrl))
      return
    }
    wx.showActionSheet({
      itemList: options.map(o => o.label),
      success: (res) => {
        this._checkAdAndExecute(() => this.proceedWithDownload(options[res.tapIndex].url))
      },
      fail: () => {}
    })
  },

  // ===== 图集保存 =====
  async saveImages() {
    const { parseResult } = this.data
    if (!parseResult || !parseResult.images || parseResult.images.length === 0) {
      wx.showToast({ title: '没有可保存的图片', icon: 'none' })
      return
    }
    this._checkAdAndExecute(() => this.proceedWithSaveImages())
  },

  // 通用广告检测及解锁
  _checkAdAndExecute(actionCallback) {
    const adConfig = app.globalData.adConfig || wx.getStorageSync('ad_config')
    let adEnabled = app.globalData.adEnabled

    if (adConfig && typeof adConfig.adEnabled !== 'undefined') {
      adEnabled = adConfig.adEnabled === true || adConfig.adEnabled === 'true'
    }

    // 若流量主总开关明确关闭，直接允许下载
    if (adEnabled === false) {
      actionCallback()
      return
    }

    // 如果未看过广告，弹出观看解锁提示
    if (!app.globalData.adWatched) {
      wx.showModal({
        title: '解锁无限使用',
        content: '观看一次完整广告，解锁24小时无限使用',
        cancelText: '下次再说',
        confirmText: '观看广告',
        success: (res) => {
          if (res.confirm) {
            this.showRewardedVideoAd(actionCallback)
          }
        }
      })
    } else {
      actionCallback()
    }
  },

  // 广告播放控制
  showRewardedVideoAd(callback) {
    this._pendingAdCallback = callback

    if (!this._rewardedVideoAd) {
      this.initRewardedAd()
    }

    if (this._rewardedVideoAd) {
      wx.showLoading({ title: '广告加载中...', mask: true })
      this._rewardedVideoAd.show()
        .then(() => {
          wx.hideLoading()
        })
        .catch(() => {
          // 如果 show 失败，尝试重新 load
          this._rewardedVideoAd.load()
            .then(() => {
              wx.hideLoading()
              this._rewardedVideoAd.show()
            })
            .catch((err) => {
              console.warn('拉取真实广告失败，自动切换为演示解锁:', err)
              wx.hideLoading()
              this._simulateAdWatch(callback)
            })
        })
    } else {
      // 在微信开发者工具或没有配置真实 Ad ID 时：进行演示解锁体验
      this._simulateAdWatch(callback)
    }
  },

  _simulateAdWatch(callback) {
    setTimeout(() => {
      wx.hideLoading()
      if (app.updateAdWatchStatus) {
        app.updateAdWatchStatus(true)
      }
      wx.showToast({ title: '已解锁24小时无限使用', icon: 'success', duration: 2000 })
      if (callback) callback()
    }, 2000)
  },

  async proceedWithDownload(videoUrl) {
    const { parseResult } = this.data
    const targetUrl = videoUrl || (parseResult && parseResult.videoUrl)
    if (!targetUrl) return

    this.setData({ isDownloading: true, downloadProgress: 0, downloadStage: 'downloading', downloadStageText: '正在下载视频...' })

    try {
      await downloadVideoWithProxy(targetUrl, parseResult.title, this.updateDownloadProgress.bind(this))
    } catch (error) {
      console.error('下载失败:', error)
      this.setData({ isDownloading: false, downloadStage: 'failed', downloadStageText: '下载失败' })
      const errorMsg = (error && (error.message || error.errMsg)) ? (error.message || error.errMsg) : '视频保存失败，请检查网络或相册权限';
      wx.showModal({
        title: '下载失败',
        content: errorMsg + '\n\n是否复制代理链接？',
        confirmText: '复制链接',
        cancelText: '取消',
        success: (res) => { if (res.confirm) this.copyVideoUrl() }
      })
    }
  },

  updateDownloadProgress(progress) {
    const { percent, stage } = progress
    let stageText = ''
    switch (stage) {
      case 'downloading': stageText = `正在下载... ${percent}%`; break
      case 'saving': stageText = '正在保存到相册...'; break
      case 'completed':
        stageText = '下载完成！'
        setTimeout(() => this.setData({ isDownloading: false }), 1500)
        wx.showToast({ title: '视频已保存到相册', icon: 'success', duration: 2000 })
        break
      case 'failed':
        stageText = '下载失败'
        this.setData({ isDownloading: false })
        break
    }
    this.setData({ downloadProgress: Math.max(0, Math.min(100, percent)), downloadStage: stage, downloadStageText: stageText })
  },

  async proceedWithSaveImages() {
    const { parseResult } = this.data
    const authRes = await new Promise(resolve => wx.authorize({ scope: 'scope.writePhotosAlbum', success: () => resolve(true), fail: () => resolve(false) }))
    if (!authRes) {
      wx.showModal({
        title: '需要相册权限', content: '请在设置中开启相册写入权限', confirmText: '去设置',
        success: (r) => { if (r.confirm) wx.openSetting() }
      })
      return
    }
    const images = parseResult.images
    wx.showLoading({ title: `保存中 0/${images.length}`, mask: true })
    let successCount = 0
    for (let i = 0; i < images.length; i++) {
      try {
        const downloadUrl = getProxyDownloadUrl(images[i])
        await new Promise((resolve, reject) => {
          wx.downloadFile({
            url: downloadUrl,
            success: (dlRes) => {
              if (dlRes.statusCode === 200) {
                wx.saveImageToPhotosAlbum({ filePath: dlRes.tempFilePath, success: () => { successCount++; resolve() }, fail: reject })
              } else reject(new Error('下载失败'))
            },
            fail: reject
          })
        })
        wx.showLoading({ title: `保存中 ${i + 1}/${images.length}`, mask: true })
      } catch (err) {
        console.error(`第${i + 1}张保存失败:`, err)
      }
    }
    wx.hideLoading()
    wx.showToast({ title: `已保存 ${successCount}/${images.length} 张图片`, icon: successCount === images.length ? 'success' : 'none', duration: 2500 })
  },

  // ===== 预览 =====
  previewImages(e) {
    const { parseResult } = this.data
    if (!parseResult || !parseResult.images || parseResult.images.length === 0) return
    wx.previewImage({ current: parseResult.images[e.currentTarget.dataset.index || 0], urls: parseResult.images })
  },

  previewCover() {
    const { parseResult } = this.data
    if (!parseResult || !parseResult.cover) return
    wx.previewImage({ current: parseResult.cover, urls: [parseResult.cover] })
  },

  // ===== 复制 =====
  copyTitle() {
    const { parseResult } = this.data
    if (!parseResult?.title) return
    wx.setClipboardData({ data: parseResult.title, success: () => wx.showToast({ title: '标题已复制', icon: 'success' }) })
  },

  copyVideoUrl() {
    const { parseResult } = this.data
    if (!parseResult?.videoUrl) return
    const url = parseResult.proxyVideoUrl || getProxyVideoUrl(parseResult.videoUrl)
    wx.setClipboardData({ data: url, success: () => wx.showToast({ title: '链接已复制', icon: 'success' }) })
  },

  // ===== 转发分享 =====
  onShareAppMessage() {
    const title = this.data.parseResult?.title || '免费短视频无水印解析下载';
    return {
      title: `⚡ ${title}`,
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    const title = this.data.parseResult?.title || '免费短视频无水印解析下载';
    return {
      title: `⚡ ${title}`,
      path: '/pages/index/index'
    }
  }
})
