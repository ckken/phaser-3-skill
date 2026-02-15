# Phaser 3 物理系统

## Arcade Physics

### 配置

```typescript
const config = {
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: true,
      debugShowBody: true,
      debugShowStaticBody: true,
      debugShowVelocity: true,
      debugBodyColor: 0xff00ff,
      debugStaticBodyColor: 0x0000ff,
      debugVelocityColor: 0x00ff00,
      fps: 60,
      timeScale: 1,
      tileBias: 16,
      forceX: false,
      isPaused: false,
      fixedStep: true,
      maxEntries: 16,
      useTree: true
    }
  }
};
```

### 创建物理对象

```typescript
// 动态物理精灵
const player = this.physics.add.sprite(x, y, 'player');

// 静态物理精灵（不受力影响）
const platform = this.physics.add.staticSprite(x, y, 'platform');

// 为现有对象启用物理
this.physics.add.existing(gameObject);
this.physics.add.existing(gameObject, true);  // true = 静态

// 静态组
const platforms = this.physics.add.staticGroup();
platforms.create(400, 568, 'ground');

// 动态组
const enemies = this.physics.add.group({
  key: 'enemy',
  quantity: 10,
  setXY: { x: 100, y: 100, stepX: 70 },
  collideWorldBounds: true
});
```

### Body 属性

```typescript
const body = sprite.body as Phaser.Physics.Arcade.Body;

// 速度
body.setVelocity(200, -300);
body.setVelocityX(200);
body.setVelocityY(-300);
body.velocity.x;
body.velocity.y;

// 最大速度
body.setMaxVelocity(400, 400);
body.setMaxVelocityX(400);

// 加速度
body.setAcceleration(100, 0);
body.setAccelerationX(100);
body.setAccelerationY(0);

// 阻力（减速）
body.setDrag(100, 100);
body.setDragX(100);
body.setDamping(true);  // 使用阻尼而非线性阻力

// 重力
body.setGravity(0, 0);      // 相对于世界重力的偏移
body.setGravityY(500);
body.setAllowGravity(false); // 禁用重力

// 弹性
body.setBounce(0.5, 0.5);
body.setBounceX(0.5);
body.setBounceY(0.5);

// 摩擦力
body.setFriction(0.5, 0.5);
body.setFrictionX(0.5);

// 质量
body.setMass(2);

// 不可移动（碰撞时不被推动）
body.setImmovable(true);

// 推动力
body.pushable = false;  // 不会被其他物体推动

// 世界边界碰撞
body.setCollideWorldBounds(true);
body.onWorldBounds = true;  // 触发事件
body.world.on('worldbounds', (body, up, down, left, right) => {});

// 碰撞体尺寸
body.setSize(width, height);           // 设置碰撞体尺寸
body.setOffset(x, y);                  // 碰撞体偏移
body.setCircle(radius, offsetX, offsetY);  // 圆形碰撞体

// 启用/禁用
body.enable = false;
body.reset(x, y);  // 重置位置和速度
```

### 碰撞检测

```typescript
// 碰撞（物理响应）
this.physics.add.collider(player, platforms);
this.physics.add.collider(player, enemies, hitEnemy, null, this);
this.physics.add.collider(bullets, enemies, bulletHitEnemy, shouldCollide, this);

// 重叠（无物理响应）
this.physics.add.overlap(player, coins, collectCoin, null, this);

// 回调函数
function hitEnemy(player: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite) {
  player.setTint(0xff0000);
  enemy.destroy();
}

// 条件回调（返回 false 跳过碰撞）
function shouldCollide(bullet: Bullet, enemy: Enemy): boolean {
  return enemy.active && bullet.active;
}

// 组与组碰撞
this.physics.add.collider(enemyGroup, platformGroup);
this.physics.add.collider(bulletGroup, enemyGroup, onBulletHit);

// 移除碰撞器
const collider = this.physics.add.collider(a, b);
collider.destroy();
// 或
this.physics.world.removeCollider(collider);
```

### 碰撞方向检测

```typescript
// 检测接触方向
if (player.body.touching.down) {
  // 站在地面上
  canJump = true;
}

if (player.body.touching.left || player.body.touching.right) {
  // 碰到墙壁
}

// blocked 表示被静态物体阻挡
if (player.body.blocked.down) {
  // 站在静态平台上
}

// 上一帧的接触状态
player.body.wasTouching.down;

// 嵌入检测
player.body.embedded;  // 是否嵌入另一个物体
```

### 世界边界

```typescript
// 设置世界边界
this.physics.world.setBounds(0, 0, 2000, 600);

// 边界碰撞设置
this.physics.world.setBoundsCollision(true, true, true, true);  // left, right, up, down

// 获取边界
this.physics.world.bounds;
```

### 物理世界控制

```typescript
// 暂停/恢复
this.physics.pause();
this.physics.resume();

// 时间缩放
this.physics.world.timeScale = 0.5;  // 慢动作

// 重力
this.physics.world.gravity.y = 500;

// 调试绘制
this.physics.world.drawDebug = true;
this.physics.world.debugGraphic.clear();
```

### 射线检测

```typescript
// 从点到点的射线
const ray = new Phaser.Geom.Line(x1, y1, x2, y2);
const hits = this.physics.overlapRect(x, y, width, height);

// 最近的物体
const closest = this.physics.closest(point, targets);

// 距离检测
const distance = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
```

---

## Matter.js Physics

### 配置

```typescript
const config = {
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 1 },
      debug: true,
      debugShowBody: true,
      debugShowStaticBody: true,
      debugShowVelocity: true,
      debugShowCollisions: true,
      debugShowSeparation: true,
      debugShowAxes: true,
      debugShowAngleIndicator: true,
      debugShowSleeping: true,
      debugShowIds: true,
      debugShowShadowBounds: false,
      enableSleeping: true,
      setBounds: {
        x: 0, y: 0,
        width: 800, height: 600,
        thickness: 32
      }
    }
  }
};
```

### 创建 Matter 物体

```typescript
// 矩形
const box = this.matter.add.rectangle(x, y, width, height, {
  isStatic: false,
  restitution: 0.5,
  friction: 0.1,
  frictionAir: 0.01,
  density: 0.001,
  label: 'box'
});

// 圆形
const ball = this.matter.add.circle(x, y, radius, options);

// 多边形
const polygon = this.matter.add.polygon(x, y, sides, radius, options);

// 梯形
const trapezoid = this.matter.add.trapezoid(x, y, width, height, slope, options);

// 从顶点创建
const vertices = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 50, y: 100 }
];
const fromVertices = this.matter.add.fromVertices(x, y, vertices, options);

// Matter 精灵
const sprite = this.matter.add.sprite(x, y, 'key', frame, {
  shape: 'circle',
  // 或使用物理编辑器生成的形状
  shape: { type: 'fromPhysicsEditor', key: 'player' }
});

// 静态物体
const ground = this.matter.add.rectangle(400, 580, 800, 40, { isStatic: true });
```

### Matter Body 属性

```typescript
const body = sprite.body as MatterJS.BodyType;

// 速度
this.matter.body.setVelocity(body, { x: 5, y: -10 });
this.matter.setVelocity(body, 5, -10);

// 角速度
this.matter.body.setAngularVelocity(body, 0.1);

// 位置
this.matter.body.setPosition(body, { x: 100, y: 100 });

// 角度
this.matter.body.setAngle(body, Math.PI / 4);

// 施加力
this.matter.body.applyForce(body, body.position, { x: 0.05, y: 0 });

// 质量
this.matter.body.setMass(body, 10);
this.matter.body.setDensity(body, 0.01);

// 静态切换
this.matter.body.setStatic(body, true);

// 休眠
this.matter.body.setSleeping(body, true);
```

### Matter 约束（Constraints）

```typescript
// 距离约束（弹簧）
const spring = this.matter.add.constraint(bodyA, bodyB, length, stiffness, {
  damping: 0.1,
  pointA: { x: 0, y: 0 },
  pointB: { x: 0, y: 0 }
});

// 固定到世界点
const pin = this.matter.add.worldConstraint(body, length, stiffness, {
  pointA: { x: 400, y: 100 },
  pointB: { x: 0, y: -50 }
});

// 鼠标约束（拖拽）
this.matter.add.mouseSpring({
  length: 1,
  stiffness: 0.9,
  damping: 0
});

// 移除约束
this.matter.world.removeConstraint(constraint);
```

### Matter 碰撞事件

```typescript
// 碰撞开始
this.matter.world.on('collisionstart', (event) => {
  event.pairs.forEach((pair) => {
    const { bodyA, bodyB } = pair;
    
    if (bodyA.label === 'player' && bodyB.label === 'enemy') {
      // 处理碰撞
    }
  });
});

// 碰撞中
this.matter.world.on('collisionactive', (event) => {});

// 碰撞结束
this.matter.world.on('collisionend', (event) => {});

// 使用碰撞类别
const playerCategory = this.matter.world.nextCategory();
const enemyCategory = this.matter.world.nextCategory();

sprite.setCollisionCategory(playerCategory);
sprite.setCollidesWith([enemyCategory]);
```

### 复合体（Compound Bodies）

```typescript
// 创建复合体
const partA = this.matter.bodies.rectangle(0, 0, 50, 50);
const partB = this.matter.bodies.circle(50, 0, 25);

const compound = this.matter.body.create({
  parts: [partA, partB]
});

this.matter.world.add(compound);

// 使用 Phaser 的复合体方法
const car = this.matter.add.car(x, y, width, height, wheelSize);
const stack = this.matter.add.stack(x, y, columns, rows, columnGap, rowGap, callback);
const pyramid = this.matter.add.pyramid(x, y, columns, rows, columnGap, rowGap, callback);
const chain = this.matter.add.chain(composite, xOffsetA, yOffsetA, xOffsetB, yOffsetB, options);
const softBody = this.matter.add.softBody(x, y, columns, rows, columnGap, rowGap, particleRadius, particleOptions, constraintOptions);
```

### 传感器（Sensors）

```typescript
// 传感器不产生物理响应，只检测重叠
const sensor = this.matter.add.rectangle(x, y, width, height, {
  isSensor: true,
  label: 'trigger'
});

this.matter.world.on('collisionstart', (event) => {
  event.pairs.forEach((pair) => {
    if (pair.bodyA.isSensor || pair.bodyB.isSensor) {
      // 触发区域检测
    }
  });
});
```

---

## 物理编辑器集成

### PhysicsEditor

```typescript
// 加载物理形状数据
this.load.json('shapes', 'assets/physics-shapes.json');

// 使用形状
const sprite = this.matter.add.sprite(x, y, 'player', null, {
  shape: this.cache.json.get('shapes').player
});
```

### 手动定义复杂形状

```typescript
const sprite = this.matter.add.sprite(x, y, 'key', null, {
  shape: {
    type: 'fromVertices',
    verts: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 50 }
    ]
  }
});
```
