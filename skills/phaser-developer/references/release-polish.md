# 游戏发布完善

## 1. 版本号管理

### 自动注入版本号

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import pkg from './package.json';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
```

```typescript
// 类型声明 (global.d.ts)
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
```

```typescript
// 使用
class BootScene extends Phaser.Scene {
  create() {
    this.add.text(10, 10, `v${__APP_VERSION__}`, {
      fontSize: '12px',
      color: '#666',
    });
  }
}
```

### 语义化版本

```json
// package.json
{
  "version": "1.2.3",
  "scripts": {
    "version:patch": "npm version patch",
    "version:minor": "npm version minor", 
    "version:major": "npm version major"
  }
}
```

## 2. 构建时间戳

```typescript
// 显示构建信息
class AboutScene extends Phaser.Scene {
  create() {
    const buildDate = new Date(__BUILD_TIME__);
    
    this.add.text(400, 300, [
      `版本: ${__APP_VERSION__}`,
      `构建: ${buildDate.toLocaleDateString()} ${buildDate.toLocaleTimeString()}`,
    ].join('\n'), {
      fontSize: '16px',
      color: '#fff',
      align: 'center',
    }).setOrigin(0.5);
  }
}
```

## 3. 更新日志弹窗

### 版本检测

```typescript
class UpdateChecker {
  private readonly VERSION_KEY = 'lastSeenVersion';
  
  shouldShowChangelog(): boolean {
    const lastSeen = localStorage.getItem(this.VERSION_KEY);
    return lastSeen !== __APP_VERSION__;
  }
  
  markAsSeen() {
    localStorage.setItem(this.VERSION_KEY, __APP_VERSION__);
  }
}
```

### 更新日志弹窗

```typescript
// changelog.ts
export const CHANGELOG: Record<string, string[]> = {
  '1.2.0': [
    '✨ 新增连击系统',
    '🎮 优化手感体验',
    '🐛 修复跳跃bug',
  ],
  '1.1.0': [
    '✨ 新增计时模式',
    '🎨 UI 优化',
  ],
};

class ChangelogPopup {
  private container: Phaser.GameObjects.Container;
  
  constructor(scene: Phaser.Scene) {
    const { width, height } = scene.cameras.main;
    
    this.container = scene.add.container(width / 2, height / 2);
    
    // 遮罩背景
    const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setInteractive();
    
    // 弹窗背景
    const bg = scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-200, -180, 400, 360, 16);
    bg.lineStyle(2, 0xffd700);
    bg.strokeRoundedRect(-200, -180, 400, 360, 16);
    
    // 标题
    const title = scene.add.text(0, -150, `🎉 更新至 v${__APP_VERSION__}`, {
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // 更新内容
    const changes = CHANGELOG[__APP_VERSION__] || ['无更新说明'];
    const content = scene.add.text(0, -50, changes.join('\n\n'), {
      fontSize: '18px',
      color: '#fff',
      lineSpacing: 8,
      wordWrap: { width: 360 },
    }).setOrigin(0.5, 0);
    
    // 确认按钮
    const btn = this.createButton(scene, 0, 140, '知道了', () => {
      new UpdateChecker().markAsSeen();
      this.hide(scene);
    });
    
    this.container.add([overlay, bg, title, content, btn]);
    this.container.setDepth(1000);
    
    // 入场动画
    this.container.setScale(0.8).setAlpha(0);
    scene.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }
  
  private createButton(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void) {
    const btn = scene.add.container(x, y);
    
    const bg = scene.add.graphics();
    bg.fillStyle(0xffd700, 1);
    bg.fillRoundedRect(-80, -20, 160, 40, 8);
    
    const label = scene.add.text(0, 0, text, {
      fontSize: '18px',
      color: '#000',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    btn.add([bg, label]);
    btn.setSize(160, 40);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onClick);
    btn.on('pointerover', () => btn.setScale(1.05));
    btn.on('pointerout', () => btn.setScale(1));
    
    return btn;
  }
  
  private hide(scene: Phaser.Scene) {
    scene.tweens.add({
      targets: this.container,
      scale: 0.8,
      alpha: 0,
      duration: 200,
      onComplete: () => this.container.destroy(),
    });
  }
}
```

### 在启动时检查

```typescript
class MainMenuScene extends Phaser.Scene {
  create() {
    // ... 其他 UI
    
    // 检查是否需要显示更新日志
    const checker = new UpdateChecker();
    if (checker.shouldShowChangelog()) {
      new ChangelogPopup(this);
    }
  }
}
```

## 4. 完整发布流程

### package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "release:patch": "npm version patch && npm run build",
    "release:minor": "npm version minor && npm run build",
    "release:major": "npm version major && npm run build"
  }
}
```

### GitHub Actions 自动发布

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v2
      
      - run: bun install
      
      - run: bun run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 发布检查清单

```markdown
## 发布前检查

- [ ] 更新 package.json 版本号
- [ ] 更新 CHANGELOG
- [ ] 本地构建测试通过
- [ ] 游戏功能测试通过
- [ ] 提交并打 tag
- [ ] 推送触发 CI/CD
```

## 5. 调试信息面板

```typescript
class DebugPanel {
  private text: Phaser.GameObjects.Text;
  private visible = false;
  
  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(10, 10, '', {
      fontSize: '12px',
      color: '#0f0',
      backgroundColor: '#000',
      padding: { x: 5, y: 5 },
    }).setScrollFactor(0).setDepth(9999).setVisible(false);
    
    // F3 切换显示
    scene.input.keyboard?.on('keydown-F3', () => {
      this.visible = !this.visible;
      this.text.setVisible(this.visible);
    });
  }
  
  update(scene: Phaser.Scene, extra: Record<string, any> = {}) {
    if (!this.visible) return;
    
    const info = {
      FPS: Math.round(scene.game.loop.actualFps),
      Version: __APP_VERSION__,
      Objects: scene.children.length,
      ...extra,
    };
    
    this.text.setText(
      Object.entries(info).map(([k, v]) => `${k}: ${v}`).join('\n')
    );
  }
}
```
