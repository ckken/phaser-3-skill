# Phaser 版本差异 (3.55 → 3.60+)

## 重要变更概览

| 特性 | 3.55 及之前 | 3.60+ |
|------|-------------|-------|
| 物理 Body 类型 | `body` 可能为 null | 需要类型断言 |
| 输入事件 | 旧 API | 新增 `pointer.wasTouch` |
| 粒子系统 | `ParticleEmitterManager` | 简化为 `ParticleEmitter` |
| 文本渲染 | Canvas 优先 | WebGL 优化 |
| TypeScript | 类型不完整 | 完整类型定义 |

## 1. 物理 Body 类型变更

### 3.55

```typescript
// body 可能为 any 类型
sprite.body.setVelocity(100, 0);
```

### 3.60+

```typescript
// 需要类型断言
const body = sprite.body as Phaser.Physics.Arcade.Body;
body.setVelocity(100, 0);

// 或使用类型守卫
if (sprite.body instanceof Phaser.Physics.Arcade.Body) {
  sprite.body.setVelocity(100, 0);
}
```

## 2. 粒子系统重构

### 3.55 (旧 API)

```typescript
// 创建粒子管理器
const particles = this.add.particles('spark');
const emitter = particles.createEmitter({
  speed: 100,
  scale: { start: 1, end: 0 },
  blendMode: 'ADD',
});
emitter.startFollow(player);
```

### 3.60+ (新 API)

```typescript
// 直接创建发射器
const emitter = this.add.particles(0, 0, 'spark', {
  speed: 100,
  scale: { start: 1, end: 0 },
  blendMode: 'ADD',
});
emitter.startFollow(player);
```

### 兼容写法

```typescript
function createParticles(scene: Phaser.Scene, texture: string, config: any) {
  // 检测版本
  if (typeof scene.add.particles === 'function') {
    // 3.60+ 新 API
    const firstArg = scene.add.particles.length >= 3;
    if (firstArg) {
      return scene.add.particles(0, 0, texture, config);
    }
  }
  // 3.55 旧 API
  const particles = scene.add.particles(texture);
  return particles.createEmitter(config);
}
```

## 3. 输入系统增强

### 3.60+ 新增

```typescript
// 区分触摸和鼠标
this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
  if (pointer.wasTouch) {
    // 触摸输入
  } else {
    // 鼠标输入
  }
});

// 多点触控改进
this.input.addPointer(2); // 支持3点触控
```

## 4. 场景事件变更

### 3.55

```typescript
this.events.on('shutdown', this.cleanup, this);
```

### 3.60+ (推荐)

```typescript
this.events.once('shutdown', this.cleanup, this);
// 或使用 destroy 事件
this.events.once('destroy', this.cleanup, this);
```

## 5. 相机效果

### 3.60+ 新增

```typescript
// 相机后处理
this.cameras.main.setPostPipeline('Blur');

// 相机遮罩改进
this.cameras.main.setMask(mask, true); // fixedToCamera 参数
```

## 6. 文本渲染优化

### 3.60+ 改进

```typescript
// WebGL 文本渲染更快
const text = this.add.text(0, 0, 'Hello', {
  fontSize: '32px',
});

// 新增 resolution 选项
const hdText = this.add.text(0, 0, 'HD Text', {
  fontSize: '32px',
  resolution: 2, // 高清渲染
});
```

## 7. 加载器变更

### 3.60+

```typescript
// 新增加载类型
this.load.video('intro', 'intro.mp4', true); // 第三个参数变更

// 加载进度事件改进
this.load.on('filecomplete-image-player', (key: string) => {
  console.log(`${key} loaded`);
});
```

## 8. TypeScript 类型改进

### 3.55

```typescript
// 很多类型需要手动声明
const sprite: any = this.add.sprite(0, 0, 'player');
```

### 3.60+

```typescript
// 完整类型推断
const sprite = this.add.sprite(0, 0, 'player');
// sprite 自动推断为 Phaser.GameObjects.Sprite
```

## 9. 性能改进

### 3.60+ 优化

- WebGL 批处理改进
- 纹理压缩支持 (ASTC, ETC, PVRTC)
- 更好的内存管理

```typescript
// 启用纹理压缩
const config: Phaser.Types.Core.GameConfig = {
  render: {
    powerPreference: 'high-performance',
  },
};
```

## 10. 迁移建议

### 从 3.55 升级到 3.60+

1. **更新依赖**
```bash
bun add phaser@latest
```

2. **检查粒子系统**
```typescript
// 搜索旧 API
// particles.createEmitter → add.particles
```

3. **添加类型断言**
```typescript
// 搜索 .body. 调用，添加类型断言
```

4. **测试输入事件**
```typescript
// 确保触摸和鼠标行为一致
```

### 版本检测

```typescript
const phaserVersion = Phaser.VERSION;
const majorVersion = parseInt(phaserVersion.split('.')[1]);

if (majorVersion >= 60) {
  // 使用新 API
} else {
  // 使用旧 API
}
```
