// src/router/index.js
import { createRouter, createWebHashHistory } from "vue-router";
import Login from "../views/Login.vue"; // 确保这里指向 src/views/Login.vue
import Home from "../views/Home.vue";
import Chart from "../views/Chart.vue";
import WeightRecord from "../views/WeightRecord.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  { path: "/home", component: Home },
  { path: "/chart", component: Chart },
  { path: "/weight", component: WeightRecord },
];

const router = createRouter({
  history: createWebHashHistory(), // 建议使用 Hash 模式以适配 GitHub Pages
  routes,
});

export default router;
