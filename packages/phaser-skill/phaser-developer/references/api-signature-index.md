# Phaser 3 API Signature Index（方法签名索引）

> 用于快速检索：模块 -> 方法签名 -> 参数要点。优先覆盖高频开发面。

## Scene / ScenePlugin
- `scene.start(key: string, data?: any): this`
- `scene.launch(key: string, data?: any): this`
- `scene.run(key: string, data?: any): this`
- `scene.switch(key: string): this`
- `scene.transition(config: TransitionConfig): this`
- `scene.restart(data?: any): this`
- `scene.stop(key?: string, data?: any): this`
- `scene.pause(key?: string, data?: any): this`
- `scene.resume(key?: string, data?: any): this`
- `scene.sleep(key?: string, data?: any): this`
- `scene.wake(key?: string, data?: any): this`
- `scene.setVisible(value: boolean, key?: string): this`
- `scene.get(key: string): Phaser.Scene`
- `scene.isActive(key?: string): boolean`
- `scene.isPaused(key?: string): boolean`
- `scene.isSleeping(key?: string): boolean`
- `scene.isVisible(key?: string): boolean`

## Loader
- `load.image(key: string, url: string | string[]): this`
- `load.spritesheet(key: string, url: string | string[], config: { frameWidth: number; frameHeight: number; ... }): this`
- `load.atlas(key: string, textureURL: string, atlasURL: string): this`
- `load.multiatlas(key: string, atlasURL: string, path?: string, baseURL?: string): this`
- `load.audio(key: string, urls: string | string[]): this`
- `load.audioSprite(key: string, jsonURL: string, audioURL?: string | string[]): this`
- `load.bitmapFont(key: string, textureURL: string, fontDataURL: string): this`
- `load.tilemapTiledJSON(key: string, url: string): this`
- `load.json(key: string, url?: string): this`
- `load.text(key: string, url?: string): this`
- `load.pack(key: string, urlOrData: string | object): this`
- `load.start(): void`
- `load.on('progress'|'fileprogress'|'complete', cb): this`

## GameObjectFactory (add)
- `add.image(x: number, y: number, texture: string, frame?: string|number)`
- `add.sprite(x: number, y: number, texture: string, frame?: string|number)`
- `add.text(x: number, y: number, text: string|string[], style?: TextStyle)`
- `add.bitmapText(x: number, y: number, font: string, text?: string, size?: number)`
- `add.graphics(config?: GraphicsConfig)`
- `add.container(x?: number, y?: number, children?: GameObject[])`
- `add.group(config?: GroupConfig | GroupConfig[])`
- `add.particles(x: number, y: number, texture: string, config?: ParticleEmitterConfig)`
- `add.tilemap(key?: string, tileWidth?: number, tileHeight?: number, width?: number, height?: number)`

## Arcade Physics
- `physics.add.sprite(x, y, texture, frame?)`
- `physics.add.group(config?)`
- `physics.add.staticGroup(config?)`
- `physics.add.collider(obj1, obj2, collideCb?, processCb?, context?)`
- `physics.add.overlap(obj1, obj2, overlapCb?, processCb?, context?)`
- `physics.add.existing(gameObject, isStatic?: boolean)`
- `physics.world.setBounds(x, y, width, height, checkLeft?, checkRight?, checkUp?, checkDown?)`
- `physics.pause()` / `physics.resume()`

### Arcade Body 常用
- `body.setVelocity(x?: number, y?: number)`
- `body.setAcceleration(x?: number, y?: number)`
- `body.setDrag(x?: number, y?: number)`
- `body.setGravity(x?: number, y?: number)`
- `body.setBounce(x?: number, y?: number)`
- `body.setCollideWorldBounds(value?: boolean, bounceX?: number, bounceY?: number, onWorldBounds?: boolean)`
- `body.setSize(width: number, height: number, center?: boolean)`
- `body.setOffset(x?: number, y?: number)`

## Matter Physics
- `matter.add.sprite(x, y, texture, frame?, options?)`
- `matter.add.rectangle(x, y, width, height, options?)`
- `matter.add.circle(x, y, radius, options?)`
- `matter.add.polygon(x, y, sides, radius, options?)`
- `matter.add.fromVertices(x, y, vertices, options?, flagInternal?, removeCollinear?, minimumArea?)`
- `matter.add.constraint(bodyA, bodyB, length?, stiffness?, options?)`
- `matter.world.on('collisionstart'|'collisionactive'|'collisionend', cb)`

## Input
- `input.keyboard.createCursorKeys()`
- `input.keyboard.addKey(code: string|number, enableCapture?: boolean, emitOnRepeat?: boolean)`
- `input.keyboard.addKeys(keys: string | object, enableCapture?: boolean, emitOnRepeat?: boolean)`
- `input.keyboard.createCombo(keys: string|number[], config?)`
- `input.on('pointerdown'|'pointerup'|'pointermove'|'wheel', cb)`
- `input.setDraggable(gameObject|gameObject[], value?: boolean)`
- `gameObject.setInteractive(hitArea?, hitAreaCallback?, dropZone?)`
- `input.gamepad.on('connected'|'down'|'up', cb)`

## Animations
- `anims.create(config: Animation)`
- `anims.generateFrameNumbers(key: string, config?: GenerateFrameNumbers)`
- `anims.generateFrameNames(key: string, config?: GenerateFrameNames)`
- `anims.exists(key: string): boolean`
- `anims.remove(key: string): Animation`
- `sprite.play(key: string|Animation, ignoreIfPlaying?: boolean)`
- `sprite.playReverse(key: string|Animation, ignoreIfPlaying?: boolean)`
- `sprite.stop()`

## Tweens
- `tweens.add(config: TweenBuilderConfig): Tween`
- `tweens.chain(config: TweenChainBuilderConfig): TweenChain`
- `tweens.timeline(config?: TimelineBuilderConfig): Timeline`
- `tweens.killTweensOf(target)`
- `tweens.pauseAll()` / `tweens.resumeAll()`

## Camera
- `cameras.add(x?: number, y?: number, width?: number, height?: number, makeMain?: boolean, name?: string)`
- `cameras.main.startFollow(target, roundPixels?, lerpX?, lerpY?, offsetX?, offsetY?)`
- `camera.setBounds(x, y, width, height, centerOn?)`
- `camera.setZoom(value)` / `camera.zoomTo(zoom, duration?, ease?, force?, cb?, context?)`
- `camera.pan(x, y, duration?, ease?, force?, cb?, context?)`
- `camera.fadeIn(duration?, r?, g?, b?, cb?, context?)`
- `camera.fadeOut(duration?, r?, g?, b?, cb?, context?)`
- `camera.shake(duration?, intensity?, force?, cb?, context?)`

## Sound
- `sound.add(key: string, config?: SoundConfig): BaseSound`
- `sound.play(key: string, config?: SoundConfig): boolean`
- `sound.stopAll()` / `sound.pauseAll()` / `sound.resumeAll()`
- `sound.setMute(value: boolean)`
- `sound.setVolume(value: number)`

## Time
- `time.addEvent(config: TimerEventConfig): TimerEvent`
- `time.delayedCall(delay: number, callback: Function, args?: any[], callbackScope?: any): TimerEvent`
- `time.removeAllEvents(): void`

## Data / Registry
- `data.set(key: string|object, value?: any): this`
- `data.get(key: string | string[]): any`
- `data.inc(key: string, amount?: number): this`
- `data.toggle(key: string): this`
- `registry.set(key: string, value: any): this`
- `registry.get(key: string): any`

---

## 参数约定（速记）
- `cb` 回调签名通常为 `(objA, objB)` 或 `(pointer, localX, localY, event)`
- `duration` 单位毫秒
- `repeat: -1` 表示无限循环
- `ease` 支持字符串（如 `Sine.easeInOut`）或函数
- `data` 透传对象建议用明确类型接口

## 说明
- 本索引用于“检索与生成代码”，非完整官方 API 镜像。
- 若需全量枚举，可在下一阶段按模块导出字母序完整清单。
