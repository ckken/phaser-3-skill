# Phaser 3 核心架构

## Game 实例

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,           // AUTO | CANVAS | WEBGL | HEADLESS
  width: 800,
  height: 600,
  parent: 'game-container',    // DOM 容器 ID
  backgroundColor: '#2d2d2d',
  scene: [BootScene, MainScene, UIScene],
  
  // 缩放模式
  scale: {
    mode: Phaser.Scale.FIT,    // FIT | RESIZE | ENVELOP | WIDTH_CONTROLS_HEIGHT
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 240 },
    max: { width: 1600, height: 1200 }
  },
  
  // 物理引擎
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false,
      fps: 60
    }
  },
  
  // 渲染设置
  render: {
    antialias: true,
    pixelArt: false,           // 像素游戏设为 true
    roundPixels: false,
    transparent: false
  },
  
  // 音频
  audio: {
    disableWebAudio: false,
    noAudio: false
  },
  
  // 输入
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    gamepad: false
  },
  
  // 性能
  fps: {
    target: 60,
    forceSetTimeOut: false,
    min: 30
  }
};

const game = new Phaser.Game(config);
```

## 场景系统

### 场景配置

```typescript
class MyScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'MyScene',           // 唯一标识
      active: false,            // 是否自动启动
      visible: true,
      pack: {                   // 预加载资源包
        files: [
          { type: 'image', key: 'logo', url: 'logo.png' }
        ]
      },
      cameras: {                // 相机配置
        x: 0, y: 0,
        width: 800, height: 600
      },
      map: {},                  // 注入映射
      physics: {                // 场景级物理配置
        arcade: { gravity: { y: 500 } }
      },
      loader: {                 // 加载器配置
        baseURL: 'assets/',
        path: 'images/'
      },
      plugins: []               // 场景插件
    });
  }
}
```

### 完整生命周期

```typescript
class GameScene extends Phaser.Scene {
  // 1. 场景初始化，接收传递的数据
  init(data: { level: number; score: number }) {
    this.level = data.level;
    this.score = data.score;
  }
  
  // 2. 加载资源
  preload() {
    this.load.image('player', 'player.png');
    this.load.spritesheet('enemy', 'enemy.png', { frameWidth: 32, frameHeight: 32 });
  }
  
  // 3. 创建游戏对象（资源加载完成后）
  create(data: { level: number }) {
    this.player = this.add.sprite(100, 100, 'player');
    this.setupInput();
    this.createAnimations();
  }
  
  // 4. 游戏循环（每帧调用）
  update(time: number, delta: number) {
    // time: 游戏启动后的总毫秒数
    // delta: 距上一帧的毫秒数（用于帧率无关计算）
    this.player.x += this.speed * (delta / 1000);
  }
}
```

### 场景事件

```typescript
// 场景内部事件
this.events.on('create', () => {});
this.events.on('update', (time, delta) => {});
this.events.on('pause', () => {});
this.events.on('resume', () => {});
this.events.on('sleep', () => {});
this.events.on('wake', () => {});
this.events.on('shutdown', () => {});  // 场景停止
this.events.on('destroy', () => {});   // 场景销毁

// 全局场景事件
this.scene.get('OtherScene').events.on('custom-event', handler);
this.events.emit('custom-event', data);
```

## 场景管理器

```typescript
// 启动场景（停止当前场景）
this.scene.start('GameScene', { level: 1 });

// 启动场景（并行运行）
this.scene.launch('HUDScene');

// 暂停/恢复
this.scene.pause('GameScene');
this.scene.resume('GameScene');

// 休眠/唤醒（保留状态但不更新）
this.scene.sleep('GameScene');
this.scene.wake('GameScene');

// 停止场景
this.scene.stop('GameScene');

// 重启
this.scene.restart();
this.scene.restart({ newData: true });

// 场景顺序
this.scene.bringToTop('HUDScene');
this.scene.sendToBack('BackgroundScene');
this.scene.moveUp('GameScene');
this.scene.moveDown('GameScene');

// 获取场景引用
const hud = this.scene.get('HUDScene') as HUDScene;
hud.updateScore(100);

// 检查场景状态
this.scene.isActive('GameScene');
this.scene.isPaused('GameScene');
this.scene.isVisible('GameScene');
this.scene.isSleeping('GameScene');
```

## 注册表和数据共享

```typescript
// 全局注册表（跨场景共享）
this.registry.set('highScore', 1000);
const highScore = this.registry.get('highScore');

// 监听注册表变化
this.registry.events.on('changedata-highScore', (parent, value) => {
  console.log('High score changed to:', value);
});

// 场景数据（场景私有）
this.data.set('lives', 3);
this.data.get('lives');
this.data.inc('lives', 1);  // 增加
this.data.toggle('paused'); // 布尔切换

// 数据变化事件
this.data.events.on('changedata-lives', (parent, value, previousValue) => {});
```

## 插件系统

```typescript
// 全局插件（所有场景可用）
class MyGlobalPlugin extends Phaser.Plugins.BasePlugin {
  constructor(pluginManager: Phaser.Plugins.PluginManager) {
    super(pluginManager);
  }
  
  init() {}
  start() {}
  stop() {}
  destroy() {}
}

// 场景插件（单个场景）
class MyScenePlugin extends Phaser.Plugins.ScenePlugin {
  constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager) {
    super(scene, pluginManager);
  }
  
  boot() {
    this.systems.events.on('start', this.start, this);
    this.systems.events.on('shutdown', this.shutdown, this);
  }
}

// 注册插件
const config = {
  plugins: {
    global: [
      { key: 'MyGlobal', plugin: MyGlobalPlugin, start: true }
    ],
    scene: [
      { key: 'MyScene', plugin: MyScenePlugin, mapping: 'myPlugin' }
    ]
  }
};

// 使用
this.myPlugin.doSomething();
```

## 游戏事件

```typescript
// 游戏级事件
game.events.on('blur', () => {});      // 失去焦点
game.events.on('focus', () => {});     // 获得焦点
game.events.on('hidden', () => {});    // 页面隐藏
game.events.on('visible', () => {});   // 页面可见
game.events.on('pause', () => {});     // 游戏暂停
game.events.on('resume', () => {});    // 游戏恢复
game.events.on('step', () => {});      // 每帧
game.events.on('prestep', () => {});   // 帧开始前
game.events.on('poststep', () => {});  // 帧结束后

// 手动控制游戏循环
game.loop.pause();
game.loop.resume();
game.loop.sleep();
game.loop.wake();
```

## 时间系统

```typescript
// 延迟调用
this.time.delayedCall(1000, () => {
  console.log('1 second later');
}, [], this);

// 重复定时器
const timer = this.time.addEvent({
  delay: 500,
  callback: this.spawnEnemy,
  callbackScope: this,
  loop: true,
  // 或者
  repeat: 10,        // 重复次数
  startAt: 0,        // 初始延迟
  paused: false
});

// 控制定时器
timer.pause();
timer.resume();
timer.remove();
timer.reset({ delay: 1000 });

// 获取时间信息
this.time.now;           // 当前时间戳
this.time.timeScale;     // 时间缩放（慢动作）
this.time.timeScale = 0.5;  // 半速

// 场景时间缩放
this.time.timeScale = 2;    // 2倍速
```
