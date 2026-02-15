# Phaser 3 游戏对象

## 基础游戏对象

### Image（静态图片）

```typescript
// 创建
const image = this.add.image(x, y, 'textureKey');
const image = this.add.image(x, y, 'atlas', 'frameName');

// 变换
image.setPosition(100, 200);
image.setX(100);
image.setY(200);
image.setScale(2);           // 统一缩放
image.setScale(2, 1.5);      // 分别缩放
image.setRotation(Math.PI);  // 弧度
image.setAngle(45);          // 角度
image.setAlpha(0.5);         // 透明度
image.setVisible(false);
image.setDepth(10);          // 渲染层级

// 原点（锚点）
image.setOrigin(0.5, 0.5);   // 中心（默认）
image.setOrigin(0, 0);       // 左上角
image.setOrigin(1, 1);       // 右下角

// 翻转
image.setFlipX(true);
image.setFlipY(true);
image.toggleFlipX();

// 着色
image.setTint(0xff0000);                    // 整体着色
image.setTint(0xff0000, 0x00ff00, 0x0000ff, 0xffff00);  // 四角渐变
image.clearTint();

// 混合模式
image.setBlendMode(Phaser.BlendModes.ADD);
image.setBlendMode(Phaser.BlendModes.MULTIPLY);

// 尺寸
image.setDisplaySize(100, 100);  // 显示尺寸
image.displayWidth;
image.displayHeight;
image.width;   // 纹理原始宽度
image.height;
```

### Sprite（可动画精灵）

```typescript
// 创建
const sprite = this.add.sprite(x, y, 'textureKey');

// 继承 Image 所有方法，额外支持动画
sprite.play('walk');
sprite.play('walk', true);  // 忽略如果已在播放
sprite.playReverse('walk');
sprite.playAfterDelay('walk', 1000);
sprite.playAfterRepeat('idle', 2);  // 当前动画重复2次后播放

// 动画控制
sprite.anims.play('walk');
sprite.anims.pause();
sprite.anims.resume();
sprite.anims.stop();
sprite.anims.restart();
sprite.anims.reverse();

// 动画状态
sprite.anims.isPlaying;
sprite.anims.isPaused;
sprite.anims.currentAnim;
sprite.anims.currentFrame;

// 动画事件
sprite.on('animationstart', (anim, frame) => {});
sprite.on('animationupdate', (anim, frame) => );
sprite.on('animationrepeat', (anim) => {});
sprite.on('animationcomplete', (anim, frame) => {});
sprite.on('animationcomplete-walk', () => {});  // 特定动画完成
```

### Text（文本）

```typescript
// 创建
const text = this.add.text(x, y, 'Hello World', {
  fontFamily: 'Arial',
  fontSize: '32px',
  fontStyle: 'bold italic',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 4,
  shadow: {
    offsetX: 2,
    offsetY: 2,
    color: '#000000',
    blur: 2,
    fill: true
  },
  align: 'center',           // left | center | right
  backgroundColor: '#ff0000',
  padding: { x: 10, y: 5 },
  maxLines: 3,
  wordWrap: { width: 300, useAdvancedWrap: true },
  lineSpacing: 5,
  fixedWidth: 200,
  fixedHeight: 100
});

// 更新文本
text.setText('New Text');
text.setText(['Line 1', 'Line 2']);  // 多行

// 样式修改
text.setStyle({ fontSize: '48px' });
text.setFontSize(48);
text.setFontFamily('Georgia');
text.setColor('#00ff00');
text.setStroke('#000', 6);
text.setShadow(2, 2, '#000', 2, true, true);
text.setBackgroundColor('#333');
text.setPadding({ left: 10, right: 10, top: 5, bottom: 5 });
text.setWordWrapWidth(400);
text.setAlign('right');
text.setLineSpacing(10);

// 获取尺寸
text.width;
text.height;
text.displayWidth;
text.displayHeight;
```

### BitmapText（位图字体）

```typescript
// 加载位图字体
this.load.bitmapFont('pixelFont', 'font.png', 'font.xml');

// 创建
const bmpText = this.add.bitmapText(x, y, 'pixelFont', 'Hello', 32);

// 设置
bmpText.setText('New Text');
bmpText.setFontSize(48);
bmpText.setLetterSpacing(2);
bmpText.setLineSpacing(5);
bmpText.setMaxWidth(300);
bmpText.setTint(0xff0000);
bmpText.setDropShadow(2, 2, 0x000000, 0.5);

// 对齐
bmpText.setOrigin(0.5);
bmpText.setCenterAlign();
bmpText.setLeftAlign();
bmpText.setRightAlign();
```

### Graphics（图形绘制）

```typescript
const graphics = this.add.graphics();

// 填充样式
graphics.fillStyle(0xff0000, 1);      // 颜色, 透明度
graphics.fillGradientStyle(0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 1);

// 线条样式
graphics.lineStyle(2, 0x00ff00, 1);   // 宽度, 颜色, 透明度

// 矩形
graphics.fillRect(x, y, width, height);
graphics.strokeRect(x, y, width, height);

// 圆角矩形
graphics.fillRoundedRect(x, y, width, height, radius);
graphics.strokeRoundedRect(x, y, width, height, radius);

// 圆形
graphics.fillCircle(x, y, radius);
graphics.strokeCircle(x, y, radius);

// 椭圆
graphics.fillEllipse(x, y, width, height);
graphics.strokeEllipse(x, y, width, height);

// 三角形
graphics.fillTriangle(x1, y1, x2, y2, x3, y3);
graphics.strokeTriangle(x1, y1, x2, y2, x3, y3);

// 多边形
graphics.fillPoints([{x:0,y:0}, {x:100,y:0}, {x:50,y:100}], true);
graphics.strokePoints(points, true);  // true = 闭合

// 线条
graphics.lineBetween(x1, y1, x2, y2);
graphics.strokeLineShape(line);

// 路径
graphics.beginPath();
graphics.moveTo(0, 0);
graphics.lineTo(100, 0);
graphics.lineTo(100, 100);
graphics.closePath();
graphics.strokePath();
graphics.fillPath();

// 弧线
graphics.arc(x, y, radius, startAngle, endAngle, anticlockwise);

// 贝塞尔曲线
graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
graphics.quadraticCurveTo(cpx, cpy, x, y);

// 清除
graphics.clear();

// 生成纹理
graphics.generateTexture('myTexture', width, height);
```

### Container（容器）

```typescript
// 创建容器
const container = this.add.container(x, y);

// 添加子对象
container.add(sprite);
container.add([sprite1, sprite2, sprite3]);
container.addAt(sprite, 0);  // 指定索引

// 移除
container.remove(sprite);
container.removeAt(0);
container.removeAll();
container.removeBetween(0, 3);

// 获取子对象
container.getAt(0);
container.getFirst();
container.getLast();
container.getByName('player');
container.getAll();
container.count(child => child.active);

// 遍历
container.each((child) => {
  child.setAlpha(0.5);
});
container.iterate((child, index) => {});

// 排序
container.sort('y');  // 按 y 坐标排序
container.sort('depth', (a, b) => a.depth - b.depth);

// 容器变换会影响所有子对象
container.setPosition(100, 100);
container.setScale(2);
container.setRotation(Math.PI / 4);
container.setAlpha(0.5);

// 子对象位置是相对于容器的
const child = this.add.sprite(50, 50, 'key');  // 相对容器 (50, 50)
container.add(child);

// 尺寸
container.setSize(200, 200);
container.getBounds();

// 交互
container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 200, 200), Phaser.Geom.Rectangle.Contains);
```

### Group（组）

```typescript
// 创建组
const group = this.add.group();

// 配置组
const group = this.add.group({
  classType: Phaser.GameObjects.Sprite,
  defaultKey: 'enemy',
  defaultFrame: 0,
  active: true,
  maxSize: 50,
  runChildUpdate: true,  // 自动调用子对象 preUpdate
  createCallback: (item) => {},
  removeCallback: (item) => {},
  createMultipleCallback: (items) => {}
});

// 添加成员
group.add(sprite);
group.addMultiple([sprite1, sprite2]);
group.create(x, y, 'key');  // 创建并添加
group.createMultiple({
  key: 'enemy',
  quantity: 10,
  setXY: { x: 100, y: 100, stepX: 50, stepY: 0 },
  setScale: { x: 0.5, y: 0.5 }
});

// 获取成员
group.getFirst(true);           // 第一个 active 的
group.getFirstDead(true, x, y); // 第一个非 active 的，可选重置位置
group.getLast(true);
group.getChildren();
group.countActive(true);
group.countActive(false);
group.getTotalUsed();
group.getTotalFree();
group.isFull();

// 遍历
group.children.iterate((child) => {
  child.setVelocityY(-100);
});

// 批量操作
group.setX(100);
group.setY(100);
group.setAlpha(0.5);
group.setVisible(false);
group.setActive(false);
group.setDepth(10);

group.incX(10);  // 所有成员 x += 10
group.incY(10);

group.scaleXY(2, 2);
group.angle(45);
group.rotate(0.1);

// 属性设置
group.propertyValueSet('alpha', 0.5);
group.propertyValueInc('x', 10);

// 播放动画
group.playAnimation('walk');

// 销毁
group.clear(true, true);  // removeFromScene, destroyChild
group.destroy(true);
```

## 对象池模式

```typescript
// 创建对象池
const bullets = this.add.group({
  classType: Bullet,
  maxSize: 30,
  runChildUpdate: true
});

// 预创建对象
bullets.createMultiple({
  classType: Bullet,
  quantity: 30,
  active: false,
  visible: false,
  key: 'bullet'
});

// 获取可用对象
function fire(x: number, y: number) {
  const bullet = bullets.getFirstDead(false);
  if (bullet) {
    bullet.fire(x, y);
  }
}

// 自定义类
class Bullet extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet');
  }
  
  fire(x: number, y: number) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
  }
  
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    
    this.y -= 10;
    
    if (this.y < -50) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}
```

## 游戏对象工厂

```typescript
// 所有可用的 add 方法
this.add.image(x, y, key);
this.add.sprite(x, y, key);
this.add.text(x, y, text, style);
this.add.bitmapText(x, y, font, text, size);
this.add.graphics(config);
this.add.container(x, y, children);
this.add.group(config);
this.add.particles(x, y, key, config);
this.add.tilemap(key);
this.add.tilesprite(x, y, width, height, key);
this.add.zone(x, y, width, height);
this.add.rectangle(x, y, width, height, fillColor);
this.add.circle(x, y, radius, fillColor);
this.add.triangle(x, y, x1, y1, x2, y2, x3, y3, fillColor);
this.add.ellipse(x, y, width, height, fillColor);
this.add.polygon(x, y, points, fillColor);
this.add.star(x, y, points, innerRadius, outerRadius, fillColor);
this.add.line(x, y, x1, y1, x2, y2, strokeColor);
this.add.curve(x, y, curve, fillColor);
this.add.arc(x, y, radius, startAngle, endAngle, anticlockwise, fillColor);
this.add.rope(x, y, key, frame, points);
this.add.shader(key, x, y, width, height);
this.add.dom(x, y, element);
this.add.extern();
this.add.video(x, y, key);
this.add.layer();
this.add.nineslice(x, y, key, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight);

// 使用 make 创建但不添加到场景
const sprite = this.make.sprite({ x: 100, y: 100, key: 'player', add: false });
```

## 深度排序

```typescript
// 设置深度
sprite.setDepth(10);

// 深度排序
this.children.sortByDepth();

// 图层
const layer = this.add.layer();
layer.add([sprite1, sprite2]);
layer.setDepth(100);

// 渲染顺序
// 深度值越大，渲染越靠前（覆盖其他对象）
// 相同深度按添加顺序渲染
```
