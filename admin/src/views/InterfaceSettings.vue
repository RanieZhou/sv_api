<template>
  <div class="interface-settings">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>接口设置</span>
        </div>
      </template>
      
      <!-- 添加使用情况统计卡片 -->
      <el-card class="usage-stats" shadow="never">
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-label">剩余可用次数</div>
            <div class="stat-value">{{ usageStats.remainingCalls }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">服务到期时间</div>
            <div class="stat-value">{{ usageStats.expiryDate }}</div>
          </div>
        </div>
      </el-card>

      <el-divider />
      
      <el-form :model="formState" label-position="top">
        <el-form-item label="接口密钥">
          <el-input
            v-model="formState.apiKey"
            placeholder="请输入接口密钥"
            :maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { ElMessage, ElCard, ElDivider, ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'
import { systemAPI } from '../utils/api'

// 使用统计数据
const usageStats = reactive({
  remainingCalls: '不限次数',
  expiryDate: '永不过期'
})

const formState = reactive({
  apiKey: ''
})

// 获取已保存的API密钥配置
const getApiKeyConfig = async () => {
  try {
    const res = await systemAPI.getApiKeyConfig()
    const data = res.data
    if (data.success && data.data?.api_key) {
      formState.apiKey = data.data.api_key
    }
  } catch (error: unknown) {
    console.error('获取配置失败:', error)
    ElMessage.error('获取配置失败')
  }
}

// 保存API密钥
const handleSubmit = async () => {
  if (!formState.apiKey) {
    ElMessage.warning('请输入API密钥')
    return
  }
  
  try {
    const res = await systemAPI.saveApiKeyConfig({ api_key: formState.apiKey })
    const data = res.data
    if (data.success) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error(data.message || '保存失败')
    }
  } catch (error: unknown) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// 组件挂载时获取配置
onMounted(() => {
  getApiKeyConfig()
})
</script>

<style scoped>
.interface-settings {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.usage-stats {
  margin-bottom: 20px;
  background-color: #f8f9fa;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
}

.stat-item {
  text-align: center;
  padding: 0 20px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  color: #303133;
  font-weight: bold;
}

.el-divider {
  margin: 24px 0;
}
</style> 