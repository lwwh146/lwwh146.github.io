import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router' // 修改这里
import App from './App.vue'
import Home from './views/Home.vue'
import WeightRecord from './views/WeightRecord.vue'
import DietRecord from './views/DietRecord.vue'
import Chart from './views/Chart.vue'
import DataManager from './views/DataManager.vue'
import Profile from './views/Profile.vue'
import Login from './views/Login.vue' // 必须导入登录组件

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/home', component: Home },
  { path: '/weight', component: WeightRecord },
  { path: '/chart', component: Chart },
  { path: '/profile', component: Profile }
]

const router = createRouter({
  history: createWebHashHistory(), // 修改这里
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')