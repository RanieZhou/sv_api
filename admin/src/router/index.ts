import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { title: '管理员登录' }
    },
    {
      path: '/',
      component: AdminLayout,
      children: [
        {
          path: '',
          redirect: '/banners'
        },
        {
          path: 'banners',
          name: 'Banners',
          component: () => import('@/views/Banners.vue'),
          meta: { title: '轮播图管理', requiresAuth: true }
        },
        {
          path: 'miniprogram-settings',
          name: 'MiniprogramSettings',
          component: () => import('@/views/MiniprogramSettings.vue'),
          meta: { title: '小程序设置', requiresAuth: true }
        },
        {
          path: 'interface-settings',
          name: 'InterfaceSettings',
          component: () => import('@/views/InterfaceSettings.vue'),
          meta: { title: '接口设置', requiresAuth: true }
        },
        {
          path: 'ad-settings',
          name: 'AdSettings',
          component: () => import('@/views/AdSettings.vue'),
          meta: { title: '流量主设置', requiresAuth: true }
        },
        {
          path: 'alipay-settings',
          name: 'AlipaySettings',
          component: () => import('@/views/AlipaySettings.vue'),
          meta: { title: '支付宝配置', requiresAuth: true }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue')
    }
  ]
})

// 路由拦截器与标题修改
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 去水印小程序管理后台`
  }

  const token = localStorage.getItem('admin_token')
  if (to.name !== 'Login' && !token) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && token) {
    next({ path: '/' })
  } else {
    next()
  }
})

export default router