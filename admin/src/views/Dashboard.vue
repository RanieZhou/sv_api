<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>仪表盘</h1>
      <p>系统数据总览</p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="24"><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-title">总用户数</div>
          <div class="stat-value">{{ stats.totalUsers }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="24"><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-title">解析总数</div>
          <div class="stat-value">{{ stats.totalParse }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="24"><SuccessFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-title">成功率</div>
          <div class="stat-value">{{ stats.successRate }}%</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="24"><Calendar /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-title">今日解析</div>
          <div class="stat-value">{{ stats.todayParse }}</div>
        </div>
      </div>
    </div>
    
    <div class="charts-section">
      <el-card class="chart-card">
        <template #header>
          <span>解析趋势</span>
        </template>
        <div class="chart-placeholder">
          <p>图表区域 - 可集成ECharts显示解析趋势</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { User, Document, SuccessFilled, Calendar } from '@element-plus/icons-vue'

interface Stats {
  totalUsers: number
  totalParse: number
  successRate: number
  todayParse: number
}

const stats = ref<Stats>({
  totalUsers: 0,
  totalParse: 0,
  successRate: 0,
  todayParse: 0
})

const loadStats = async () => {
  // 这里调用API获取统计数据
  // 模拟数据
  stats.value = {
    totalUsers: 1234,
    totalParse: 5678,
    successRate: 95.6,
    todayParse: 89
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.page-header {
  margin-bottom: 30px;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.charts-section {
  display: grid;
  gap: 20px;
}

.chart-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
}

:deep(.el-card__header) {
  font-weight: 600;
  color: #333;
}
</style> 