<template>
  <div class="ad-settings">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>流量主设置</span>
        </div>
      </template>
      
      <div class="tip-text">在这里您可以设置小程序的流量主广告ID，复制时请注意删除空格！</div>
      
      <el-form :model="formState" label-position="top">
        <el-form-item label="工具页原生广告ID">
          <el-input
            v-model="formState.toolPageAdId"
            placeholder="请输入工具页原生广告ID"
            :maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="插屏广告ID">
          <el-input
            v-model="formState.interstitialAdId"
            placeholder="请输入插屏广告ID"
            :maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="激励广告ID">
          <el-input
            v-model="formState.rewardedAdId"
            placeholder="请输入激励广告ID"
            :maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="视频广告ID">
          <el-input
            v-model="formState.videoAdId"
            placeholder="请输入视频广告ID"
            :maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="原生广告">
          <el-input
            v-model="formState.nativeAdId"
            placeholder="请输入原生广告ID"
            :maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { systemAPI } from '../utils/api'

const formState = reactive({
  toolPageAdId: '',
  interstitialAdId: '',
  rewardedAdId: '',
  videoAdId: '',
  nativeAdId: ''
})

const loadAdSettings = async () => {
  try {
    const res = await systemAPI.getAdConfig()
    const data = res.data
    if (data.success && data.data) {
      Object.assign(formState, data.data)
    }
  } catch (error) {
    console.error('获取广告配置失败:', error)
  }
}

const handleSubmit = async () => {
  try {
    const res = await systemAPI.saveAdConfig(formState)
    if (res.data.success) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error(res.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存广告配置失败:', error)
    ElMessage.error('保存失败')
  }
}

const handleReset = () => {
  formState.toolPageAdId = ''
  formState.interstitialAdId = ''
  formState.rewardedAdId = ''
  formState.videoAdId = ''
  formState.nativeAdId = ''
  ElMessage.success('已重置表单')
}

onMounted(() => {
  loadAdSettings()
})
</script>

<style scoped>
.ad-settings {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tip-text {
  color: #909399;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f4f4f5;
  border-radius: 4px;
}
</style> 