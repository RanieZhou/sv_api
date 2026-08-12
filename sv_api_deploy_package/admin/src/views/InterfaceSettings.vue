<template>
  <div class="interface-settings">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>接口设置</span>
          <el-tag v-if="keyStatus === 'valid'" type="success" effect="dark">
            ✅ 密钥有效 {{ keyUserInfo ? `(${keyUserInfo})` : '' }}
          </el-tag>
          <el-tag v-else-if="keyStatus === 'invalid'" type="danger" effect="dark">
            ❌ 密钥无效 / 不存在
          </el-tag>
          <el-tag v-else type="info" effect="plain">
            ⚪ 未配置接口密钥
          </el-tag>
        </div>
      </template>
      
      <!-- 使用情况统计卡片 -->
      <el-card class="usage-stats" shadow="never">
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-label">剩余可用次数</div>
            <div class="stat-value" :class="{ 'valid-value': keyStatus === 'valid' }">
              {{ usageStats.remainingCalls }}
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">服务到期时间</div>
            <div class="stat-value" :class="{ 'valid-value': keyStatus === 'valid' }">
              {{ usageStats.expiryDate }}
            </div>
          </div>
        </div>
      </el-card>

      <el-divider />
      
      <el-form :model="formState" label-position="top">

        <!-- 只读：接口请求地址 -->
        <el-form-item label="解析接口地址（只读，不可更改）">
          <div class="readonly-url-wrap">
            <el-input
              :value="apiBaseUrl"
              readonly
              class="readonly-url-input"
            />
            <el-button plain @click="copyApiUrl">复制地址</el-button>
          </div>
          <div class="input-tip">
            <p>• 此地址为小程序调用的解析服务接口，由系统固定配置，不可手动修改</p>
          </div>
        </el-form-item>

        <el-divider />

        <!-- API Key 配置 -->
        <el-form-item label="接口密钥 (API Key)">
          <div class="input-with-button">
            <el-input
              v-model="formState.apiKey"
              placeholder="请输入有效的 API Key (如 sk_...)"
              :maxlength="100"
              show-word-limit
              clearable
              @input="handleInput"
            />
            <el-button 
              type="primary" 
              plain 
              :loading="verifying"
              @click="verifyKey(true)"
            >
              验证密钥
            </el-button>
          </div>
          <div class="input-tip">
            <p v-if="verifyMessage" :class="keyStatus === 'valid' ? 'success-text' : 'error-text'">
              {{ verifyMessage }}
            </p>
            <p v-else>• 需填写有效的 API Key，系统才能为小程序提供在线解析服务</p>
            <div class="store-link-row">
              <a href="https://shortvideo.aihubzone.cn/store/" target="_blank" class="store-link">
                🛒 没有 API Key？点此前往官方授权商城 → 注册登录即可购买开通 ↗
              </a>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            保存配置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElCard, ElDivider, ElForm, ElFormItem, ElInput, ElButton, ElTag, ElIcon } from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import { systemAPI } from '../utils/api'

// 固定只读接口地址
const apiBaseUrl = 'https://shortvideo.aihubzone.cn/api/parse'

// 复制接口地址
const copyApiUrl = () => {
  navigator.clipboard.writeText(apiBaseUrl).then(() => {
    ElMessage.success('接口地址已复制！')
  })
}

// 使用统计数据
const usageStats = reactive({
  remainingCalls: '--',
  expiryDate: '--'
})

const formState = reactive({
  apiKey: ''
})

const keyStatus = ref<'none' | 'valid' | 'invalid'>('none')
const keyUserInfo = ref('')
const verifyMessage = ref('')
const verifying = ref(false)
const submitLoading = ref(false)

// 验证 API Key 是否有效
const verifyKey = async (showToast = false) => {
  const key = formState.apiKey.trim()
  if (!key) {
    keyStatus.value = 'none'
    keyUserInfo.value = ''
    usageStats.remainingCalls = '--'
    usageStats.expiryDate = '--'
    verifyMessage.value = ''
    if (showToast) ElMessage.warning('请输入 API Key 后再进行验证')
    return false
  }

  verifying.value = true
  try {
    const res = await systemAPI.verifyApiKeyConfig(key)
    const data = res.data

    if (data.success && data.valid) {
      keyStatus.value = 'valid'
      keyUserInfo.value = data.data.userName || ''
      usageStats.remainingCalls = data.data.remainingCalls
      usageStats.expiryDate = data.data.expiryDate
      verifyMessage.value = `✅ 校验成功：剩余 ${data.data.remainingCalls}，到期时间 ${data.data.expiryDate}`
      if (showToast) ElMessage.success('API Key 校验有效！')
      return true
    } else {
      keyStatus.value = 'invalid'
      keyUserInfo.value = ''
      usageStats.remainingCalls = '--'
      usageStats.expiryDate = '--'
      verifyMessage.value = `❌ ${data.message || 'API Key 无效或不存在'}`
      if (showToast) ElMessage.error(data.message || 'API Key 无效或不存在')
      return false
    }
  } catch (error: any) {
    console.error('校验失败:', error)
    keyStatus.value = 'invalid'
    verifyMessage.value = '❌ 网络请求失败或服务端异常'
    if (showToast) ElMessage.error('校验失败')
    return false
  } finally {
    verifying.value = false
  }
}

// 防抖或输入变动处理
let timer: any = null
const handleInput = () => {
  if (timer) clearTimeout(timer)
  if (!formState.apiKey.trim()) {
    verifyKey(false)
    return
  }
  timer = setTimeout(() => {
    verifyKey(false)
  }, 600)
}

// 获取已保存的 API 密钥配置
const getApiKeyConfig = async () => {
  try {
    const res = await systemAPI.getApiKeyConfig()
    const data = res.data
    if (data.success && data.data?.api_key) {
      formState.apiKey = data.data.api_key
      if (formState.apiKey) {
        await verifyKey(false)
      }
    } else {
      formState.apiKey = ''
      verifyKey(false)
    }
  } catch (error: unknown) {
    console.error('获取配置失败:', error)
    ElMessage.error('获取配置失败')
  }
}

// 保存 API 密钥
const handleSubmit = async () => {
  const key = formState.apiKey.trim()
  if (!key) {
    ElMessage.warning('请输入 API 密钥后再保存')
    return
  }
  
  // 保存前进行有效性校验
  const isValid = await verifyKey(false)
  if (!isValid) {
    ElMessage.error('当前 Key 校验无效，请填写正确的 API Key 后再保存！')
    return
  }

  submitLoading.value = true
  try {
    const res = await systemAPI.saveApiKeyConfig({ api_key: key })
    const data = res.data
    if (data.success) {
      ElMessage.success('保存接口密钥配置成功！')
    } else {
      ElMessage.error(data.message || '保存失败')
    }
  } catch (error: unknown) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    submitLoading.value = false
  }
}

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
  border-radius: 8px;
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
  color: #909399;
  font-weight: bold;
}

.stat-value.valid-value {
  color: #409EFF;
}

.input-with-button {
  display: flex;
  gap: 12px;
  width: 100%;
}

.input-tip {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.success-text {
  color: #67C23A;
  font-weight: 500;
}

.error-text {
  color: #F56C6C;
  font-weight: 500;
}

.el-divider {
  margin: 24px 0;
}

.readonly-url-wrap {
  display: flex;
  gap: 12px;
  width: 100%;
}

.readonly-url-input {
  flex: 1;
}

:deep(.readonly-url-input .el-input__inner) {
  cursor: default;
  color: #606266;
  background-color: #f5f7fa;
}

.store-link-row {
  margin-top: 10px;
}

.store-link {
  display: inline-block;
  color: #409EFF;
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
  padding: 6px 12px;
  border: 1px solid #409EFF;
  border-radius: 6px;
  transition: all 0.2s;
}

.store-link:hover {
  background-color: #409EFF;
  color: #fff;
}
</style>