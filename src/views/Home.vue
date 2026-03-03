<template>
  <div class="home-container">
    <transition name="fade">
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>同步数据中...</p>
      </div>
    </transition>

    <div :style="{ opacity: loading ? 0 : 1 }" class="content-wrapper">
      <header class="home-header">
        <div class="user-meta">
          <h1>我的健康概览</h1>
          <p class="date">{{ currentDate }}</p>
        </div>
        <div class="avatar">📈</div>
      </header>

      <section class="main-stat-card">
        <div class="card-top">
          <div class="stat-main">
            <span class="label">当前体重 (斤)</span>
            <div class="value-group">
              <h2 class="current-value">{{ latestWeight || '--' }}</h2>
              <span v-if="weightChange !== 0" :class="['change-tag', weightChange > 0 ? 'up' : 'down']">
                {{ weightChange > 0 ? '↑' : '↓' }} {{ Math.abs(weightChange).toFixed(1) }}
              </span>
            </div>
          </div>
          <div class="target-box" @click="setTargetWeight">
            <span class="label">目标体重</span>
            <div class="target-value">{{ targetWeight }}<span>斤</span></div>
            <div class="edit-icon">✏️</div>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-info">
            <span>距离目标还差 {{ (latestWeight - targetWeight).toFixed(1) }} 斤</span>
            <span>{{ progressPercent }}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </section>

      <section class="recent-section">
        <div class="section-header">
          <h2>最近动态</h2>
          <router-link to="/weight" class="more-link">查看全部 ></router-link>
        </div>
        
        <div class="record-list" v-if="recentRecords.length > 0">
          <div v-for="item in recentRecords" :key="item.id" class="record-item">
            <div class="r-info">
              <span class="r-weight">{{ item.weight }} 斤</span>
              <span class="r-date">{{ formatDate(item.date) }}</span>
            </div>
            <p v-if="item.note" class="r-note">{{ item.note }}</p>
          </div>
        </div>
        <div v-else class="empty-hint">开启你的第一次记录吧</div>
      </section>
    </div>
  </div>
</template>

<script>
import { supabase } from "../supabase.js";

export default {
  data() {
    return {
      loading: true,
      latestWeight: 0,
      weightChange: 0,
      targetWeight: localStorage.getItem('target_weight') || 120,
      recentRecords: [],
      currentDate: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
    };
  },
  computed: {
    progressPercent() {
      if (!this.latestWeight) return 0;
      const startWeight = 160; // 假设起始体重，实际可根据首条数据计算
      const progress = ((startWeight - this.latestWeight) / (startWeight - this.targetWeight)) * 100;
      return Math.min(Math.max(Math.round(progress), 0), 100);
    }
  },
  async mounted() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("weight_logs")
          .select("*")
          .order("date", { ascending: false })
          .limit(5);

        if (!error && data.length > 0) {
          this.recentRecords = data;
          this.latestWeight = data[0].weight;
          if (data.length > 1) {
            this.weightChange = data[0].weight - data[1].weight;
          }
        }
      } finally {
        setTimeout(() => { this.loading = false; }, 500);
      }
    },
    setTargetWeight() {
      const val = prompt("设置你的目标体重 (斤):", this.targetWeight);
      if (val && !isNaN(val)) {
        this.targetWeight = val;
        localStorage.setItem('target_weight', val);
      }
    },
    formatDate(d) {
      return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  }
};
</script>

<style scoped>
.home-container { padding: 20px; background-color: #f2f2f7; min-height: 100vh; position: relative; }
.content-wrapper { transition: opacity 0.4s ease; }

/* Loading 样式 */
.loading-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #f2f2f7; z-index: 100;
}
.spinner {
  width: 32px; height: 32px; border: 3px solid #e5e5ea;
  border-top-color: #007aff; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-overlay p { margin-top: 12px; font-size: 14px; color: #8e8e93; }

/* 头部 */
.home-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; margin-top: 10px; }
.user-meta h1 { font-size: 24px; color: #1c1c1e; margin: 0; }
.user-meta .date { font-size: 14px; color: #8e8e93; margin-top: 4px; }
.avatar { font-size: 32px; background: white; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

/* 主卡片 */
.main-stat-card { background: linear-gradient(135deg, #007aff 0%, #0056b3 100%); border-radius: 28px; padding: 24px; color: white; box-shadow: 0 15px 30px rgba(0,122,255,0.2); margin-bottom: 30px; }
.card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
.label { font-size: 13px; opacity: 0.8; display: block; margin-bottom: 8px; }
.current-value { font-size: 42px; font-weight: 800; margin: 0; line-height: 1; }
.value-group { display: flex; align-items: baseline; gap: 10px; }
.change-tag { padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.2); }
.change-tag.down { background: #34c759; }
.change-tag.up { background: #ff3b30; }

.target-box { text-align: right; cursor: pointer; }
.target-value { font-size: 20px; font-weight: 700; }
.target-value span { font-size: 12px; margin-left: 2px; }
.edit-icon { font-size: 12px; margin-top: 4px; opacity: 0.6; }

.progress-info { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
.progress-bar-bg { height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: white; transition: width 1s cubic-bezier(0.2, 0.8, 0.2, 1); }

/* 最近记录 */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.section-header h2 { font-size: 18px; color: #1c1c1e; }
.more-link { font-size: 13px; color: #007aff; text-decoration: none; }
.record-item { background: white; border-radius: 16px; padding: 15px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.r-info { display: flex; justify-content: space-between; align-items: center; }
.r-weight { font-weight: 700; color: #1c1c1e; }
.r-date { font-size: 12px; color: #8e8e93; }
.r-note { font-size: 12px; color: #8e8e93; margin: 8px 0 0; padding-top: 8px; border-top: 1px dashed #f2f2f7; }
.empty-hint { text-align: center; padding: 40px; color: #c7c7cc; font-size: 14px; }

.fade-leave-active { transition: opacity 0.5s; }
.fade-leave-to { opacity: 0; }
</style>