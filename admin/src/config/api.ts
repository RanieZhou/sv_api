import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 从环境变量获取API基础URL，默认使用开发环境地址
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 创建axios实例
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// API端点配置
export const API_ENDPOINTS = {
  // 认证相关
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile'
  },
  // 轮播图相关
  banners: {
    list: '/api/banners',
    create: '/api/banners',
    update: '/api/banners/:id',
    delete: '/api/banners/:id'
  }
}

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer default_token`
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
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
          router.push('/login')
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
          ElMessage.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default api 