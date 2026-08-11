const app = getApp()
const { parseDouyinVideo, downloadVideoWithProxy, getProxyVideoUrl, extractDouyinUrl, debounce, testApiConnection, handleApiError } = require('../../utils/douyin.js')
const { getApiUrl, getServerUrl } = require('../../config/env.js')

Page({
  data: {
    banners: [], // 轮播图列表
    showBanners: false, // 是否显示轮播图区域
    inputUrl: '', // 输入的链接
    isLoading: false, // 是否正在加载
    parseResult: null, // 解析结果
    canParse: false, // 是否可以解析
    // 下载进度相关
    isDownloading: false, // 是否正在下载
    downloadProgress: 0, // 下载进度 0-100
    downloadStage: '', // 下载阶段: downloading, saving, completed, failed
    downloadStageText: '', // 下载阶段文本
    videoAd: null, // 激励广告实例
  },

  onLoad() {
    this.loadBanners()
    // 初始化激励广告
    this.initRewardedVideoAd()
  },

  onShow() {
    // 每次显示页面时检查剪贴板
    this.checkClipboard()
  },

  // 加载轮播图 - 从后端API获取真实数据
  async loadBanners() {
    try {
      wx.request({
        url: getApiUrl('/banners'),
        method: 'GET',
        header: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        success: (res) => {
          console.log('轮播图API响应:', res);
          
          if (res.statusCode === 200 && res.data && res.data.success) {
            const banners = res.data.data || [];
            
            // 处理图片URL，如果是本地路径则添加服务器前缀
            const processedBanners = banners.map(banner => ({
              ...banner,
              imageUrl: banner.imageUrl.startsWith('/uploads') ? 
                getServerUrl(banner.imageUrl) : 
                banner.imageUrl
            }));
            
            this.setData({
              banners: processedBanners,
              showBanners: processedBanners.length > 0
            });
            
            console.log('✅ 轮播图加载成功，共', processedBanners.length, '张');
          } else {
            console.log('⚠️ 轮播图API返回异常:', res.data);
            this.useFallbackBanners();
          }
        },
        fail: (err) => {
          console.error('❌ 轮播图API请求失败:', err);
          this.useFallbackBanners();
        }
      });
    } catch (error) {
      console.error('加载轮播图异常:', error);
      this.useFallbackBanners();
    }
  },

  // 备用轮播图数据（当API不可用时）
  useFallbackBanners() {
    console.log('📋 使用备用轮播图数据');
    const fallbackBanners = [
      {
        id: 1,
        title: '欢迎使用去水印工具',
        imageUrl: 'https://picsum.photos/750/300?random=1',
        linkUrl: '',
        isActive: true,
        sortOrder: 1
      },
      {
        id: 2,
        title: '支持多平台视频解析',
        imageUrl: 'https://picsum.photos/750/300?random=2', 
        linkUrl: '',
        isActive: true,
        sortOrder: 2
      }
    ];
    
    this.setData({
      banners: fallbackBanners,
      showBanners: true
    });
  },

  // 初始化激励广告
  initRewardedVideoAd() {
    if (wx.createRewardedVideoAd) {
      this.videoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-70281f12832763f1'
      })
      
      this.videoAd.onLoad(() => {
        console.log('激励广告加载成功')
      })
      
      this.videoAd.onError((err) => {
        console.error('激励广告加载失败', err)
        // 广告加载失败时，直接允许下载
        app.updateAdWatchStatus(true)
      })
      
      this.videoAd.onClose((res) => {
        if (res && res.isEnded) {
          // 正常播放结束，更新广告观看状态
          app.updateAdWatchStatus(true)
          // 继续执行保存操作
          this.proceedWithDownload()
        } else {
          // 播放中途退出，不更新状态
          wx.showToast({
            title: '需要观看完整广告才能保存视频',
            icon: 'none',
            duration: 2000
          })
        }
      })
    }
  },

  // 显示激励广告
  showRewardedVideoAd() {
    if (!this.videoAd) {
      console.log('激励广告未初始化')
      // 广告组件未初始化，直接允许下载
      app.updateAdWatchStatus(true)
      this.proceedWithDownload()
      return
    }

    this.videoAd.show().catch(() => {
      // 失败重试
      this.videoAd.load()
        .then(() => this.videoAd.show())
        .catch(err => {
          console.error('激励广告显示失败', err)
          // 广告显示失败，直接允许下载
          app.updateAdWatchStatus(true)
          this.proceedWithDownload()
        })
    })
  },

  // 从文本中提取抖音视频链接
  extractVideoUrl(text) {
    if (!text || typeof text !== 'string') return ''
    
    try {
      // 优先使用抖音专用提取函数
      return extractDouyinUrl(text)
    } catch (error) {
      console.log('抖音链接提取失败:', error.message)
      return ''
    }
  },

  // 检查剪贴板内容
  checkClipboard() {
    wx.getClipboardData({
      success: (res) => {
        const clipData = res.data
        
        // 从剪贴板内容中提取视频链接
        const extractedUrl = this.extractVideoUrl(clipData)
        
        if (extractedUrl && extractedUrl !== this.data.inputUrl) {
          // 如果提取到的链接与原始内容不同，说明是从复杂文本中提取的
          const isExtracted = extractedUrl !== clipData.trim()
          
          wx.showModal({
            title: '发现视频链接',
            content: isExtracted ? 
              `检测到视频链接：${extractedUrl.length > 50 ? extractedUrl.substring(0, 50) + '...' : extractedUrl}` : 
              '是否使用剪贴板中的视频链接？',
            confirmText: '使用',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.setData({
                  inputUrl: extractedUrl
                })
                this.checkCanParse()
                
                if (isExtracted) {
                  wx.showToast({ title: '已自动提取视频链接', icon: 'success' })
                }
              }
            }
          })
        }
      },
      fail: () => {
        // 获取剪贴板失败，忽略
      }
    })
  },

  // 判断是否为有效网络链接
  isVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const clean = url.trim();
    return clean.startsWith('http://') || clean.startsWith('https://');
  },

  // 轮播图点击事件
  onBannerTap(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      console.log('轮播图跳转:', url)
    }
  },

  // 输入链接：自动提取纯 URL 并显示在文本框中
  onUrlInput(e) {
    const inputValue = e.detail.value;
    const extractedUrl = this.extractVideoUrl(inputValue);
    const finalUrl = extractedUrl || inputValue;
    
    this.setData({
      inputUrl: finalUrl,
      parseResult: null
    });
    
    if (extractedUrl && extractedUrl !== inputValue.trim()) {
      wx.showToast({ title: '已自动提取链接', icon: 'success' });
    }
    
    this.checkCanParse();
  },

  // 粘贴链接：自动提取纯 URL 并显示在文本框中
  pasteUrl() {
    wx.getClipboardData({
      success: (res) => {
        const clipData = res.data || '';
        const extractedUrl = this.extractVideoUrl(clipData);
        const finalUrl = extractedUrl || clipData;
        
        this.setData({
          inputUrl: finalUrl,
          parseResult: null
        });
        
        this.checkCanParse();
        
        if (extractedUrl && extractedUrl !== clipData.trim()) {
          wx.showToast({ title: '已自动提取链接', icon: 'success' });
        } else if (finalUrl) {
          wx.showToast({ title: '已粘贴链接' });
        }
      },
      fail: () => {
        wx.showToast({ title: '粘贴失败', icon: 'none' });
      }
    });
  },

  // 清空链接
  clearUrl() {
    this.setData({
      inputUrl: '',
      parseResult: null
    });
    this.checkCanParse();
  },

  // 检查是否可以解析
  checkCanParse() {
    const inputUrl = (this.data.inputUrl || '').trim();
    const canParse = inputUrl.length > 0 && this.isVideoUrl(inputUrl);
    this.setData({ canParse });
  },

  // 解析抖音视频
  async parseVideo() {
    if (!this.data.canParse || this.data.isLoading) return

    const { inputUrl } = this.data
    
    this.setData({ isLoading: true })
    wx.showLoading({
      title: '正在解析视频...',
      mask: true
    })

    try {
      console.log('开始解析抖音视频:', inputUrl)
      
      // 使用符合接口文档规范的解析工具
      const videoData = await parseDouyinVideo(inputUrl)
      
      console.log('解析成功，视频数据:', videoData)

      // 按照接口文档的标准字段格式化数据
      const formattedData = {
        success: true,
        title: videoData.title || '抖音视频',
        author: videoData.author || '未知作者',
        videoUrl: videoData.videoUrl || '',
        cover: videoData.cover || '',
        proxyVideoUrl: videoData.proxyVideoUrl, // 重要：必须使用代理URL
        duration: videoData.duration || 0,
        size: videoData.size || 0,
        originalUrl: inputUrl
      }
      
      this.setData({
        parseResult: formattedData
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '解析成功！',
        icon: 'success'
      })

    } catch (error) {
      console.error('解析失败:', error)
      
      wx.hideLoading()
      
      // 使用统一的错误处理
      handleApiError(error, '视频解析')
      
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 下载抖音视频
  async downloadVideo() {
    const { parseResult } = this.data
    if (!parseResult || !parseResult.videoUrl) {
      wx.showToast({
        title: '无效的视频链接',
        icon: 'none'
      })
      return
    }

    // 检查是否需要观看广告
    if (!app.globalData.adWatched) {
      wx.showModal({
        title: '观看广告',
        content: '首次保存视频需要观看一条广告，观看完成后今天内可无限保存视频，是否继续？',
        confirmText: '继续',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.showRewardedVideoAd()
          }
        }
      })
    } else {
      // 已经观看过广告，直接下载
      this.proceedWithDownload()
    }
  },

  // 执行下载操作
  async proceedWithDownload() {
    const { parseResult } = this.data
    
    // 开始下载，显示进度条
    this.setData({
      isDownloading: true,
      downloadProgress: 0,
      downloadStage: 'downloading',
      downloadStageText: '正在下载视频...'
    })

    try {
      await downloadVideoWithProxy(
        parseResult.videoUrl,
        parseResult.title,
        this.updateDownloadProgress.bind(this)
      )
    } catch (error) {
      console.error('下载失败:', error)
      
      this.setData({
        isDownloading: false,
        downloadStage: 'failed',
        downloadStageText: '下载失败'
      })

      // 如果下载失败，提供复制链接的备选方案
      wx.showModal({
        title: '下载失败',
        content: error.message + '\n\n是否复制代理视频链接到剪贴板？',
        confirmText: '复制链接',
        cancelText: '取消',
        success: (modalRes) => {
          if (modalRes.confirm) {
            this.copyVideoUrl()
          }
        }
      })
    }
  },

  // 更新下载进度
  updateDownloadProgress(progress) {
    const { percent, stage } = progress
    let stageText = ''
    
    switch (stage) {
      case 'downloading':
        stageText = `正在下载视频... ${percent}%`
        break
      case 'saving':
        stageText = '正在保存到相册...'
        break
      case 'completed':
        stageText = '下载完成！'
        // 延迟隐藏进度条
        setTimeout(() => {
          this.setData({
            isDownloading: false
          })
        }, 1500)
        // 显示成功提示
        wx.showToast({
          title: '视频已保存到相册',
          icon: 'success',
          duration: 2000
        })
        break
      case 'failed':
        stageText = '下载失败'
        this.setData({
          isDownloading: false
        })
        break
    }
    
    // 使用动画更新进度，使进度变化更平滑
    this.setData({
      downloadProgress: Math.max(0, Math.min(100, percent)), // 确保进度在0-100之间
      downloadStage: stage,
      downloadStageText: stageText
    })

    // 如果是下载阶段，添加额外的视觉反馈
    if (stage === 'downloading' && progress.totalBytesWritten && progress.totalBytesExpectedToWrite) {
      const sizeInfo = `${this.formatSize(progress.totalBytesWritten)} / ${this.formatSize(progress.totalBytesExpectedToWrite)}`
      console.log('下载进度详情:', sizeInfo)
    }
  },

  // 复制视频链接（使用代理URL）
  copyVideoUrl() {
    const { parseResult } = this.data
    if (!parseResult || !parseResult.videoUrl) {
      wx.showToast({
        title: '无效的视频链接',
        icon: 'none'
      })
      return
    }

    // 重要：必须使用代理URL，按照接口文档要求
    const urlToCopy = parseResult.proxyVideoUrl || getProxyVideoUrl(parseResult.videoUrl)

    wx.setClipboardData({
      data: urlToCopy,
      success: () => {
        wx.showToast({
          title: '代理链接已复制（已处理防盗链）',
          icon: 'success',
          duration: 2000
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  },

  // 复制标题
  copyTitle() {
    const { parseResult } = this.data
    if (!parseResult || !parseResult.title) {
      wx.showToast({
        title: '暂无标题信息',
        icon: 'none'
      })
      return
    }

    wx.setClipboardData({
      data: parseResult.title,
      success: () => {
        wx.showToast({
          title: '标题已复制',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  },

  // 复制作者
  copyAuthor() {
    const { parseResult } = this.data
    if (!parseResult || !parseResult.author) {
      wx.showToast({
        title: '暂无作者信息',
        icon: 'none'
      })
      return
    }

    wx.setClipboardData({
      data: parseResult.author,
      success: () => {
        wx.showToast({
          title: '作者已复制',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  },

  // 预览视频封面
  previewCover() {
    const { parseResult } = this.data
    if (!parseResult || !parseResult.cover) {
      wx.showToast({ title: '无封面图片', icon: 'none' })
      return
    }
    
    wx.previewImage({
      current: parseResult.cover,
      urls: [parseResult.cover]
    })
  },

  // 格式化时长
  formatDuration(seconds) {
    if (!seconds) return ''
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  // 格式化文件大小
  formatSize(bytes) {
    if (!bytes || bytes === 0) return ''
    
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  },


}) 