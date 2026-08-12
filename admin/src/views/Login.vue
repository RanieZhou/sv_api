<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
        <h2>去水印管理后台</h2>
        <p>请输入管理员密码登录</p>
      </div>

      <el-form :model="loginForm" :rules="rules" ref="formRef" @keyup.enter="handleLogin">
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入管理员密码"
            show-password
            size="large"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'
import { authAPI } from '../utils/api'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  password: ''
})

const rules = {
  password: [
    { required: true, message: '请输入管理员密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const res = await authAPI.login(loginForm.password)
    if (res.data.code === 200 && res.data.data?.token) {
      localStorage.setItem('admin_token', res.data.data.token)
      localStorage.setItem('user_info', JSON.stringify({ username: 'Admin' }))
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error(res.data.msg || '密码错误')
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    ElMessage.error(error.response?.data?.msg || '密码错误或网络问题')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.login-card {
  width: 400px;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 24px;
  color: #1e293b;
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: #64748b;
}

.login-button {
  width: 100%;
  border-radius: 8px;
  background: linear-gradient(135deg, #4A7EE6 0%, #6B5BEF 100%);
  border: none;
}
</style>
