<template>
  <div class="admin-layout">
    <el-container class="layout-container">
      <!-- 侧边栏 -->
      <el-aside :width="collapsed ? '64px' : '240px'" class="sidebar">
        <div class="logo-container">
          <div class="logo">
            <span v-if="!collapsed">去水印管理</span>
            <span v-else>管</span>
          </div>
        </div>
        
        <el-menu
          :default-active="$route.path"
          router
          :collapse="collapsed"
          :collapse-transition="false"
          class="sidebar-menu"
        >
          <el-menu-item index="/banners">
            <el-icon><Picture /></el-icon>
            <span>轮播图管理</span>
          </el-menu-item>
          
          <el-menu-item index="/miniprogram-settings">
            <el-icon><Setting /></el-icon>
            <span>小程序设置</span>
          </el-menu-item>

          <el-menu-item index="/interface-settings">
            <el-icon><Link /></el-icon>
            <span>接口设置</span>
          </el-menu-item>

          <el-menu-item index="/ad-settings">
            <el-icon><Money /></el-icon>
            <span>流量主设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <!-- 主内容区域 -->
      <el-container class="main-container">
        <!-- 顶部导航 -->
        <el-header class="header">
          <div class="header-left">
            <el-button 
              text 
              @click="toggleSidebar"
              class="collapse-btn"
            >
              <el-icon><Menu /></el-icon>
            </el-button>
            
            <el-breadcrumb separator="/">
              <el-breadcrumb-item to="/">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="$route.meta.title">
                {{ $route.meta.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <el-dropdown @command="handleUserAction">
              <span class="user-info">
                <el-icon><Avatar /></el-icon>
                <span>{{ userInfo.username || 'Admin' }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 主内容 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Picture,
  Menu,
  Avatar,
  ArrowDown,
  Link,
  Money,
  Setting,
  Key
} from '@element-plus/icons-vue'

const router = useRouter()

const collapsed = ref(false)

// 从localStorage获取用户信息
const userInfo = computed(() => {
  const userInfoStr = localStorage.getItem('user_info')
  if (userInfoStr) {
    try {
      return JSON.parse(userInfoStr)
    } catch {
      return { username: 'User' }
    }
  }
  return { username: 'User' }
})

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const handleUserAction = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm(
        '确定要退出登录吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      // 清除用户信息
      localStorage.removeItem('admin_token')
      localStorage.removeItem('user_info')
      
      ElMessage.success('已退出登录')
      router.push({ name: 'Login' })
    } catch {
      // 用户取消操作
    }
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.layout-container {
  height: 100%;
}

.sidebar {
  background: #001529;
  transition: width 0.3s ease;
  overflow: hidden;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #1f2937;
}

.logo {
  color: white;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.sidebar-menu {
  border-right: none;
  background: #001529;
}

:deep(.el-menu-item) {
  color: #b3b3b3;
  border-radius: 0;
}

:deep(.el-menu-item:hover) {
  background: #1f2937 !important;
  color: #667eea !important;
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
}

:deep(.el-menu--collapse .el-menu-item) {
  padding: 0 20px;
}

.main-container {
  background: #f5f7fa;
}

.header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-btn {
  font-size: 18px;
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #666;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.user-info:hover {
  background: #f5f7fa;
}

.main-content {
  padding: 20px;
  overflow-y: auto;
}

:deep(.el-breadcrumb__inner) {
  font-weight: normal;
}

.external-menu-link {
  text-decoration: none;
  color: inherit;
}
</style> 