<template>
  <div class="profile-container">
    <header class="profile-header">
      <div class="user-info">
        <div class="user-avatar">👤</div>
        <div class="user-detail">
          <h2>{{ userEmail || '健康用户' }}</h2>
          <p>自律从今天开始</p>
        </div>
      </div>
    </header>

    <div class="menu-list">
      <div class="menu-item" @click="handleTargetSet">
        <span class="menu-icon">🎯</span>
        <span class="menu-title">目标体重</span>
        <span class="menu-value">{{ targetWeight }} 斤</span>
        <span class="edit-btn">修改</span>
      </div>
      <div class="menu-item game-entry" @click="$router.push('/game2048')">
        <span class="menu-icon">🎮</span>
        <span class="menu-title">休闲 2048</span>
        <span class="edit-btn">去玩玩 ></span>
      </div>
    </div>

    <div class="action-area">
      <button class="logout-btn" @click="confirmLogout">退出登录</button>
      <p class="version">极简版 v1.0.2</p>
    </div>
  </div>
</template>

<script>
import { supabase } from "../supabase.js";

export default {
  data() {
    return {
      userEmail: '',
      targetWeight: localStorage.getItem('target_weight') || '120'
    };
  },
  async created() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.userEmail = user.email;
    }
  },
  methods: {
    handleTargetSet() {
      const newTarget = prompt("请输入新的目标体重 (斤):", this.targetWeight);
      if (newTarget && !isNaN(newTarget)) {
        this.targetWeight = parseFloat(newTarget);
        localStorage.setItem('target_weight', this.targetWeight);
        // 提示修改成功（可选）
        console.log('目标已更新');
      }
    },
    async confirmLogout() {
      if (confirm("确定要退出当前账号吗？")) {
        await supabase.auth.signOut();
      }
    }
  }
};
</script>

<style scoped>
.game-entry {
  border-top: 1px solid #f2f2f7; /* 加一个淡色分割线 */
}
.profile-container {
  padding: 20px;
  background-color: #f2f2f7;
  min-height: 100vh;
}

.profile-header {
  background: white;
  padding: 30px 20px;
  border-radius: 24px;
  margin-bottom: 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-avatar {
  width: 70px;
  height: 70px;
  background: #f2f2f7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 35px;
}

.user-detail h2 {
  font-size: 18px;
  margin: 0;
  color: #1c1c1e;
  word-break: break-all; /* 防止邮箱过长撑破布局 */
}

.user-detail p {
  font-size: 13px;
  color: #8e8e93;
  margin: 5px 0 0;
}

/* 菜单项样式 */
.menu-list {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 20px;
  cursor: pointer;
}

.menu-item:active { background-color: #f9f9f9; }

.menu-icon { font-size: 18px; margin-right: 15px; }
.menu-title { flex: 1; font-size: 16px; color: #1c1c1e; }
.menu-value { font-size: 16px; font-weight: 600; color: #007aff; margin-right: 12px; }
.edit-btn { color: #c7c7cc; font-size: 14px; }

/* 退出区域 */
.action-area {
  margin-top: 40px;
  text-align: center;
}

.logout-btn {
  width: 100%;
  padding: 16px;
  background: white;
  color: #ff3b30;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}

.logout-btn:active { background: #fff5f5; opacity: 0.8; }

.version {
  margin-top: 20px;
  font-size: 12px;
  color: #c7c7cc;
}
</style>