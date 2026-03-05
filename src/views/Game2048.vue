<template>
  <div class="game-2048-container" :class="{ 'dark-mode': isDarkMode }">
    <header class="game-header">
      <div class="header-left">
        <button @click="$router.back()" class="back-btn">✕ 关闭</button>
        <h1 class="game-title">2048 挑战</h1>
      </div>
      <div class="header-right">
        <button @click="toggleDarkMode" class="icon-btn">
          {{ isDarkMode ? "☀️" : "🌙" }}
        </button>
      </div>
    </header>

    <section class="scores-container">
      <div class="score-grid">
        <div class="score-box current">
          <span class="label">SCORE</span>
          <span class="value">{{ score }}</span>
        </div>
        <div class="score-box best">
          <span class="label">BEST</span>
          <span class="value">{{ highScore }}</span>
        </div>
        
        <div class="button-grid">
          <button @click="undo" class="mini-btn" :disabled="!canUndo" title="撤销">
            <span class="icon">↺</span>
          </button>
          <button @click="manualSave" class="mini-btn save" :disabled="loading" title="保存">
            <span class="icon">{{ loading ? '⌛' : '💾' }}</span>
          </button>
          <button @click="initGame" class="primary-btn-new">
            新游戏
          </button>
        </div>
      </div>
    </section>

    <div
      class="game-board"
      ref="board"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div v-for="(row, rIdx) in board" :key="'row-' + rIdx" class="grid-row">
        <div
          v-for="(tile, tIdx) in row"
          :key="`${rIdx}-${tIdx}-${tile}`"
          class="grid-cell"
          :class="[
            'tile-' + tile,
            { 'tile-new': tile !== 0 },
            { 'tile-merged': isMergedCell(rIdx, tIdx) },
          ]"
        >
          <div class="tile-inner">{{ tile !== 0 ? tile : "" }}</div>
        </div>
      </div>
      <transition name="fade">
        <div v-if="gameState !== 'playing'" class="game-over-overlay">
          <h2>{{ gameState === "won" ? "你赢了！🎉" : "游戏结束" }}</h2>
          <p>最终得分: {{ score }}</p>
          <div class="overlay-btns">
            <button @click="resetToNewGame(true)" class="restart-btn">
              再试一次
            </button>
          </div>
        </div>
      </transition>
    </div>

    <section class="leaderboard-section">
      <h3>🏆 高分榜 (前五)</h3>
      <div v-if="leaderboard.length > 0" class="leaderboard-list">
        <div
          v-for="(entry, index) in leaderboard"
          :key="index"
          class="leaderboard-item"
        >
          <span class="rank">#{{ index + 1 }}</span>
          <span class="l-score">{{ entry.score }} 分</span>
          <span class="l-date">{{ formatDate(entry.date) }}</span>
        </div>
      </div>
      <p v-else class="empty-hint">暂无记录，快去创造高分吧！</p>
    </section>
  </div>
</template>

<script>
import { supabase } from "../supabase.js";

export default {
  data() {
    return {
      size: 4,
      board: [],
      score: 0,
      highScore: localStorage.getItem("2048_highScore") || 0,
      gameState: "playing", // playing, won, lost
      isDarkMode: localStorage.getItem("2048_darkMode") === "true",
      loading: false, // 云端加载状态

      // 撤销功能
      previousState: null,
      canUndo: false,
      mergedPositions: [], // 记录当前步发生合并的坐标
      // 排行榜
      leaderboard: JSON.parse(localStorage.getItem("2048_leaderboard")) || [],

      // 输入处理
      touchStartClientX: 0,
      touchStartClientY: 0,
      isMouseDown: false,
    };
  },
  async mounted() {
    // 1. 初始化游戏（包含从云端拉取存档）
    await this.initGame();

    // 2. 监听电脑键盘
    window.addEventListener("keydown", this.handleKeyDown);

    // 3. 监听鼠标拖拽（适配电脑）
    const boardEl = this.$refs.board;
    boardEl.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mousemove", this.handleMouseMove); // 放在 window 上保证拖拽顺滑
    window.addEventListener("mouseup", this.handleMouseUp);

    // 4. 阻止移动端橡皮筋效果
    boardEl.addEventListener("touchmove", (e) => e.preventDefault(), {
      passive: false,
    });
  },
  beforeUnmount() {
    // 销毁监听
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);
  },
  methods: {
    async manualSave() {
      if (this.loading) return;
      this.loading = true;
      try {
        await this.syncToCloud();
        // 可以加一个轻提示，比如修改按钮文字或弹窗
        alert("进度已保存到云端");
      } catch (err) {
        alert("保存失败，请检查网络");
      } finally {
        this.loading = false;
      }
    },
    isMergedCell(r, c) {
      return this.mergedPositions.some((pos) => pos.r === r && pos.c === c);
    },
    // --- 存档逻辑 ---

    async initGame() {
      this.loading = true;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // 尝试读取 Supabase 里的进度
          const { data: save, error } = await supabase
            .from("game_saves")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (save && save.board_data) {
            this.board = save.board_data;
            this.score = save.current_score;
            this.gameState = "playing";
            this.loading = false; // 💡 确保这里关闭了
            return;
          }
        }
      } catch (err) {
        console.error("加载云端进度失败:", err);
      }

      // 如果没有云端存档或报错，则开启新游戏
      this.resetToNewGame();
      this.loading = false;
    },

    resetToNewGame(isManual = false) {
      this.board = Array(this.size)
        .fill(0)
        .map(() => Array(this.size).fill(0));
      this.score = 0;
      this.gameState = "playing";
      this.addRandomTile();
      this.addRandomTile();
      if (isManual) this.syncToCloud(); // 💡 手动点击新游戏时覆盖云端
    },

    async syncToCloud() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("game_saves").upsert({
        user_id: user.id,
        board_data: this.board,
        current_score: this.score,
        updated_at: new Date(),
      });
    },

    // --- 核心移动逻辑 ---

    move(direction) {
      this.mergedPositions = [];
      if (this.gameState !== "playing" || this.loading) return;

      // 重要：在移动前先克隆当前状态（解决 ReferenceError）
      const boardBeforeMove = JSON.parse(JSON.stringify(this.board));

      const mergeRow = (row, rowIndex, isVertical, colIndex) => {
        let nums = row.filter((n) => n !== 0);
        for (let i = 0; i < nums.length - 1; i++) {
          if (nums[i] === nums[i + 1]) {
            nums[i] *= 2;
            this.score += nums[i];
            nums.splice(i + 1, 1);

            // 记录合并的位置（这里简化处理，让合成后的格子跳动）
            this.mergedPositions.push({ r: rowIndex, c: i });
          }
        }
        while (nums.length < this.size) nums.push(0);
        return nums;
      };

      let newBoard = Array(this.size)
        .fill(0)
        .map(() => Array(this.size).fill(0));

      if (direction === "left" || direction === "right") {
        for (let r = 0; r < this.size; r++) {
          let row = [...this.board[r]];
          if (direction === "right") row.reverse();
          let merged = mergeRow(row);
          if (direction === "right") merged.reverse();
          newBoard[r] = merged;
        }
      } else {
        for (let c = 0; c < this.size; c++) {
          let col = [];
          for (let r = 0; r < this.size; r++) col.push(this.board[r][c]);
          if (direction === "down") col.reverse();
          let merged = mergeRow(col);
          if (direction === "down") merged.reverse();
          for (let r = 0; r < this.size; r++) newBoard[r][c] = merged[r];
        }
      }

      // 检查是否有变化
      if (JSON.stringify(boardBeforeMove) !== JSON.stringify(newBoard)) {
        this.previousState = {
          board: boardBeforeMove,
          score: this.score, // 注意：这里要存加分前的分数
        };
        this.canUndo = true;

        this.board = newBoard; // 应用新棋盘
        this.addRandomTile(); // 产生新方块
        this.$nextTick(() => {
          this.checkGameOver(); // 💡 确保在 DOM 更新后检测
        });
        // this.syncToCloud();
      } else {
        // 💡 即使棋盘没变，如果格子已经满了，也要检测一次是否死局
        this.checkGameOver();
      }
    },

    // --- 输入处理逻辑 ---

    handleKeyDown(e) {
      const keys = {
        ArrowUp: "up",
        w: "up",
        ArrowDown: "down",
        s: "down",
        ArrowLeft: "left",
        a: "left",
        ArrowRight: "right",
        d: "right",
      };
      if (keys[e.key]) {
        e.preventDefault();
        this.move(keys[e.key]);
      }
    },

    // 鼠标处理（拖拽模拟滑动）
    handleMouseDown(e) {
      this.isMouseDown = true;
      this.touchStartClientX = e.clientX;
      this.touchStartClientY = e.clientY;
    },
    handleMouseMove(e) {
      if (!this.isMouseDown) return;
    },
    handleMouseUp(e) {
      if (!this.isMouseDown) return;
      this.isMouseDown = false;
      const dx = e.clientX - this.touchStartClientX;
      const dy = e.clientY - this.touchStartClientY;
      this.processGesture(dx, dy);
    },

    // 触摸处理
    handleTouchStart(e) {
      this.touchStartClientX = e.touches[0].clientX;
      this.touchStartClientY = e.touches[0].clientY;
    },
    handleTouchEnd(e) {
      const dx = e.changedTouches[0].clientX - this.touchStartClientX;
      const dy = e.changedTouches[0].clientY - this.touchStartClientY;
      this.processGesture(dx, dy);
    },

    // 统一处理滑动手势
    processGesture(dx, dy) {
      const threshold = 30; // 最小滑动距离
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > threshold) {
          this.move(dx > 0 ? "right" : "left");
        }
      } else {
        if (Math.abs(dy) > threshold) {
          this.move(dy > 0 ? "down" : "up");
        }
      }
    },

    // --- 辅助逻辑 ---

    addRandomTile() {
      let cells = [];
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.board[r][c] === 0) cells.push({ r, c });
        }
      }
      if (cells.length > 0) {
        let { r, c } = cells[Math.floor(Math.random() * cells.length)];
        this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
      }
    },

    checkGameOver() {
  // 1. 检查胜利 (2048)
  for (let r = 0; r < this.size; r++) {
    for (let c = 0; c < this.size; c++) {
      if (this.board[r][c] === 2048) {
        this.gameState = "won";
        this.updateLeaderboard();
        this.syncToCloud(); // 💡 关键节点：胜利后自动备份到云端
        return;
      }
    }
  }

  // 2. 检查空位
  for (let r = 0; r < this.size; r++) {
    for (let c = 0; c < this.size; c++) {
      if (this.board[r][c] === 0) return;
    }
  }

  // 3. 检查可合并项
  for (let r = 0; r < this.size; r++) {
    for (let c = 0; c < this.size; c++) {
      if (c < this.size - 1 && this.board[r][c] === this.board[r][c + 1]) return;
      if (r < this.size - 1 && this.board[r][c] === this.board[r + 1][c]) return;
    }
  }

  // 4. 死局结算
  this.gameState = "lost";
  this.updateLeaderboard();
  this.syncToCloud(); // 💡 关键节点：失败后自动更新云端最高分
},

    undo() {
      // 增加 loading 判断，防止在同步时重复点击
      if (!this.canUndo || !this.previousState || this.loading) return;

      // 1. 恢复状态
      this.board = JSON.parse(JSON.stringify(this.previousState.board));
      this.score = this.previousState.score;

      // 2. 状态重置
      this.previousState = null;
      this.canUndo = false;
      this.gameState = "playing"; // 💡 撤销可以救回死局

      // 3. 关键：同步到云端，保证下次打开也是撤销后的状态
      this.syncToCloud();
    },

    updateLeaderboard() {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem("2048_highScore", this.highScore);
      }
      if (this.score <= 0) return;
      this.leaderboard.push({ score: this.score, date: new Date().getTime() });
      this.leaderboard.sort((a, b) => b.score - a.score);
      this.leaderboard = this.leaderboard.slice(0, 5);
      localStorage.setItem(
        "2048_leaderboard",
        JSON.stringify(this.leaderboard),
      );
    },

    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem("2048_darkMode", this.isDarkMode);
    },

    formatDate(ts) {
      const d = new Date(ts);
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    },
  },
};
</script>
<style scoped>
/* 1. 新数字出现的缩放动画 */
.tile-new {
  animation: appear 200ms ease-out;
}

/* 2. 两个数字合并时的碰撞弹跳动画 */
.tile-merged {
  animation: pop 200ms ease-in-out;
}

@keyframes appear {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  } /* 稍微放大，模拟碰撞感 */
  100% {
    transform: scale(1);
  }
}
.save-btn {
  background: #42b983 !important; /* Vue 绿，给人安全感 */
  color: white !important;
}
.save-btn:disabled {
  background: #a8d8c0 !important;
  cursor: not-allowed;
}

/* 让数字文字也有平滑的颜色过渡 */
.tile-inner {
  transition: all 0.1s ease;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* --- 基础容器与变量 --- */
.game-2048-container {
  background-color: #f2f2f7; /* iOS 系统背景色 */
  /* 适配移动端全屏，如果需要嵌入菜单请修改高度 */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  padding: 15px;
  box-sizing: border-box;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  z-index: 1000; /* 确保在最上层 */
  overflow-y: auto; /* 允许内容过长时滚动 */
  transition:
    background-color 0.3s ease,
    color 0.3s ease;

  /* 默认：白天模式变量 */
  --bg-color: #f2f2f7;
  --panel-bg: white;
  --text-primary: #1c1c1e;
  --text-secondary: #8e8e93;
  --accent-blue: #007aff;
  --accent-red: #ff3b30;

  /* 2048 棋盘颜色变量 */
  --board-bg: rgba(255, 255, 255, 0.1);
  --cell-bg: rgba(255, 255, 255, 0.05);
  --text-dark: #776e65;
  --text-light: #f9f6f2;

  background-color: var(--bg-color);
  color: var(--text-primary);
}

/* --- 夜间模式变量覆盖 --- */
.game-2048-container.dark-mode {
  --bg-color: #1c1c1e;
  --panel-bg: #2c2c2e;
  --text-primary: white;
  --text-secondary: #c7c7cc;

  /* 夜间模式棋盘颜色可以稍微调暗一点 */
  --board-bg: rgba(255, 255, 255, 0.1);
}

/* --- 工具栏 --- */
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icon-btn {
  background: var(--panel-bg);
  border: none;
  font-size: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding: 10px 5px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(0, 122, 255, 0.2);
  color: #007aff;
  padding: 6px 14px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.back-btn:active {
  background: rgba(142, 142, 147, 0.25);
  transform: scale(0.95);
}

.game-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--text-primary) 0%, #8e8e93 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* --- 棋盘质感提升 --- */
.game-board {
  background: #bbada0;
  border-radius: 18px;
  padding: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); /* 增加投影 */
}

.grid-cell {
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); /* 每个小方块微弱阴影 */
}

/* --- 分数区 --- */
.scores-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.score-box {
  flex: 1;
  background: var(--panel-bg);
  padding: 12px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}
.score-box.best-box .value {
  color: var(--accent-blue);
}
.score-box .label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.score-box .value {
  font-size: 24px;
  font-weight: 800;
}
.control-btns {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.action-btn {
  font-size: 13px;
  font-weight: 600;
  padding: 10px 15px;
  border-radius: 12px;
  border: none;
  transition: all 0.2s;
  white-space: nowrap;
}
.undo-btn {
  background: var(--panel-bg);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.undo-btn:disabled {
  opacity: 0.4;
}
.reset-btn {
  background: var(--accent-blue);
  color: white;
}
.action-btn:active:not(:disabled) {
  opacity: 0.8;
  transform: scale(0.98);
}

/* --- 核心棋盘 --- */
.game-board {
  width: 100%;
  aspect-ratio: 1; /* 保持正方形 */
  background: var(--board-bg);
  border-radius: 12px;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative; /* 用于挂载遮罩层 */
  touch-action: none; /* 彻底阻止浏览器默认滑动 */
}
.grid-row {
  display: flex;
  flex: 1;
  gap: 8px;
}
.grid-cell {
  flex: 1;
  background: var(--cell-bg);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  user-select: none; /* 阻止文字选中 */
}

/* 根据格子的长宽比动态调整字体大小，适配小屏手机 */
.grid-cell {
  font-size: 6.5vw;
}
@media (min-width: 500px) {
  .grid-cell {
    font-size: 32px;
  }
}

/* --- 2048 经典配色方案 --- */
.tile-2 {
  background-color: #eee4da;
  color: var(--text-dark);
}
.tile-4 {
  background-color: #ede0c8;
  color: var(--text-dark);
}
.tile-8 {
  background-color: #f2b179;
  color: var(--text-light);
}
.tile-16 {
  background-color: #f59563;
  color: var(--text-light);
}
.tile-32 {
  background-color: #f67c5f;
  color: var(--text-light);
}
.tile-64 {
  background-color: #f65e3b;
  color: var(--text-light);
}
.tile-128 {
  background-color: #edcf72;
  color: var(--text-light);
  font-size: 5.5vw;
  box-shadow: 0 0 10px rgba(237, 207, 114, 0.5);
}
.tile-256 {
  background-color: #edcc61;
  color: var(--text-light);
  font-size: 5.5vw;
  box-shadow: 0 0 15px rgba(237, 204, 97, 0.6);
}
.tile-512 {
  background-color: #edc850;
  color: var(--text-light);
  font-size: 5.5vw;
  box-shadow: 0 0 20px rgba(237, 200, 80, 0.7);
}
.tile-1024 {
  background-color: #edc53f;
  color: var(--text-light);
  font-size: 4.5vw;
}
.tile-2048 {
  background-color: #edc22e;
  color: var(--text-light);
  font-size: 4.5vw;
  background: linear-gradient(135deg, #edc22e 0%, #ffeb3b 100%);
  animation: pulse 1.5s infinite;
}

@media (min-width: 500px) {
  .tile-128,
  .tile-256,
  .tile-512 {
    font-size: 26px;
  }
  .tile-1024,
  .tile-2048 {
    font-size: 22px;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 15px rgba(237, 194, 46, 0.7);
  }
  50% {
    box-shadow: 0 0 30px rgba(237, 194, 46, 0.9);
  }
  100% {
    box-shadow: 0 0 15px rgba(237, 194, 46, 0.7);
  }
}

/* --- 遮罩层 --- */
/* 遮罩层容器 */
.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(238, 228, 218, 0.85); /* 浅色背景 */
  backdrop-filter: blur(4px); /* 磨砂玻璃效果 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  z-index: 100;
  animation: fadeIn 0.4s ease;
}

/* 暗色模式适配 */
.dark-mode .game-over-overlay {
  background: rgba(28, 28, 30, 0.9);
}

.game-over-overlay h2 {
  font-size: 36px;
  font-weight: 800;
  color: #776e65;
  margin-bottom: 10px;
}

.dark-mode .game-over-overlay h2 {
  color: #fff;
}

.restart-btn {
  background: #8f7a66;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.restart-btn:active {
  transform: scale(0.95);
}

/* 渐变过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* --- 排行榜 --- */
.leaderboard-section {
  margin-top: 30px;
  margin-bottom: 20px;
}
.leaderboard-section h3 {
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 15px;
  padding-left: 5px;
}
.leaderboard-list {
  background: var(--panel-bg);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}
.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}
.dark-mode .leaderboard-item {
  border-bottom-color: rgba(255, 255, 255, 0.03);
}
.leaderboard-item:last-child {
  border-bottom: none;
}
.rank {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-secondary);
  min-width: 30px;
}
.leaderboard-item:nth-child(1) .rank {
  color: #ffd700;
} /* 金 */
.leaderboard-item:nth-child(2) .rank {
  color: #c0c0c0;
} /* 银 */
.leaderboard-item:nth-child(3) .rank {
  color: #cd7f32;
} /* 铜 */
.l-score {
  flex: 1;
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
  text-align: right;
  margin-right: 15px;
}
.l-date {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.empty-hint {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
  font-size: 14px;
  background: var(--panel-bg);
  border-radius: 16px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}


.score-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr; /* 三列布局 */
  gap: 10px;
  width: 100%;
}

.score-box {
  background: var(--panel-bg);
  padding: 8px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.02);
}

.button-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 按钮区再分两列 */
  grid-template-rows: 1fr 1fr;
  gap: 6px;
}

/* “新游戏”占据右侧整行高度 */
.primary-btn-new {
  grid-column: span 2;
  background: var(--accent-blue);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 14px;
}

.mini-btn {
  background: var(--panel-bg);
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s;
}

.mini-btn.save {
  color: #42b983; /* 仅图标着色，背景保持统一 */
}

.mini-btn .icon{
  color: yellow; /* 仅图标着色，背景保持统一 */
}

.mini-btn:disabled {
  opacity: 0.3;
}
</style>
