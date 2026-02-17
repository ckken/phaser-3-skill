---
name: phaser-developer
description: Phaser 3 游戏开发技能。当用户需要创建 2D 游戏、使用 Phaser 框架、处理游戏物理/动画/输入时激活。支持老虎机、平台跳跃、射击、消除、跑酷等游戏类型。包含遮罩、缓动、响应式布局等高级特性。
---

# Phaser Developer

帮助 AI 使用 Phaser 3 框架开发 2D 游戏。

## 触发场景

- 创建游戏或游戏原型
- 使用 Phaser、Phaser 3 开发
- 处理游戏物理、精灵动画、碰撞检测
- 创建老虎机、平台跳跃、射击、消除等游戏

## 项目结构 (Bun + Vite)

```
game-project/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    └── main.ts
```

### package.json

```json
{
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": { "phaser": "^3.90.0" },
  "devDependencies": { "typescript": "^5.9.2", "vite": "^7.1.3" }
}
```

### 最小游戏模板

```typescript
import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  constructor() { super('MainScene'); }
  preload() { this.load.image('player', 'assets/player.png'); }
  create() { this.player = this.add.sprite(400, 300, 'player'); }
  update(time: number, delta: number) { /* 游戏循环 */ }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: MainScene,
  physics: { default: 'arcade', arcade: { gravity: { y: 300 } } }
};

new Phaser.Game(config);
```

## 核心概念速查

### 场景生命周期

`init(data)` → `preload()` → `create()` → `update(time, delta)` 循环

### 游戏对象

```typescript
this.add.image(x, y, 'key');                    // 静态图片
this.add.sprite(x, y, 'key');                   // 精灵
this.physics.add.sprite(x, y, 'key');           // 物理精灵
this.add.text(x, y, 'Hello', { fontSize: '32px', color: '#fff' });
this.add.graphics();                            // 图形绘制
this.add.container(x, y, [children]);           // 容器
```

### 物理系统

```typescript
this.physics.add.collider(a, b);                // 碰撞
this.physics.add.overlap(a, b, callback);       // 重叠检测
sprite.setVelocity(200, -300);                  // 速度
sprite.body.setGravityY(500);                   // 重力
sprite.body.setBounce(0.2);                     // 弹性
```

### 输入

```typescript
const cursors = this.input.keyboard.createCursorKeys();
this.input.on('pointerdown', (p) => { });
sprite.setInteractive().on('pointerdown', () => { });
```

### 补间动画

```typescript
this.tweens.add({
  targets: sprite,
  x: 400, y: 300, scale: 2, alpha: 0.5,
  duration: 1000,
  ease: 'Power2',          // 缓动函数
  yoyo: true, repeat: -1,
  onComplete: () => { }
});
```

## 高级特性

### 遮罩 (Mask) - 滚动/裁剪必备

```typescript
// 创建遮罩图形
const maskGraphics = this.add.graphics();
maskGraphics.fillStyle(0xffffff);
maskGraphics.fillRect(x, y, width, height);
maskGraphics.setVisible(false);  // 隐藏遮罩图形

// 应用遮罩
const mask = maskGraphics.createGeometryMask();
container.setMask(mask);  // 容器内容只在遮罩区域可见
```

### 缓动函数 (Easing)

```typescript
// 常用缓动
'Linear'           // 线性
'Power2'           // 二次方
'Power3'           // 三次方
'Bounce.easeOut'   // 弹跳
'Back.easeOut'     // 回弹
'Elastic.easeOut'  // 弹性
'Sine.easeInOut'   // 正弦

// 自定义缓动
const easeOutQuad = (t: number) => t * (2 - t);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
```

### 竖屏/响应式配置

```typescript
const config: Phaser.Types.Core.GameConfig = {
  width: 400,   // 竖屏宽度
  height: 720,  // 竖屏高度
  scale: {
    mode: Phaser.Scale.FIT,           // 适应屏幕
    autoCenter: Phaser.Scale.CENTER_BOTH,  // 居中
  },
};

// HTML viewport
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

### Container 高级用法

```typescript
// 创建复合对象
const card = this.add.container(x, y);
const bg = this.add.graphics().fillRect(-50, -70, 100, 140);
const icon = this.add.text(0, 0, '🎰', { fontSize: '48px' }).setOrigin(0.5);
card.add([bg, icon]);

// 整体操作
card.setScale(1.2);
card.setAlpha(0.8);
card.setPosition(newX, newY);

// 设置交互区域
card.setSize(100, 140);
card.setInteractive({ useHandCursor: true });
```

### 定时器

```typescript
// 延迟执行
this.time.delayedCall(1000, () => { /* 1秒后执行 */ });

// 循环定时器
this.time.addEvent({
  delay: 100,
  loop: true,
  callback: () => { /* 每100ms执行 */ }
});
```

### 数学工具

```typescript
Phaser.Math.Clamp(value, min, max);           // 限制范围
Phaser.Math.Linear(a, b, t);                  // 线性插值
Phaser.Math.Between(min, max);                // 随机整数
Phaser.Math.FloatBetween(min, max);           // 随机浮点
Phaser.Display.Color.IntegerToColor(0xff0000); // 颜色转换
```

## 常见游戏模式

### 老虎机 (Slot Machine)

关键技术：Container + Mask + 自定义缓动

```typescript
class Reel {
  private symbols: Phaser.GameObjects.Container[] = [];
  private offset = 0;
  private speed = 0;
  
  update(delta: number) {
    this.offset += this.speed * (delta / 1000);
    // 循环滚动：顶部符号移到底部
    while (this.offset >= SYMBOL_SIZE) {
      this.offset -= SYMBOL_SIZE;
      const first = this.symbols.shift()!;
      this.symbols.push(first);
    }
    // 更新位置
    this.symbols.forEach((s, i) => s.setY(startY + i * SYMBOL_SIZE + this.offset));
  }
}
```

### 平台跳跃

见 `references/patterns.md` - 平台跳跃模式

### 射击游戏

见 `references/patterns.md` - 射击模式 + 对象池

### 消除游戏

见 `references/patterns.md` - 消除模式

## 详细参考文档

| 文档 | 内容 |
|------|------|
| `references/core-architecture.md` | Game 配置、场景系统、生命周期 |
| `references/scene-api.md` | Scene API：切换/并行/状态/事件 |
| `references/game-objects.md` | Sprite、Text、Graphics、Container、Group |
| `references/physics.md` | Arcade/Matter.js 物理、碰撞检测 |
| `references/input.md` | 键盘、鼠标、触摸、拖拽 |
| `references/animation.md` | 帧动画、补间动画、粒子系统 |
| `references/camera-audio.md` | 相机控制、特效、音频 |
| `references/patterns.md` | 平台跳跃、射击、跑酷、消除、状态机 |
| `references/slot-machine.md` | 老虎机完整实现：滚动、缓动、中奖检测 |
| `references/platformer-feel.md` | 手感优化：Coyote Time、跳跃缓冲、边缘宽容 |

## 调试

```typescript
// 物理调试
physics: { arcade: { debug: true } }

// FPS
this.add.text(10, 10, '').setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
```
