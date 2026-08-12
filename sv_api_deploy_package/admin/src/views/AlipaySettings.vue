<template>
  <div class="alipay-settings">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>支付宝支付配置</span>
          <el-tag v-if="configured" type="success" effect="dark">✅ 已配置</el-tag>
          <el-tag v-else type="warning" effect="plain">⚠️ 未配置</el-tag>
        </div>
      </template>

      <!-- 说明卡片 -->
      <el-alert
        title="配置说明"
        type="info"
        :closable="false"
        style="margin-bottom: 24px;"
      >
        <template #default>
          <p>1. 前往 <a href="https://open.alipay.com/" target="_blank" class="link">支付宝开放平台</a> 创建应用并开通「当面付」产品</p>
          <p>2. 生成 RSA2 密钥对，上传应用公钥，获取支付宝公钥</p>
          <p>3. 填写下方配置并保存，配置将即时生效，无需重启服务</p>
          <p>4. 沙箱模式可在 <a href="https://open.alipay.com/develop/sandbox/app" target="_blank" class="link">沙箱环境</a> 测试，无需真实付款</p>
        </template>
      </el-alert>

      <el-form :model="form" label-position="top" ref="formRef">
        <!-- 运行模式 -->
        <el-form-item label="运行模式">
          <el-switch
            v-model="form.sandbox"
            active-text="沙箱测试环境"
            inactive-text="生产正式环境"
            active-color="#e6a23c"
            inactive-color="#67c23a"
          />
          <div class="input-tip">
            <p v-if="form.sandbox">⚠️ 当前为沙箱模式，仅用于开发测试，不会真实扣款</p>
            <p v-else>✅ 当前为生产模式，用户支付将真实扣款并自动发卡</p>
          </div>
        </el-form-item>

        <el-divider />

        <!-- App ID -->
        <el-form-item label="支付宝 App ID" required>
          <el-input
            v-model="form.appId"
            placeholder="如：2021000000000000"
            clearable
          />
          <div class="input-tip">
            <p>• 在支付宝开放平台「我的应用」中查看 App ID</p>
          </div>
        </el-form-item>

        <!-- 应用私钥 -->
        <el-form-item label="应用私钥 (RSA2 私钥)" required>
          <el-input
            v-model="form.privateKey"
            type="textarea"
            :rows="5"
            :placeholder="privatekeyPlaceholder"
          />
          <div class="input-tip">
            <p>• 粘贴完整的 PKCS8 格式应用私钥（包含 -----BEGIN...）</p>
            <p v-if="configured" style="color: #e6a23c;">• 已有配置，若不修改私钥请保持为空（留空则保留原有值）</p>
          </div>
        </el-form-item>

        <!-- 支付宝公钥 -->
        <el-form-item label="支付宝公钥" required>
          <el-input
            v-model="form.alipayPublicKey"
            type="textarea"
            :rows="5"
            :placeholder="alipayPublicKeyPlaceholder"
          />
          <div class="input-tip">
            <p>• 在开放平台「开发设置」→「接口加签方式」中复制支付宝公钥</p>
            <p v-if="configured" style="color: #e6a23c;">• 已有配置，若不修改公钥请保持为空（留空则保留原有值）</p>
          </div>
        </el-form-item>

        <el-divider />

        <!-- 只读：异步通知地址 -->
        <el-form-item label="异步通知地址 (notify_url，只读)">
          <div class="readonly-wrap">
            <el-input :value="notifyUrl" readonly />
            <el-button plain @click="copyNotifyUrl">复制</el-button>
          </div>
          <div class="input-tip">
            <p>• 将此地址填入支付宝开放平台「应用详情」→「接口内容加密方式」的 notify_url 配置中</p>
            <p>• 此地址必须公网可访问（您的域名已满足条件）</p>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving" size="large">
            保存支付宝配置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { systemAPI } from '../utils/api'

const notifyUrl = 'https://shortvideo.aihubzone.cn/api/alipay/notify'

const form = reactive({
  appId: '',
  privateKey: '',
  alipayPublicKey: '',
  sandbox: false,
})

const configured = ref(false)
const saving = ref(false)

const privatekeyPlaceholder = computed(() =>
  configured.value
    ? '已有私钥配置，若需更新请重新粘贴完整私钥，否则留空保留原值'
    : '-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----'
)

const alipayPublicKeyPlaceholder = computed(() =>
  configured.value
    ? '已有支付宝公钥配置，若需更新请重新粘贴，否则留空保留原值'
    : 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...'
)

const copyNotifyUrl = () => {
  navigator.clipboard.writeText(notifyUrl).then(() => {
    ElMessage.success('通知地址已复制！')
  })
}

const loadConfig = async () => {
  try {
    const res = await systemAPI.request('GET', '/admin/alipay-config')
    const data = res.data
    if (data.code === 200 && data.data) {
      configured.value = true
      form.appId = data.data.appId || ''
      form.sandbox = !!data.data.sandbox
      // 私钥和公钥显示脱敏提示，不回填真实值
      form.privateKey = ''
      form.alipayPublicKey = ''
    }
  } catch (e) {
    console.error('读取支付宝配置失败:', e)
  }
}

const handleSave = async () => {
  if (!form.appId.trim()) {
    ElMessage.warning('请填写 App ID')
    return
  }

  // 已配置时私钥允许留空（保留原值），未配置时必填
  if (!configured.value && !form.privateKey.trim()) {
    ElMessage.warning('请填写应用私钥')
    return
  }
  if (!configured.value && !form.alipayPublicKey.trim()) {
    ElMessage.warning('请填写支付宝公钥')
    return
  }

  saving.value = true
  try {
    const payload: any = {
      appId: form.appId.trim(),
      sandbox: form.sandbox,
    }
    // 留空时后端会自动保留旧值
    payload.privateKey = form.privateKey.trim() || '******（保留原值）'
    payload.alipayPublicKey = form.alipayPublicKey.trim() || '******（保留原值）'

    const res = await systemAPI.request('POST', '/admin/alipay-config', payload)
    if (res.data.code === 200) {
      ElMessage.success('支付宝配置已保存并即时生效！')
      configured.value = true
      form.privateKey = ''
      form.alipayPublicKey = ''
    } else {
      ElMessage.error(res.data.msg || '保存失败')
    }
  } catch (e: any) {
    ElMessage.error('保存失败：' + (e.message || '网络错误'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.alipay-settings {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-tip {
  margin-top: 6px;
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

.input-tip p {
  margin: 2px 0;
}

.readonly-wrap {
  display: flex;
  gap: 12px;
  width: 100%;
}

.link {
  color: #409EFF;
}

.el-alert p {
  margin: 4px 0;
  font-size: 13px;
}
</style>
