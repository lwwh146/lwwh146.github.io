import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import WeightRecord from './views/WeightRecord.vue'
import DietRecord from './views/DietRecord.vue'
import Chart from './views/Chart.vue'
import DataManager from './views/DataManager.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/weight', component: WeightRecord },
  { path: '/diet', component: DietRecord },
  { path: '/chart', component: Chart },
  { path: '/data', component: DataManager }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')