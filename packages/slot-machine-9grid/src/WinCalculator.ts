// 中奖计算模块 - 纯函数实现
import { type SymbolData } from './types';

export interface WinResult {
  winAmount: number;
  winningLines: WinningLine[];
}

export interface WinningLine {
  rowIndex: number;  // 0, 1, 2 (第1,2,3行)
  symbols: SymbolData[];
  multiplier: number;
}

/**
 * 计算中奖金额
 * 
 * @param payline payline[row][col]
 * @param betAmount 押注金额
 * @returns 中奖结果
 */
export function calculateWin(payline: SymbolData[][], betAmount: number): WinResult {
  console.log('[WinCalculator] Payline:', payline, 'Bet:', betAmount);
  
  const winningLines: WinningLine[] = [];
  let totalWin = 0;
  
  // 检查每一行
  for (let row = 0; row < 3; row++) {
    const symbols = payline.map(col => col[row]);
    console.log(`[WinCalculator] Row ${row}:`, symbols);
    
    // 获取符号 ID 用于比较
    const symbolIds = symbols.map(s => s.id);
    
    // 检查 3个相同
    if (symbolIds[0] === symbolIds[1] && symbolIds[1] === symbolIds[2]) {
      const lineMultiplier = symbols[0].multiplier;
      const win = Math.floor(betAmount * lineMultiplier);
      
      winningLines.push({
        rowIndex: row,
        symbols: symbols,
        multiplier: lineMultiplier
      });
      
      totalWin += win;
      console.log(`[WinCalculator] 中奖行 ${row}: 3个 ${symbols[0].id}, 倍数 ${lineMultiplier}, 赢取 ${win}`);
      continue;
    }
    
    // 检查 2个相同 (允许一个 Wild)
    const counts: Record<string, number> = {};
    symbolIds.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });
    
    const symbolCounts = Object.entries(counts).filter(([_, count]) => count >= 2);
    
    if (symbolCounts.length > 0) {
      const symbolId = symbolCounts[0][0];
      const mainSymbol = symbols.find(s => s.id === symbolId)!;
      const mainMultiplier = mainSymbol.multiplier;
      const win = Math.floor(betAmount * mainMultiplier * 0.5); // 2个匹配给50%
      
      winningLines.push({
        rowIndex: row,
        symbols: symbols,
        multiplier: mainMultiplier * 0.5
      });
      
      totalWin += win;
      console.log(`[WinCalculator] 中奖行 ${row}: 2个 ${symbolId}, 赢取 ${win}`);
    }
  }
  
  return {
    winAmount: totalWin,
    winningLines: winningLines
  };
}

/**
 * 格式化中奖线显示
 */
export function formatWinningLines(lines: WinningLine[]): string {
  if (lines.length === 0) return '';
  
  return lines.map(line => {
    const symbols = line.symbols.map(s => s.label).join(' | ');
    return `行 ${line.rowIndex + 1}: ${symbols} (x${line.multiplier})`;
  }).join(' \n');
}
