import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加token到请求头
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API请求错误:', error)
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          // 清除本地存储
          localStorage.removeItem('admin_token')
          localStorage.removeItem('user_info')
          // 跳转到登录页
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.msg || data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// 鉴权API
export const authAPI = {
  login: (password: string) => api.post('/admin/login', { password })
}

// 轮播图相关API
export const bannerAPI = {
  // 获取所有轮播图（管理端）
  getAll: () => api.get('/banners/admin'),
  
  // 获取单个轮播图
  getById: (id: number) => api.get(`/banners/${id}`),
  
  // 添加轮播图
  create: (data: any) => api.post('/banners', data),
  
  // 更新轮播图
  update: (id: number, data: any) => api.put(`/banners/${id}`, data),
  
  // 删除轮播图
  delete: (id: number) => api.delete(`/banners/${id}`)
}

// 系统配置相关API
export const systemAPI = {
  // 获取小程序配置
  getMiniprogramConfig() {
    return api.get('/system/miniprogram-config')
  },
  // 保存小程序配置
  saveMiniprogramConfig(data: any) {
    return api.post('/system/miniprogram-config', data)
  },
  // 接口Key配置与校验
  getApiKeyConfig() {
    return api.get('/apiKey/config')
  },
  saveApiKeyConfig(data: any) {
    return api.post('/apiKey/config', data)
  },
  verifyApiKeyConfig(apiKey: string) {
    return api.get('/apiKey/verify', { params: { apiKey } })
  },
  // 流量主广告配置
  getAdConfig() {
    return api.get('/system/ad-config')
  },
  saveAdConfig(data: any) {
    return api.post('/system/ad-config', data)
  },
  // 通用管理 API 请求（带 admin token 鉴权）
  request(method: string, url: string, data?: any) {
    return api.request({ method, url, data })
  }
}

// 文件上传相关API
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}