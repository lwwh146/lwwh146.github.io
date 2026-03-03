<template>
  <div id="app">
    <div class="container">
      <router-view />
    </div>
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item" active-class="active">
        <div class="nav-icon">🏠</div>
        <span>首页</span>
      </router-link>
      <router-link to="/weight" class="nav-item" active-class="active">
        <div class="nav-icon">⚖️</div>
        <span>体重</span>
      </router-link>
      <!-- <router-link to="/diet" class="nav-item" active-class="active">
        <div class="nav-icon">🍽️</div>
        <span>饮食</span>
      </router-link> -->
      <router-link to="/chart" class="nav-item" active-class="active">
        <div class="nav-icon">📊</div>
        <span>统计</span>
      </router-link>
      <!-- <router-link to="/data" class="nav-item" active-class="active">
        <div class="nav-icon">💾</div>
        <span>数据</span>
      </router-link> -->
    </nav>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* 确保内容区域填满可视区域，但不包括导航栏高度 */
  overflow-y: auto;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #666;
  font-size: 11px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  padding: 8px 4px;
  border-radius: 12px;
  position: relative;
}

.nav-item:hover {
  background: rgba(0, 122, 255, 0.1);
  /* transform: translateY(-2px); */
}

.nav-item.active {
  color: #007aff;
  background: rgba(0, 122, 255, 0.15);
}

/* .nav-item.active::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: #007aff;
  border-radius: 50%;
} */

.nav-icon {
  font-size: 20px;
  margin-bottom: 3px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item.active .nav-icon {
  transform: scale(1.1);
}

.router-link-active {
  color: #007aff;
}
</style>