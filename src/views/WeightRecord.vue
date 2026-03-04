<template>
  <div class="weight-record-container">
    <header class="page-header">
      <h1>记录体重</h1>
      <p class="subtitle">记录每一天的微小进步</p>
    </header>

    <section class="input-card">
      <div class="form-row">
        <div class="input-group flex-2">
          <label>日期</label>
          <input
            type="date"
            v-model="newRecord.date"
            :max="maxDate"
            :disabled="loading"
          />
        </div>
        <div class="input-group flex-3">
          <label>体重 (斤)</label>
          <div class="weight-input-wrapper">
            <input
              type="number"
              v-model="newRecord.weight"
              step="0.1"
              placeholder="0.0"
              :disabled="loading"
            />
            <span class="unit">斤</span>
          </div>
        </div>
      </div>

      <div class="input-group">
        <label>心情/备注</label>
        <textarea
          v-model="newRecord.note"
          placeholder="今天状态如何？(选填)"
          :disabled="loading"
        ></textarea>
      </div>

      <button
        @click="addRecord"
        class="submit-btn"
        :disabled="!canAdd || loading"
      >
        <span v-if="loading" class="btn-spinner"></span>
        {{ loading ? "同步中..." : "确认录入" }}
      </button>
    </section>

    <section class="history-section">
      <div class="section-title">
        <h2>历史记录</h2>
        <span class="count">共 {{ records.length }} 条</span>
      </div>

      <div
        v-if="records.length > 0"
        class="timeline"
        :class="{ 'list-loading': loading }"
      >
        <div v-for="record in records" :key="record.id" class="timeline-item">
          <div class="time-point"></div>
          <div class="record-card">
            <div class="card-left">
              <span class="res-weight">{{ record.weight }}</span>
              <span class="res-unit">斤</span>
            </div>
            <div class="card-main">
              <div class="res-date">{{ formatDate(record.date) }}</div>
              <div class="res-note" v-if="record.note">{{ record.note }}</div>
            </div>
            <button
              v-if="!loading"
              class="delete-icon"
              @click="deleteRecord(record.id)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="empty-holder">
        <p>暂无记录，开始你的第一次录入吧</p>
      </div>
    </section>
  </div>
</template>

<script>
import { supabase } from "../supabase.js";

export default {
  data() {
    return {
      loading: false,
      newRecord: {
        date: new Date().toISOString().split("T")[0],
        weight: "",
        note: "",
      },
      records: [],
      maxDate: new Date().toISOString().split("T")[0],
    };
  },
  computed: {
    canAdd() {
      return this.newRecord.weight > 0 && this.newRecord.date;
    },
  },
  async mounted() {
    await this.fetchRecords();
  },
  methods: {
    async fetchRecords() {
      const { data, error } = await supabase
        .from("weight_logs")
        .select("*")
        .order("date", { ascending: false });
      if (!error) this.records = data;
    },
    async addRecord() {
      this.loading = true;
      try {
        const { error } = await supabase
          .from("weight_logs")
          .insert([this.newRecord]);
        if (!error) {
          this.newRecord.weight = "";
          this.newRecord.note = "";
          await this.fetchRecords();
        }
      } finally {
        this.loading = false;
      }
    },
    async deleteRecord(id) {
      if (confirm("确定删除这条记录吗？")) {
        this.loading = true;
        try {
          const { error } = await supabase
            .from("weight_logs")
            .delete()
            .eq("id", id);
          if (!error) await this.fetchRecords();
        } finally {
          this.loading = false;
        }
      }
    },
    formatDate(dateStr) {
      const d = new Date(dateStr);
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    },
  },
};
</script>

<style scoped>
.weight-record-container {
  padding: 24px 20px;
  background-color: #f2f2f7;
  min-height: 100vh;
}
.page-header {
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 24px;
  color: #1c1c1e;
}
.page-header .subtitle {
  font-size: 14px;
  color: #8e8e93;
  margin-top: 4px;
}

/* 输入卡片 */
.input-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}
.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}
.flex-2 {
  flex: 2;
}
.flex-3 {
  flex: 3;
}
.input-group {
  margin-bottom: 15px;
}
.input-group label {
  display: block;
  font-size: 13px;
  color: #8e8e93;
  margin-bottom: 6px;
  padding-left: 4px;
}

/* 替换原有的 input, textarea 样式 */
input, textarea { 
  width: 100%; 
  padding: 12px 16px; 
  background: #f2f2f7; 
  border: 2px solid transparent; 
  border-radius: 12px; 
  font-size: 16px; 
  color: #1c1c1e; 
  transition: all 0.2s;
  
  /* --- 新增/强化以下代码 --- */
  height: 48px;              /* 显式固定高度 */
  line-height: normal;       /* 修复 iOS 默认行高偏移 */
  display: block;            /* 确保是块级元素 */
  box-sizing: border-box;    /* 确保 padding 不撑大高度 */
  -webkit-appearance: none;  /* 移除 iOS 默认内阴影和样式 */
}

/* 针对 textarea 的特殊处理：它不能固定 48px */
textarea {
  height: auto;
  min-height: 80px;
  line-height: 1.5;
}

/* 针对 iOS 日期选择器的垂直居中优化 */
input[type="date"] {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
input:focus,
textarea:focus {
  background: white;
  border-color: #007aff;
  outline: none;
}
input:disabled,
textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.weight-input-wrapper {
  position: relative;
}
.weight-input-wrapper .unit {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #8e8e93;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.submit-btn:disabled {
  opacity: 0.5;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 列表 */
.list-loading {
  opacity: 0.6;
  pointer-events: none;
}
.timeline {
  border-left: 2px solid #e5e5ea;
  margin-left: 10px;
  padding-left: 20px;
  transition: opacity 0.3s;
}
.timeline-item {
  position: relative;
  margin-bottom: 16px;
}
.time-point {
  position: absolute;
  left: -27px;
  top: 22px;
  width: 12px;
  height: 12px;
  background: #007aff;
  border-radius: 50%;
  border: 2px solid white;
}
.record-card {
  background: white;
  padding: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  position: relative;
}
.card-left {
  text-align: center;
  padding-right: 15px;
  border-right: 1px solid #f2f2f7;
  min-width: 70px;
}
.res-weight {
  font-size: 20px;
  font-weight: 700;
  color: #007aff;
}
.res-unit {
  font-size: 12px;
  color: #8e8e93;
}
.card-main {
  padding-left: 15px;
  flex: 1;
}
.res-date {
  font-size: 14px;
  color: #1c1c1e;
  font-weight: 500;
}
.res-note {
  font-size: 12px;
  color: #8e8e93;
  margin-top: 4px;
}
.delete-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #c7c7cc;
  font-size: 14px;
  padding: 5px;
  cursor: pointer;
}
.empty-holder {
  text-align: center;
  padding: 40px;
  color: #c7c7cc;
}
</style>
