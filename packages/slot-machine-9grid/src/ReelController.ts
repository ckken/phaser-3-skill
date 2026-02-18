// 游戏控制器 - 整合物理引擎 + 虚拟渲染
import Phaser from 'phaser';
import { SYMBOLS, type SymbolData } from './types';
import { PhysicsEngine, type PhysicsConfig } from './PhysicsEngine';
import { VirtualRenderer, type VirtualReelConfig } from './VirtualRenderer';

const PHYSICS_CONFIG: PhysicsConfig = {
  maxSpeed: 2000,
  accelTime: 0.2,
  decelTime: 0.6,  // 加长减速时间，更真实
  minSpinTime: 0.8
};

const VIRTUAL_CONFIG: VirtualReelConfig = {
  symbolSize: 90,
  visibleRows: 3,
  bufferRows: 3
};

interface PositionedSymbol {
  symbol: SymbolData;
  x: number;
  y: number;
  index: number;
}

export class ReelController {
  private scene: Phaser.Scene;
  private x: number;
  private topY: number;
  
  private physics: PhysicsEngine;
  private renderer: VirtualRenderer;
  
  // Phaser 渲染对象
  private container: Phaser.GameObjects.Container;
  private symbolContainers: Phaser.GameObjects.Container[] = [];
  
  // 悬崖取值
  private currentSymbols: SymbolData[] = [];
  private targetSymbols?: SymbolData[];
  
  constructor(scene: Phaser.Scene, x: number, topY: number) {
    this.scene = scene;
    this.x = x;
    this.topY = topY;
    
    this.physics = new PhysicsEngine(PHYSICS_CONFIG);
    this.renderer = new VirtualRenderer(VIRTUAL_CONFIG);
    
    // 创建容器
    this.container = scene.add.container(x, 0);
    this.createSymbolContainers();
  }
  
  private createSymbolContainers() {
    const totalSymbols = VIRTUAL_CONFIG.bufferRows * 2 + VIRTUAL_CONFIG.visibleRows;
    
    for (let i = 0; i < totalSymbols; i++) {
      const cont = this.createSymbolContainer();
      this.symbolContainers.push(cont);
      this.container.add(cont);
    }
  }
  
  private createSymbolContainer(): Phaser.GameObjects.Container {
    const cont = this.scene.add.container(0, 0);
    
    // 背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x222244, 1);
    bg.fillRoundedRect(-VIRTUAL_CONFIG.symbolSize/2 + 4, -VIRTUAL_CONFIG.symbolSize/2 + 4, 
                        VIRTUAL_CONFIG.symbolSize - 8, VIRTUAL_CONFIG.symbolSize - 8, 8);
    cont.add(bg);
    
    // 文本
    const text = this.scene.add.text(0, 0, '', {
      fontSize: '42px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add(text);
    cont.setData('text', text);
    
    return cont;
  }
  
  spin(targetSymbols: SymbolData[]) {
    this.targetSymbols = targetSymbols;
    this.physics.startSpin();
  }
  
  update(deltaMs: number) {
    // Step 1: 纯物理计算
    const physics = this.physics.update(deltaMs);
    
    // Step 2: 学会时机，开始减速
    if (this.targetSymbols && 
        physics.phase === 'constant' && 
        physics.phaseTime >= PHYSICS_CONFIG.minSpinTime) {
      // 计算目标位置的像素偏移
      const currentPosition = physics.position;
      const { targetPosition } = this.renderer.calculateAlignedPosition(currentPosition, this.targetSymbols);
      
      this.physics.startDeceleration(targetPosition);
      console.log('[Reel] Decelerating to:', targetPosition, 'from:', currentPosition);
    }
    
    // Step 3: 纯函数：根据物理位置计算符号
    const symbols = this.renderer.getVisibleSymbols(physics.position, this.targetSymbols);
    
    // Step 4: 渲染更新
    this.updateSymbolRender(symbols);
  }
  
  private updateSymbolRender(symbols: SymbolData[]) {
    const startX = this.x;
    const startY = this.topY - VIRTUAL_CONFIG.bufferRows * VIRTUAL_CONFIG.symbolSize + this.getPhasePositionOffset();
    
    for (let i = 0; i < this.symbolContainers.length; i++) {
      const container = this.symbolContainers[i];
      const symbol = symbols[i];
      
      // 更新位置（整数像素对齐）
      container.setY(Math.round(startY + i * VIRTUAL_CONFIG.symbolSize));
      
      // 更新文本
      const text = container.getData('text') as Phaser.GameObjects.Text;
      text.setText(symbol.label);
      text.setColor(Phaser.Display.Color.IntegerToColor(symbol.color).rgba);
    }
  }
  
  /**
   * Phas的角色玩家兼容
   * PhysicsEngine 当前物理位置的小数部分
   * Virtual renderer 会处理整数部分
   */
  private getPhasePositionOffset(): number {
    const state = this.physics.getState();
    return state.position % VIRTUAL_CONFIG.symbolSize;
  }
  
  isSpinning(): boolean {
    return !this.physics.isIdle();
  }
  
  getVisibleSymbols(): SymbolData[] {
    const symbols = this.renderer.getVisibleSymbols(this.physics.getState().position, this.targetSymbols);
    const bufferStart = VIRTUAL_CONFIG.bufferRows;
    return symbols.slice(bufferStart, bufferStart + VIRTUAL_CONFIG.visibleRows);
  }
}