// 虚拟渲染器 - 根据位置计算可见符号
import { SYMBOLS, SymbolData } from './types';

export interface VirtualReelConfig {
  symbolSize: number;
  visibleRows: number;
  bufferRows: number;
}

export class VirtualRenderer {
  private symbolPool = [...SYMBOLS];
  private config: VirtualReelConfig;
  
  constructor(config: VirtualReelConfig) {
    this.config = config;
  }
  
  /**
   * 根据滚动位置获取可见符号
   * 
   * @param position 滚动位置（像素，向下为正）
   * @param targetSymbols 目标符号（减速时用于精确对齐）
   */
  getVisibleSymbols(position: number, targetSymbols?: SymbolData[]): SymbolData[] {
    // 计算索引偏移
    const indexOffset = Math.floor(position / this.config.symbolSize);
    const totalVisible = this.config.bufferRows * 2 + this.config.visibleRows;
    
    const result: SymbolData[] = [];
    
    // 目标符号插入逻辑（减速阶段）
    if (targetSymbols) {
      // 计算目标符号应该出现在哪个索引位置
      const targetStartIndex = indexOffset + this.config.bufferRows;
      
      for (let i = 0; i < totalVisible; i++) {
        const globalIndex = indexOffset + i;
        
        // 检查是否在目标符号区域
        if (globalIndex >= targetStartIndex && 
            globalIndex < targetStartIndex + this.config.visibleRows) {
          // 使用目标符号
          const targetIndex = globalIndex - targetStartIndex;
          result.push(targetSymbols[targetIndex] || this.symbolPool[globalIndex % this.symbolPool.length]);
        } else {
          // 使用随机符号
          result.push(this.symbolPool[globalIndex % this.symbolPool.length]);
        }
      }
    } else {
      // 普通滚动模式（无目标符号）
      for (let i = 0; i < totalVisible; i++) {
        const symbolIndex = Math.abs(indexOffset + i) % this.symbolPool.length;
        result.push(this.symbolPool[symbolIndex]);
      }
    }
    
    return result;
  }
  
  /**
   * 计算精确的对齐位置
   * 确保减速结束后符号正好对齐到可视区域
   */
  calculateAlignedPosition(currentPosition: number, targetSymbols: SymbolData[]): {
    targetPosition: number;
    startIndex: number;
  } {
    // 找到距离当前位置最近的整数倍符号位置
    // 让符号边界对齐到可视区域的顶部
    const alignedOffset = Math.round(currentPosition / this.config.symbolSize) * this.config.symbolSize;
    
    // 计算目标符号的起始索引
    const startIndex = Math.floor(alignedOffset / this.config.symbolSize) + this.config.bufferRows;
    
    return {
      targetPosition: alignedOffset,
      startIndex
    };
  }
}