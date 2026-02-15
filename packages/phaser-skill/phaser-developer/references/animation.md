# Phaser 3 动画系统

## 创建动画

### 从精灵表创建

```typescript
// 加载精灵表
preload() {
  this.load.spritesheet('player', 'player.png', {
    frameWidth: 32,
    frameHeight: 48,
    startFrame: 0,
    endFrame: 15,
    margin: 0,
    spacing: 0
  });
}

// 创建动画
create() {
  this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('player', { 
      start: 0, 
      end: 3 
    }),
    frameRate: 10,
    repeat: -1  // -1 = 无限循环
  });
  
  this.anims.create({
    key: 'jump',
    frames: this.anims.generateFrameNumbers('player', { 
      frames: [4, 5, 6, 7]  // 指定帧
    }),
    frameRate: 8,
    repeat: 0  // 播放一次
  });
}
```

### 从图集创建

```typescript
// 加载图集
preload() {
  this.load.atlas('sprites', 'sprites.png', 'sprites.json');
}

// 创建动画
create() {
  this.anims.create({
    key: 'explode',
    frames: this.anims.generateFrameNames('sprites', {
      prefix: 'explosion_',
      start: 1,
      end: 8,
      suffix: '.png',
      zeroPad: 2  // explosion_01.png, explosion_02.png...
    }),
    frameRate: 15,
    repeat: 0,
    hideOnComplete: true
  });
}
```

### 动画配置选项

```typescript
this.anims.create({
  key: 'walk',
  frames: frames,
  
  // 播放速度
  frameRate: 10,           // 每秒帧数
  duration: 1000,          // 或指定总时长（毫秒）
  
  // 循环
  repeat: -1,              // -1=无限, 0=一次, n=n次
  repeatDelay: 500,        // 循环间隔
  
  // 方向
  yoyo: true,              // 来回播放
  
  // 显示
  showOnStart: true,       // 开始时显示
  hideOnComplete: false,   // 完成时隐藏
  
  // 跳帧
  skipMissedFrames: true,  // 跳过延迟帧
  
  // 延迟
  delay: 0,                // 开始延迟
  
  // 随机
  randomFrame: false       // 随机起始帧
});
```

### 手动定义帧

```typescript
this.anims.create({
  key: 'custom',
  frames: [
    { key: 'sprites', frame: 'frame1.png', duration: 100 },
    { key: 'sprites', frame: 'frame2.png', duration: 200 },
    { key: 'sprites', frame: 'frame3.png', duration: 50 },
    { key: 'sprites', frame: 'frame4.png' }  // 使用默认 frameRate
  ],
  frameRate: 10
});
```

---

## 播放动画

### 基础播放

```typescript
// 播放
sprite.play('walk');
sprite.play('walk', true);  // ignoreIfPlaying

// 反向播放
sprite.playReverse('walk');

// 延迟播放
sprite.playAfterDelay('walk', 1000);

// 当前动画重复后播放
sprite.playAfterRepeat('idle', 2);

// 链式播放
sprite.play('attack').chain('idle');
sprite.chain(['walk', 'run', 'idle']);

// 停止
sprite.stop();
sprite.anims.stop();
```

### 动画控制

```typescript
const anims = sprite.anims;

// 暂停/恢复
anims.pause();
anims.resume();

// 重启
anims.restart();

// 反向
anims.reverse();

// 跳转到帧
anims.setCurrentFrame(anims.currentAnim.frames[3]);
anims.nextFrame();
anims.previousFrame();

// 设置进度 (0-1)
anims.setProgress(0.5);

// 时间缩放
anims.timeScale = 2;  // 2倍速
anims.timeScale = 0.5;  // 半速

// 设置重复次数
anims.setRepeat(3);
anims.setRepeat(-1);  // 无限

// 设置 yoyo
anims.setYoyo(true);
```

### 动画状态

```typescript
const anims = sprite.anims;

// 状态检查
anims.isPlaying;
anims.isPaused;
anims.isLoaded;

// 当前信息
anims.currentAnim;        // 当前动画对象
anims.currentFrame;       // 当前帧对象
anims.getName();          // 当前动画名称

// 帧信息
anims.getFrameName();     // 当前帧名称
anims.getTotalFrames();   // 总帧数
anims.getProgress();      // 进度 (0-1)
anims.getRepeat();        // 剩余重复次数

// 时间信息
anims.duration;           // 动画总时长
anims.msPerFrame;         // 每帧毫秒数
```

---

## 动画事件

### 精灵级事件

```typescript
// 动画开始
sprite.on('animationstart', (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame, gameObject: Phaser.GameObjects.Sprite) => {
  console.log('Animation started:', anim.key);
});

// 动画更新（每帧）
sprite.on('animationupdate', (anim, frame, gameObject) => {
  console.log('Frame:', frame.index);
});

// 动画重复
sprite.on('animationrepeat', (anim, frame, gameObject) => {
  console.log('Animation repeated');
});

// 动画完成
sprite.on('animationcomplete', (anim, frame, gameObject) => {
  console.log('Animation complete:', anim.key);
});

// 特定动画完成
sprite.on('animationcomplete-attack', (anim, frame, gameObject) => {
  sprite.play('idle');
});

// 动画停止
sprite.on('animationstop', (anim, frame, gameObject) => {});

// 动画重启
sprite.on('animationrestart', (anim, frame, gameObject) => {});
```

### 全局动画事件

```typescript
// 任何动画开始
this.anims.on('start', (anim, frame, gameObject) => {});

// 任何动画完成
this.anims.on('complete', (anim, frame, gameObject) => {});

// 添加新动画
this.anims.on('add', (key, anim) => {});

// 移除动画
this.anims.on('remove', (key, anim) => {});
```

---

## 动画管理

### 全局动画管理器

```typescript
// 获取动画
const anim = this.anims.get('walk');

// 检查动画是否存在
this.anims.exists('walk');

// 获取所有动画
const anims = this.anims.anims;  // Map

// 暂停所有动画
this.anims.pauseAll();
this.anims.resumeAll();

// 移除动画
this.anims.remove('walk');

// 从 JSON 加载动画
this.anims.fromJSON(jsonData);

// 导出为 JSON
const json = this.anims.toJSON();

// 全局时间缩放
this.anims.globalTimeScale = 0.5;
```

### 从 JSON 定义动画

```typescript
// animations.json
{
  "anims": [
    {
      "key": "walk",
      "type": "frame",
      "frames": [
        { "key": "player", "frame": 0, "duration": 100 },
        { "key": "player", "frame": 1, "duration": 100 },
        { "key": "player", "frame": 2, "duration": 100 },
        { "key": "player", "frame": 3, "duration": 100 }
      ],
      "frameRate": 10,
      "repeat": -1
    }
  ]
}

// 加载
preload() {
  this.load.animation('playerAnims', 'animations.json');
}
```

---

## 补间动画 (Tweens)

### 基础补间

```typescript
this.tweens.add({
  targets: sprite,
  x: 400,
  y: 300,
  duration: 1000,
  ease: 'Power2'
});
```

### 完整配置

```typescript
this.tweens.add({
  targets: sprite,              // 目标对象（可以是数组）
  
  // 属性
  x: 400,
  y: { value: 300, duration: 500 },  // 单独配置
  alpha: { from: 0, to: 1 },
  scale: { start: 0.5, to: 1 },
  angle: '+=90',                // 相对值
  
  // 时间
  duration: 1000,
  delay: 0,
  
  // 缓动
  ease: 'Power2',
  easeParams: [1.5],
  
  // 循环
  repeat: -1,                   // -1=无限
  repeatDelay: 500,
  yoyo: true,
  yoyoDelay: 200,
  
  // 翻转
  flipX: true,
  flipY: false,
  
  // 回调
  onStart: (tween, targets) => {},
  onUpdate: (tween, targets) => {},
  onRepeat: (tween, targets) => {},
  onYoyo: (tween, targets) => {},
  onComplete: (tween, targets) => {},
  
  // 回调作用域
  callbackScope: this,
  
  // 其他
  paused: false,
  persist: false,               // 完成后保留
  completeDelay: 0
});
```

### 缓动函数

```typescript
// 内置缓动
'Linear'
'Quad.easeIn', 'Quad.easeOut', 'Quad.easeInOut'
'Cubic.easeIn', 'Cubic.easeOut', 'Cubic.easeInOut'
'Quart.easeIn', 'Quart.easeOut', 'Quart.easeInOut'
'Quint.easeIn', 'Quint.easeOut', 'Quint.easeInOut'
'Sine.easeIn', 'Sine.easeOut', 'Sine.easeInOut'
'Expo.easeIn', 'Expo.easeOut', 'Expo.easeInOut'
'Circ.easeIn', 'Circ.easeOut', 'Circ.easeInOut'
'Elastic.easeIn', 'Elastic.easeOut', 'Elastic.easeInOut'
'Back.easeIn', 'Back.easeOut', 'Back.easeInOut'
'Bounce.easeIn', 'Bounce.easeOut', 'Bounce.easeInOut'
'Stepped'

// 简写
'Power0' // Linear
'Power1' // Quad
'Power2' // Cubic
'Power3' // Quart
'Power4' // Quint

// 自定义缓动
ease: (t) => t * t  // 自定义函数
```

### 补间控制

```typescript
const tween = this.tweens.add({ ... });

// 控制
tween.play();
tween.pause();
tween.resume();
tween.stop();
tween.restart();
tween.complete();  // 立即完成

// 状态
tween.isPlaying();
tween.isPaused();
tween.isActive();

// 进度
tween.seek(0.5);   // 跳转到 50%
tween.getProgress();

// 时间缩放
tween.timeScale = 2;

// 移除
tween.remove();
```

### 补间链

```typescript
// 链式补间
this.tweens.chain({
  targets: sprite,
  tweens: [
    { x: 400, duration: 1000 },
    { y: 300, duration: 500 },
    { scale: 2, duration: 300 }
  ],
  loop: -1
});
```

### 时间线

```typescript
const timeline = this.tweens.createTimeline();

timeline.add({
  targets: sprite1,
  x: 400,
  duration: 1000
});

timeline.add({
  targets: sprite2,
  y: 300,
  duration: 500,
  offset: '-=200'  // 提前 200ms 开始
});

timeline.add({
  targets: sprite3,
  alpha: 0,
  duration: 300,
  offset: '+=100'  // 延后 100ms 开始
});

timeline.play();

// 时间线控制
timeline.pause();
timeline.resume();
timeline.stop();
```

### 补间管理

```typescript
// 获取所有补间
this.tweens.getTweens();

// 暂停所有
this.tweens.pauseAll();
this.tweens.resumeAll();

// 停止特定目标的补间
this.tweens.killTweensOf(sprite);

// 检查是否有补间
this.tweens.isTweening(sprite);

// 全局时间缩放
this.tweens.timeScale = 0.5;
```

---

## 粒子系统

### 创建粒子发射器

```typescript
// 基础粒子
const particles = this.add.particles(x, y, 'particle', {
  speed: 100,
  scale: { start: 1, end: 0 },
  blendMode: 'ADD'
});

// 完整配置
const particles = this.add.particles(x, y, 'particle', {
  // 发射
  frequency: 100,           // 发射频率（毫秒）
  quantity: 1,              // 每次发射数量
  emitting: true,
  
  // 生命周期
  lifespan: 2000,
  
  // 位置
  x: { min: -10, max: 10 },
  y: { min: -10, max: 10 },
  
  // 速度
  speed: { min: 50, max: 100 },
  angle: { min: 0, max: 360 },
  
  // 或使用方向
  speedX: { min: -100, max: 100 },
  speedY: { min: -200, max: -100 },
  
  // 加速度
  accelerationX: 0,
  accelerationY: 200,       // 重力效果
  
  // 缩放
  scale: { start: 1, end: 0 },
  scaleX: { start: 1, end: 0.5 },
  scaleY: { start: 1, end: 0.5 },
  
  // 旋转
  rotate: { min: 0, max: 360 },
  
  // 透明度
  alpha: { start: 1, end: 0 },
  
  // 颜色
  tint: 0xff0000,
  tint: { start: 0xff0000, end: 0x0000ff },
  
  // 混合模式
  blendMode: 'ADD',
  
  // 发射区域
  emitZone: {
    type: 'random',
    source: new Phaser.Geom.Circle(0, 0, 100)
  },
  
  // 死亡区域
  deathZone: {
    type: 'onEnter',
    source: new Phaser.Geom.Rectangle(0, 500, 800, 100)
  },
  
  // 边界
  bounds: new Phaser.Geom.Rectangle(0, 0, 800, 600),
  collideBottom: true,
  collideTop: true,
  collideLeft: true,
  collideRight: true,
  
  // 最大粒子数
  maxParticles: 100,
  
  // 持续时间
  duration: 5000,           // 发射持续时间
  stopAfter: 100            // 发射 n 个后停止
});
```

### 粒子控制

```typescript
// 开始/停止发射
particles.start();
particles.stop();
particles.explode(50);      // 一次性发射 50 个

// 跟随目标
particles.startFollow(sprite);
particles.stopFollow();

// 设置位置
particles.setPosition(x, y);

// 销毁
particles.destroy();
```
