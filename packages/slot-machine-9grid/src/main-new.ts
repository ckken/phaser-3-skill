// ✨ 重构后的主场景 - 三层架构
import * as Phaser from 'phaser';
import { SYMBOLS, type SymbolData } from './types';
import { ReelController } from './ReelController';
import { calculateWin, formatWinningLines } from './WinCalculator';

const CONFIG = {
  WIDTH: 400,
  HEIGHT: 720,
  REEL_COUNT: 3,
  REEL_GAP: 10,
  SYMBOL_SIZE: 90,
  VISIBLE_ROWS: 3,
  BUFFER_SYMBOLS: 3
};

const THEME = {
  bgDark: 0x0d0d1a,
  bgPanel: 0x1a2a3e,
  gold: 0xffd700,
  red: 0xc41e3a
};

class SlotGame extends Phaser.Scene {
  private reels: ReelController[] = [];
  private balance = 1000;
  private betting = 10;
  private spinning = false;
  
  private balanceText!: Phaser.GameObjects.Text;
  private betText!: Phaser.GameObjects.Text;
  private winText!: Phaser.GameObjects.Text;
  private spinButton!: Phaser.GameObjects.Container;
  private maskGraphics!: Phaser.GameObjects.Graphics;
  
  constructor() {
    super('SlotGame');
  }
  
  create() {
    this.createBackground();
    this.createMask();
    this.createReels();
    this.createUI();
    this.createButton();
    
    this.input.keyboard?.on('keydown-SPACE', () => this.handleSpin());
  }
  
  private createBackground() {
    const g = this.add.graphics();
    for (let y = 0; y < CONFIG.HEIGHT; y++) {
      const t = y / CONFIG.HEIGHT;
      const startColor = Phaser.Display.Color.ValueToColor(0x0d0d1a);
      const endColor = Phaser.Display.Color.ValueToColor(0x05050f);
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        startColor,
        endColor,
        100, 
        t * 100
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
      g.fillRect(0, y, CONFIG.WIDTH, 1);
    }
  }
  
  private createMask() {
    this.maskGraphics = this.add.graphics();
    const reelY = 180;
    const reelHeight = CONFIG.VISIBLE_ROWS * CONFIG.SYMBOL_SIZE;
    const marginY = 20;
    
    this.maskGraphics.fillStyle(0xffffff, 1);
    this.maskGraphics.fillRect(0, reelY - marginY, CONFIG.WIDTH, reelHeight + marginY * 2);
  }
  
  private createReels() {
    const reelY = 180;
    const reelWidth = CONFIG.SYMBOL_SIZE;
    const totalWidth = reelWidth * CONFIG.REEL_COUNT + CONFIG.REEL_GAP * (CONFIG.REEL_COUNT - 1);
    const startX = (CONFIG.WIDTH - totalWidth) / 2 + reelWidth / 2;
    
    for (let i = 0; i < CONFIG.REEL_COUNT; i++) {
      const x = startX + i * (reelWidth + CONFIG.REEL_GAP);
      const reel = new ReelController(this, x, reelY);
      this.reels.push(reel);
    }
  }
  
  private createUI() {
    // 标题
    this.add.text(CONFIG.WIDTH/2, 50, '🎰 LUCKY SLOT 🎰', {
      fontSize: '32px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5).setShadow(2, 2, '#000', 2, true, true);
    
    // 面板
    const panel = this.add.graphics();
    panel.fillStyle(THEME.bgPanel, 0.6);
    panel.fillRoundedRect(40, CONFIG.HEIGHT - 120, CONFIG.WIDTH - 80, 80, 12);
    panel.lineStyle(2, THEME.gold, 0.4);
    panel.strokeRoundedRect(40, CONFIG.HEIGHT - 120, CONFIG.WIDTH - 80, 80, 12);
    
    // 文本
    this.balanceText = this.add.text(60, CONFIG.HEIGHT - 100, 'BALANCE: $1000', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#fff'
    });
    
    this.betText = this.add.text(60, CONFIG.HEIGHT - 70, 'BET: $10', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffd700'
    });
    
    this.winText = this.add.text(CONFIG.WIDTH - 40, CONFIG.HEIGHT - 85, '', {
      fontSize: '28px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#c41e3a'
    }).setOrigin(1, 0.5).setVisible(false);
  }
  
  private createButton() {
    const button = this.add.container(CONFIG.WIDTH/2, CONFIG.HEIGHT - 50);
    this.spinButton = button;
    
    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0xc41e3a, 1);
    bg.fillRoundedRect(-60, -25, 120, 50, 8);
    bg.lineStyle(3, 0xffd700, 1);
    bg.strokeRoundedRect(-60, -25, 120, 50, 8);
    button.add(bg);
    
    // 文本
    const text = this.add.text(0, 0, 'SPIN', {
      fontSize: '24px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#fff'
    }).setOrigin(0.5);
    button.add(text);
    
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.handleSpin());
  }
  
  update(time: number, delta: number) {
    if (this.spinning) {
      this.reels.forEach(reel => reel.update(delta));
      
      // 检查是否全部停止
      const allIdle = this.reels.every(reel => !reel.isSpinning());
      if (this.spinning && allIdle) {
        this.onSpinComplete();
      }
    }
  }
  
  private handleSpin() {
    if (this.spinning || this.balance < this.betting) return;
    
    this.spinning = true;
    this.balance -= this.betting;
    this.updateBalanceText();
    this.winText.setVisible(false);
    
    // 生成目标符号
    const results = this.generateSpinResults();
    
    // 触发滚动（每格延迟）
    this.reels.forEach((reel, idx) => {
      const delay = idx * 200;
      setTimeout(() => {
        reel.spin(results[idx]);
      }, delay);
    });
  }
  
  private generateSpinResults(): SymbolData[][] {
    return this.reels.map(() => 
      Array.from({ length: CONFIG.VISIBLE_ROWS }, () => 
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      )
    );
  }
  
  private onSpinComplete() {
    this.spinning = false;
    
    // 计算中奖
    const payline = this.reels.map(reel => reel.getVisibleSymbols());
    const result = calculateWin(payline, this.betting);
    
    if (result.winAmount > 0) {
      this.balance += result.winAmount;
      this.winText.text = `+ $${result.winAmount}`;
      this.winText.setVisible(true);
      this.animateWin();
      
      // 显示中奖线详情
      const winDetails = formatWinningLines(result.winningLines);
      console.log('[Game] Winning:', winDetails);
    }
    
    this.updateBalanceText();
  }
  
  private calculateWin(payline: SymbolData[][]): number {
    console.log('[Calculate win] Payline:', payline);
    // 此函数已弃用, 实际计算在 onSpinComplete 中使用 WinCalculator
    return 0;
  }
  
  private animateWin() {
    this.tweens.add({
      targets: this.winText,
      scale: 1.5,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        this.winText.setScale(1);
        this.winText.setAlpha(1);
        this.winText.setVisible(false);
      }
    });
  }
  
  private updateBalanceText() {
    this.balanceText.text = `BALANCE: $${this.balance}`;
  }
}

class GameConfig {
  public config: Phaser.Types.Core.GameConfig;
  
  constructor() {
    this.config = {
      type: Phaser.AUTO,
      width: CONFIG.WIDTH,
      height: CONFIG.HEIGHT,
      parent: 'game-container',
      backgroundColor: '#0a0a1a',
      scene: SlotGame
    };
  }
}

// 导出配置供 Vite 使用
export default GameConfig;