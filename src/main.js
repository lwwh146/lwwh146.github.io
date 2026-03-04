import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 直接引用你刚才修改好的 router/index.js
import { supabase } from './supabase'

// 关键修复：只保留这一个挂载逻辑
// 先等待 Supabase 读取本地存储的 Session 状态
supabase.auth.getSession().then(() => {
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
})