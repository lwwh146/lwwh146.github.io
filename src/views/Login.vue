<template>
  <div class="login-page">
    <div class="login-card" :class="{ 'signup-mode': isSignUp }">
      <div class="logo">⚖️</div>
      <h1>{{ isSignUp ? '加入我们' : '欢迎回来' }}</h1>
      <p class="subtitle">{{ isSignUp ? '只需一步，开启健康之旅' : '请登录以同步您的体重数据' }}</p>

      <div class="form">
        <div class="input-group">
          <label>电子邮箱</label>
          <input v-model="email" type="email" placeholder="请输入邮箱" autocomplete="email" />
        </div>
        <div class="input-group">
          <label>设置密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" />
        </div>

        <button 
          @click="handleAuth" 
          :disabled="loading" 
          :class="['auth-btn', isSignUp ? 'signup-btn' : 'login-btn']"
        >
          {{ loading ? '处理中...' : (isSignUp ? '立即创建账号' : '安全登录') }}
        </button>

        <div class="switch-mode">
          <p v-if="!isSignUp">没有账号？ <span @click="isSignUp = true">立即注册</span></p>
          <p v-else>已有账号？ <span @click="isSignUp = false">返回登录</span></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from "../supabase.js";

export default {
  data() {
    return {
      email: "",
      password: "",
      isSignUp: false,
      loading: false,
    };
  },
  methods: {
    async handleAuth() {
      if (!this.email || !this.password) return alert("请填写完整信息");
      this.loading = true;

      try {
        if (this.isSignUp) {
          const { error } = await supabase.auth.signUp({
            email: this.email,
            password: this.password,
          });
          if (error) throw error;
          alert("注册申请已提交！如果您关闭了邮箱验证，现在可以直接尝试登录；否则请查看邮件。");
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: this.email,
            password: this.password,
          });
          if (error) throw error;
          this.$router.push("/home"); // 登录成功跳转
        }
      } catch (error) {
        alert("错误: " + error.message);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
  /* 移除任何可能导致它跟其他页面重叠的绝对定位 */
}

.login-card {
  background: white;
  padding: 40px 30px;
  border-radius: 24px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.08);
  width: 100%;
  max-width: 380px;
  text-align: center;
  transition: all 0.3s ease;
  border-top: 6px solid #007aff; /* 登录模式蓝色 */
}

.login-card.signup-mode {
  border-top: 6px solid #34c759; /* 注册模式绿色 */
}

.logo { font-size: 48px; margin-bottom: 12px; }
h1 { font-size: 26px; color: #1c1c1e; margin-bottom: 8px; }
.subtitle { color: #8e8e93; font-size: 14px; margin-bottom: 32px; }

.input-group { text-align: left; margin-bottom: 20px; }
.input-group label { display: block; font-size: 12px; color: #8e8e93; margin-bottom: 6px; margin-left: 4px; }

input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e5e5ea;
  border-radius: 12px;
  background: #f2f2f7;
  outline: none;
  font-size: 16px;
  transition: all 0.2s;
}

input:focus {
  background: white;
  border-color: #007aff;
  box-shadow: 0 0 0 4px rgba(0,122,255,0.1);
}

.auth-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  color: white;
  margin-top: 10px;
  transition: transform 0.1s;
}

.auth-btn:active { transform: scale(0.98); }

.login-btn { background: #007aff; }
.signup-btn { background: #34c759; }

.switch-mode { margin-top: 24px; font-size: 14px; color: #8e8e93; }
.switch-mode span { color: #007aff; font-weight: 600; cursor: pointer; }
</style>