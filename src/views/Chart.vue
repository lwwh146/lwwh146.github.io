<template>
  <div class="chart-page-container">
    <header class="page-header">
      <h1>趋势分析</h1>
      <div class="time-selector">
        <button 
          v-for="range in timeRanges" 
          :key="range.value"
          @click="selectedRange = range.value"
          :class="{ active: selectedRange === range.value }"
          :disabled="loading"
        >
          {{ range.label }}
        </button>
      </div>
    </header>

    <section class="metrics-grid">
      <div class="metric-card">
        <span class="m-label">最高体重</span>
        <div class="m-value">{{ maxWeight || '--' }}<span>斤</span></div>
      </div>
      <div class="metric-card">
        <span class="m-label">最低体重</span>
        <div class="m-value highlight">{{ minWeight || '--' }}<span>斤</span></div>
      </div>
      <div class="metric-card">
        <span class="m-label">平均体重</span>
        <div class="m-value">{{ avgWeight || '--' }}<span>斤</span></div>
      </div>
    </section>

    <section class="chart-wrapper">
      <div class="chart-header">
        <h2>体重走势图</h2>
        <span class="chart-unit">单位：斤</span>
      </div>

      <div class="chart-relative-container">
        <div v-if="loading" class="chart-loading-overlay">
          <div class="spinner"></div>
          <p>分析中...</p>
        </div>
        
        <div id="weightChart" class="main-chart" :style="{ opacity: loading ? 0.3 : 1 }"></div>
      </div>
    </section>

    <section class="detail-section">
      <div class="section-title">数据明细</div>
      <div v-if="chartData.length > 0" class="detail-list">
        <div v-for="(record) in reversedChartData" :key="record.id" class="detail-item">
          <div class="d-date">
            <span class="d-m">{{ formatMonth(record.date) }}</span>
            <span class="d-d">{{ formatDay(record.date) }}</span>
          </div>
          <div class="d-weight">{{ record.weight }} 斤</div>
          <div class="d-trend" :class="getTrendClass(record)">
            {{ getTrendText(record) }}
          </div>
        </div>
      </div>
      <div v-else class="empty-state">暂无区间内数据</div>
    </section>
  </div>
</template>

<script>
import { supabase } from "../supabase.js";
import * as echarts from 'echarts';

export default {
  data() {
    return {
      loading: false,
      selectedRange: '7',
      timeRanges: [
        { label: '7天', value: '7' },
        { label: '30天', value: '30' },
        { label: '全部', value: 'all' }
      ],
      chartData: [], // 原始按时间正序排列的数据（用于图表）
      myChart: null
    };
  },
  computed: {
    // 用于列表展示，最新的数据在最前
    reversedChartData() {
      return [...this.chartData].reverse();
    },
    maxWeight() {
      if (!this.chartData.length) return 0;
      return Math.max(...this.chartData.map(r => r.weight)).toFixed(1);
    },
    minWeight() {
      if (!this.chartData.length) return 0;
      return Math.min(...this.chartData.map(r => r.weight)).toFixed(1);
    },
    avgWeight() {
      if (!this.chartData.length) return 0;
      const sum = this.chartData.reduce((acc, r) => acc + r.weight, 0);
      return (sum / this.chartData.length).toFixed(1);
    }
  },
  watch: {
    selectedRange() {
      this.fetchData();
    }
  },
  async mounted() {
    await this.fetchData();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.myChart) this.myChart.dispose();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        let query = supabase.from("weight_logs").select("*").order("date", { ascending: true });
        
        if (this.selectedRange !== 'all') {
          const date = new Date();
          date.setDate(date.getDate() - parseInt(this.selectedRange));
          query = query.gte("date", date.toISOString().split('T')[0]);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        this.chartData = data || [];
        this.$nextTick(() => {
          this.initChart();
        });
      } catch (err) {
        console.error("加载失败:", err);
      } finally {
        // 增加小延迟防止闪烁
        setTimeout(() => { this.loading = false; }, 400);
      }
    },
    initChart() {
      const chartDom = document.getElementById('weightChart');
      if (!chartDom) return;
      if (!this.myChart) this.myChart = echarts.init(chartDom);
      
      const option = {
        grid: { top: 20, right: 10, bottom: 40, left: 40 },
        tooltip: { 
          trigger: 'axis', 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textStyle: { color: '#333' }
        },
        // 找到这部分代码进行修改
xAxis: {
  type: 'category',
  // 将原来的 formatDay(r.date) 修改为显示 月/日
  data: this.chartData.map(r => {
    const d = new Date(r.date);
    return `${d.getMonth() + 1}/${d.getDate()}`; // 结果类似于 3/2
  }),
  axisLine: { lineStyle: { color: '#e5e5ea' } },
  axisLabel: { 
    color: '#8e8e93', 
    fontSize: 10,
    interval: 'auto', // 自动计算标签显示间隔，防止重叠
    hideOverlap: true // 自动隐藏重叠的标签
  }
},
        yAxis: {
          type: 'value',
          min: 'dataMin',
          axisLine: { show: false },
          splitLine: { lineStyle: { type: 'dashed', color: '#f2f2f7' } },
          axisLabel: { color: '#8e8e93', fontSize: 11 }
        },
        series: [{
          data: this.chartData.map(r => r.weight),
          type: 'line',
          smooth: true,
          symbolSize: 8,
          label: { show: true, position: 'top', fontSize: 10, color: '#007aff' },
          itemStyle: { color: '#007aff' },
          lineStyle: { width: 3, shadowColor: 'rgba(0,122,255,0.3)', shadowBlur: 10 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,122,255,0.2)' },
              { offset: 1, color: 'rgba(0,122,255,0)' }
            ])
          }
        }]
      };
      this.myChart.setOption(option);
    },
    getTrendClass(record) {
      // 找到这条记录在原始正序数组中的位置
      const idx = this.chartData.findIndex(r => r.id === record.id);
      if (idx <= 0) return '';
      const diff = record.weight - this.chartData[idx - 1].weight;
      return diff > 0 ? 'up' : 'down';
    },
    getTrendText(record) {
      const idx = this.chartData.findIndex(r => r.id === record.id);
      if (idx <= 0) return '--';
      const diff = record.weight - this.chartData[idx - 1].weight;
      return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    },
    formatMonth: (d) => new Date(d).getMonth() + 1 + '月',
    formatDay: (d) => new Date(d).getDate() + '日',
    handleResize() {
      this.myChart && this.myChart.resize();
    }
  }
};
</script>

<style scoped>
.chart-page-container {
  padding: 24px 20px;
  background-color: #f2f2f7;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-header h1 { font-size: 24px; color: #1c1c1e; margin: 0; }

/* 时间选择器 */
.time-selector {
  background: #e3e3e8;
  padding: 3px;
  border-radius: 10px;
  display: flex;
}
.time-selector button {
  padding: 6px 14px;
  border: none;
  background: none;
  font-size: 13px;
  border-radius: 8px;
  color: #8e8e93;
  transition: all 0.2s;
}
.time-selector button.active {
  background: white;
  color: #1c1c1e;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

/* 指标卡片 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.metric-card {
  background: white;
  padding: 12px;
  border-radius: 18px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
}
.m-label { font-size: 11px; color: #8e8e93; display: block; margin-bottom: 4px; }
.m-value { font-size: 18px; font-weight: 700; color: #1c1c1e; }
.m-value span { font-size: 10px; margin-left: 2px; }
.m-value.highlight { color: #34c759; }

/* 图表区域 */
.chart-wrapper {
  background: white;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}
.chart-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
.chart-header h2 { font-size: 16px; margin: 0; color: #1c1c1e; }
.chart-unit { font-size: 11px; color: #c7c7cc; }

.chart-relative-container {
  position: relative;
  width: 100%;
  height: 220px;
}

.chart-loading-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #f2f2f7;
  border-top: 3px solid #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.main-chart { height: 100%; width: 100%; transition: opacity 0.3s; }

/* 列表区域 */
.section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #1c1c1e; }
.detail-list { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
.detail-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f2f2f7;
}
.detail-item:last-child { border-bottom: none; }
.d-date { display: flex; flex-direction: column; width: 60px; }
.d-m { font-size: 11px; color: #8e8e93; }
.d-d { font-size: 16px; font-weight: 600; color: #1c1c1e; }
.d-weight { flex: 1; font-size: 17px; font-weight: 600; color: #1c1c1e; text-align: center; }
.d-trend { width: 60px; text-align: right; font-size: 14px; font-weight: 600; color: #8e8e93; }
.d-trend.up { color: #ff3b30; }
.d-trend.down { color: #34c759; }

.empty-state { text-align: center; padding: 40px; color: #c7c7cc; font-size: 14px; }
</style>