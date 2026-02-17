# Phaser 包体优化

## 问题

Phaser 完整包约 1.2MB (gzip ~340KB)，首屏加载慢。

## 优化策略

### 1. 按需导入 (Tree Shaking)

Phaser 3.60+ 支持模块化导入：

```typescript
// ❌ 全量导入 (~1.2MB)
import Phaser from 'phaser';

// ✅ 按需导入 (可减少 30-50%)
import { Game, Scene, AUTO } from 'phaser';
import { ArcadePhysics } from 'phaser/src/physics/arcade';
```

**注意**：目前 Phaser 的 tree shaking 支持有限，效果因项目而异。

### 2. 动态导入 (Code Splitting)

```typescript
// 首屏只加载 Loading 场景
const config: Phaser.Types.Core.GameConfig = {
  scene: [LoadingScene],
};

// LoadingScene 中动态加载游戏场景
class LoadingScene extends Phaser.Scene {
  async create() {
    // 显示加载进度
    this.add.text(200, 300, 'Loading...', { fontSize: '24px' });
    
    // 动态导入主游戏
    const { GameScene } = await import('./GameScene');
    this.scene.add('GameScene', GameScene);
    this.scene.start('GameScene');
  }
}
```

### 3. Vite 分包配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Phaser 单独打包
          phaser: ['phaser'],
        },
      },
    },
    // 提高警告阈值（Phaser 本身就大）
    chunkSizeWarningLimit: 1500,
  },
});
```

### 4. CDN 加载

```html
<!-- index.html -->
<script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"></script>

<!-- 或使用国内 CDN -->
<script src="https://unpkg.zhimg.com/phaser@3.90.0/dist/phaser.min.js"></script>
```

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['phaser'],
      output: {
        globals: {
          phaser: 'Phaser',
        },
      },
    },
  },
});
```

### 5. 压缩优化

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [
    compression({
      algorithm: 'gzip',
      threshold: 10240, // 10KB 以上才压缩
    }),
    compression({
      algorithm: 'brotliCompress',
      threshold: 10240,
    }),
  ],
});
```

### 6. 资源优化

```typescript
// 使用 Texture Atlas 替代多个单图
// ❌ 多次请求
this.load.image('player', 'player.png');
this.load.image('enemy', 'enemy.png');
this.load.image('coin', 'coin.png');

// ✅ 单次请求
this.load.atlas('sprites', 'sprites.png', 'sprites.json');
```

生成 Atlas：
```bash
# 使用 TexturePacker CLI
TexturePacker --format phaser --data sprites.json --sheet sprites.png assets/*.png

# 或使用 free-tex-packer-cli
npx free-tex-packer-cli -i assets -o dist --name sprites --format phaser3
```

### 7. 预加载策略

```typescript
class BootScene extends Phaser.Scene {
  preload() {
    // 只加载 Loading 界面必需资源
    this.load.image('logo', 'logo.png');
    this.load.image('progress-bar', 'progress.png');
  }
  
  create() {
    this.scene.start('LoadingScene');
  }
}

class LoadingScene extends Phaser.Scene {
  preload() {
    // 显示进度条
    const bar = this.add.image(400, 300, 'progress-bar');
    
    this.load.on('progress', (value: number) => {
      bar.setCrop(0, 0, bar.width * value, bar.height);
    });
    
    // 加载所有游戏资源
    this.load.atlas('game', 'game.png', 'game.json');
    this.load.audio('bgm', 'bgm.mp3');
    // ...
  }
  
  create() {
    this.scene.start('GameScene');
  }
}
```

## 体积对比

| 策略 | 首屏 JS | 说明 |
|------|---------|------|
| 默认 | ~1.2MB | 全量打包 |
| CDN | ~50KB | Phaser 从 CDN 加载 |
| 分包 | ~50KB + 1.2MB (lazy) | 首屏快，后台加载 |
| Tree Shaking | ~800KB | 效果有限 |

## 推荐方案

**小游戏/Demo**：CDN 加载最简单

**正式项目**：分包 + 预加载 + Brotli 压缩

```typescript
// 最佳实践配置
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
```
