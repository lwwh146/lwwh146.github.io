<template>
  <div id="app">
    <main class="main-container" :class="{ 'has-footer': isLoggedIn }">
      <router-view />
    </main>

    <nav v-if="isLoggedIn" class="tab-bar">
      <router-link to="/home" class="tab-item">
        <span class="icon">🏠</span>
        <span class="label">首页</span>
      </router-link>
      <router-link to="/weight" class="tab-item">
        <span class="icon">⚖️</span>
        <span class="label">记录</span>
      </router-link>
      <router-link to="/chart" class="tab-item">
        <span class="icon">📈</span>
        <span class="label">统计</span>
      </router-link>
      <router-link to="/profile" class="tab-item">
        <span class="icon">👤</span>
        <span class="label">我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
import { supabase } from "./supabase.js";

export default {
  data() {
    return {
      isLoggedIn: false
    };
  },
  created() {
    supabase.auth.getSession().then(({ data: { session } }) => {
      this.isLoggedIn = !!session;
    });

    supabase.auth.onAuthStateChange((event, session) => {
      this.isLoggedIn = !!session;
      if (event === 'SIGNED_OUT') {
        this.$router.push('/login');
      }
    });
  },
  methods: {
    async handleLogout() {
      if (confirm("确定要退出登录吗？")) {
        await supabase.auth.signOut();
      }
    }
  }
};
</script>

<style>

/* 1. 强制所有元素使用 border-box 模型 */
*, *::before, *::after {
  box-sizing: border-box !important;
  margin: 0;
  padding: 0;
}

html, body {
  width: 100%;
  overflow-x: hidden; /* 防止横向抖动 */
  background-color: #f2f2f7;
}

#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 2. 修正主容器 */
.main-container {
  width: 100%;
  flex: 1;
  /* 如果你想要左右有留白，请确保是左右对称的 */
  /* padding: 15px;  */
  /* 如果不想要留白，就设为 0 */
}

.main-container.has-footer {
  /* 确保底部的 padding-bottom 足够大，且左右为 0 或对称 */
  padding-bottom: 85px; 
}


/* 3. 底部导航：强制固定定位 */
.tab-bar {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 70px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px); /* 毛玻璃效果 */
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid #e5e5ea;
  z-index: 9999;
  padding-bottom: env(safe-area-inset-bottom); /* 适配全面屏 */
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #8e8e93;
  -webkit-tap-highlight-color: transparent;
}

.tab-item .icon { font-size: 20px; margin-bottom: 2px; }
.tab-item .label { font-size: 11px; }

/* 激活状态颜色 */
.router-link-active {
  color: #007aff !important;
}

.logout { color: #ff3b30; cursor: pointer; }
</style>