# Phaser 3 常见游戏模式

## 平台跳跃游戏

```typescript
class PlatformerScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  
  preload() {
    this.load.image('ground', 'ground.png');
    this.load.spritesheet('player', 'player.png', { frameWidth: 32, frameHeight: 48 });
  }
  
  create() {
    // 平台
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    this.platforms.create(600, 400, 'ground');
    this.platforms.create(50, 250, 'ground');
    this.platforms.create(750, 220, 'ground');
    
    // 玩家
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    
    // 动画
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'idle',
      frames: [{ key: 'player', frame: 4 }],
      frameRate: 20
    });
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });
    
    // 碰撞
    this.physics.add.collider(this.player, this.platforms);
    
    // 输入
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  
  update() {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play('left', true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play('right', true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play('idle');
    }
    
    // 跳跃（只有站在地面时）
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }
  }
}
```

---

## 射击游戏

```typescript
class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet');
  }
  
  fire(x: number, y: number, direction: number) {
    this.body.reset(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setVelocityY(direction * 400);
  }
  
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.y < -10 || this.y > 610) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}

class ShooterScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private lastFired = 0;
  
  create() {
    // 玩家
    this.player = this.physics.add.sprite(400, 550, 'player');
    this.player.setCollideWorldBounds(true);
    
    // 子弹池
    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 30,
      runChildUpdate: true
    });
    
    // 敌人
    this.enemies = this.physics.add.group();
    this.spawnEnemies();
    
    // 碰撞
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, undefined, this);
    
    // 定时生成敌人
    this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemies,
      callbackScope: this,
      loop: true
    });
  }
  
  update(time: number) {
    // 移动
    const cursors = this.input.keyboard.createCursorKeys();
    if (cursors.left.isDown) {
      this.player.setVelocityX(-200);
    } else if (cursors.right.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }
    
    // 射击
    if (cursors.space.isDown && time > this.lastFired + 200) {
      const bullet = this.bullets.get() as Bullet;
      if (bullet) {
        bullet.fire(this.player.x, this.player.y - 20, -1);
        this.lastFired = time;
      }
    }
  }
  
  spawnEnemies() {
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(50, 750);
      const enemy = this.enemies.create(x, 0, 'enemy');
      enemy.setVelocityY(100);
    }
  }
  
  hitEnemy(bullet: Bullet, enemy: Phaser.Physics.Arcade.Sprite) {
    bullet.setActive(false);
    bullet.setVisible(false);
    enemy.destroy();
  }
}
```

---

## 无尽跑酷

```typescript
class RunnerScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private gameSpeed = 200;
  
  create() {
    // 玩家
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setGravityY(800);
    
    // 平台组
    this.platforms = this.physics.add.group();
    
    // 初始平台
    for (let i = 0; i < 5; i++) {
      this.spawnPlatform(200 + i * 200);
    }
    
    // 碰撞
    this.physics.add.collider(this.player, this.platforms);
    
    // 跳跃
    this.input.on('pointerdown', () => {
      if (this.player.body.touching.down) {
        this.player.setVelocityY(-400);
      }
    });
    
    // 分数
    this.time.addEvent({
      delay: 100,
      callback: () => { this.score++; },
      loop: true
    });
  }
  
  update() {
    // 移动平台
    this.platforms.children.iterate((platform: Phaser.Physics.Arcade.Sprite) => {
      platform.x -= this.gameSpeed * 0.016;
      
      // 回收平台
      if (platform.x < -100) {
        platform.x = 900;
        platform.y = Phaser.Math.Between(200, 400);
      }
      return true;
    });
    
    // 游戏结束
    if (this.player.y > 600) {
      this.scene.restart();
    }
    
    // 加速
    this.gameSpeed += 0.01;
  }
  
  spawnPlatform(x: number) {
    const y = Phaser.Math.Between(200, 400);
    const platform = this.platforms.create(x, y, 'platform') as Phaser.Physics.Arcade.Sprite;
    platform.body.setImmovable(true);
    platform.body.setAllowGravity(false);
  }
}
```

---

## 俯视角 RPG

```typescript
class RPGScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  
  create() {
    // 地图
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('tiles', 'tiles');
    const groundLayer = map.createLayer('Ground', tileset, 0, 0);
    const wallsLayer = map.createLayer('Walls', tileset, 0, 0);
    wallsLayer.setCollisionByProperty({ collides: true });
    
    // 玩家
    this.player = this.physics.add.sprite(100, 100, 'player');
    this.player.setSize(16, 16);
    
    // 动画
    this.createAnimations();
    
    // 碰撞
    this.physics.add.collider(this.player, wallsLayer);
    
    // 相机
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    
    // 输入
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  
  update() {
    const speed = 100;
    this.player.setVelocity(0);
    
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.anims.play('walk-left', true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.anims.play('walk-right', true);
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      this.player.anims.play('walk-up', true);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
      this.player.anims.play('walk-down', true);
    } else {
      this.player.anims.stop();
    }
  }
  
  createAnimations() {
    const directions = ['down', 'left', 'right', 'up'];
    directions.forEach((dir, i) => {
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers('player', { start: i * 4, end: i * 4 + 3 }),
        frameRate: 10,
        repeat: -1
      });
    });
  }
}
```

---

## 消除游戏

```typescript
class MatchScene extends Phaser.Scene {
  private grid: Phaser.GameObjects.Sprite[][] = [];
  private gridSize = 8;
  private tileSize = 64;
  private selected: { x: number; y: number } | null = null;
  
  create() {
    // 创建网格
    for (let y = 0; y < this.gridSize; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridSize; x++) {
        const type = Phaser.Math.Between(0, 4);
        const tile = this.add.sprite(
          x * this.tileSize + this.tileSize / 2,
          y * this.tileSize + this.tileSize / 2,
          'gems',
          type
        );
        tile.setInteractive();
        tile.setData('type', type);
        tile.setData('gridX', x);
        tile.setData('gridY', y);
        tile.on('pointerdown', () => this.selectTile(x, y));
        this.grid[y][x] = tile;
      }
    }
    
    // 初始检查匹配
    this.checkMatches();
  }
  
  selectTile(x: number, y: number) {
    if (!this.selected) {
      this.selected = { x, y };
      this.grid[y][x].setTint(0xffff00);
    } else {
      // 检查是否相邻
      const dx = Math.abs(x - this.selected.x);
      const dy = Math.abs(y - this.selected.y);
      
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        this.swapTiles(this.selected.x, this.selected.y, x, y);
      }
      
      this.grid[this.selected.y][this.selected.x].clearTint();
      this.selected = null;
    }
  }
  
  swapTiles(x1: number, y1: number, x2: number, y2: number) {
    const tile1 = this.grid[y1][x1];
    const tile2 = this.grid[y2][x2];
    
    // 交换数据
    this.grid[y1][x1] = tile2;
    this.grid[y2][x2] = tile1;
    
    // 动画
    this.tweens.add({
      targets: tile1,
      x: x2 * this.tileSize + this.tileSize / 2,
      y: y2 * this.tileSize + this.tileSize / 2,
      duration: 200
    });
    this.tweens.add({
      targets: tile2,
      x: x1 * this.tileSize + this.tileSize / 2,
      y: y1 * this.tileSize + this.tileSize / 2,
      duration: 200,
      onComplete: () => this.checkMatches()
    });
  }
  
  checkMatches() {
    const matches: { x: number; y: number }[] = [];
    
    // 横向检查
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize - 2; x++) {
        const type = this.grid[y][x].getData('type');
        if (type === this.grid[y][x + 1].getData('type') &&
            type === this.grid[y][x + 2].getData('type')) {
          matches.push({ x, y }, { x: x + 1, y }, { x: x + 2, y });
        }
      }
    }
    
    // 纵向检查
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize - 2; y++) {
        const type = this.grid[y][x].getData('type');
        if (type === this.grid[y + 1][x].getData('type') &&
            type === this.grid[y + 2][x].getData('type')) {
          matches.push({ x, y }, { x, y: y + 1 }, { x, y: y + 2 });
        }
      }
    }
    
    // 消除匹配
    if (matches.length > 0) {
      this.removeMatches(matches);
    }
  }
  
  removeMatches(matches: { x: number; y: number }[]) {
    // 去重
    const unique = [...new Set(matches.map(m => `${m.x},${m.y}`))];
    
    unique.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      this.tweens.add({
        targets: this.grid[y][x],
        scale: 0,
        duration: 200,
        onComplete: () => {
          // 重新生成
          const type = Phaser.Math.Between(0, 4);
          this.grid[y][x].setFrame(type);
          this.grid[y][x].setData('type', type);
          this.grid[y][x].setScale(1);
        }
      });
    });
  }
}
```

---

## 状态机模式

```typescript
// 简单状态机
class StateMachine {
  private states: Map<string, {
    enter?: () => void;
    update?: (delta: number) => void;
    exit?: () => void;
  }> = new Map();
  private currentState: string = '';
  
  addState(name: string, config: {
    enter?: () => void;
    update?: (delta: number) => void;
    exit?: () => void;
  }) {
    this.states.set(name, config);
  }
  
  setState(name: string) {
    if (this.currentState) {
      this.states.get(this.currentState)?.exit?.();
    }
    this.currentState = name;
    this.states.get(name)?.enter?.();
  }
  
  update(delta: number) {
    this.states.get(this.currentState)?.update?.(delta);
  }
}

// 使用示例
class Player {
  private stateMachine = new StateMachine();
  
  constructor(private sprite: Phaser.Physics.Arcade.Sprite) {
    this.stateMachine.addState('idle', {
      enter: () => this.sprite.anims.play('idle'),
      update: () => {
        if (this.isMoving()) this.stateMachine.setState('walk');
        if (this.isJumping()) this.stateMachine.setState('jump');
      }
    });
    
    this.stateMachine.addState('walk', {
      enter: () => this.sprite.anims.play('walk'),
      update: () => {
        if (!this.isMoving()) this.stateMachine.setState('idle');
        if (this.isJumping()) this.stateMachine.setState('jump');
      }
    });
    
    this.stateMachine.addState('jump', {
      enter: () => {
        this.sprite.anims.play('jump');
        this.sprite.setVelocityY(-400);
      },
      update: () => {
        if (this.sprite.body.touching.down) {
          this.stateMachine.setState('idle');
        }
      }
    });
    
    this.stateMachine.setState('idle');
  }
  
  update(delta: number) {
    this.stateMachine.update(delta);
  }
  
  private isMoving(): boolean { /* ... */ return false; }
  private isJumping(): boolean { /* ... */ return false; }
}
```

---

## 场景过渡

```typescript
// 淡入淡出过渡
class TransitionScene extends Phaser.Scene {
  transitionTo(targetScene: string, data?: object) {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(targetScene, data);
    });
  }
}

// 目标场景淡入
class GameScene extends Phaser.Scene {
  create() {
    this.cameras.main.fadeIn(500, 0, 0, 0);
    // ...
  }
}

// 滑动过渡
class SlideTransition {
  static slideOut(scene: Phaser.Scene, targetScene: string) {
    scene.tweens.add({
      targets: scene.cameras.main,
      scrollX: -800,
      duration: 500,
      ease: 'Power2',
      onComplete: () => scene.scene.start(targetScene)
    });
  }
}
```
