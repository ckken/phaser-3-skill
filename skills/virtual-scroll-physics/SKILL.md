# Virtual Scroll + Physics Engine - 项目实战

实战项目：老虎机数字轮盘（Slot Machine Reel）

## 实战痛点

传统老虎机滚动常见技术问题：
1. **闪烁/跳变**：停止时刻位置校正导致视觉闪现
2. **滚动不流畅**：固定速度突变，手感假
3. **数据结构混乱**：数组移位操作（shift/push）导致符号管理复杂
4. **停止不精确**：先减速到0，再调整到目标位置
5. **性能问题**：多圈滚动时数据量线性增长

## 实战架构重构

### 传统架构（有问题的）

```typescript
// ❌ 单层混合逻辑
class Reel {
  offset = 0;                      // 当前偏移量
  speed = 0;                       // 当前速度
  symbols: Symbol[] = [];          // 符号数组
  
  update(dt) {
    this.offset += this.speed * dt;
    
    // 问题1：边滚动边修改数组
    while (this.offset >= SYMBOL_SIZE) {
      this.offset -= SYMBOL_SIZE;
      this.symbols.shift();        // ❌ 副作用：数据位移
      this.symbols.push(random()); // ❌ 数据混乱
    }
    
    // 问题2：停止时位置校正
    if (stopping) {
      this.offset = 0;             // ❌ 突变：从任意值→0
    }
  }
}
```

**问题分析：**
- 物理计算 + 数据操作 + 渲染 耦合
- 多职责违反单一职责原则
- 停止时刻的突变校正 = 用户感知到"闪一下"

### 重构后的架构（三层分离）

#### Layer 1: PhysicsEngine - 纯粹的物理运动引擎

```typescript
// ✨ src/PhysicsEngine.ts
interface PhysicsState {
  position: number;    // 精确像素位置
  velocity: number;    // 速度 px/s
  phase: 'idle' | 'accelerating' | 'constant' | 'decelerating';
  phaseTime: number;
}

export class PhysicsEngine {
  update(deltaMs: number): PhysicsState {
    // 仅计算物理参数：位置、速度、相位
    // 不涉及游戏符号
    // pure function: same input → same output
  }
  
  startDeceleration(targetPosition: number) {
    // 减速开始到目标位置的精确插值
    // 结束时刻位置=目标位置（无校正）
  }
}
```

**设计原则：**
- 与游戏逻辑完全解耦
- 可复用于滚动列表、轮播图、老虎机
- 只关心运动，不关心内容

#### Layer 2: VirtualRenderer - 虚拟渲染层

```typescript
// ✨ src/VirtualReel.ts
class VirtualReel {
  // 关键：只保留符号池，不维护滚动状态
  symbolPool: Symbol[] = [
    {id: 'seven', label: '7'},
    {id: 'diamond', label: '◆'},
    // ...
  ];
  
  /**
   * 根据位置获取可见符号
   * pure function: 位置 → 可见符号（无副作用）
    */
  getVisibleSymbols(position: number): Symbol[] {
    const indexOffset = Math.floor(position / SYMBOL_SIZE);
    const visibleCount = BUFFER_TOP + VISIBLE + BUFFER_BOTTOM;
    
    return Array.from({length: visibleCount}, (_, i) => {
      const symbolIndex = (indexOffset + i) % this.symbolPool.length;
      return this.symbolPool[symbolIndex];
    });
  }
}
```

**优势：**
- 无数组移位操作（shift/push）→ 无副作用
- 任意圈数不累加数据
- 符号通过索引访问，O(1) 复杂度
- 纯函数：可缓存、可测试

#### Layer 3: GameController - 游戏逻辑控制

```typescript
class ReelController {
  private physics: PhysicsEngine;
  private renderer: VirtualReel;
  private currentSymbols: Symbol[] = [];
  
  spin(targetSymbols: Symbol[]) {
    this.physics.startSpin();
    
    // 等待适当时机开始减速
    setTimeout(() => {
      const targetPosition = this.calculateStopPosition(targetSymbols);
      this.physics.startDeceleration(targetPosition);
    }, minSpinTime);
  }
  
  // 核心：分离物理更新和渲染
  updateFrame(deltaMs: number) {
    // Step 1: 纯物理计算
    const physicsState = this.physics.update(deltaMs);
    
    // Step 2: 纯函数获取符号（根据位置）
    const symbols = this.renderer.getVisibleSymbols(physicsState.position);
    
    // Step 3: 重渲染（如果符号变化）
    if (this.hasSymbolsChanged(symbols)) {
      this.renderSymbols(symbols);
    }
  }
}
```

**设计模式：**
- 命令模式：`spin()` 发起动作
- 观察者模式：`updateFrame()` 轮询状态
- 策略模式：`getVisibleSymbols()` 抽离算法

### 核心算法：精确停止插值

传统方式（闪烁根源）：
```typescript
// ❌ 先减速，再校正
if (decelTime >= 1) {
  speed = 0;
  position = 0;  // ❌ 校正：从任意值→0
}
```

物理正确方式（无缝停止）：
```typescript
class PhysicsEngine {
  private decelStartPosition: number;
  private targetStopPosition: number;
  
  startDeceleration(targetPosition: number) {
    this.decelStartPosition = this.state.position;
    this.targetStopPosition = targetPosition;
    this.state.phase = 'decelerating';
  }
  
  update(deltaMs: number): PhysicsState {
    if (this.state.phase === 'decelerating') {
      const t = Math.min(this.phaseTime / DECEL_TIME, 1);
      const eased = easeOutCubic(t);
      
      // ✨ 魔法：从开始到目标的平滑插值
      // t=0 → position = start
      // t=1 → position = target（自然到达，无校正）
      this.state.position = this.decelStartPosition + 
        (this.targetStopPosition - this.decelStartPosition) * eased;
      
      this.state.velocity = MAX_SPEED * (1 - eased);
    }
  }
}
```

**数学原理：**
```
position(t) = start + (target - start) * ease(t)

当 t = 0: position = start（正确）
当 t = 1: position = target（精确，无校正）

速度同源：
velocity(t) = MAX_SPEED * (1 - ease(t))
→ 确保物理一致性
```

## 实战性能对比

| 指标 | 传统架构 | 虚拟架构 |
|-----|---------|---------|
| 符号管理 | shift/push O(n) | 索引访问 O(1) |
| 内存 | 线性增长 | 恒定大小 |
| 停止质量 | 闪烁校正 | 无缝自然 |
| 可复用性 | 耦合低 | 高度解耦 |

## 知识点技能清单

```typescript
// ✨ 1. 物理公式抽象
interface PhysicsState {
  position: number;    // px
  velocity: number;    // px/s
  acceleration?: number; // px/s²
}

// ✨ 2. 纯函数原则
// pure: 没有副作用，不修改输入
function getVisible(position: number, pool: Symbol[]): Symbol[] {
  return pool[(index + position) % pool.length];
}

// ✨ 3. 缓存策略（空间换时间）
// 如果计算heavy，可以缓存 lastKnownPosition → symbols
const cache = new Map<string, Symbol[]>();

// ✨ 4. 时间同步
// 使用 high-precision timestamp
const time = performance.now();
```

## 实战项目结构

```
slot-machine-9grid/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts                  # 游戏主控
    ├── PhysicsEngine.ts         # 物理引擎
    ├── VirtualReel.ts          # 虚拟渲染
    └── SymbolRenderer.ts       # 符号渲染（与 Phaser 集成）

虚拟滚动物理架构 demo 在此：
demo/
├── index.html
├── bundle.js
└── source/
    ├── physics.demo.ts
    ├── virtual.demo.ts
    └── index.ts
```

## 可复用场景扩展

这个 skill 不仅用于老虎机：

**1. 无限滚动列表（Web）**
```typescript
list.scrollTo(index) {
  physics.startDeceleration(index * itemHeight);
}
```

**2. 轮播图（移动端）**
```typescript
carousel.snapTo(index) {
  physics.startDeceleration(index * slideWidth);
}
```

**3. 滑块选择器**
```typescript
picker.selectValue(value) {
  physics.startDeceleration(value * stepHeight);
}
```

**4. 抽奖转盘**
```typescript
wheel.spinTo(prize) {
  physics.startDeceleration(
    360 * rotations + prizeAngle
  );
}
```

## 实战调试技巧

1. **可视化物理参数**
```typescript
debugPanel.innerHTML = `
  位置: ${physics.position.toFixed(2)}px  
  速度: ${physics.velocity.toFixed(2)}px/s
  相位: ${physics.phase}
 `;
```

2. **慢动作模式**
```typescript
// 降低游戏速度（Baba is You 模式）
Time.timeScale = 0.1; // 10% speed
```

3. **位置预测线**
```typescript
// 显示停止预测线
drawLine(physics.predictStopPosition());
```

4. **缓存命中率**
```typescript
console.log(`Cache hit: ${cacheHits}/${cacheTotal} = ${(cacheHits/cacheTotal).toFixed(2)}`);
```

## 常见错误规避

❌ **错误 1：直接设置位置**
```typescript
// ❌ 突变位置
position = target;
// → 导致用户看到"闪一下"
```

✅ **正确：平滑插值**
```typescript
declStartPosition = current;
target = calculateTarget();
pos = declStart + (target - declStart) * ease(t);
```

❌ **错误 2：数组 mutation**
```typescript
// ❌ shift/push 副作用
symbols.shift(); symbols.push(new);
// → 数据不可预测
```

✅ **正确：纯函数访问**
```typescript
// ✅ 通过索引计算
visible = pool[(offset + i) % pool.length];
// → 无副作用，可预测
```

❌ **错误 3：时间不精确**
```typescript
// ❌ 使用 Date.now()
const dt = Date.now() - last;
// → 精度毫秒级，不够
```

✅ **正确：高分辨率时间戳**
```typescript
const dt = performance.now() - last;
// → 微秒级精度，流畅
```

## 性能优化要点

1. **对象池（Object Pool）**
```typescript
// 重用 SymbolContainer，避免垃圾回收
const pool: Container[] = [];
function getContainer(): Container {
  return pool.pop() || createContainer();
}
```

2. **离屏渲染优化**
```typescript
// 只渲染 visible + buffer area
const start = Math.floor(position / HEIGHT) - BUFFER;
const end = start + VISIBLE + BUFFER * 2;
```

3. **整数像素对齐**
```typescript
// 消除渲染模糊
container.setY(Math.round(y));
text.setX(Math.round(x));
```

4. **批量更新**
```typescript
// 批量设置，避免多次重算
graphics.fillPoints(points);
text.setText(batchUpdate);
```

## 测试用例