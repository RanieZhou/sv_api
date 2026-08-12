<template>
  <div class="miniprogram-settings-page">
    <div class="page-header">
      <h1>小程序设置</h1>
      <p>配置小程序的基本信息和通知</p>
    </div>
    
    <el-card>
      <template #header>
        <span>基本信息</span>
      </template>
      
      <el-form 
        :model="settingsForm" 
        :rules="rules" 
        ref="formRef" 
        label-width="120px"
        v-loading="loading"
      >
        <el-form-item label="小程序名称" prop="appName">
          <el-input 
            v-model="settingsForm.appName" 
            placeholder="请输入小程序名称"
            maxlength="20"
            show-word-limit
          />
          <div class="form-tip">
            显示在首页以及我的页面，建议不超过10个字符
          </div>
        </el-form-item>
        
        <el-form-item label="小程序APPID" prop="appId">
          <el-input 
            v-model="settingsForm.appId" 
            placeholder="请输入小程序APPID"
            maxlength="50"
          />
          <div class="form-tip">
            微信小程序的唯一标识符，格式如：wx1234567890abcdef
          </div>
        </el-form-item>
        
        <el-form-item label="滚动通知" prop="noticeText">
          <el-input 
            v-model="settingsForm.noticeText" 
            type="textarea"
            :rows="3"
            placeholder="请输入滚动通知内容"
            maxlength="200"
            show-word-limit
          />
          <div class="form-tip">
            在小程序首页显示的滚动通知，留空则不显示
          </div>
        </el-form-item>
        
        <el-form-item label="通知状态">
          <el-switch 
            v-model="settingsForm.noticeEnabled"
            active-text="启用"
            inactive-text="禁用"
          />
          <div class="form-tip">
            控制滚动通知是否在小程序中显示
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">
            保存设置
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 预览区域 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <span>预览效果</span>
      </template>
      
      <div class="preview-container">
        <div class="miniprogram-preview">
          <div class="preview-header">
            <span class="app-name">{{ settingsForm.appName || '小程序名称' }}</span>
          </div>
          
          <div v-if="settingsForm.noticeEnabled && settingsForm.noticeText" class="preview-notice">
            <el-icon><Notification /></el-icon>
            <span class="notice-text">{{ settingsForm.noticeText }}</span>
          </div>
          
          <div class="preview-content">
            <p>这里是小程序首页内容预览...</p>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Notification } from '@element-plus/icons-vue'
import { systemAPI } from '../utils/api'

interface SettingsForm {
  appName: string
  appId: string
  noticeText: string
  noticeEnabled: boolean
}

const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)

const settingsForm = reactive<SettingsForm>({
  appName: '',
  appId: '',
  noticeText: '',
  noticeEnabled: true
})

const rules: FormRules = {
  appName: [
    { required: true, message: '请输入小程序名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  appId: [
    { required: true, message: '请输入小程序APPID', trigger: 'blur' },
    { pattern: /^wx[a-zA-Z0-9]{16}$/, message: 'APPID格式不正确', trigger: 'blur' }
  ]
}

// 加载设置
const loadSettings = async () => {
  loading.value = true
  try {
    const response = await systemAPI.getMiniprogramConfig()
    if (response.data.success) {
      Object.assign(settingsForm, response.data.data)
    }
  } catch (error) {
    console.error('加载设置失败:', error)
    ElMessage.error('加载设置失败')
  } finally {
    loading.value = false
  }
}

// 保存设置
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    saving.value = true
    
    const response = await systemAPI.saveMiniprogramConfig(settingsForm)
    
    if (response.data.success) {
      ElMessage.success('设置保存成功')
    } else {
      ElMessage.error(response.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 重置表单
const handleReset = () => {
  formRef.value?.resetFields()
  loadSettings()
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.miniprogram-settings-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-header p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.preview-container {
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.miniprogram-preview {
  max-width: 350px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.preview-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  text-align: center;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
}

.preview-notice {
  background: #fef3c7;
  color: #92400e;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.notice-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-content {
  padding: 20px;
  text-align: center;
  color: #6b7280;
}
</style> 