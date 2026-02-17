# 老虎机 (Slot Machine) 开发指南

## 核心架构

老虎机由以下组件构成：

```
SlotGame
├── Reels[] (轮盘数组，通常3-5列)
│   └── Symbols[] (符号数组，每列多个)
├── UI
│   ├── Balance (余额显示)
│   ├── Bet (下注控制)
│   ├── Win (中奖显示)
│   └── SpinButton (旋转按钮)
└── WinLines (中奖线)
```

## 轮盘滚动实现

### 方案一：位置偏移 + 循环队列（推荐）

```typescript
class Reel {
  private container: Phaser.GameObjects.Container;
  private symbols: Phaser.GameObjects.Container[] = [];
  private symbolData: SymbolType[] = [];
  
  private offset = 0;        // 当前偏移量
  private speed = 0;         // 滚动速度
  private phase: 'idle' | 'accel' | 'spin' | 'decel' | 'bounce' = 'idle';
  
  constructor(scene: Phaser.Scene, x: number, topY: number, mask: Phaser.GameObjects.Graphics) {
    this.container = scene.add.container(x, 0);
    this.container.setMask(mask.createGeometryMask());
    
    // 创建符号：可见行 + 上下缓冲
    const totalSymbols = VISIBLE_ROWS + BUFFER * 2;
    for (let i = 0; i < totalSymbols; i++) {
      const sym = this.createSymbol();
      sym.setY(topY - BUFFER * SYMBOL_SIZE + i * SYMBOL_SIZE);
      this.symbols.push(sym);
      this.symbolData.push(this.randomSymbol());
      this.container.add(sym);
    }
  }
  
  update(delta: number) {
    if (this.phase === 'idle') return;
    
    const dt = delta / 1000;
    
    // 更新速度（根据阶段）
    this.updateSpeed(dt);
    
    // 更新偏移
    this.offset += this.speed * dt;
    
    // 循环：当偏移超过一个符号高度，顶部移到底部
    while (this.offset >= SYMBOL_SIZE) {
      this.offset -= SYMBOL_SIZE;
      this.symbolData.shift();
      this.symbolData.push(this.randomSymbol());
    }
    
    // 更新所有符号位置
    this.symbols.forEach((sym, i) => {
      sym.setY(this.baseY + i * SYMBOL_SIZE + this.offset);
    });
  }
}
```

### 方案二：Tween 动画（简单但不够流畅）

```typescript
// 不推荐：难以实现平滑的加速减速
this.tweens.add({
  targets: this.reelContainer,
  y: targetY,
  duration: 2000,
  ease: 'Cubic.easeOut'
});
```

## 滚动阶段与缓动

### 四阶段滚动模型

```
[加速] → [匀速旋转] → [减速] → [回弹]
 0.25s      0.8s+        0.5s     0.2s
```

```typescript
private updateSpeed(dt: number) {
  this.phaseTime += dt;
  
  switch (this.phase) {
    case 'accel':
      // 缓动加速
      const accelT = Math.min(this.phaseTime / ACCEL_TIME, 1);
      this.speed = MAX_SPEED * this.easeOutQuad(accelT);
      if (accelT >= 1) this.phase = 'spin';
      break;
      
    case 'spin':
      // 匀速
      this.speed = MAX_SPEED;
      if (this.phaseTime >= MIN_SPIN_TIME) this.phase = 'decel';
      break;
      
    case 'decel':
      // 缓动减速
      const decelT = Math.min(this.phaseTime / DECEL_TIME, 1);
      this.speed = MAX_SPEED * (1 - this.easeOutCubic(decelT));
      if (decelT >= 1) {
        this.snapToTarget();
        this.phase = 'bounce';
      }
      break;
      
    case 'bounce':
      // 回弹效果
      const bounceT = Math.min(this.phaseTime / BOUNCE_TIME, 1);
      this.bounceOffset = BOUNCE_HEIGHT * Math.sin(bounceT * Math.PI) * (1 - bounceT);
      if (bounceT >= 1) this.phase = 'idle';
      break;
  }
}
```

### 缓动函数

```typescript
// 加速用：快速启动
easeOutQuad(t: number): number {
  return t * (2 - t);
}

// 减速用：平滑停止
easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// 回弹用：过冲效果
easeOutBack(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}
```

## 遮罩实现

```typescript
// 创建遮罩区域
const maskG = this.add.graphics();
maskG.fillStyle(0xffffff);
maskG.fillRect(reelAreaX, reelAreaY, reelAreaWidth, reelAreaHeight);
maskG.setVisible(false);  // 重要：隐藏遮罩图形本身

// 应用到轮盘容器
const mask = maskG.createGeometryMask();
reelContainer.setMask(mask);
```

## 错峰停止

```typescript
spin() {
  for (let col = 0; col < REEL_COUNT; col++) {
    // 每列延迟不同时间停止
    const stopDelay = MIN_SPIN_TIME + col * 0.35 + Math.random() * 0.2;
    this.reels[col].spin(targetSymbols[col], stopDelay);
  }
}
```

## 中奖检测

### 9宫格中奖线

```typescript
// 3x3 布局的5条中奖线
const LINES = [
  // 横线
  [[0,0], [1,0], [2,0]],  // 顶行
  [[0,1], [1,1], [2,1]],  // 中行
  [[0,2], [1,2], [2,2]],  // 底行
  // 对角线
  [[0,0], [1,1], [2,2]],  // 左上到右下
  [[0,2], [1,1], [2,0]],  // 左下到右上
];

checkWin(results: Symbol[][]) {
  let totalWin = 0;
  
  for (const line of LINES) {
    const symbols = line.map(([col, row]) => results[col][row]);
    
    // 三个相同
    if (symbols[0].id === symbols[1].id && symbols[1].id === symbols[2].id) {
      totalWin += this.bet * symbols[0].multiplier;
    }
  }
  
  return totalWin;
}
```

### 符号定义

```typescript
const SYMBOLS = [
  { id: 'seven',   label: '7',  color: 0xff3333, multiplier: 10 },
  { id: 'diamond', label: '◆', color: 0x33ffff, multiplier: 8 },
  { id: 'bell',    label: '🔔', color: 0xffdd33, multiplier: 5 },
  { id: 'bar',     label: 'BAR', color: 0x66ff66, multiplier: 4 },
  { id: 'cherry',  label: '🍒', color: 0xff6699, multiplier: 3 },
  { id: 'lemon',   label: '🍋', color: 0xffff33, multiplier: 2 },
  { id: 'grape',   label: '🍇', color: 0xaa33ff, multiplier: 2 },
  { id: 'star',    label: '★',  color: 0xffaa00, multiplier: 1.5 },
];
```

## 中奖动画

### 符号闪烁

```typescript
animateWinSymbols(positions: {col: number, row: number}[]) {
  positions.forEach((pos, idx) => {
    const symbol = this.getSymbol(pos.col, pos.row);
    
    this.time.delayedCall(idx * 100, () => {
      this.tweens.add({
        targets: symbol,
        scale: 1.3,
        duration: 200,
        yoyo: true,
        repeat: 2,
        ease: 'Bounce.easeOut',
      });
    });
  });
}
```

### 中奖线绘制

```typescript
drawWinLine(startX: number, startY: number, endX: number, endY: number) {
  const line = this.add.graphics();
  
  this.tweens.addCounter({
    from: 0,
    to: 1,
    duration: 300,
    onUpdate: (tween) => {
      const p = tween.getValue();
      line.clear();
      line.lineStyle(4, 0xffd700, 0.9);
      line.beginPath();
      line.moveTo(startX, startY);
      line.lineTo(
        Phaser.Math.Linear(startX, endX, p),
        Phaser.Math.Linear(startY, endY, p)
      );
      line.strokePath();
    }
  });
}
```

## 竖屏配置

```typescript
const CONFIG = {
  WIDTH: 400,
  HEIGHT: 720,
  
  REEL_COUNT: 3,
  VISIBLE_ROWS: 3,
  SYMBOL_SIZE: 90,
  
  // 滚动参数
  MAX_SPEED: 2400,
  ACCEL_TIME: 0.25,
  MIN_SPIN_TIME: 0.8,
  DECEL_TIME: 0.5,
  BOUNCE_HEIGHT: 12,
  BOUNCE_TIME: 0.2,
};

const gameConfig: Phaser.Types.Core.GameConfig = {
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
```

## UI 布局 (竖屏)

```
┌─────────────────────┐
│      TITLE          │  60px
├─────────────────────┤
│  BALANCE  │  BET    │  70px
├─────────────────────┤
│                     │
│   ┌───┬───┬───┐    │
│   │ 🍒│ 🍋│ 🍇│    │
│   ├───┼───┼───┤    │  270px (3x90)
│   │ 💎│ 7 │ 🔔│    │
│   ├───┼───┼───┤    │
│   │ ★ │BAR│ 🍒│    │
│   └───┴───┴───┘    │
│                     │
│      WIN TEXT       │  50px
├─────────────────────┤
│    [SPIN BUTTON]    │  80px
└─────────────────────┘
```

## 完整示例

参考项目：`packages/slot-machine-9grid/src/main.ts`
