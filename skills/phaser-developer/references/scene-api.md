# Phaser 3 Scene API（高覆盖版）

> 目标：覆盖 Phaser.Scene 常用与核心 API、参数与返回值说明，便于 AI 生成代码时直接检索。
> 版本建议：Phaser 3.60+（不同小版本个别签名可能有差异）。

## 1) Scene 构造与配置

```ts
class MyScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'MyScene',
      active: false,
      visible: true,
      pack: { files: [] },
      map: {},
      physics: {},
      loader: {},
      plugins: []
    })
  }
}
```

### Scene Settings 关键字段
- `key: string` 场景唯一键
- `active?: boolean` 启动游戏时是否自动激活
- `visible?: boolean` 初始是否可见
- `pack?: { files: LoaderFile[] }` 场景创建前预加载包
- `physics?: object` 场景级物理配置
- `loader?: object` 场景级 loader 配置
- `plugins?: object[]` 场景插件注入
- `map?: object` 注入映射

---

## 2) 生命周期方法

```ts
init(data?: any): void
preload(): void
create(data?: any): void
update(time: number, delta: number): void
```

- `init(data)`：初始化场景状态、接收上一场景传参
- `preload()`：仅放加载逻辑
- `create(data)`：资源加载完成后构建对象
- `update(time, delta)`：逐帧执行（`delta` 毫秒）

---

## 3) ScenePlugin（this.scene）方法速查

## 3.1 启停与切换

```ts
this.scene.start(key: string, data?: any): this
this.scene.restart(data?: any): this
this.scene.stop(key?: string, data?: any): this
this.scene.switch(key: string): this
this.scene.transition(config: TransitionConfig): this
```

- `start`：停止当前并启动目标
- `restart`：重启当前场景
- `stop`：停止目标场景（默认当前）
- `switch`：当前休眠并启动目标
- `transition`：带过渡效果切换

### TransitionConfig 常见参数
- `target: string` 目标场景 key
- `duration?: number` 过渡时长(ms)
- `moveAbove?: boolean` / `moveBelow?: boolean` 层级控制
- `sleep?: boolean` 是否让来源场景 sleep
- `remove?: boolean` 是否移除来源场景
- `allowInput?: boolean` 过渡中是否接受输入
- `onStart?(from, to, duration)`
- `onUpdate?(progress: number)`

## 3.2 并行场景控制

```ts
this.scene.launch(key: string, data?: any): this
this.scene.run(key: string, data?: any): this
this.scene.pause(key?: string, data?: any): this
this.scene.resume(key?: string, data?: any): this
this.scene.sleep(key?: string, data?: any): this
this.scene.wake(key?: string, data?: any): this
```

- `launch`：并行启动场景
- `run`：若睡眠则唤醒，否则启动
- `pause/resume`：暂停/恢复 update
- `sleep/wake`：休眠/唤醒（常用于 UI 分层）

## 3.3 状态查询

```ts
this.scene.isActive(key?: string): boolean
this.scene.isPaused(key?: string): boolean
this.scene.isSleeping(key?: string): boolean
this.scene.isVisible(key?: string): boolean
```

## 3.4 获取与顺序

```ts
this.scene.get(key: string): Phaser.Scene
this.scene.getScene(key: string): Phaser.Scene
this.scene.getIndex(key: string): number
this.scene.getStatus(key?: string): number
this.scene.bringToTop(key?: string): this
this.scene.sendToBack(key?: string): this
this.scene.moveAbove(keyA: string, keyB: string): this
this.scene.moveBelow(keyA: string, keyB: string): this
this.scene.moveUp(key?: string): this
this.scene.moveDown(key?: string): this
this.scene.swapPosition(keyA: string, keyB: string): this
```

## 3.5 可见性

```ts
this.scene.setVisible(value: boolean, key?: string): this
```

## 3.6 移除

```ts
this.scene.remove(key: string): this
```

---

## 4) Scene 常驻系统对象（this.xxx）

场景内常见成员（系统注入）：

- `this.add` `GameObjectFactory`
- `this.make` `GameObjectCreator`
- `this.anims` `AnimationManager`
- `this.cache` `CacheManager`
- `this.cameras` `CameraManager`
- `this.children` `DisplayList`
- `this.data` `DataManager`
- `this.events` `EventEmitter`
- `this.input` `InputPlugin`
- `this.lights` `LightsManager`（WebGL）
- `this.load` `LoaderPlugin`
- `this.matter` `MatterPhysics`（启用时）
- `this.physics` `ArcadePhysics`（启用时）
- `this.plugins` `PluginManager`
- `this.registry` `DataManager`（全局）
- `this.scale` `ScaleManager`
- `this.scene` `ScenePlugin`
- `this.sound` `SoundManager`
- `this.sys` `Systems`
- `this.textures` `TextureManager`
- `this.time` `Clock`
- `this.tweens` `TweenManager`

---

## 5) this.events（场景事件）

常见事件名：
- `boot`
- `start`
- `ready`
- `preupdate`
- `update`
- `postupdate`
- `pause`
- `resume`
- `sleep`
- `wake`
- `shutdown`
- `destroy`

```ts
this.events.on('shutdown', () => {
  // 清理定时器/监听器
})
```

---

## 6) this.sys（底层系统）常用

- `this.sys.settings` 场景设置
- `this.sys.game` `Phaser.Game`
- `this.sys.scale` `ScaleManager`
- `this.sys.events` 系统事件
- `this.sys.isActive()`
- `this.sys.isPaused()`
- `this.sys.isSleeping()`
- `this.sys.isTransitioning()`

---

## 7) Scene 数据传递与共享

## 7.1 start/launch 传参

```ts
this.scene.start('GameScene', { level: 2, hp: 100 })

create(data: { level: number; hp: number }) {
  // 使用 data
}
```

## 7.2 registry（跨场景）

```ts
this.registry.set('coins', 10)
const coins = this.registry.get('coins')
this.registry.events.on('changedata-coins', (_parent, value) => {})
```

## 7.3 scene data（场景私有）

```ts
this.data.set('state', 'idle')
this.data.get('state')
this.data.inc('score', 10)
this.data.toggle('paused')
```

---

## 8) Scene 与摄像机协作（典型）

```ts
const cam = this.cameras.main
cam.setBounds(0, 0, 4000, 2000)
cam.startFollow(player, true, 0.08, 0.08)
cam.setDeadzone(160, 90)
cam.fadeIn(300)
```

---

## 9) Scene 与时间系统协作（典型）

```ts
const timer = this.time.addEvent({
  delay: 1000,
  loop: true,
  callback: () => {}
})

this.time.delayedCall(500, () => {})
```

参数：
- `delay: number`
- `callback: Function`
- `callbackScope?: any`
- `args?: any[]`
- `repeat?: number`
- `loop?: boolean`
- `startAt?: number`
- `paused?: boolean`

---

## 10) Scene 与 Tween 协作（典型）

```ts
this.tweens.add({
  targets: player,
  x: 600,
  duration: 500,
  ease: 'Sine.easeInOut',
  yoyo: true,
  repeat: 1
})
```

常用参数：
- `targets`
- 属性目标：`x/y/alpha/scale/angle/...`
- `duration` `delay`
- `ease`
- `repeat` `repeatDelay`
- `yoyo`
- `onStart/onUpdate/onComplete`

---

## 11) 销毁与清理建议

在 `shutdown/destroy` 做：
1. `off` 所有自定义事件
2. 清除定时器、tween
3. 停止音频或解除引用
4. 释放临时对象池

```ts
this.events.once('shutdown', () => {
  this.input.off('pointerdown', this.handleClick, this)
  this.time.removeAllEvents()
  this.tweens.killAll()
})
```

---

## 12) Scene API 快速清单（便于检索）

- 切换：`start/switch/transition/restart`
- 并行：`launch/run`
- 控制：`pause/resume/sleep/wake/stop/remove`
- 可见：`setVisible`
- 查询：`get/getScene/getStatus/getIndex/isActive/isPaused/isSleeping/isVisible`
- 排序：`bringToTop/sendToBack/moveUp/moveDown/moveAbove/moveBelow/swapPosition`

---

## 13) 场景模板（可直接复用）

```ts
export class BaseScene extends Phaser.Scene {
  constructor(key: string) {
    super({ key })
  }

  init(data?: any): void {}

  preload(): void {}

  create(data?: any): void {
    this.events.once('shutdown', this.onShutdown, this)
  }

  update(_time: number, _delta: number): void {}

  protected onShutdown(): void {
    this.time.removeAllEvents()
    this.tweens.killAll()
  }
}
```
