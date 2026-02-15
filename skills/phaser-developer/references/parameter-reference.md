# Phaser 3 参数类型与默认值参考（第一版）

> 目标：给高频 API 提供“参数类型 / 可选值 / 默认行为”速查。

## 1) GameConfig

| 参数 | 类型 | 常见值/默认 | 说明 |
|---|---|---|---|
| `type` | `number` | `Phaser.AUTO` | 渲染器类型：AUTO/CANVAS/WEBGL |
| `width` | `number|string` | `800` | 画布宽 |
| `height` | `number|string` | `600` | 画布高 |
| `parent` | `string|HTMLElement` | `undefined` | 挂载容器 |
| `backgroundColor` | `string|number` | `#000000` | 背景色 |
| `scene` | `SceneType|SceneType[]` | 必填 | 场景 |

## 2) Scene 切换

| API | 关键参数 | 类型 | 默认/说明 |
|---|---|---|---|
| `scene.start` | `key` | `string` | 目标场景 key |
|  | `data` | `any` | 可选透传数据 |
| `scene.transition` | `target` | `string` | 必填 |
|  | `duration` | `number` | 默认 `1000`（常见） |
|  | `sleep/remove` | `boolean` | 控制来源场景状态 |
|  | `allowInput` | `boolean` | 过渡期输入策略 |

## 3) Loader

| API | 参数 | 类型 | 默认/可选值 |
|---|---|---|---|
| `load.image` | `key` | `string` | 必填 |
|  | `url` | `string|string[]` | 必填 |
| `load.spritesheet` | `config.frameWidth` | `number` | 必填 |
|  | `config.frameHeight` | `number` | 必填 |
|  | `config.startFrame` | `number` | 默认 `0` |
|  | `config.endFrame` | `number` | 默认自动推断 |
| `load.audio` | `urls` | `string|string[]` | 建议多格式 |
| `load.tilemapTiledJSON` | `url` | `string` | Tiled 导出 JSON |

## 4) Arcade Physics

| API | 参数 | 类型 | 默认/说明 |
|---|---|---|---|
| `physics.add.collider` | `obj1,obj2` | `ArcadeColliderType` | 必填 |
|  | `collideCb` | `function` | 可选 |
|  | `processCb` | `function` | 返回 `boolean` |
| `body.setVelocity` | `x,y` | `number` | 默认未传为 0 |
| `body.setBounce` | `x,y` | `number` | 常见 `0~1` |
| `body.setCollideWorldBounds` | `value` | `boolean` | 默认 `false` |
|  | `onWorldBounds` | `boolean` | 默认 `false` |

## 5) Matter Physics

| API | 参数 | 类型 | 默认/说明 |
|---|---|---|---|
| `matter.add.rectangle` | `x,y,w,h` | `number` | 必填 |
|  | `options.isStatic` | `boolean` | 默认 `false` |
|  | `options.restitution` | `number` | 弹性，默认较低 |
| `matter.add.constraint` | `length` | `number` | 可选 |
|  | `stiffness` | `number` | 常见 `0~1` |

## 6) Input

| API | 参数 | 类型 | 默认/说明 |
|---|---|---|---|
| `keyboard.addKey` | `code` | `string|number` | 必填 |
|  | `enableCapture` | `boolean` | 默认 `true`（常见） |
| `setInteractive` | `hitArea` | `Geom` | 默认纹理区域 |
|  | `dropZone` | `boolean` | 默认 `false` |
| `input.on('pointerdown')` | `pointer` | `Phaser.Input.Pointer` | 回调入参 |

## 7) Animation

| API | 参数 | 类型 | 默认/说明 |
|---|---|---|---|
| `anims.create` | `key` | `string` | 必填 |
|  | `frames` | `AnimationFrame[]` | 必填 |
|  | `frameRate` | `number` | 与 `duration` 二选一主导 |
|  | `repeat` | `number` | `-1` 无限循环 |
|  | `yoyo` | `boolean` | 默认 `false` |
| `sprite.play` | `ignoreIfPlaying` | `boolean` | 默认 `false` |

## 8) Tween

| API | 参数 | 类型 | 默认/说明 |
|---|---|---|---|
| `tweens.add` | `targets` | `object|object[]` | 必填 |
|  | `duration` | `number` | 默认 `1000`（常见） |
|  | `ease` | `string|function` | 默认 `Power0/Linear`（常见） |
|  | `repeat` | `number` | 默认 `0` |
|  | `yoyo` | `boolean` | 默认 `false` |

## 9) Camera

| API | 参数 | 类型 | 默认/说明 |
|---|---|---|---|
| `startFollow` | `target` | `GameObject` | 必填 |
|  | `lerpX,lerpY` | `number` | 默认 `1,1`（立即跟随） |
| `setBounds` | `x,y,w,h` | `number` | 限制相机滚动 |
| `shake` | `duration` | `number` | 毫秒 |
|  | `intensity` | `number|{x,y}` | 常见 `0.005~0.05` |

## 10) Sound

| API | 参数 | 类型 | 默认/说明 |
|---|---|---|---|
| `sound.add/play` | `volume` | `number` | `1` |
|  | `loop` | `boolean` | `false` |
|  | `rate` | `number` | `1` |
|  | `detune` | `number` | `0` |
| `sound.setMute` | `value` | `boolean` | 全局静音 |

---

## 注记
- 本文是“高频参数参考”，不是完整官方类型定义镜像。
- 下一阶段可继续做：
  1) 按模块补全“完整可选参数表”
  2) 增加“默认值来源说明（文档/源码）”
