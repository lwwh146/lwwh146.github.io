<template>
  <div class="chart">
    <div class="header">
      <h1>体重趋势</h1>
    </div>

    <div class="chart-controls">
      <div class="time-range-selector">
        <button 
          v-for="range in timeRanges" 
          :key="range.value"
          @click="selectedRange = range.value"
          :class="{ active: selectedRange === range.value }"
          class="range-btn"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <div class="chart-container">
      <div id="weightChart" class="chart"></div>
    </div>

    <div class="weight-list">
      <h2>详细记录</h2>
      <div class="list-header">
        <span>日期</span>
        <span>体重</span>
        <span>变化</span>
      </div>
      <div class="list-content">
        <div v-for="record in chartData" :key="record.id" class="list-item">
          <span class="date">{{ formatDate(record.date) }}</span>
          <span class="weight">{{ record.weight }} 斤</span>
          <span class="change" :class="getChangeClass(record.change)">
            {{ formatChange(record.change) }}
          </span>
        </div>
      </div>
      
      <div class="empty-state" v-if="chartData.length === 0">
        <div class="empty-icon">📊</div>
        <p>暂无数据，请先记录体重</p>
      </div>
    </div>

    <div class="statistics">
      <h2>统计数据</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">当前体重</div>
          <div class="stat-value">{{ statistics.currentWeight }} 斤</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">初始体重</div>
          <div class="stat-value">{{ statistics.startWeight }} 斤</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总体变化</div>
          <div class="stat-value" :class="statistics.totalChange >= 0 ? 'increase' : 'decrease'">
            {{ statistics.totalChange >= 0 ? '+' : '' }}{{ statistics.totalChange }} 斤
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均体重</div>
          <div class="stat-value">{{ statistics.averageWeight }} 斤</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最高体重</div>
          <div class="stat-value">{{ statistics.maxWeight }} 斤</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最低体重</div>
          <div class="stat-value">{{ statistics.minWeight }} 斤</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
// import storage from '../utils/storage.js'
import { supabase } from '../supabase.js'

export default {
  name: 'Chart',
  data() {
    return {
      chart: null,
      selectedRange: '7',
      timeRanges: [
        { value: '7', label: '7天' },
        { value: '30', label: '30天' },
        { value: '90', label: '3个月' },
        { value: '180', label: '6个月' },
        { value: '365', label: '1年' }
      ],
      chartData: []
    }
  },
  computed: {
    statistics() {
      if (this.chartData.length === 0) {
        return {
          currentWeight: '--',
          startWeight: '--',
          totalChange: '--',
          averageWeight: '--',
          maxWeight: '--',
          minWeight: '--'
        }
      }

      const weights = this.chartData.map(record => record.weight)
      const currentWeight = weights[weights.length - 1]
      const startWeight = weights[0]
      const totalChange = currentWeight - startWeight
      const averageWeight = (weights.reduce((sum, weight) => sum + weight, 0) / weights.length).toFixed(1)
      const maxWeight = Math.max(...weights)
      const minWeight = Math.min(...weights)

      return {
        currentWeight: currentWeight.toFixed(1),
        startWeight: startWeight.toFixed(1),
        totalChange: totalChange.toFixed(1),
        averageWeight,
        maxWeight: maxWeight.toFixed(1),
        minWeight: minWeight.toFixed(1)
      }
    }
  },
  mounted() {
  this.loadData(); // 调用上面修改后的异步方法
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    this.myChart && this.myChart.resize();
  });
},
  beforeUnmount() {
    if (this.chart) {
      this.chart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
  },
  watch: {
    selectedRange() {
      this.loadData()
    }
  },
  methods: {
    initChart() {
      const chartDom = document.getElementById('weightChart')
      this.chart = echarts.init(chartDom)
    },
    async loadData() {
      const { data, error } = await supabase.from('weight_logs').select('*');
      
      if (error || !data || data.length === 0) {
        console.warn("无法连接数据库或无数据，展示模拟数据进行调试");
        this.chartData = [
          { id: 1, date: '2023-10-01', weight: 140, change: 0 },
          { id: 2, date: '2023-10-02', weight: 139.2, change: -0.8 },
          { id: 3, date: '2023-10-03', weight: 138.5, change: -0.7 },
        ];
      } else {
        // 正常处理逻辑...
      }
      this.$nextTick(() => { this.initChart(); });
    },
    updateChart() {
      if (!this.chart) return

      const dates = this.chartData.map(record => record.date)
      const weights = this.chartData.map(record => record.weight)
      
      // 计算y轴最小值：取数据最小值的整数部分
      let yAxisMin = 0
      if (weights.length > 0) {
        const minWeight = Math.min(...weights)
        yAxisMin = Math.floor(minWeight)
        // 如果最小值刚好是整数，再减1留出一些空间
        if (minWeight === yAxisMin) {
          yAxisMin = yAxisMin - 1
        }
      }

      const option = {
        title: {
          text: '体重变化趋势',
          left: 'center',
          textStyle: {
            fontSize: 18,
            color: '#333',
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: 'transparent',
        },
        grid: {
          left: '0%',
          right: '0%',
          bottom: '0%',
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            // rotate: 45,
            fontSize: 11,
            color: '#666',
            formatter: function(value) {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }
          },
          axisLine: {
            lineStyle: {
              color: '#00000000'
            }
          },
          axisTick: {
            lineStyle: {
              color: '#00000000'
            }
          }
        },
        yAxis: {
          type: 'value',
          min: yAxisMin,
          name: '体重 (斤)',
          nameTextStyle: {
            fontSize: 12,
            color: '#666'
          },
          axisLabel: {
            fontSize: 11,
            color: '#666'
          },
          axisLine: {
            lineStyle: {
              color: '#e0e0e0'
            }
          },
          splitLine: {
            lineStyle: {
              color: '#f0f0f0',
              type: 'dashed'
            }
          }
        },
        series: [{
          name: '体重',
          type: 'line',
          data: weights,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#007aff',
            width: 3,
            shadowColor: 'rgba(0, 122, 255, 0.3)',
            shadowBlur: 10,
            shadowOffsetY: 2
          },
        label: {
            show: true,
            position: 'top',
            textStyle: {
                color: '#007aff',
            }
        },
          itemStyle: {
            color: '#007aff',
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(0, 122, 255, 0.3)',
            shadowBlur: 8
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: 'rgba(0, 122, 255, 0.4)'
              }, {
                offset: 0.5,
                color: 'rgba(0, 122, 255, 0.2)'
              }, {
                offset: 1,
                color: 'rgba(0, 122, 255, 0.05)'
              }]
            }
          },
          emphasis: {
            itemStyle: {
              color: '#0056b3',
              borderColor: '#fff',
              borderWidth: 3,
              shadowColor: 'rgba(0, 122, 255, 0.5)',
              shadowBlur: 12
            }
          }
        }]
      }

      this.chart.setOption(option)
    },
    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    },
    formatDate(dateStr) {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}/${date.getDate()}`
    },
    formatChange(change) {
      if (change === 0) return '0'
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}`
    },
    getChangeClass(change) {
      if (change > 0) return 'increase'
      if (change < 0) return 'decrease'
      return 'neutral'
    }
  }
}
</script>

<style scoped>
.chart {
  padding: 20px 20px 70px;
  /* max-width: 600px; */
  margin: 0 auto;
  /* flex: 1; */
  /* display: flex;
  flex-direction: column; */
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 24px;
  color: #333;
}

.chart-controls {
  margin-bottom: 20px;
}

.time-range-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.range-btn {
  flex: 1;
  min-width: 60px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.range-btn.active {
  background: #007aff;
  color: white;
  border-color: #007aff;
}

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart {
  width: 100%;
  /* height: 350px; */
}

.statistics {
  margin-bottom: 30px;
}

.statistics h2 {
  font-size: 18px;
  color: #333;
  margin: 15px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.stat-value.increase {
  color: #ff3b30;
}

.stat-value.decrease {
  color: #34c759;
}

.weight-list {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.weight-list h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.list-header span {
  flex: 1;
  text-align: center;
}

.list-content {
  max-height: 300px;
  overflow-y: auto;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.list-item span {
  flex: 1;
  text-align: center;
  font-size: 14px;
}

.change.increase {
  color: #ff3b30;
}

.change.decrease {
  color: #34c759;
}

.change.neutral {
  color: #666;
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

@media (max-width: 480px) {
  .chart {
    /* height: 280px; */
  }
}
#weightChart{
  width: 100%;
  height: 280px;
  padding: 0;
}
</style>