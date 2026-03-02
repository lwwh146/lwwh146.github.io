// 数据存储工具类
class Storage {
  constructor() {
    this.keys = {
      WEIGHT_RECORDS: 'weight_records',
      DIET_RECORDS: 'diet_records'
    }
  }

  // 获取体重记录
  getWeightRecords() {
    const data = localStorage.getItem(this.keys.WEIGHT_RECORDS)
    return data ? JSON.parse(data) : []
  }

  // 保存体重记录
  saveWeightRecord(record) {
    const records = this.getWeightRecords()
    records.push({
      id: Date.now(),
      date: record.date || new Date().toISOString().split('T')[0],
      weight: parseFloat(record.weight),
      note: record.note || '',
      createdAt: new Date().toISOString()
    })
    localStorage.setItem(this.keys.WEIGHT_RECORDS, JSON.stringify(records))
    return records
  }

  // 删除体重记录
  deleteWeightRecord(id) {
    const records = this.getWeightRecords()
    const filteredRecords = records.filter(record => record.id !== id)
    localStorage.setItem(this.keys.WEIGHT_RECORDS, JSON.stringify(filteredRecords))
    return filteredRecords
  }

  // 获取饮食记录
  getDietRecords() {
    const data = localStorage.getItem(this.keys.DIET_RECORDS)
    return data ? JSON.parse(data) : []
  }

  // 保存饮食记录
  saveDietRecord(record) {
    const records = this.getDietRecords()
    records.push({
      id: Date.now(),
      date: record.date || new Date().toISOString().split('T')[0],
      mealType: record.mealType, // breakfast, lunch, dinner, snack
      food: record.food,
      calories: record.calories ? parseInt(record.calories) : 0,
      note: record.note || '',
      createdAt: new Date().toISOString()
    })
    localStorage.setItem(this.keys.DIET_RECORDS, JSON.stringify(records))
    return records
  }

  // 删除饮食记录
  deleteDietRecord(id) {
    const records = this.getDietRecords()
    const filteredRecords = records.filter(record => record.id !== id)
    localStorage.setItem(this.keys.DIET_RECORDS, JSON.stringify(filteredRecords))
    return filteredRecords
  }

  // 获取指定日期的饮食记录
  getDietRecordsByDate(date) {
    const records = this.getDietRecords()
    return records.filter(record => record.date === date)
  }

  // 获取体重趋势数据（用于图表）
  getWeightTrend(days = 30) {
    const records = this.getWeightRecords()
    const sortedRecords = records.sort((a, b) => new Date(a.date) - new Date(b.date))
    
    // 获取最近N天的数据
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)
    
    return sortedRecords.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate >= startDate && recordDate <= endDate
    })
  }

  // 清空所有数据
  clearAllData() {
    localStorage.removeItem(this.keys.WEIGHT_RECORDS)
    localStorage.removeItem(this.keys.DIET_RECORDS)
  }

  // 导出所有数据
  exportData() {
    const data = {
      weightRecords: this.getWeightRecords(),
      dietRecords: this.getDietRecords(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    return data
  }

  // 导入数据
  importData(data, options = {}) {
    const { overwrite = false, merge = true } = options
    
    try {
      // 验证数据格式
      if (!data || typeof data !== 'object') {
        throw new Error('无效的数据格式')
      }

      let importedWeightRecords = []
      let importedDietRecords = []

      // 处理体重记录
      if (data.weightRecords && Array.isArray(data.weightRecords)) {
        importedWeightRecords = data.weightRecords.filter(record =>
          record &&
          typeof record.weight === 'number' &&
          record.date &&
          !isNaN(new Date(record.date).getTime())
        )
      }

      // 处理饮食记录
      if (data.dietRecords && Array.isArray(data.dietRecords)) {
        importedDietRecords = data.dietRecords.filter(record =>
          record &&
          record.food &&
          record.mealType &&
          record.date &&
          !isNaN(new Date(record.date).getTime())
        )
      }

      if (overwrite) {
        // 完全覆盖模式
        localStorage.setItem(this.keys.WEIGHT_RECORDS, JSON.stringify(importedWeightRecords))
        localStorage.setItem(this.keys.DIET_RECORDS, JSON.stringify(importedDietRecords))
      } else if (merge) {
        // 合并模式
        const existingWeightRecords = this.getWeightRecords()
        const existingDietRecords = this.getDietRecords()
        
        // 去重合并（基于日期和ID）
        const mergedWeightRecords = this.mergeRecords(existingWeightRecords, importedWeightRecords)
        const mergedDietRecords = this.mergeRecords(existingDietRecords, importedDietRecords)
        
        localStorage.setItem(this.keys.WEIGHT_RECORDS, JSON.stringify(mergedWeightRecords))
        localStorage.setItem(this.keys.DIET_RECORDS, JSON.stringify(mergedDietRecords))
      }

      return {
        success: true,
        weightRecordsCount: importedWeightRecords.length,
        dietRecordsCount: importedDietRecords.length,
        message: '数据导入成功'
      }
    } catch (error) {
      return {
        success: false,
        message: `导入失败: ${error.message}`
      }
    }
  }

  // 合并记录，去重
  mergeRecords(existingRecords, importedRecords) {
    const merged = [...existingRecords]
    const existingIds = new Set(existingRecords.map(r => r.id))
    const existingDates = new Set(existingRecords.map(r => `${r.date}_${r.mealType || 'weight'}`))
    
    importedRecords.forEach(record => {
      // 如果有ID且不存在，或者没有ID但日期+餐次不重复，则添加
      if ((record.id && !existingIds.has(record.id)) ||
          (!record.id && !existingDates.has(`${record.date}_${record.mealType || 'weight'}`))) {
        merged.push(record)
      }
    })
    
    // 按日期排序
    return merged.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // 获取数据统计信息
  getDataStats() {
    const weightRecords = this.getWeightRecords()
    const dietRecords = this.getDietRecords()
    
    return {
      weightRecordsCount: weightRecords.length,
      dietRecordsCount: dietRecords.length,
      dateRange: {
        earliest: weightRecords.length > 0 ? weightRecords[0].date : null,
        latest: weightRecords.length > 0 ? weightRecords[weightRecords.length - 1].date : null
      },
      totalCalories: dietRecords.reduce((sum, record) => sum + (record.calories || 0), 0)
    }
  }
}

export default new Storage()