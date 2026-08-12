<template>
  <div class="banners-page">
    <div class="page-header">
      <h1>轮播图管理</h1>
      <p>管理小程序首页轮播图</p>
    </div>
    
    <el-card>
      <div class="table-header">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          添加轮播图
        </el-button>
      </div>
      
      <el-table :data="banners" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="150" />
        <el-table-column label="图片" width="120">
          <template #default="{ row }">
            <el-image 
              :src="getImageUrl(row.imageUrl)"
              :preview-src-list="[getImageUrl(row.imageUrl)]"
              style="width: 80px; height: 45px;"
              fit="cover"
              @error="handleImageError"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="linkUrl" label="链接地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑轮播图' : '添加轮播图'"
      width="600px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入轮播图标题" />
        </el-form-item>
        
        <el-form-item label="图片链接" prop="imageUrl">
          <div class="image-input-section">
            <el-input 
              v-model="form.imageUrl" 
              placeholder="请输入图片URL链接，如：https://example.com/image.jpg"
              @input="handleImageUrlChange"
            />
            <div class="image-preview" v-if="form.imageUrl">
              <el-image
                :src="form.imageUrl"
                class="preview-image"
                fit="cover"
                @error="handlePreviewError"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                    <p>图片加载失败</p>
                  </div>
                </template>
              </el-image>
            </div>
            <div class="image-tip">
              <p>• 请输入完整的图片URL地址</p>
              <p>• 建议尺寸：800x400像素</p>
              <p>• 支持 jpg、png、webp 等格式</p>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="链接地址">
          <el-input v-model="form.linkUrl" placeholder="点击轮播图跳转的链接（可选）" />
        </el-form-item>
        
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch v-model="form.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture } from '@element-plus/icons-vue'
import { bannerAPI } from '../utils/api'

interface Banner {
  id?: number
  title: string
  imageUrl: string
  linkUrl: string
  sortOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

const banners = ref<Banner[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()

// 表单数据
const form = ref<Banner>({
  title: '',
  imageUrl: '',
  linkUrl: '',
  sortOrder: 0,
  isActive: true
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入轮播图标题', trigger: 'blur' }
  ],
  imageUrl: [
    { required: true, message: '请输入图片URL链接', trigger: 'blur' },
    { 
      pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i, 
      message: '请输入有效的图片URL链接', 
      trigger: 'blur' 
    }
  ]
}

// 获取完整图片URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl
  const apiUrl = (window as any).__VITE_API_URL__ || ''
  return `${apiUrl}${imageUrl}`
}

// 处理图片URL输入变化
const handleImageUrlChange = () => {
  // 触发表单验证
  if (formRef.value) {
    formRef.value.validateField('imageUrl')
  }
}

// 处理预览图片加载错误
const handlePreviewError = () => {
  console.log('预览图片加载失败')
}

// 加载轮播图列表
const loadBanners = async () => {
  loading.value = true
  try {
    const response = await bannerAPI.getAll()
    if (response.data.success) {
      banners.value = response.data.data
    } else {
      ElMessage.error(response.data.message || '加载失败')
    }
  } catch (error) {
    console.error('加载轮播图失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.value = {
    title: '',
    imageUrl: '',
    linkUrl: '',
    sortOrder: 0,
    isActive: true
  }
  isEdit.value = false
  formRef.value?.clearValidate()
}

// 添加轮播图
const handleAdd = () => {
  resetForm()
  dialogVisible.value = true
}

// 编辑轮播图
const handleEdit = async (row: Banner) => {
  try {
    const response = await bannerAPI.getById(row.id!)
    if (response.data.success) {
      form.value = { ...response.data.data }
      isEdit.value = true
      dialogVisible.value = true
    } else {
      ElMessage.error('获取轮播图详情失败')
    }
  } catch (error) {
    console.error('获取轮播图详情失败:', error)
    ElMessage.error('获取轮播图详情失败')
  }
}

// 删除轮播图
const handleDelete = (row: Banner) => {
  ElMessageBox.confirm(
    `确定要删除轮播图"${row.title}"吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const response = await bannerAPI.delete(row.id!)
      if (response.data.success) {
        ElMessage.success('删除成功')
        loadBanners()
      } else {
        ElMessage.error(response.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    let response
    if (isEdit.value) {
      response = await bannerAPI.update(form.value.id!, form.value)
    } else {
      response = await bannerAPI.create(form.value)
    }
    
    if (response.data.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      loadBanners()
    } else {
      ElMessage.error(response.data.message || '操作失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 图片加载错误处理
const handleImageError = () => {
  console.log('图片加载失败')
}

onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.page-header p {
  color: #666;
  font-size: 14px;
}

.table-header {
  margin-bottom: 20px;
}

.image-input-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.image-preview {
  display: flex;
  justify-content: center;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
}

.preview-image {
  width: 200px;
  height: 120px;
  border-radius: 4px;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 120px;
  background: #f5f7fa;
  color: #909399;
  border-radius: 4px;
}

.image-error p {
  margin: 5px 0 0 0;
  font-size: 12px;
}

.image-tip {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.image-tip p {
  margin: 0;
  color: #666;
  font-size: 12px;
  line-height: 1.5;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 20px;
}
</style> 