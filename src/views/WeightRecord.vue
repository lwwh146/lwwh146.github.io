<template>
  <div class="weight-record">
    <div class="header">
      <h1>体重记录</h1>
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
        <label>体重 (斤)</label>
        <input
          type="number"
          v-model="newRecord.weight"
          step="0.1"
          placeholder="请输入体重"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label>备注</label>
        <textarea
          v-model="newRecord.note"
          placeholder="可选：记录今日状态、饮食情况等"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>

      <button @click="addRecord" class="add-btn" :disabled="!canAdd">
        添加记录
      </button>
    </div>

    <div class="records-list">
      <h2>历史记录</h2>

      <div class="filter-tabs">
        <button
          @click="filterType = 'all'"
          :class="{ active: filterType === 'all' }"
          class="filter-btn"
        >
          全部
        </button>
        <button
          @click="filterType = 'recent7'"
          :class="{ active: filterType === 'recent7' }"
          class="filter-btn"
        >
          最近7天
        </button>
        <button
          @click="filterType = 'recent30'"
          :class="{ active: filterType === 'recent30' }"
          class="filter-btn"
        >
          最近30天
        </button>
      </div>

      <div class="weight-cards">
        <div
          v-for="record in filteredRecords"
          :key="record.id"
          class="weight-card"
        >
          <div class="card-header">
            <div class="date-info">
              <div class="date">{{ formatDate(record.date) }}</div>
              <div class="time">{{ formatTime(record.created_at) }}</div>
            </div>
            <button @click="deleteRecord(record.id)" class="delete-btn">
              🗑️
            </button>
          </div>

          <div class="weight-display">
            <span class="weight-value">{{ record.weight }}</span>
            <span class="weight-unit">斤</span>
          </div>

          <div class="weight-change" v-if="record.weightChange">
            <span
              :class="[
                'change-value',
                record.weightChange > 0 ? 'increase' : 'decrease',
              ]"
            >
              {{ record.weightChange > 0 ? "+" : ""
              }}{{ record.weightChange.toFixed(1) }} 斤
            </span>
            <span class="change-label">较上次</span>
          </div>

          <div class="note" v-if="record.note">
            {{ record.note }}
          </div>
        </div>
      </div>

      <div class="empty-state" v-if="filteredRecords.length === 0">
        <div class="empty-icon">📊</div>
        <p>
          {{ filterType === "all" ? "还没有体重记录" : "该时间段没有记录" }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
// import storage from '../utils/storage.js'
import { supabase } from "../supabase.js";

export default {
  name: "WeightRecord",
  data() {
    return {
      newRecord: {
        date: new Date().toISOString().split("T")[0],
        weight: "",
        note: "",
      },
      records: [],
      filterType: "all",
      maxDate: new Date().toISOString().split("T")[0],
    };
  },
  computed: {
    canAdd() {
      return this.newRecord.weight && parseFloat(this.newRecord.weight) > 0;
    },
    filteredRecords() {
      let filtered = [...this.records];

      // 按日期倒序排列
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

      // 计算体重变化
      filtered.forEach((record, index) => {
        if (index < filtered.length - 1) {
          const prevRecord = filtered[index + 1];
          record.weightChange = record.weight - prevRecord.weight;
        } else {
          record.weightChange = null;
        }
      });

      // 应用时间过滤
      if (this.filterType === "recent7") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(
          (record) => new Date(record.date) >= sevenDaysAgo,
        );
      } else if (this.filterType === "recent30") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(
          (record) => new Date(record.date) >= thirtyDaysAgo,
        );
      }

      return filtered;
    },
  },
  mounted() {
    this.loadRecords();
  },
  methods: {
    async loadRecords() {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .order('date', { ascending: false }) // 按日期倒序排列

      if (error) {
        console.error('读取失败:', error.message)
      } else {
        this.records = data
      }
    },
    async addRecord() {
      console.log("准备提交数据:", this.newRecord); // 添加这行
      // 注意：这里要加 async
      if (!this.canAdd) return;

      try {
        // 2. 构造要存入数据库的对象（字段名必须和 Supabase 表里一致）
        const { data, error } = await supabase.from("weight_logs").insert([
          {
            date: this.newRecord.date,
            weight: parseFloat(this.newRecord.weight),
            note: this.newRecord.note,
          },
        ]);

        if (error) throw error;

        // 3. 重置表单
        this.newRecord = {
          date: new Date().toISOString().split("T")[0],
          weight: "",
          note: "",
        };

        // 4. 重新加载数据
        await this.loadRecords();
        this.showToast("数据已同步至云端");
      } catch (err) {
        console.error("上传失败:", err.message);
        this.showToast("上传失败: " + err.message);
      }
    },
    async deleteRecord(id) {
  if (confirm('确定要从云端删除这条记录吗？')) {
    const { error } = await supabase
      .from('weight_logs')
      .delete()
      .eq('id', id) // 匹配 ID 删除

    if (!error) {
      await this.loadRecords()
      this.showToast('记录已从云端移除')
    }
  }
},
    formatDate(dateStr) {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "今天";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "昨天";
      } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    },
    formatTime(timeStr) {
      const date = new Date(timeStr);
      return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    },
    showToast(message) {
      // 简单的toast提示实现
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.textContent = message;
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
      `;
      document.body.appendChild(toast);

      setTimeout(() => {
        document.body.removeChild(toast);
      }, 2000);
    },
  },
};
</script>

<style scoped>
.weight-record {
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
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
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

.form-input,
.form-textarea {
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

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007aff;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}

.add-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.add-btn:disabled {
  background: linear-gradient(135deg, #ccc 0%, #999 100%);
  cursor: not-allowed;
  box-shadow: none;
}

.add-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 122, 255, 0.4);
}

.add-btn:not(:disabled):active {
  transform: translateY(0);
}

.records-list h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-btn {
  flex: 1;
  padding: 10px 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
  backdrop-filter: blur(10px);
  border: 2px solid rgba(0, 122, 255, 0.1);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-btn.active {
  background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
  color: white;
  border-color: #007aff;
  box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
}

.filter-btn:hover:not(.active) {
  border-color: rgba(0, 122, 255, 0.3);
  background: rgba(0, 122, 255, 0.05);
}

.weight-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weight-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.weight-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.date-info .date {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.date-info .time {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.weight-display {
  text-align: center;
  margin-bottom: 8px;
}

.weight-value {
  font-size: 32px;
  font-weight: bold;
  color: #007aff;
}

.weight-unit {
  font-size: 16px;
  color: #666;
  margin-left: 4px;
}

.weight-change {
  text-align: center;
  margin-bottom: 8px;
}

.change-value {
  font-size: 14px;
  font-weight: 500;
}

.change-value.increase {
  color: #ff3b30;
}

.change-value.decrease {
  color: #34c759;
}

.change-label {
  font-size: 12px;
  color: #666;
  margin-left: 4px;
}

.note {
  font-size: 14px;
  color: #666;
  padding: 8px;
  background: #f8f8f8;
  border-radius: 6px;
  margin-top: 8px;
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
