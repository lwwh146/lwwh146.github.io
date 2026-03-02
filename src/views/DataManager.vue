<template>
  <div class="data-manager">
    <div class="header">
      <h1>数据管理</h1>
    </div>

    <div class="stats-section">
      <h2>数据统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">⚖️</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.weightRecordsCount }}</div>
            <div class="stat-label">体重记录</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🍽️</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.dietRecordsCount }}</div>
            <div class="stat-label">饮食记录</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalCalories }}</div>
            <div class="stat-label">总卡路里</div>
          </div>
        </div>
      </div>
      
      <div class="date-range" v-if="stats.dateRange.earliest">
        <span>记录时间范围：</span>
        <span>{{ formatDate(stats.dateRange.earliest) }} 至 {{ formatDate(stats.dateRange.latest) }}</span>
      </div>
    </div>

    <div class="export-section">
      <h2>数据导出</h2>
      <div class="export-card">
        <div class="export-info">
          <div class="export-icon">📤</div>
          <div class="export-text">
            <p>导出所有数据为JSON文件，可以备份到本地或传输到其他设备</p>
            <p class="export-note">导出的文件包含所有体重和饮食记录</p>
          </div>
        </div>
        <button @click="exportData" class="export-btn">
          导出数据
        </button>
      </div>
    </div>

    <div class="import-section">
      <h2>数据导入</h2>
      <div class="import-card">
        <div class="import-info">
          <div class="import-icon">📥</div>
          <div class="import-text">
            <p>从JSON文件导入数据，可以合并或覆盖现有数据</p>
            <p class="import-note">支持之前导出的数据文件</p>
          </div>
        </div>
        
        <div class="import-controls">
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleFileSelect" 
            accept=".json"
            style="display: none"
          />
          <button @click="$refs.fileInput.click()" class="import-btn">
            选择文件
          </button>
          
          <div class="import-options" v-if="selectedFile">
            <div class="file-info">
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
            
            <div class="import-mode">
              <label>
                <input type="radio" v-model="importMode" value="merge" />
                合并数据（推荐）
              </label>
              <label>
                <input type="radio" v-model="importMode" value="overwrite" />
                覆盖数据
              </label>
            </div>
            
            <button @click="importData" class="confirm-import-btn" :disabled="importing">
              {{ importing ? '导入中...' : '确认导入' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="danger-section">
      <h2>危险操作</h2>
      <div class="danger-card">
        <div class="danger-info">
          <div class="danger-icon">⚠️</div>
          <div class="danger-text">
            <p>清空所有数据将删除所有体重和饮食记录，此操作不可恢复</p>
            <p class="danger-note">建议在清空前先导出数据备份</p>
          </div>
        </div>
        <button @click="confirmClearData" class="danger-btn">
          清空所有数据
        </button>
      </div>
    </div>

    <!-- 导入结果弹窗 -->
    <div class="modal-overlay" v-if="importResult" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ importResult.success ? '导入成功' : '导入失败' }}</h3>
        </div>
        <div class="modal-content">
          <p :class="{ 'error': !importResult.success }">
            {{ importResult.message }}
          </p>
          <div v-if="importResult.success" class="import-stats">
            <p>体重记录：{{ importResult.weightRecordsCount }} 条</p>
            <p>饮食记录：{{ importResult.dietRecordsCount }} 条</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="modal-btn">
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import storage from '../utils/storage.js'

export default {
  name: 'DataManager',
  data() {
    return {
      stats: {
        weightRecordsCount: 0,
        dietRecordsCount: 0,
        totalCalories: 0,
        dateRange: {
          earliest: null,
          latest: null
        }
      },
      selectedFile: null,
      importMode: 'merge',
      importing: false,
      importResult: null
    }
  },
  mounted() {
    this.loadStats()
  },
  methods: {
    loadStats() {
      this.stats = storage.getDataStats()
    },
    exportData() {
      try {
        const data = storage.exportData()
        const jsonString = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        
        // 创建下载链接
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `weight-diet-data-${new Date().toISOString().split('T')[0]}.json`
        
        // 触发下载
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理URL对象
        URL.revokeObjectURL(url)
        
        this.showToast('数据导出成功')
      } catch (error) {
        this.showToast('导出失败：' + error.message, 'error')
      }
    },
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
          this.showToast('请选择JSON文件', 'error')
          return
        }
        this.selectedFile = file
      }
    },
    importData() {
      if (!this.selectedFile) return
      
      this.importing = true
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          const result = storage.importData(data, {
            overwrite: this.importMode === 'overwrite',
            merge: this.importMode === 'merge'
          })
          
          this.importResult = result
          this.loadStats()
          
          // 重置文件选择
          this.selectedFile = null
          this.$refs.fileInput.value = ''
          
        } catch (error) {
          this.importResult = {
            success: false,
            message: '文件解析失败：' + error.message
          }
        } finally {
          this.importing = false
        }
      }
      
      reader.readAsText(this.selectedFile)
    },
    confirmClearData() {
      if (confirm('确定要清空所有数据吗？此操作不可恢复！\n建议先导出数据备份。')) {
        if (confirm('再次确认：真的要删除所有数据吗？')) {
          storage.clearAllData()
          this.loadStats()
          this.showToast('所有数据已清空')
        }
      }
    },
    closeModal() {
      this.importResult = null
    },
    formatDate(dateStr) {
      if (!dateStr) return '--'
      const date = new Date(dateStr)
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    showToast(message, type = 'success') {
      const toast = document.createElement('div')
      toast.className = 'toast'
      toast.textContent = message
      toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${type === 'error' ? 'rgba(255, 59, 48, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        max-width: 80%;
        text-align: center;
      `
      document.body.appendChild(toast)
      
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 3000)
    }
  }
}
</script>

<style scoped>
.data-manager {
  padding: 20px 20px 70px;
  max-width: 600px;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 24px;
  color: #333;
}

.stats-section, .export-section, .import-section, .danger-section {
  margin-bottom: 30px;
}

.stats-section h2, .export-section h2, .import-section h2, .danger-section h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 15px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.date-range {
  text-align: center;
  font-size: 14px;
  color: #666;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
}

.export-card, .import-card, .danger-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.export-card:hover, .import-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.danger-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(255, 59, 48, 0.2);
}

.export-info, .import-info, .danger-info {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 20px;
}

.export-icon, .import-icon, .danger-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.export-text, .import-text, .danger-text {
  flex: 1;
}

.export-text p, .import-text p, .danger-text p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.export-note, .import-note, .danger-note {
  font-size: 12px;
  color: #666;
}

.export-btn, .import-btn, .confirm-import-btn, .danger-btn {
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.export-btn {
  background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
  color: white;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 122, 255, 0.4);
}

.import-btn {
  background: linear-gradient(135deg, #34c759 0%, #28a745 100%);
  color: white;
  width: 100%;
  margin-bottom: 15px;
  box-shadow: 0 4px 20px rgba(52, 199, 89, 0.3);
}

.import-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(52, 199, 89, 0.4);
}

.confirm-import-btn {
  background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
  color: white;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
}

.confirm-import-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 122, 255, 0.4);
}

.confirm-import-btn:disabled {
  background: linear-gradient(135deg, #ccc 0%, #999 100%);
  cursor: not-allowed;
  box-shadow: none;
}

.danger-btn {
  background: linear-gradient(135deg, #ff3b30 0%, #d70015 100%);
  color: white;
  width: 100%;
  box-shadow: 0 4px 20px rgba(255, 59, 48, 0.3);
}

.danger-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(255, 59, 48, 0.4);
}

.import-options {
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(248, 248, 248, 0.9) 0%, rgba(248, 248, 248, 0.7) 100%);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  margin-bottom: 12px;
  border: 1px solid rgba(0, 122, 255, 0.2);
}

.file-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  color: #666;
}

.import-mode {
  margin-bottom: 15px;
}

.import-mode label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.import-mode input[type="radio"] {
  margin-right: 8px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 32px;
  margin: 20px;
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.modal-header h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.modal-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.modal-content p.error {
  color: #ff3b30;
}

.import-stats p {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.modal-footer {
  margin-top: 20px;
  text-align: right;
}

.modal-btn {
  padding: 10px 20px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.modal-btn:hover {
  background: #0056b3;
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .export-info, .import-info, .danger-info {
    flex-direction: column;
    text-align: center;
  }
  
  .export-icon, .import-icon, .danger-icon {
    align-self: center;
  }
}
</style>