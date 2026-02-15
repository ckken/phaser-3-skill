# Phaser 3 输入系统

## 键盘输入

### 方向键

```typescript
// 创建方向键对象
const cursors = this.input.keyboard.createCursorKeys();

// 在 update 中检测
update() {
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
  } else {
    player.setVelocityX(0);
  }
  
  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
  }
}

// cursors 包含
cursors.up;
cursors.down;
cursors.left;
cursors.right;
cursors.space;
cursors.shift;
```

### 单个按键

```typescript
// 添加单个按键
const keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
const keyA = this.input.keyboard.addKey('A');
const keySpace = this.input.keyboard.addKey('SPACE');

// 检测状态
if (keyW.isDown) { }
if (keyW.isUp) { }

// 刚按下（只触发一次）
if (Phaser.Input.Keyboard.JustDown(keySpace)) {
  jump();
}

// 刚松开
if (Phaser.Input.Keyboard.JustUp(keySpace)) {
  endJump();
}

// 按键持续时间
keySpace.getDuration();  // 按下了多久（毫秒）
```

### WASD 控制

```typescript
// 添加 WASD
const keys = this.input.keyboard.addKeys({
  up: Phaser.Input.Keyboard.KeyCodes.W,
  down: Phaser.Input.Keyboard.KeyCodes.S,
  left: Phaser.Input.Keyboard.KeyCodes.A,
  right: Phaser.Input.Keyboard.KeyCodes.D,
  fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
  shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
});

// 或简写
const keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');

// 使用
if (keys.up.isDown) { }
if (keys.fire.isDown) { }
```

### 按键事件

```typescript
// 全局按键事件
this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
  console.log(event.key, event.code);
});

this.input.keyboard.on('keyup', (event: KeyboardEvent) => {});

// 特定按键事件
this.input.keyboard.on('keydown-SPACE', () => {
  fire();
});

this.input.keyboard.on('keyup-SPACE', () => {});

// 按键对象事件
keySpace.on('down', (key) => {});
keySpace.on('up', (key) => {});

// 移除监听
this.input.keyboard.off('keydown-SPACE');
keySpace.off('down');
```

### 组合键

```typescript
// 创建组合键
const combo = this.input.keyboard.createCombo('ABCD', {
  resetOnWrongKey: true,
  maxKeyDelay: 500,
  resetOnMatch: true,
  deleteOnMatch: false
});

// 监听组合完成
this.input.keyboard.on('keycombomatch', (combo) => {
  console.log('Combo matched!');
});

// 科纳米代码
const konami = this.input.keyboard.createCombo([
  Phaser.Input.Keyboard.KeyCodes.UP,
  Phaser.Input.Keyboard.KeyCodes.UP,
  Phaser.Input.Keyboard.KeyCodes.DOWN,
  Phaser.Input.Keyboard.KeyCodes.DOWN,
  Phaser.Input.Keyboard.KeyCodes.LEFT,
  Phaser.Input.Keyboard.KeyCodes.RIGHT,
  Phaser.Input.Keyboard.KeyCodes.LEFT,
  Phaser.Input.Keyboard.KeyCodes.RIGHT,
  Phaser.Input.Keyboard.KeyCodes.B,
  Phaser.Input.Keyboard.KeyCodes.A
]);
```

### 键盘管理

```typescript
// 启用/禁用键盘
this.input.keyboard.enabled = false;

// 阻止默认行为
this.input.keyboard.addCapture('SPACE');  // 阻止空格滚动页面
this.input.keyboard.removeCapture('SPACE');

// 重置按键状态
this.input.keyboard.resetKeys();

// 移除按键
this.input.keyboard.removeKey('SPACE');
this.input.keyboard.removeAllKeys();
```

---

## 鼠标/触摸输入

### Pointer 基础

```typescript
// 获取主指针
const pointer = this.input.activePointer;

// 指针位置
pointer.x;           // 相对于游戏画布
pointer.y;
pointer.worldX;      // 相对于游戏世界（考虑相机）
pointer.worldY;
pointer.downX;       // 按下时的位置
pointer.downY;

// 指针状态
pointer.isDown;
pointer.leftButtonDown();
pointer.rightButtonDown();
pointer.middleButtonDown();
pointer.button;      // 0=左, 1=中, 2=右

// 移动信息
pointer.velocity.x;
pointer.velocity.y;
pointer.angle;       // 移动角度
pointer.distance;    // 移动距离
pointer.getDuration();  // 按下持续时间
```

### 指针事件

```typescript
// 场景级事件
this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
  console.log(pointer.x, pointer.y);
});

this.input.on('pointerup', (pointer) => {});
this.input.on('pointermove', (pointer) => {});
this.input.on('pointerover', (pointer) => {});  // 进入画布
this.input.on('pointerout', (pointer) => {});   // 离开画布

// 滚轮
this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
  if (deltaY > 0) {
    // 向下滚动
  } else {
    // 向上滚动
  }
});

// 游戏对象事件
sprite.setInteractive();
sprite.on('pointerdown', (pointer, localX, localY, event) => {});
sprite.on('pointerup', (pointer, localX, localY, event) => {});
sprite.on('pointerover', (pointer, localX, localY, event) => {});
sprite.on('pointerout', (pointer, localX, localY, event) => {});
sprite.on('pointermove', (pointer, localX, localY, event) => {});
sprite.on('wheel', (pointer, deltaX, deltaY, deltaZ) => {});
```

### 交互区域

```typescript
// 基于纹理尺寸（默认）
sprite.setInteractive();

// 自定义矩形区域
sprite.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 50), Phaser.Geom.Rectangle.Contains);

// 圆形区域
sprite.setInteractive(new Phaser.Geom.Circle(50, 50, 50), Phaser.Geom.Circle.Contains);

// 多边形区域
const polygon = new Phaser.Geom.Polygon([0, 0, 100, 0, 50, 100]);
sprite.setInteractive(polygon, Phaser.Geom.Polygon.Contains);

// 像素完美检测
sprite.setInteractive({
  pixelPerfect: true,
  alphaTolerance: 1  // 0-255
});

// 禁用交互
sprite.disableInteractive();
sprite.removeInteractive();

// 检查是否可交互
sprite.input.enabled;
```

### 拖拽

```typescript
// 启用拖拽
sprite.setInteractive({ draggable: true });
// 或
this.input.setDraggable(sprite);

// 拖拽事件
sprite.on('dragstart', (pointer, dragX, dragY) => {});
sprite.on('drag', (pointer, dragX, dragY) => {
  sprite.x = dragX;
  sprite.y = dragY;
});
sprite.on('dragend', (pointer, dragX, dragY, dropped) => {});

// 拖拽进入/离开目标
sprite.on('dragenter', (pointer, target) => {});
sprite.on('dragleave', (pointer, target) => {});
sprite.on('dragover', (pointer, target) => {});
sprite.on('drop', (pointer, target) => {});

// 设置放置目标
dropZone.setInteractive({ dropZone: true });

// 场景级拖拽事件
this.input.on('dragstart', (pointer, gameObject) => {});
this.input.on('drag', (pointer, gameObject, dragX, dragY) => {});
this.input.on('dragend', (pointer, gameObject, dropped) => {});
this.input.on('drop', (pointer, gameObject, dropZone) => {});
```

### 多点触控

```typescript
// 配置多点触控
const config = {
  input: {
    touch: {
      capture: true
    }
  }
};

// 获取所有指针
this.input.pointer1;  // 第一个触摸点
this.input.pointer2;  // 第二个触摸点
// ... 最多 pointer10

// 添加更多指针
this.input.addPointer(2);  // 添加2个额外指针

// 遍历活动指针
this.input.manager.pointers.forEach((pointer) => {
  if (pointer.isDown) {
    console.log(pointer.x, pointer.y);
  }
});

// 双指缩放示例
let initialDistance = 0;

this.input.on('pointerdown', () => {
  if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
    initialDistance = Phaser.Math.Distance.Between(
      this.input.pointer1.x, this.input.pointer1.y,
      this.input.pointer2.x, this.input.pointer2.y
    );
  }
});

this.input.on('pointermove', () => {
  if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
    const currentDistance = Phaser.Math.Distance.Between(
      this.input.pointer1.x, this.input.pointer1.y,
      this.input.pointer2.x, this.input.pointer2.y
    );
    const scale = currentDistance / initialDistance;
    // 应用缩放
  }
});
```

---

## 游戏手柄

### 配置

```typescript
const config = {
  input: {
    gamepad: true
  }
};
```

### 使用手柄

```typescript
// 检测手柄连接
this.input.gamepad.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
  console.log('Gamepad connected:', pad.id);
});

// 获取手柄
const pad = this.input.gamepad.pad1;  // 第一个手柄
const pads = this.input.gamepad.gamepads;  // 所有手柄

// 检测按钮
if (pad) {
  // 标准按钮
  if (pad.A) { }  // A 按钮
  if (pad.B) { }
  if (pad.X) { }
  if (pad.Y) { }
  if (pad.L1) { }  // 左肩键
  if (pad.R1) { }  // 右肩键
  if (pad.L2) { }  // 左扳机（0-1）
  if (pad.R2) { }  // 右扳机
  
  // 方向键
  if (pad.up) { }
  if (pad.down) { }
  if (pad.left) { }
  if (pad.right) { }
  
  // 摇杆
  const leftStickX = pad.leftStick.x;   // -1 到 1
  const leftStickY = pad.leftStick.y;
  const rightStickX = pad.rightStick.x;
  const rightStickY = pad.rightStick.y;
  
  // 按钮数组
  pad.buttons[0].pressed;
  pad.buttons[0].value;  // 0-1（模拟按钮）
  
  // 轴数组
  pad.axes[0].getValue();
}

// 手柄事件
this.input.gamepad.on('down', (pad, button, value) => {});
this.input.gamepad.on('up', (pad, button, value) => {});

// 震动（如果支持）
pad.vibration?.playEffect('dual-rumble', {
  duration: 200,
  strongMagnitude: 1.0,
  weakMagnitude: 0.5
});
```

---

## 输入管理

### 输入优先级

```typescript
// 设置深度排序（深度高的优先接收输入）
this.input.setTopOnly(true);  // 只有最上层接收输入

// 设置游戏对象输入优先级
sprite.setDepth(10);

// 手动排序
this.input.sortGameObjects(gameObjects);
```

### 输入区域

```typescript
// 设置输入区域（只在此区域内响应）
this.input.setDefaultCursor('pointer');

// 鼠标锁定
this.input.mouse.requestPointerLock();
this.input.mouse.releasePointerLock();
this.input.mouse.locked;  // 是否锁定

// 鼠标移动（锁定时）
this.input.on('pointermove', (pointer) => {
  if (this.input.mouse.locked) {
    player.x += pointer.movementX;
    player.y += pointer.movementY;
  }
});
```

### 全局输入控制

```typescript
// 启用/禁用所有输入
this.input.enabled = false;

// 启用/禁用特定输入
this.input.keyboard.enabled = false;
this.input.mouse.enabled = false;

// 清除所有输入状态
this.input.keyboard.resetKeys();
```
