# Phaser 3 相机与音频

## 相机系统

### 基础相机

```typescript
// 获取主相机
const camera = this.cameras.main;

// 相机位置
camera.setPosition(x, y);
camera.scrollX = 100;
camera.scrollY = 100;
camera.centerOn(x, y);
camera.centerOnX(x);
camera.centerOnY(y);

// 相机尺寸
camera.setSize(width, height);
camera.setViewport(x, y, width, height);

// 缩放
camera.setZoom(2);
camera.zoomTo(2, 1000);  // 缩放动画

// 旋转
camera.setRotation(Math.PI / 4);
camera.setAngle(45);

// 边界
camera.setBounds(0, 0, 2000, 600);
camera.useBounds = true;

// 背景色
camera.setBackgroundColor('#2d2d2d');
camera.setBackgroundColor(0x2d2d2d);
camera.transparent = true;
```

### 跟随目标

```typescript
// 基础跟随
camera.startFollow(player);

// 配置跟随
camera.startFollow(player, true, 0.1, 0.1);  // roundPixels, lerpX, lerpY

// 完整配置
camera.startFollow(player, {
  roundPixels: true,
  lerpX: 0.1,           // 水平平滑度 (0-1)
  lerpY: 0.1,           // 垂直平滑度
  offsetX: 0,           // 偏移
  offsetY: -50
});

// 停止跟随
camera.stopFollow();

// 死区（玩家在此区域内移动不触发相机移动）
camera.setDeadzone(200, 100);
camera.deadzone;  // Phaser.Geom.Rectangle

// 跟随偏移
camera.setFollowOffset(0, -100);
```

### 相机特效

```typescript
// 淡入淡出
camera.fadeIn(1000, 0, 0, 0);           // 从黑色淡入
camera.fadeOut(1000, 0, 0, 0);          // 淡出到黑色
camera.fade(1000, 0, 0, 0, false, callback);  // force, callback

// 闪烁
camera.flash(500, 255, 255, 255);       // 白色闪烁

// 震动
camera.shake(500, 0.01);                // duration, intensity
camera.shake(500, { x: 0.01, y: 0.02 });

// 平移
camera.pan(400, 300, 1000, 'Power2');   // x, y, duration, ease
camera.pan(400, 300, 1000, 'Power2', false, callback);

// 缩放动画
camera.zoomTo(2, 1000, 'Power2');

// 旋转动画
camera.rotateTo(Math.PI, false, 1000, 'Power2');

// 重置特效
camera.resetFX();

// 特效事件
camera.on('camerafadeincomplete', () => {});
camera.on('camerafadeoutcomplete', () => {});
camera.on('cameraflashcomplete', () => {});
camera.on('camerashakecomplete', () => {});
camera.on('camerapancomplete', () => {});
camera.on('camerazoomcomplete', () => {});
```

### 多相机

```typescript
// 添加相机
const minimap = this.cameras.add(600, 10, 180, 180);
minimap.setZoom(0.2);
minimap.setBackgroundColor(0x333333);
minimap.startFollow(player);

// 相机忽略对象
minimap.ignore(uiLayer);
camera.ignore([sprite1, sprite2]);

// 移除相机
this.cameras.remove(minimap);

// 获取所有相机
this.cameras.cameras;

// 设置主相机
this.cameras.main = newCamera;

// 相机渲染顺序
camera.setDepth(10);
```

### 相机裁剪

```typescript
// 只渲染相机视口内的对象
camera.setRoundPixels(true);

// 获取相机可见区域
camera.worldView;  // Phaser.Geom.Rectangle

// 检查点是否在相机视口内
camera.worldView.contains(x, y);

// 检查对象是否在相机视口内
const bounds = sprite.getBounds();
Phaser.Geom.Rectangle.Overlaps(camera.worldView, bounds);
```

### 坐标转换

```typescript
// 屏幕坐标 → 世界坐标
const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);

// 世界坐标 → 屏幕坐标
const screenX = sprite.x - camera.scrollX;
const screenY = sprite.y - camera.scrollY;

// 考虑缩放
const screenX = (sprite.x - camera.scrollX) * camera.zoom;
```

---

## 音频系统

### 加载音频

```typescript
preload() {
  // 单个音频文件
  this.load.audio('bgm', 'audio/music.mp3');
  
  // 多格式（浏览器兼容）
  this.load.audio('bgm', ['audio/music.ogg', 'audio/music.mp3']);
  
  // 音频精灵（多个音效合并）
  this.load.audioSprite('sfx', 'audio/sfx.json', [
    'audio/sfx.ogg',
    'audio/sfx.mp3'
  ]);
}
```

### 播放音频

```typescript
// 简单播放
this.sound.play('bgm');

// 带配置播放
this.sound.play('bgm', {
  volume: 0.5,
  loop: true,
  delay: 0
});

// 获取音频实例
const music = this.sound.add('bgm', {
  volume: 0.8,
  loop: true
});
music.play();

// 音频精灵
const sfx = this.sound.addAudioSprite('sfx');
sfx.play('explosion');
sfx.play('jump', { volume: 0.5 });
```

### 音频控制

```typescript
const sound = this.sound.add('bgm');

// 播放控制
sound.play();
sound.pause();
sound.resume();
sound.stop();

// 属性
sound.setVolume(0.5);
sound.volume = 0.5;
sound.setLoop(true);
sound.loop = true;
sound.setRate(1.5);      // 播放速度
sound.rate = 1.5;
sound.setDetune(100);    // 音调（音分）
sound.detune = 100;
sound.setSeek(10);       // 跳转到秒
sound.seek = 10;

// 淡入淡出
sound.setVolume(0);
sound.play();
this.tweens.add({
  targets: sound,
  volume: 1,
  duration: 2000
});

// 状态
sound.isPlaying;
sound.isPaused;
sound.duration;          // 总时长（秒）
sound.currentTime;       // 当前时间
sound.progress;          // 进度 (0-1)
```

### 音频事件

```typescript
sound.on('play', () => {});
sound.on('pause', () => {});
sound.on('resume', () => {});
sound.on('stop', () => {});
sound.on('complete', () => {});
sound.on('looped', () => {});
sound.on('mute', (sound, muted) => {});
sound.on('volume', (sound, volume) => {});
sound.on('rate', (sound, rate) => {});
sound.on('detune', (sound, detune) => {});
sound.on('seek', (sound, seek) => {});
```

### 全局音频管理

```typescript
// 全局音量
this.sound.volume = 0.5;

// 全局静音
this.sound.mute = true;
this.sound.setMute(true);

// 暂停/恢复所有
this.sound.pauseAll();
this.sound.resumeAll();
this.sound.stopAll();

// 移除音频
this.sound.remove(sound);
this.sound.removeAll();

// 获取所有音频
this.sound.sounds;

// 检查音频是否在播放
this.sound.isPlaying('bgm');

// 音频解锁（移动端需要用户交互）
this.sound.locked;  // 是否锁定
this.sound.once('unlocked', () => {
  // 可以播放音频了
});
```

### Web Audio API 特性

```typescript
// 检查是否使用 Web Audio
if (this.sound.context) {
  // Web Audio 可用
  const context = this.sound.context;
  
  // 创建分析器
  const analyser = context.createAnalyser();
  
  // 连接音频源
  sound.source.connect(analyser);
  analyser.connect(context.destination);
  
  // 获取频率数据
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
}
```

### 空间音频

```typescript
// 基于距离的音量
function updateSpatialAudio(listener: Phaser.GameObjects.Sprite, source: Phaser.GameObjects.Sprite, sound: Phaser.Sound.BaseSound) {
  const distance = Phaser.Math.Distance.Between(
    listener.x, listener.y,
    source.x, source.y
  );
  
  const maxDistance = 500;
  const volume = Math.max(0, 1 - distance / maxDistance);
  sound.setVolume(volume);
  
  // 左右声道平衡
  const pan = Phaser.Math.Clamp((source.x - listener.x) / maxDistance, -1, 1);
  // Web Audio API 需要额外处理 pan
}
```

---

## 资源加载

### 加载器配置

```typescript
preload() {
  // 基础路径
  this.load.setBaseURL('https://example.com/');
  this.load.setPath('assets/');
  
  // 跨域
  this.load.setCORS('anonymous');
  
  // 加载进度
  this.load.on('progress', (value: number) => {
    console.log(`${Math.round(value * 100)}%`);
    progressBar.setScale(value, 1);
  });
  
  this.load.on('fileprogress', (file: Phaser.Loader.File) => {
    console.log(`Loading: ${file.key}`);
  });
  
  this.load.on('complete', () => {
    console.log('All assets loaded');
  });
}
```

### 加载各类资源

```typescript
preload() {
  // 图片
  this.load.image('logo', 'logo.png');
  this.load.image({ key: 'logo', url: 'logo.png' });
  
  // 精灵表
  this.load.spritesheet('player', 'player.png', {
    frameWidth: 32,
    frameHeight: 48
  });
  
  // 图集
  this.load.atlas('sprites', 'sprites.png', 'sprites.json');
  this.load.multiatlas('mega', 'mega.json', 'assets/');
  
  // 音频
  this.load.audio('bgm', ['music.ogg', 'music.mp3']);
  this.load.audioSprite('sfx', 'sfx.json');
  
  // 位图字体
  this.load.bitmapFont('pixelFont', 'font.png', 'font.xml');
  
  // JSON
  this.load.json('levels', 'levels.json');
  
  // 文本
  this.load.text('story', 'story.txt');
  
  // XML
  this.load.xml('config', 'config.xml');
  
  // 二进制
  this.load.binary('data', 'data.bin');
  
  // 瓦片地图
  this.load.tilemapTiledJSON('map', 'map.json');
  this.load.tilemapCSV('map', 'map.csv');
  
  // 着色器
  this.load.glsl('shader', 'shader.frag');
  
  // HTML
  this.load.html('template', 'template.html');
  
  // 视频
  this.load.video('intro', 'intro.mp4');
  
  // 脚本
  this.load.script('lib', 'library.js');
  this.load.scripts('libs', ['lib1.js', 'lib2.js']);
  
  // 插件
  this.load.plugin('myPlugin', 'plugin.js');
  this.load.scenePlugin('scenePlugin', 'scenePlugin.js', 'myScenePlugin');
}
```

### 动态加载

```typescript
// 在 create 或 update 中加载
this.load.image('newImage', 'new.png');
this.load.once('complete', () => {
  // 新资源加载完成
  this.add.image(400, 300, 'newImage');
});
this.load.start();

// 检查资源是否已加载
if (this.textures.exists('myTexture')) {
  // 已加载
}
```

### 资源包

```typescript
// 定义资源包
const pack = {
  files: [
    { type: 'image', key: 'logo', url: 'logo.png' },
    { type: 'spritesheet', key: 'player', url: 'player.png', frameConfig: { frameWidth: 32, frameHeight: 48 } },
    { type: 'audio', key: 'bgm', url: ['music.ogg', 'music.mp3'] }
  ]
};

// 加载资源包
this.load.pack('level1', pack);
// 或从文件
this.load.pack('level1', 'level1-assets.json');
```
