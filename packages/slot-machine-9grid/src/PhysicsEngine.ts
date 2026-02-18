// 纯粹的物理运动引擎，不涉及游戏逻辑
export interface PhysicsState {
  position: number;    // 精确像素位置
  velocity: number;    // 速度 px/s
  phase: 'idle' | 'accelerating' | 'constant' | 'decelerating';
  phaseTime: number; // 当前阶段持续时间
}

export interface PhysicsConfig {
  maxSpeed: number;      // 最大速度
  accelTime: number;     // 加速时间
  decelTime: number;     // 减速时间
  minSpinTime: number;   // 最小旋转时间
}

export class PhysicsEngine {
  private state: PhysicsState = {
    position: 0,
    velocity: 0,
    phase: 'idle',
    phaseTime: 0
  };
  
  private config: PhysicsConfig;
  private currentTargetPosition?: number;
  
  constructor(config: PhysicsConfig) {
    this.config = config;
  }
  
  startSpin() {
    this.state = {
      position: this.state.position,
      velocity: 0,
      phase: 'accelerating',
      phaseTime: 0
    };
    this.currentTargetPosition = undefined;
  }
  
  /** 开始减速到指定位置 */
  startDeceleration(targetPosition: number) {
    this.currentTargetPosition = targetPosition;
    this.state.phase = 'decelerating';
    this.state.phaseTime = 0;
  }
  
  /** 更新物理状态，返回新的状态 */
  update(deltaMs: number): PhysicsState {
    const dt = deltaMs / 1000;
    this.state.phaseTime += dt;
    
    switch (this.state.phase) {
      case 'accelerating': {
        const t = Math.min(this.state.phaseTime / this.config.accelTime, 1);
        this.state.velocity = this.config.maxSpeed * this.easeOutQuad(t);
        this.state.position += this.state.velocity * dt;
        
        if (t >= 1) {
          this.state.phase = 'constant';
          this.state.phaseTime = 0;
        }
        break;
      }
        
      case 'constant': {
        this.state.velocity = this.config.maxSpeed;
        this.state.position += this.state.velocity * dt;
        
        if (this.state.phaseTime >= this.config.minSpinTime) {
          // 等待外部调用 startDeceleration
        }
        break;
      }
        
      case 'decelerating': {
        if (this.currentTargetPosition === undefined) {
          // 没有目标位置，使用固定减速
          const t = Math.min(this.state.phaseTime / this.config.decelTime, 1);
          const eased = this.easeOutCubic(t);
          this.state.velocity = this.config.maxSpeed * (1 - eased);
          this.state.position += this.state.velocity * dt;
          
          if (t >= 1) {
            this.state.phase = 'idle';
            this.state.velocity = 0;
          }
        } else {
          // 有目标位置，使用精确插值
          const t = Math.min(this.state.phaseTime / this.config.decelTime, 1);
          const eased = this.easeOutCubic(t);
          
          // 从减速开始到目标位置的平滑插值
          // 无缝的物理运动结束时正好到达目标
          this.state.position = this.getDecelStartPosition() + 
            (this.currentTargetPosition - this.getDecelStartPosition()) * eased;
          this.state.velocity = this.config.maxSpeed * (1 - eased);
          
          if (t >= 1) {
            this.state.phase = 'idle';
            this.state.velocity = 0;
            this.state.position = this.currentTargetPosition; // 精确对齐
          }
        }
        break;
      }
        
      case 'idle':
        // 保持状态
        break;
    }
    
    return { ...this.state };
  }
  
  getState(): PhysicsState {
    return { ...this.state };
  }
  
  isIdle(): boolean {
    return this.state.phase === 'idle';
  }
  
  getDecelStartPosition(): number {
    // 计算如果现在开始减速时的起始位置
    const t = this.config.minSpinTime;
    const avgSpeed = this.config.maxSpeed * (this.config.accelTime / t / 2);
    return this.state.position + avgSpeed * t;
  }
  
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }
  
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}