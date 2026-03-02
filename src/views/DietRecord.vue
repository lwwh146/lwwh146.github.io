<template>
  <div class="diet-record">
    <div class="header">
      <h1>饮食记录</h1>
    </div>

    <div class="add-record">
      <div class="form-group">
        <label>日期</label>
        <input 
          type="date" 
          v-model="newRecord.date" 
          :max="maxDate"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label>餐次</label>
        <div class="meal-types">
          <button 
            v-for="type in mealTypes" 
            :key="type.value"
            @click="newRecord.mealType = type.value"
            :class="{ active: newRecord.mealType === type.value }"
            class="meal-type-btn"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
      
      <div class="form-group">
        <label>食物</label>
        <input 
          type="text" 
          v-model="newRecord.food" 
          placeholder="请输入食物名称"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label>卡路里 (可选)</label>
        <input 
          type="number" 
          v-model="newRecord.calories" 
          placeholder="请输入卡路里"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label>备注</label>
        <textarea 
          v-model="newRecord.note" 
          placeholder="可选：记录用餐感受、制作方法等"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
      
      <button @click="addRecord" class="add-btn" :disabled="!canAdd">
        添加记录
      </button>
    </div>

    <div class="records-list">
      <h2>今日记录</h2>
      
      <div class="date-selector">
        <button @click="previousDay" class="date-nav-btn">◀</button>
        <span class="current-date">{{ formatDate(selectedDate) }}</span>
        <button @click="nextDay" class="date-nav-btn">▶</button>
      </div>

      <div class="meal-section" v-for="mealType in mealTypes" :key="mealType.value">
        <h3>{{ mealType.label }}</h3>
        <div class="diet-cards">
          <div v-for="record in getRecordsByMealType(mealType.value)" :key="record.id" class="diet-card">
            <div class="card-header">
              <div class="food-info">
                <div class="food-name">{{ record.food }}</div>
                <div class="calories" v-if="record.calories">{{ record.calories }} kcal</div>
              </div>
              <button @click="deleteRecord(record.id)" class="delete-btn">
                🗑️
              </button>
            </div>
            
            <div class="time">{{ formatTime(record.createdAt) }}</div>
            
            <div class="note" v-if="record.note">
              {{ record.note }}
            </div>
          </div>
          
          <div class="empty-meal" v-if="getRecordsByMealType(mealType.value).length === 0">
            <span>暂无{{ mealType.label }}记录</span>
          </div>
        </div>
      </div>

      <div class="daily-summary" v-if="todayRecords.length > 0">
        <h3>今日统计</h3>
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-label">总餐数</div>
            <div class="summary-value">{{ todayRecords.length }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">总卡路里</div>
            <div class="summary-value">{{ totalCalories }}</div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-if="todayRecords.length === 0">
        <div class="empty-icon">🍽️</div>
        <p>今天还没有饮食记录</p>
      </div>
    </div>
  </div>
</template>

<script>
import storage from '../utils/storage.js'

export default {
  name: 'DietRecord',
  data() {
    return {
      newRecord: {
        date: new Date().toISOString().split('T')[0],
        mealType: 'breakfast',
        food: '',
        calories: '',
        note: ''
      },
      records: [],
      selectedDate: new Date().toISOString().split('T')[0],
      mealTypes: [
        { value: 'breakfast', label: '早餐' },
        { value: 'lunch', label: '午餐' },
        { value: 'dinner', label: '晚餐' },
        { value: 'snack', label: '加餐' }
      ],
      maxDate: new Date().toISOString().split('T')[0]
    }
  },
  computed: {
    canAdd() {
      return this.newRecord.food && this.newRecord.mealType
    },
    todayRecords() {
      return this.records.filter(record => record.date === this.selectedDate)
    },
    totalCalories() {
      return this.todayRecords.reduce((total, record) => {
        return total + (record.calories || 0)
      }, 0)
    }
  },
  mounted() {
    this.loadRecords()
  },
  methods: {
    loadRecords() {
      this.records = storage.getDietRecords()
    },
    addRecord() {
      if (!this.canAdd) return
      
      storage.saveDietRecord({
        date: this.newRecord.date,
        mealType: this.newRecord.mealType,
        food: this.newRecord.food,
        calories: this.newRecord.calories ? parseInt(this.newRecord.calories) : 0,
        note: this.newRecord.note
      })
      
      // 重置表单
      this.newRecord = {
        date: new Date().toISOString().split('T')[0],
        mealType: 'breakfast',
        food: '',
        calories: '',
        note: ''
      }
      
      // 重新加载数据
      this.loadRecords()
      
      // 显示成功提示
      this.showToast('饮食记录添加成功')
    },
    deleteRecord(id) {
      if (confirm('确定要删除这条记录吗？')) {
        storage.deleteDietRecord(id)
        this.loadRecords()
        this.showToast('记录已删除')
      }
    },
    getRecordsByMealType(mealType) {
      return this.todayRecords
        .filter(record => record.mealType === mealType)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },
    previousDay() {
      const date = new Date(this.selectedDate)
      date.setDate(date.getDate() - 1)
      this.selectedDate = date.toISOString().split('T')[0]
    },
    nextDay() {
      const date = new Date(this.selectedDate)
      date.setDate(date.getDate() + 1)
      if (date <= new Date()) {
        this.selectedDate = date.toISOString().split('T')[0]
      }
    },
    formatDate(dateStr) {
      const date = new Date(dateStr)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (date.toDateString() === today.toDateString()) {
        return '今天'
      } else if (date.toDateString() === yesterday.toDateString()) {
        return '昨天'
      } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`
      }
    },
    formatTime(timeStr) {
      const date = new Date(timeStr)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    showToast(message) {
      // 简单的toast提示实现
      const toast = document.createElement('div')
      toast.className = 'toast'
      toast.textContent = message
      toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
      `
      document.body.appendChild(toast)
      
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 2000)
    }
  }
}
</script>

<style scoped>
.diet-record {
  padding: 20px 20px 70px;
  max-width: 600px;
  /* margin: 0 auto; */
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

.add-record {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.form-input, .form-textarea {
  width: 100%;
  padding: 14px;
  border: 2px solid rgba(0, 122, 255, 0.1);
  border-radius: 12px;
  font-size: 16px;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #007aff;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}

.meal-types {
  display: flex;
  gap: 10px;
}

.meal-type-btn {
  flex: 1;
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(0, 122, 255, 0.1);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.meal-type-btn.active {
  background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
  color: white;
  border-color: #007aff;
  box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.meal-type-btn:hover:not(.active) {
  border-color: rgba(0, 122, 255, 0.3);
  background: rgba(0, 122, 255, 0.05);
}

.add-btn {
  width: 100%;
  padding: 14px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.add-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.add-btn:not(:disabled):hover {
  background: #0056b3;
}

.records-list h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}

.date-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.date-nav-btn {
  background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 10px;
  color: white;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 122, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.date-nav-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(0, 122, 255, 0.4);
}

.current-date {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  min-width: 100px;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.meal-section {
  margin-bottom: 30px;
}

.meal-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
  padding-left: 4px;
}

.diet-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diet-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.diet-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.food-info {
  flex: 1;
}

.food-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.calories {
  font-size: 14px;
  color: #666;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
}

.time {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.note {
  font-size: 14px;
  color: #666;
  padding: 8px;
  background: #f8f8f8;
  border-radius: 6px;
}

.empty-meal {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
  background: #f8f8f8;
  border-radius: 8px;
}

.daily-summary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.daily-summary h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
}

.summary-cards {
  display: flex;
  gap: 12px;
}

.summary-card {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba(248, 248, 248, 0.9) 0%, rgba(248, 248, 248, 0.7) 100%);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.summary-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
  color: #007aff;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>