import Phaser from 'phaser';

// ============ 配置 ============
const CONFIG = {
  WIDTH: 400,
  HEIGHT: 720,
  REEL_COUNT: 3,
  VISIBLE_ROWS: 3,
  SYMBOL_SIZE: 90,
  REEL_GAP: 10,
  
  // 滚动配置
  BUFFER_SYMBOLS: 3,
  MAX_SPEED: 2000,
  ACCEL_TIME: 0.2,
  MIN_SPIN_TIME: 0.6,
  STOP_DELAY: 0.3,
  DECEL_TIME: 0.4,
};

const SYMBOLS = [
  { id: 'seven', color: 0xff3333, label: '7', multiplier: 10 },
  { id: 'diamond', color: 0x33ffff, label: '◆', multiplier: 8 },
  { id: 'bell', color: 0xffdd33, label: '🔔', multiplier: 5 },
  { id: 'cherry', color: 0xff6699, label: '🍒', multiplier: 3 },
  { id: 'lemon', color: 0xffff33, label: '🍋', multiplier: 2 },
  { id: 'grape', color: 0xaa33ff, label: '🍇', multiplier: 2 },
  { id: 'star', color: 0xffaa00, label: '★', multiplier: 1.5 },
  { id: 'bar', color: 0x66ff66, label: 'BAR', multiplier: 4 },
];

const THEME = {
  bgDark: 0x0d0d1a,
  bgPanel: 0x1a1a2e,
  gold: 0xffd700,
  goldDark: 0xb8860b,
  red: 0xc41e3a,
};

// ============ 轮盘类 ============
class Reel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private symbols: Phaser.GameObjects.Container[] = [];
  private symbolData: typeof SYMBOLS[number][] = [];
  
  private x: number;
  private topY: number;
  
  // 滚动状态
  private offset = 0;
  private speed = 0;
  private phase: 'idle' | 'accel' | 'spin' | 'decel' = 'idle';
  private phaseTime = 0;
  private targetSymbols: typeof SYMBOLS[number][] = [];
  private stopAtOffset = 0;  // 记录应该停在哪
  
  constructor(scene: Phaser.Scene, x: number, topY: number, maskGraphics: Phaser.GameObjects.Graphics) {
    this.scene = scene;
    this.x = x;
    this.topY = topY;
    
    this.container = scene.add.container(x, 0);
    
    const totalSymbols = CONFIG.VISIBLE_ROWS + CONFIG.BUFFER_SYMBOLS * 2;
    for (let i = 0; i < totalSymbols; i++) {
      const sym = this.createSymbol();
      sym.setY(topY - CONFIG.BUFFER_SYMBOLS * CONFIG.SYMBOL_SIZE + i * CONFIG.SYMBOL_SIZE);
      this.symbols.push(sym);
      this.symbolData.push(this.randomSymbol());
      this.container.add(sym);
    }
    
    this.updatePositions();
    
    const mask = maskGraphics.createGeometryMask();
    this.container.setMask(mask);
  }
  
  private createSymbol(): Phaser.GameObjects.Container {
    const cont = this.scene.add.container(0, 0);
    
    // ✅ 只创建一次，缓存图形
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x222244, 1);
    bg.fillRoundedRect(-CONFIG.SYMBOL_SIZE/2 + 4, -CONFIG.SYMBOL_SIZE/2 + 4, 
                        CONFIG.SYMBOL_SIZE - 8, CONFIG.SYMBOL_SIZE - 8, 8);
    cont.add(bg);
    
    // ✅ 文本只设置一次静态属性
    const text = this.scene.add.text(0, 0, '', {
      fontSize: '42px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add(text);
    cont.setData('text', text);
    
    // ✅ 整个容器只设置一次交互（如果需要）
    // cont.setInteractive({ useHandCursor: true });
    
    return cont;
  }
  
  private randomSymbol(): typeof SYMBOLS[number] {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }
  
  private updatePositions() {
    const startY = this.topY - CONFIG.BUFFER_SYMBOLS * CONFIG.SYMBOL_SIZE;
    
    for (let i = 0; i < this.symbols.length; i++) {
      const sym = this.symbols[i];
      const data = this.symbolData[i];
      
      // ✅ 整数像素对齐 - 消除渲染模糊
      const preciseY = startY + i * CONFIG.SYMBOL_SIZE + this.offset;
      sym.setY(Math.round(preciseY));
      
      const text = sym.getData('text') as Phaser.GameObjects.Text;
      // 只在数据变化时更新文本和颜色
      if (text.text !== data.label) {
        text.setText(data.label);
      }
      const colorStr = Phaser.Display.Color.IntegerToColor(data.color).rgba;
      if (text.style.color !== colorStr) {
        text.setColor(colorStr);
      }
    }
  }
  
  private prepareFinalSymbols(): void {
    // 🎯 减速前确定最终符号序列
    // 将目标符号插入到可见区域，减速时只移动位置，不更换符号
    const bufferStart = CONFIG.BUFFER_SYMBOLS;
    
    for (let i = 0; i < CONFIG.VISIBLE_ROWS; i++) {
      this.symbolData[bufferStart + i] = this.targetSymbols[i];
    }
  }
  
  spin(targetSymbols: typeof SYMBOLS[number][], delay: number) {
    this.targetSymbols = targetSymbols;
    this.phase = 'accel';
    this.phaseTime = 0;
    this.speed = 0;
    this.offset = 0;
    
    this.scene.time.delayedCall(delay * 1000, () => {
      if (this.phase === 'spin') {
        this.phase = 'decel';
        this.phaseTime = 0;
        // 减速开始时，设置最终应该停止的位置
        // 让它停在某个符号的边界上
        this.stopAtOffset = 0;
      }
    });
  }
  
  update(delta: number) {
    if (this.phase === 'idle') return;
    
    const dt = delta / 1000;
    this.phaseTime += dt;
    
    switch (this.phase) {
      case 'accel':
        const accelT = Math.min(this.phaseTime / CONFIG.ACCEL_TIME, 1);
        this.speed = CONFIG.MAX_SPEED * this.easeOutQuad(accelT);
        if (accelT >= 1) {
          this.phase = 'spin';
          this.phaseTime = 0;
        }
        break;
        
      case 'spin':
        this.speed = CONFIG.MAX_SPEED;
        if (this.phaseTime >= CONFIG.MIN_SPIN_TIME) {
          this.phase = 'decel';
          this.phaseTime = 0;
          // 🎯 关键：开始减速前，确定最终符号序列
          this.prepareFinalSymbols();
        }
        break;
        
      case 'decel':
        const decelT = Math.min(this.phaseTime / CONFIG.DECEL_TIME, 1);
        // 使用更平滑的减速曲线
        const eased = this.easeOutCubic(decelT);
        this.speed = CONFIG.MAX_SPEED * (1 - eased);
        
        // 当减速完成时，直接设置到精确位置，无闪烁
        if (decelT >= 1) {
          this.speed = 0;
          this.offset = 0;
          // 直接设置到精确位置，无任何动画
          this.updatePositions();
          this.phase = 'idle';
          return;
        }
        break;
    }
    
    // 更新滚动偏移
    this.offset += this.speed * dt;
    
    // 只在加速和匀速阶段循环符号
    if (this.phase === 'accel' || this.phase === 'spin') {
      while (this.offset >= CONFIG.SYMBOL_SIZE) {
        this.offset -= CONFIG.SYMBOL_SIZE;
        this.symbolData.shift();
        this.symbolData.push(this.randomSymbol());
      }
    }
    
    this.updatePositions();
  }
  
  private applyTargetSymbols() {
    // 目标符号已在减速前设置（prepareFinalSymbols）
    // 这里仅更新位置，无回弹动画
    this.updatePositions();
  }
  
  isIdle(): boolean {
    return this.phase === 'idle';
  }
  
  playBounceAnimation(): void {
    const symbols = this.getVisibleSymbols();
    symbols.forEach((data, idx) => {
      const sym = this.symbols[CONFIG.BUFFER_SYMBOLS + idx];
      
      // 符号闪烁
      this.scene.tweens.add({
        targets: sym,
        scaleY: 0.8,  // 压扁
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
      
      // 文本弹跳
      const text = sym.getData('text') as Phaser.GameObjects.Text;
      this.scene.tweens.add({
        targets: text,
        scaleY: 1.3,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut',
        delay: idx * 50,  // 错峰触发
      });
    });
  }
  
  getVisibleSymbols(): typeof SYMBOLS[number][] {
    const start = CONFIG.BUFFER_SYMBOLS;
    return this.symbolData.slice(start, start + CONFIG.VISIBLE_ROWS);
  }
  
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }
  
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}

// ============ 主场景 ============
class SlotScene extends Phaser.Scene {
  private reels: Reel[] = [];
  private balance = 1000;
  private bet = 10;
  private spinning = false;
  
  private balanceText!: Phaser.GameObjects.Text;
  private betText!: Phaser.GameObjects.Text;
  private winText!: Phaser.GameObjects.Text;
  
  constructor() {
    super('SlotScene');
  }
  
  create() {
    this.createBackground();
    this.createTitle();
    this.createReelArea();
    this.createUI();
    
    this.input.keyboard?.on('keydown-SPACE', () => this.handleSpin());
  }
  
  private createBackground() {
    const g = this.add.graphics();
    for (let y = 0; y < CONFIG.HEIGHT; y++) {
      const t = y / CONFIG.HEIGHT;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 13, g: 13, b: 26, a: 255 },
        { r: 5, g: 5, b: 15, a: 255 },
        100, t * 100
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
      g.fillRect(0, y, CONFIG.WIDTH, 1);
    }
    
    g.lineStyle(2, THEME.gold, 0.5);
    g.strokeRect(15, 15, CONFIG.WIDTH - 30, CONFIG.HEIGHT - 30);
  }
  
  private createTitle() {
    const titleBg = this.add.graphics();
    titleBg.fillStyle(THEME.red, 0.9);
    titleBg.fillRoundedRect(40, 30, CONFIG.WIDTH - 80, 60, 10);
    titleBg.lineStyle(3, THEME.gold);
    titleBg.strokeRoundedRect(40, 30, CONFIG.WIDTH - 80, 60, 10);
    
    this.add.text(CONFIG.WIDTH / 2, 60, '🎰 LUCKY 9 🎰', {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }
  
  private createReelArea() {
    const areaWidth = CONFIG.REEL_COUNT * CONFIG.SYMBOL_SIZE + (CONFIG.REEL_COUNT - 1) * CONFIG.REEL_GAP;
    const areaHeight = CONFIG.VISIBLE_ROWS * CONFIG.SYMBOL_SIZE;
    const areaX = (CONFIG.WIDTH - areaWidth) / 2;
    const areaY = 130;
    
    const reelBg = this.add.graphics();
    reelBg.fillStyle(0x0a0a15, 1);
    reelBg.fillRoundedRect(areaX - 15, areaY - 15, areaWidth + 30, areaHeight + 30, 12);
    reelBg.lineStyle(4, THEME.gold);
    reelBg.strokeRoundedRect(areaX - 15, areaY - 15, areaWidth + 30, areaHeight + 30, 12);
    
    const centerY = areaY + areaHeight / 2;
    this.add.triangle(areaX - 20, centerY, 0, -10, 0, 10, 12, 0, THEME.gold);
    this.add.triangle(areaX + areaWidth + 20, centerY, 0, -10, 0, 10, -12, 0, THEME.gold);
    
    const maskG = this.add.graphics();
    maskG.fillStyle(0xffffff);
    maskG.fillRect(areaX - 5, areaY - 5, areaWidth + 10, areaHeight + 10);
    maskG.setVisible(false);
    
    for (let i = 0; i < CONFIG.REEL_COUNT; i++) {
      const reelX = areaX + CONFIG.SYMBOL_SIZE / 2 + i * (CONFIG.SYMBOL_SIZE + CONFIG.REEL_GAP);
      const reel = new Reel(this, reelX, areaY + CONFIG.SYMBOL_SIZE / 2, maskG);
      this.reels.push(reel);
    }
    
    const sepG = this.add.graphics();
    sepG.lineStyle(2, THEME.goldDark, 0.3);
    for (let i = 1; i < CONFIG.REEL_COUNT; i++) {
      const x = areaX + i * (CONFIG.SYMBOL_SIZE + CONFIG.REEL_GAP) - CONFIG.REEL_GAP / 2;
      sepG.moveTo(x, areaY);
      sepG.lineTo(x, areaY + areaHeight);
    }
    sepG.strokePath();
  }
  
  private createUI() {
    const panelY = 430;
    
    this.createPanel(30, panelY, 160, 70, '💰 BALANCE');
    this.balanceText = this.add.text(110, panelY + 45, `$${this.balance}`, {
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    this.createPanel(210, panelY, 160, 70, '🎯 BET');
    this.betText = this.add.text(290, panelY + 45, `$${this.bet}`, {
      fontSize: '24px',
      color: '#33ffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    this.createBetButton(220, panelY + 45, '-', () => this.adjustBet(-10));
    this.createBetButton(360, panelY + 45, '+', () => this.adjustBet(10));
    
    this.winText = this.add.text(CONFIG.WIDTH / 2, 530, '', {
      fontSize: '32px',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);
    
    this.createSpinButton();
  }
  
  private createPanel(x: number, y: number, w: number, h: number, label: string) {
    const g = this.add.graphics();
    g.fillStyle(THEME.bgPanel, 0.9);
    g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(2, THEME.gold, 0.6);
    g.strokeRoundedRect(x, y, w, h, 8);
    
    this.add.text(x + w / 2, y + 18, label, {
      fontSize: '12px',
      color: '#888',
    }).setOrigin(0.5);
  }
  
  private createBetButton(x: number, y: number, label: string, callback: () => void) {
    const btn = this.add.text(x, y, label, {
      fontSize: '24px',
      color: '#33ffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    btn.on('pointerdown', callback);
    btn.on('pointerover', () => btn.setScale(1.2));
    btn.on('pointerout', () => btn.setScale(1));
  }
  
  private createSpinButton() {
    const btnX = CONFIG.WIDTH / 2;
    const btnY = 620;
    
    const btn = this.add.container(btnX, btnY);
    
    const bg = this.add.graphics();
    bg.fillStyle(THEME.red, 1);
    bg.fillRoundedRect(-70, -30, 140, 60, 12);
    bg.lineStyle(4, THEME.gold);
    bg.strokeRoundedRect(-70, -30, 140, 60, 12);
    
    const text = this.add.text(0, 0, '🎰 SPIN', {
      fontSize: '26px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    btn.add([bg, text]);
    btn.setSize(140, 60);
    btn.setInteractive({ useHandCursor: true });
    
    btn.on('pointerdown', () => this.handleSpin());
    btn.on('pointerover', () => btn.setScale(1.05));
    btn.on('pointerout', () => btn.setScale(1));
  }
  
  private adjustBet(delta: number) {
    if (this.spinning) return;
    this.bet = Phaser.Math.Clamp(this.bet + delta, 10, 100);
    this.betText.setText(`$${this.bet}`);
  }
  
  private handleSpin() {
    if (this.spinning) return;
    if (this.balance < this.bet) {
      this.showMessage('💸 余额不足!');
      return;
    }
    
    this.spinning = true;
    this.balance -= this.bet;
    this.balanceText.setText(`$${this.balance}`);
    this.winText.setAlpha(0);
    
    const results: typeof SYMBOLS[number][][] = [];
    for (let i = 0; i < CONFIG.REEL_COUNT; i++) {
      const col: typeof SYMBOLS[number][] = [];
      for (let j = 0; j < CONFIG.VISIBLE_ROWS; j++) {
        col.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }
      results.push(col);
    }
    
    // ✅ 错峰停止 - 每列增加延迟，增强节奏感
    for (let i = 0; i < CONFIG.REEL_COUNT; i++) {
      // 第1列立即，第2列延迟0.35s，第3列延迟0.7s
      const delay = i * CONFIG.STOP_DELAY * 2;
      this.reels[i].spin(results[i], delay);
    }
    
    // 添加音效层次感
    this.time.delayedCall(350, () => this.playReelSound(1));
    this.time.delayedCall(700, () => this.playReelSound(2));
    
    // 等待所有轮盘停止
    const checkInterval = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (this.reels.every(r => r.isIdle())) {
          checkInterval.remove();
          this.checkWin(results);
          this.spinning = false;
        }
      },
    });
  }
  
  private playReelSound(reelIndex: number) {
    // 占位：播放轮盘停止音效
    console.log(`Reel ${reelIndex + 1} stopped`);
  }
  
  private checkWin(results: typeof SYMBOLS[number][][]) {
    const lines = [
      [results[0][0], results[1][0], results[2][0]],
      [results[0][1], results[1][1], results[2][1]],
      [results[0][2], results[1][2], results[2][2]],
      [results[0][0], results[1][1], results[2][2]],
      [results[0][2], results[1][1], results[2][0]],
    ];
    
    let totalWin = 0;
    
    for (const line of lines) {
      if (line[0].id === line[1].id && line[1].id === line[2].id) {
        totalWin += this.bet * line[0].multiplier;
      }
    }
    
    if (totalWin > 0) {
      this.balance += totalWin;
      this.balanceText.setText(`$${this.balance}`);
      this.showWin(totalWin);
    } else {
      this.showMessage('🎲 再试一次!');
    }
  }
  
  private showWin(amount: number) {
    this.winText.setText(`🎉 WIN $${amount}! 🎉`);
    this.winText.setAlpha(1).setScale(0);
    
    this.tweens.add({
      targets: this.winText,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });
  }
  
  private showMessage(text: string) {
    const msg = this.add.text(CONFIG.WIDTH / 2, 530, text, {
      fontSize: '20px',
      color: '#888',
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 1000,
      delay: 500,
      onComplete: () => msg.destroy(),
    });
  }
  
  update(_time: number, delta: number) {
    for (const reel of this.reels) {
      reel.update(delta);
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  scene: [SlotScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
