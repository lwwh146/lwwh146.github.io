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
              <h2 class="current-value">{{ latestWeight || "--" }}</h2>
              <span
                v-if="weightChange !== 0"
                :class="['change-tag', weightChange > 0 ? 'up' : 'down']"
              >
                {{ weightChange > 0 ? "↑" : "↓" }}
                {{ Math.abs(weightChange).toFixed(1) }}
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
            <span>
              {{ latestWeight > targetWeight ? "距离目标还差" : "已超出目标" }}
              {{ Math.abs(latestWeight - targetWeight).toFixed(1) }} 斤
            </span>
            <span>{{ progressPercent }}%</span>
          </div>
          <div class="progress-bar-bg">
            <div
              class="progress-bar-fill"
              :style="{ width: progressPercent + '%' }"
            ></div>
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
      firstWeight: 0, // 💡 新增：记录起始体重
      targetWeight: 120, // 默认值，会被 fetchData 覆盖
      recentRecords: [],
      currentDate: new Date().toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
      }),
    };
  },
  computed: {
    progressPercent() {
  if (!this.latestWeight || !this.targetWeight || !this.firstWeight) return 0;
  
  // 💡 核心逻辑：如果当前体重比当初开始时还重，进度就是 0
  if (this.latestWeight >= this.firstWeight) return 0;
  
  // 如果已经达到或低于目标，进度就是 100
  if (this.latestWeight <= this.targetWeight) return 100;

  // 计算总行程：起点到目标的距离
  const totalDistance = this.firstWeight - this.targetWeight;
  // 计算已走行程：起点到当前体重的距离
  const distanceCovered = this.firstWeight - this.latestWeight;

  if (totalDistance <= 0) return 0;

  const result = Math.round((distanceCovered / totalDistance) * 100);
  return Math.min(Math.max(result, 0), 100);
},
  },
  async mounted() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 并行获取：最近记录、目标配置、以及第一条记录（作为进度起点）
        const [logsRes, profileRes, firstLogRes] = await Promise.all([
          supabase
            .from("weight_logs")
            .select("*")
            .order("date", { ascending: false })
            .limit(5),
          supabase
            .from("user_profiles")
            .select("target_weight")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("weight_logs")
            .select("weight")
            .order("date", { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);

        // 1. 处理最近记录和当前体重
        if (!logsRes.error && logsRes.data?.length > 0) {
          this.recentRecords = logsRes.data;
          this.latestWeight = logsRes.data[0].weight;
          if (logsRes.data.length > 1) {
            this.weightChange = logsRes.data[0].weight - logsRes.data[1].weight;
          }
        }

        // 2. 处理目标体重
        if (profileRes.data?.target_weight) {
          this.targetWeight = profileRes.data.target_weight;
        } else {
          this.targetWeight =
            parseFloat(localStorage.getItem("target_weight")) || 120;
        }

        // 3. 处理起始体重（进度条 0% 的位置）
        if (firstLogRes.data?.weight) {
  // 💡 改进：起点应该是你历史记录里最重的那笔，或者第一笔
  this.firstWeight = firstLogRes.data.weight;
  
  // 调试：如果当前比起点还重，我们临时把起点设为当前+10，方便看进度条效果
  if (this.latestWeight >= this.firstWeight) {
    this.firstWeight = this.latestWeight + 5; 
  }
} else {
          this.firstWeight = this.latestWeight; // 如果没记录，则起点就是当前值
        }
      } catch (err) {
        console.error("数据加载失败", err);
      } finally {
        setTimeout(() => {
          this.loading = false;
        }, 500);
      }
    },

    async setTargetWeight() {
      const val = prompt("设置你的目标体重 (斤):", this.targetWeight);
      if (val && !isNaN(val)) {
        const newWeight = parseFloat(val);
        this.targetWeight = newWeight;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("user_profiles").upsert({
            id: user.id,
            target_weight: newWeight,
            updated_at: new Date(),
          });
        }
        localStorage.setItem("target_weight", newWeight);
      }
    },

    formatDate(d) {
      return new Date(d).toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      });
    },
  },
};
</script>

<style scoped>
.home-container {
  padding: 20px;
  background-color: #f2f2f7;
  min-height: 100vh;
  position: relative;
}
.content-wrapper {
  transition: opacity 0.4s ease;
}

/* Loading 样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f2f2f7;
  z-index: 100;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e5ea;
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.loading-overlay p {
  margin-top: 12px;
  font-size: 14px;
  color: #8e8e93;
}

/* 头部 */
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  margin-top: 10px;
}
.user-meta h1 {
  font-size: 24px;
  color: #1c1c1e;
  margin: 0;
}
.user-meta .date {
  font-size: 14px;
  color: #8e8e93;
  margin-top: 4px;
}
.avatar {
  font-size: 32px;
  background: white;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

/* 主卡片 */
.main-stat-card {
  background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
  border-radius: 28px;
  padding: 24px;
  color: white;
  box-shadow: 0 15px 30px rgba(0, 122, 255, 0.2);
  margin-bottom: 30px;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
}
.label {
  font-size: 13px;
  opacity: 0.8;
  display: block;
  margin-bottom: 8px;
}
.current-value {
  font-size: 42px;
  font-weight: 800;
  margin: 0;
  line-height: 1;
}
.value-group {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.change-tag {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
}
.change-tag.down {
  background: #34c759;
}
.change-tag.up {
  background: #ff3b30;
}

.target-box {
  text-align: right;
  cursor: pointer;
}
.target-value {
  font-size: 20px;
  font-weight: 700;
}
.target-value span {
  font-size: 12px;
  margin-left: 2px;
}
.edit-icon {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.6;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 8px;
}
.progress-bar-bg {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: white;
  transition: width 1s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* 最近记录 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.section-header h2 {
  font-size: 18px;
  color: #1c1c1e;
}
.more-link {
  font-size: 13px;
  color: #007aff;
  text-decoration: none;
}
.record-item {
  background: white;
  border-radius: 16px;
  padding: 15px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}
.r-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.r-weight {
  font-weight: 700;
  color: #1c1c1e;
}
.r-date {
  font-size: 12px;
  color: #8e8e93;
}
.r-note {
  font-size: 12px;
  color: #8e8e93;
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px dashed #f2f2f7;
}
.empty-hint {
  text-align: center;
  padding: 40px;
  color: #c7c7cc;
  font-size: 14px;
}

.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-leave-to {
  opacity: 0;
}
</style>
