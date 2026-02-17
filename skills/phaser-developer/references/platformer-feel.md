# 平台跳跃手感优化

## 三件套概览

| 技术 | 作用 | 体验提升 |
|------|------|----------|
| Coyote Time | 离开平台后仍可跳跃 | 减少"明明按了却没跳"的挫败感 |
| Jump Buffer | 落地前按跳跃键预存 | 连续跳跃更流畅 |
| Edge Forgiveness | 平台边缘防滑 | 减少意外坠落 |

## 1. Coyote Time (土狼时间)

玩家离开平台边缘后，仍有短暂时间可以跳跃。

```typescript
class Player {
  private coyoteTime = 0;
  private readonly COYOTE_DURATION = 100; // 毫秒
  private wasOnGround = false;
  
  update(time: number, delta: number) {
    const onGround = this.sprite.body.blocked.down;
    
    // 刚离开地面，开始计时
    if (this.wasOnGround && !onGround) {
      this.coyoteTime = this.COYOTE_DURATION;
    }
    
    // 递减
    if (this.coyoteTime > 0) {
      this.coyoteTime -= delta;
    }
    
    this.wasOnGround = onGround;
  }
  
  canJump(): boolean {
    return this.sprite.body.blocked.down || this.coyoteTime > 0;
  }
  
  jump() {
    if (this.canJump()) {
      this.sprite.setVelocityY(-400);
      this.coyoteTime = 0; // 跳跃后清零，防止二段跳
    }
  }
}
```

## 2. Jump Buffer (跳跃缓冲)

玩家在落地前按下跳跃键，落地瞬间自动执行跳跃。

```typescript
class Player {
  private jumpBufferTime = 0;
  private readonly JUMP_BUFFER_DURATION = 150; // 毫秒
  
  update(time: number, delta: number) {
    // 递减缓冲时间
    if (this.jumpBufferTime > 0) {
      this.jumpBufferTime -= delta;
    }
    
    // 检测跳跃输入
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
      this.jumpBufferTime = this.JUMP_BUFFER_DURATION;
    }
    
    // 落地时检查缓冲
    if (this.sprite.body.blocked.down && this.jumpBufferTime > 0) {
      this.jump();
      this.jumpBufferTime = 0;
    }
  }
}
```

## 3. Edge Forgiveness (边缘宽容)

### 方案 A：扩大碰撞检测

```typescript
// 平台碰撞盒比视觉稍宽
platform.body.setSize(platform.width + 10, platform.height);
platform.body.setOffset(-5, 0);
```

### 方案 B：边缘吸附

```typescript
class Player {
  private readonly EDGE_SNAP_DISTANCE = 8;
  
  update() {
    if (!this.sprite.body.blocked.down && this.sprite.body.velocity.y > 0) {
      // 下落时检测附近平台
      const nearbyPlatform = this.findNearbyPlatformEdge();
      if (nearbyPlatform) {
        // 吸附到平台上
        this.sprite.y = nearbyPlatform.y - this.sprite.height / 2;
        this.sprite.body.velocity.y = 0;
      }
    }
  }
  
  findNearbyPlatformEdge(): Phaser.GameObjects.Sprite | null {
    // 检测玩家脚下附近的平台边缘
    const playerBottom = this.sprite.y + this.sprite.height / 2;
    const playerX = this.sprite.x;
    
    for (const platform of this.platforms.getChildren()) {
      const p = platform as Phaser.Physics.Arcade.Sprite;
      const platformTop = p.y - p.height / 2;
      const platformLeft = p.x - p.width / 2;
      const platformRight = p.x + p.width / 2;
      
      // 垂直距离在吸附范围内
      if (Math.abs(playerBottom - platformTop) < this.EDGE_SNAP_DISTANCE) {
        // 水平位置在平台范围内（含边缘宽容）
        if (playerX > platformLeft - this.EDGE_SNAP_DISTANCE && 
            playerX < platformRight + this.EDGE_SNAP_DISTANCE) {
          return p;
        }
      }
    }
    return null;
  }
}
```

## 完整整合示例

```typescript
class PlatformerPlayer {
  private sprite: Phaser.Physics.Arcade.Sprite;
  private jumpKey: Phaser.Input.Keyboard.Key;
  
  // 手感参数
  private readonly COYOTE_TIME = 100;
  private readonly JUMP_BUFFER = 150;
  private readonly JUMP_VELOCITY = -400;
  
  // 状态
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private wasOnGround = false;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.jumpKey = scene.input.keyboard.addKey('SPACE');
  }
  
  update(delta: number) {
    const onGround = this.sprite.body.blocked.down;
    
    // === Coyote Time ===
    if (this.wasOnGround && !onGround && this.sprite.body.velocity.y >= 0) {
      this.coyoteTimer = this.COYOTE_TIME;
    }
    if (this.coyoteTimer > 0) this.coyoteTimer -= delta;
    
    // === Jump Buffer ===
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
      this.jumpBufferTimer = this.JUMP_BUFFER;
    }
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= delta;
    
    // === 执行跳跃 ===
    const canJump = onGround || this.coyoteTimer > 0;
    const wantsJump = this.jumpBufferTimer > 0;
    
    if (canJump && wantsJump) {
      this.sprite.setVelocityY(this.JUMP_VELOCITY);
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }
    
    this.wasOnGround = onGround;
  }
}
```

## 参数调优建议

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| Coyote Time | 80-150ms | 太长会感觉飘，太短效果不明显 |
| Jump Buffer | 100-200ms | 太长会误触发跳跃 |
| Edge Snap | 4-10px | 太大会穿模 |

## 进阶：可变跳跃高度

松开跳跃键时减少上升速度，实现"轻按小跳、长按大跳"：

```typescript
update(delta: number) {
  // 上升过程中松开跳跃键
  if (this.sprite.body.velocity.y < 0 && this.jumpKey.isUp) {
    // 削减上升速度
    this.sprite.body.velocity.y *= 0.5;
  }
}
```

## 调试可视化

```typescript
// 显示 Coyote Time 状态
this.debugText.setText([
  `On Ground: ${onGround}`,
  `Coyote: ${this.coyoteTimer.toFixed(0)}ms`,
  `Buffer: ${this.jumpBufferTimer.toFixed(0)}ms`,
  `Velocity Y: ${this.sprite.body.velocity.y.toFixed(0)}`,
].join('\n'));
```
