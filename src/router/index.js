import { createRouter, createWebHashHistory } from "vue-router";
import { supabase } from "../supabase.js"; 
import Login from "../views/Login.vue";
import Home from "../views/Home.vue";
import Chart from "../views/Chart.vue";
import WeightRecord from "../views/WeightRecord.vue";
import Profile from "../views/Profile.vue";
import Game2048 from "../views/Game2048.vue";

const routes = [
  // 根路径直接指向 home，让守卫去决定是否要踢回 login
  { path: "/", redirect: "/home" }, 
  { path: "/login", component: Login },
  { path: "/home", component: Home },
  { path: "/chart", component: Chart },
  { path: "/weight", component: WeightRecord },
  { path: "/profile", component: Profile },
  { path: "/game2048", component: Game2048 },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 核心：全局前置守卫
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  // 调试用：发布前可以删掉
  console.log('当前路径:', to.path, 'Session状态:', !!session);

  if (session) {
    // 已登录状态下，如果去登录页，强行拉回首页
    if (to.path === '/login') {
      next('/home');
    } else {
      next();
    }
  } else {
    // 未登录状态下，除了登录页，其他都去登录页
    if (to.path !== '/login') {
      next('/login');
    } else {
      next();
    }
  }
});

export default router;