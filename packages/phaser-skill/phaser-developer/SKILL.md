---
name: phaser-developer
description: Phaser 3 游戏开发技能。当用户需要创建 2D 游戏、使用 Phaser 框架、处理游戏物理/动画/输入时激活。
---

# Phaser Developer

帮助 AI 使用 Phaser 3 框架开发 2D 游戏。

## 触发场景

- 用户要求创建游戏或游戏原型
- 提到 Phaser、Phaser 3、2D 游戏开发
- 需要处理游戏物理、精灵动画、碰撞检测
- 创建平台跳跃、射击、益智等类型游戏

## 快速开始

### 最小游戏模板

```typescript
import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    // 加载资源
    this.load.image('player', 'assets/player.png');
  }

  create() {
    // 创建游戏对象
    this.player = this.add.sprite(400, 300, 'player');
  }

  update(time: number, delta: number) {
    // 游戏循环逻辑
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: MainScene,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 300 }, debug: false }
  }
};

new Phaser.Game(config);
```

### 使用 Bun 运行

```bash
bun add phaser
bun run index.ts
```

## 核心概念

### 1. 场景生命周期

```
init() → preload() → create() → update() (循环)
```

| 方法 | 用途 |
|------|------|
| `init(data)` | 接收场景切换数据，初始化变量 |
| `preload()` | 加载所有资源（图片、音频、JSON） |
| `create()` | 创建游戏对象、设置物理、绑定输入 |
| `update(time, delta)` | 每帧执行，处理游戏逻辑 |

### 2. 游戏对象

```typescript
// 静态图片
this.add.image(x, y, 'key');

// 精灵（可动画）
this.add.sprite(x, y, 'key');

// 物理精灵
this.physics.add.sprite(x, y, 'key');

// 文本
this.add.text(x, y, 'Hello', { fontSize: '32px', color: '#fff' });

// 图形绘制
const graphics = this.add.graphics();
graphics.fillStyle(0xff0000);
graphics.fillRect(0, 0, 100, 100);
```

### 3. Arcade 物理

```typescript
// 启用物理
this.physics.add.existing(gameObject);

// 设置速度
sprite.setVelocity(200, -300);
sprite.setVelocityX(200);

// 碰撞检测
this.physics.add.collider(player, platforms);
this.physics.add.overlap(player, coins, collectCoin, null, this);

// 物理属性
sprite.body.setGravityY(500);
sprite.body.setBounce(0.2);
sprite.body.setCollideWorldBounds(true);
```

### 4. 输入处理

```typescript
// 键盘
const cursors = this.input.keyboard.createCursorKeys();
if (cursors.left.isDown) player.setVelocityX(-160);

// 单个按键
const spaceKey = this.input.keyboard.addKey('SPACE');
if (Phaser.Input.Keyboard.JustDown(spaceKey)) jump();

// 鼠标/触摸
this.input.on('pointerdown', (pointer) => {
  console.log(pointer.x, pointer.y);
});

// 游戏对象交互
sprite.setInteractive();
sprite.on('pointerdown', () => console.log('clicked'));
```

### 5. 动画

```typescript
// 从精灵表创建动画
this.anims.create({
  key: 'walk',
  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
  frameRate: 10,
  repeat: -1  // 无限循环
});

// 播放动画
sprite.play('walk');
sprite.anims.stop();
```

### 6. 补间动画

```typescript
this.tweens.add({
  targets: sprite,
  x: 400,
  y: 300,
  scale: 2,
  alpha: 0.5,
  duration: 1000,
  ease: 'Power2',
  yoyo: true,
  repeat: -1,
  onComplete: () => console.log('done')
});
```

### 7. 场景管理

```typescript
// 切换场景
this.scene.start('GameOver', { score: 100 });

// 并行场景（UI层）
this.scene.launch('HUD');
this.scene.pause('MainScene');

// 重启当前场景
this.scene.restart();
```

### 8. 相机

```typescript
// 跟随玩家
this.cameras.main.startFollow(player);

// 设置边界
this.cameras.main.setBounds(0, 0, 2000, 600);

// 特效
this.cameras.main.shake(500);
this.cameras.main.fade(1000, 0, 0, 0);
this.cameras.main.flash(500);
```

## 常见游戏模式

### 平台跳跃

```typescript
create() {
  this.player = this.physics.add.sprite(100, 450, 'player');
  this.player.setCollideWorldBounds(true);
  
  this.platforms = this.physics.add.staticGroup();
  this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
  
  this.physics.add.collider(this.player, this.platforms);
  this.cursors = this.input.keyboard.createCursorKeys();
}

update() {
  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-160);
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(160);
  } else {
    this.player.setVelocityX(0);
  }
  
  if (this.cursors.up.isDown && this.player.body.touching.down) {
    this.player.setVelocityY(-330);
  }
}
```

### 射击游戏子弹

```typescript
class Bullet extends Phaser.Physics.Arcade.Sprite {
  fire(x: number, y: number) {
    this.body.reset(x, y);
    this.setActive(true).setVisible(true);
    this.setVelocityY(-300);
  }
  
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.y < 0) this.setActive(false).setVisible(false);
  }
}

// 使用对象池
this.bullets = this.physics.add.group({
  classType: Bullet,
  maxSize: 10,
  runChildUpdate: true
});

// 发射
const bullet = this.bullets.get();
if (bullet) bullet.fire(player.x, player.y);
```

## 资源加载

```typescript
preload() {
  // 图片
  this.load.image('sky', 'assets/sky.png');
  
  // 精灵表
  this.load.spritesheet('player', 'assets/player.png', {
    frameWidth: 32,
    frameHeight: 48
  });
  
  // 图集（推荐，性能更好）
  this.load.atlas('sprites', 'assets/sprites.png', 'assets/sprites.json');
  
  // 音频
  this.load.audio('bgm', 'assets/music.mp3');
  
  // JSON 数据
  this.load.json('levels', 'assets/levels.json');
  
  // 加载进度
  this.load.on('progress', (value: number) => {
    console.log(`Loading: ${Math.round(value * 100)}%`);
  });
}
```

## 调试技巧

```typescript
// 开启物理调试
physics: {
  arcade: { debug: true }
}

// 控制台输出
console.log(sprite.x, sprite.y, sprite.body.velocity);

// FPS 显示
this.add.text(10, 10, '', { fontSize: '16px' })
  .setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
```

## 参考资源

- [Phaser 3 官方文档](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 3 示例](https://phaser.io/examples)
- [Phaser 3 API](https://newdocs.phaser.io/docs/3.60.0)

## 相关文件

- `references/core-architecture.md` - 架构详解
- `references/physics.md` - 物理系统详解
- `references/patterns.md` - 更多游戏模式
