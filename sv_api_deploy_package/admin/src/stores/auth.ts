import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: number
  username: string
  email: string | null
  avatar: string | null
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string>('default_token')
  const userInfo = ref<UserInfo>({
    id: 1,
    username: 'admin',
    email: null,
    avatar: null
  })
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => true)

  // 检查认证状态
  const checkAuth = async () => {
    return true
  }

  return {
    token,
    userInfo,
    loading,
    isAuthenticated,
    checkAuth
  }
}) 