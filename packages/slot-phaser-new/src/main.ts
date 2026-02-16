import Phaser from 'phaser';

// 老虎机符号 - 使用 emoji
const SYMBOLS = ['🍒', '🍋', '🍇', '💎', '🔔', '⭐', '🍀', '🎰'];

// 符号赔率
const SYMBOL_MULTIPLIER: Record<string, number> = {
  '🎰': 10, '💎': 8, '🔔': 6, '⭐': 5, '🍇': 3, '🍋': 2, '🍒': 1.5, '🍀': 1
};

// 配色方案 - 经典赌场风格
const COLORS = {
  bgDark: 0x0d0d1a,
  bgMid: 0x1a1a2e,
  gold: 0xffd700,
  goldDark: 0xb8860b,
  red: 0xc41e3a,
  redDark: 0x8b0000,
  cream: 0xfff8dc,
  neonBlue: 0x00ffff,
  neonPink: 0xff00ff,
};

// 游戏配置
const CONFIG = {
  GAME_W: 480,
  GAME_H: 800,
  REEL_COUNT: 3,
  ROW_COUNT: 3,
  SYMBOL_SIZE: 100,
  REEL_SPACING: 140,
  REEL_START_X: 80,
  REEL_TOP: 280,
  VISIBLE_SYMBOLS: 7,
  MAX_SPEED: 2000,
  ACCEL_DURATION: 0.35,
  SPIN_MIN_TIME: 1.2,
  DECEL_DURATION: 0.8,
  BOUNCE_DURATION: 0.25,
  BOUNCE_OVERSHOOT: 15,
  STOP_INTERVAL_BASE: 0.6,
  STOP_INTERVAL_RAND: 0.25,
};

export class SlotGame extends Phaser.Scene {
  private reels: Phaser.GameObjects.Container[] = [];
  private reelSymbols: Phaser.GameObjects.Text[][] = [];
  private balance = 1000;
  private bet = 10;
  private spinning = false;
  private lineFx?: Phaser.GameObjects.Graphics;
  
  // 滚动状态
  private reelSpeed = [0, 0, 0];
  private reelPhase: ('idle' | 'accel' | 'spinning' | 'decel' | 'bounce')[] = ['idle', 'idle', 'idle'];
  private reelFinal: string[][] = [[], [], []];
  private reelOffset = [0, 0, 0];
  private reelStopDelay = [0, 0, 0];
  private bounceProgress = [0, 0, 0];
  private accelProgress = [0, 0, 0];
  private symbolQueue: string[][] = [[], [], []];
  private queueIndex = [0, 0, 0];

  // UI 元素
  private balanceText?: Phaser.GameObjects.Text;
  private winText?: Phaser.GameObjects.Text;
  private spinButton?: Phaser.GameObjects.Container;
  private betText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SlotGame' });
  }

  create() {
    // 设置画布大小
    this.cameras.main.setViewport(0, 0, CONFIG.GAME_W, CONFIG.GAME_H);
    
    this.createBackground();
    this.createTitle();
    this.createReelFrame();
    this.createReels();
    this.createUI();
    this.createWinEffects();
    
    // 键盘事件
    this.input.keyboard?.on('keydown-SPACE', () => this.handleSpin());
    this.input.keyboard?.on('keydown-ENTER', () => this.handleSpin());
  }

  private createBackground() {
    // 深色渐变背景
    const g = this.add.graphics();
    for (let i = 0; i < CONFIG.GAME_H; i++) {
      const t = i / CONFIG.GAME_H;
      const r = Math.floor(Phaser.Math.Linear(0x0d, 0x05, t));
      const gr = Math.floor(Phaser.Math.Linear(0x0d, 0x05, t));
      const b = Math.floor(Phaser.Math.Linear(0x1a, 0x10, t));
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, i, CONFIG.GAME_W, 1);
    }

    // 顶部金色边条
    this.add.rectangle(CONFIG.GAME_W / 2, 20, CONFIG.GAME_W - 40, 3, COLORS.gold, 0.7);
    // 底部金色边条
    this.add.rectangle(CONFIG.GAME_W / 2, CONFIG.GAME_H - 20, CONFIG.GAME_W - 40, 3, COLORS.gold, 0.7);

    // 角落装饰
    this.drawCornerDecoration(20, 20, 1, 1);
    this.drawCornerDecoration(CONFIG.GAME_W - 20, 20, -1, 1);
    this.drawCornerDecoration(20, CONFIG.GAME_H - 20, 1, -1);
    this.drawCornerDecoration(CONFIG.GAME_W - 20, CONFIG.GAME_H - 20, -1, -1);
  }

  private drawCornerDecoration(x: number, y: number, sx: number, sy: number) {
    const g = this.add.graphics();
    g.lineStyle(2, COLORS.gold, 0.6);
    g.beginPath();
    g.moveTo(x, y + sy * 25);
    g.lineTo(x, y);
    g.lineTo(x + sx * 25, y);
    g.strokePath();
  }

  private createTitle() {
    // 标题背景
    const titleBg = this.add.graphics();
    titleBg.fillStyle(COLORS.redDark, 0.85);
    titleBg.fillRoundedRect(60, 60, 360, 70, 10);
    titleBg.lineStyle(3, COLORS.gold, 1);
    titleBg.strokeRoundedRect(60, 60, 360, 70, 10);

    // 主标题
    this.add.text(CONFIG.GAME_W / 2, 82, '🎰 LUCKY SLOTS 🎰', {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      stroke: '#8b0000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // 副标题
    this.add.text(CONFIG.GAME_W / 2, 108, '✨ Good Fortune Awaits ✨', {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      color: '#fff8dc',
    }).setOrigin(0.5);
  }

  private createReelFrame() {
    const frameX = 40;
    const frameY = CONFIG.REEL_TOP - 50;
    const frameW = 400;
    const frameH = 340;

    // 外框阴影
    this.add.rectangle(frameX + frameW / 2 + 4, frameY + frameH / 2 + 4, frameW, frameH, 0x000000, 0.4)
      .setOrigin(0.5);

    // 主框架
    const frame = this.add.graphics();
    frame.fillStyle(COLORS.bgMid, 1);
    frame.fillRoundedRect(frameX, frameY, frameW, frameH, 16);

    // 金色边框
    frame.lineStyle(4, COLORS.gold, 1);
    frame.strokeRoundedRect(frameX, frameY, frameW, frameH, 16);

    // 内边框
    frame.lineStyle(2, COLORS.goldDark, 0.5);
    frame.strokeRoundedRect(frameX + 10, frameY + 10, frameW - 20, frameH - 20, 12);

    // 轮盘区域背景
    const reelBg = this.add.graphics();
    reelBg.fillStyle(0x050510, 1);
    reelBg.fillRoundedRect(frameX + 18, frameY + 18, frameW - 36, frameH - 36, 8);

    // 中奖线指示器
    const centerY = CONFIG.REEL_TOP + CONFIG.SYMBOL_SIZE;
    this.add.rectangle(frameX + 10, centerY, 6, 80, COLORS.gold, 0.8);
    this.add.rectangle(frameX + frameW - 10, centerY, 6, 80, COLORS.gold, 0.8);
  }

  private createReels() {
    const maskG = this.add.graphics();
    maskG.fillStyle(0xffffff);
    maskG.fillRect(55, CONFIG.REEL_TOP - 35, 370, 320);
    const mask = maskG.createGeometryMask();
    maskG.setVisible(false);

    for (let col = 0; col < CONFIG.REEL_COUNT; col++) {
      const container = this.add.container(
        CONFIG.REEL_START_X + col * CONFIG.REEL_SPACING, 
        0
      );
      container.setMask(mask);
      this.reels[col] = container;
      this.reelSymbols[col] = [];

      // 创建滚动符号
      for (let i = 0; i < CONFIG.VISIBLE_SYMBOLS; i++) {
        const y = CONFIG.REEL_TOP - CONFIG.SYMBOL_SIZE * 2 + i * CONFIG.SYMBOL_SIZE;
        const symbol = this.add.text(0, y, this.randomSymbol(), {
          fontSize: '64px',
        }).setOrigin(0.5);
        container.add(symbol);
        this.reelSymbols[col].push(symbol);
      }
    }
  }

  private createUI() {
    // 余额显示区域
    const balanceBg = this.add.graphics();
    balanceBg.fillStyle(COLORS.bgMid, 0.9);
    balanceBg.fillRoundedRect(30, 160, 180, 50, 8);
    balanceBg.lineStyle(2, COLORS.gold, 0.8);
    balanceBg.strokeRoundedRect(30, 160, 180, 50, 8);

    this.add.text(50, 172, '💰 BALANCE', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#aaa',
    });

    this.balanceText = this.add.text(50, 190, `$${this.balance}`, {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#ffd700',
      fontStyle: 'bold',
    });

    // 下注显示区域
    const betBg = this.add.graphics();
    betBg.fillStyle(COLORS.bgMid, 0.9);
    betBg.fillRoundedRect(270, 160, 180, 50, 8);
    betBg.lineStyle(2, COLORS.gold, 0.8);
    betBg.strokeRoundedRect(270, 160, 180, 50, 8);

    this.add.text(290, 172, '🎯 BET', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#aaa',
    });

    this.betText = this.add.text(290, 190, `$${this.bet}`, {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#00ffff',
      fontStyle: 'bold',
    });

    // 下注按钮
    this.createBetButtons();

    // 旋转按钮
    this.createSpinButton();
  }

  private createBetButtons() {
    // 减小下注按钮
    const minusBtn = this.add.text(340, 175, '◀', {
      fontSize: '20px',
      color: '#00ffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    minusBtn.on('pointerdown', () => {
      if (!this.spinning && this.bet > 10) {
        this.bet -= 10;
        this.betText?.setText(`$${this.bet}`);
      }
    });

    // 增加下注按钮
    const plusBtn = this.add.text(420, 175, '▶', {
      fontSize: '20px',
      color: '#00ffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    plusBtn.on('pointerdown', () => {
      if (!this.spinning && this.bet < 100) {
        this.bet += 10;
        this.betText?.setText(`$${this.bet}`);
      }
    });
  }

  private createSpinButton() {
    const btnX = CONFIG.GAME_W / 2;
    const btnY = CONFIG.GAME_H - 80;
    
    const btnBg = this.add.graphics();
    btnBg.fillStyle(COLORS.red, 1);
    btnBg.fillRoundedRect(btnX - 80, btnY - 35, 160, 70, 12);
    btnBg.lineStyle(4, COLORS.gold, 1);
    btnBg.strokeRoundedRect(btnX - 80, btnY - 35, 160, 70, 12);

    // 发光效果
    const glow = this.add.graphics();
    glow.fillStyle(COLORS.gold, 0.3);
    glow.fillRoundedRect(btnX - 85, btnY - 40, 170, 80, 15);

    this.spinButton = this.add.container(btnX, btnY);
    
    const btnText = this.add.text(0, 0, '🎰 SPIN', {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.spinButton.add([glow, btnBg, btnText]);
    this.spinButton.setSize(160, 70);
    this.spinButton.setInteractive({ useHandCursor: true });

    this.spinButton.on('pointerdown', () => this.handleSpin());
    this.spinButton.on('pointerover', () => {
      btnText.setScale(1.1);
    });
    this.spinButton.on('pointerout', () => {
      btnText.setScale(1);
    });
  }

  private createWinEffects() {
    this.lineFx = this.add.graphics();
    
    this.winText = this.add.text(CONFIG.GAME_W / 2, CONFIG.REEL_TOP + 180, '', {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      stroke: '#8b0000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);
  }

  private handleSpin() {
    if (this.spinning) return;
    if (this.balance < this.bet) {
      this.showMessage('💸 Insufficient balance!');
      return;
    }

    this.spin();
  }

  private randomSymbol(): string {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  private prepareSymbolQueue(col: number) {
    this.symbolQueue[col] = [];
    for (let i = 0; i < 60; i++) {
      this.symbolQueue[col].push(this.randomSymbol());
    }
    this.queueIndex[col] = 0;
  }

  private getNextSymbol(col: number): string {
    const queue = this.symbolQueue[col];
    if (this.queueIndex[col] >= queue.length) {
      for (let i = 0; i < 30; i++) {
        queue.push(this.randomSymbol());
      }
    }
    return queue[this.queueIndex[col]++];
  }

  // 缓动函数
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;

    for (let col = 0; col < CONFIG.REEL_COUNT; col++) {
      const phase = this.reelPhase[col];
      if (phase === 'idle') continue;

      if (phase === 'accel') {
        // 加速阶段 - 快速启动
        this.accelProgress[col] += dt / CONFIG.ACCEL_DURATION;
        const t = Math.min(this.accelProgress[col], 1);
        const eased = this.easeOutQuad(t);
        this.reelSpeed[col] = CONFIG.MAX_SPEED * eased;

        if (t >= 1) {
          this.reelPhase[col] = 'spinning';
          this.reelSpeed[col] = CONFIG.MAX_SPEED;
        }
        this.updateReelScroll(col, dt);
      } else if (phase === 'spinning') {
        // 匀速阶段
        this.reelStopDelay[col] -= dt;
        if (this.reelStopDelay[col] <= 0) {
          this.reelPhase[col] = 'decel';
          this.accelProgress[col] = 0;
        }
        this.updateReelScroll(col, dt);
      } else if (phase === 'decel') {
        // 减速阶段 - 惯性减速
        this.accelProgress[col] += dt / CONFIG.DECEL_DURATION;
        const t = Math.min(this.accelProgress[col], 1);
        const eased = this.easeOutCubic(t);
        this.reelSpeed[col] = CONFIG.MAX_SPEED * (1 - eased);

        this.updateReelScroll(col, dt);

        if (t >= 1) {
          this.reelSpeed[col] = 0;
          this.snapToFinal(col);
          this.reelPhase[col] = 'bounce';
          this.bounceProgress[col] = 0;
        }
      } else if (phase === 'bounce') {
        // 回弹阶段
        this.bounceProgress[col] += dt;
        const t = Math.min(this.bounceProgress[col] / CONFIG.BOUNCE_DURATION, 1);
        const bounce = this.easeOutBack(t);
        
        const bounceOffset = (1 - bounce) * CONFIG.BOUNCE_OVERSHOOT;
        this.applyBounceOffset(col, bounceOffset);

        if (t >= 1) {
          this.reelPhase[col] = 'idle';
          this.applyBounceOffset(col, 0);
          this.checkAllStopped();
        }
      }
    }
  }

  private updateReelScroll(col: number, dt: number) {
    // 向下滚动
    this.reelOffset[col] += this.reelSpeed[col] * dt;
    const symbols = this.reelSymbols[col];

    // 循环滚动
    while (this.reelOffset[col] >= CONFIG.SYMBOL_SIZE) {
      this.reelOffset[col] -= CONFIG.SYMBOL_SIZE;
      const topSymbol = symbols.shift()!;
      topSymbol.setText(this.getNextSymbol(col));
      symbols.push(topSymbol);
    }

    // 更新符号位置
    for (let i = 0; i < symbols.length; i++) {
      const baseY = CONFIG.REEL_TOP - CONFIG.SYMBOL_SIZE * 2 + i * CONFIG.SYMBOL_SIZE;
      symbols[i].setY(baseY + this.reelOffset[col]);
      symbols[i].setAlpha(1);
      symbols[i].setScale(1);
    }
  }

  private snapToFinal(col: number) {
    const symbols = this.reelSymbols[col];
    this.reelOffset[col] = 0;

    // 设置最终显示的符号
    for (let i = 0; i < symbols.length; i++) {
      const row = i - 2;
      if (row >= 0 && row < CONFIG.ROW_COUNT) {
        symbols[i].setText(this.reelFinal[col][row]);
      } else {
        symbols[i].setText(this.randomSymbol());
      }
      symbols[i].setY(CONFIG.REEL_TOP - CONFIG.SYMBOL_SIZE * 2 + i * CONFIG.SYMBOL_SIZE);
    }
  }

  private applyBounceOffset(col: number, offset: number) {
    const symbols = this.reelSymbols[col];
    for (let i = 0; i < symbols.length; i++) {
      const baseY = CONFIG.REEL_TOP - CONFIG.SYMBOL_SIZE * 2 + i * CONFIG.SYMBOL_SIZE;
      symbols[i].setY(baseY + offset);
    }
  }

  private checkAllStopped() {
    if (this.reelPhase.every(p => p === 'idle')) {
      this.settle();
    }
  }

  private spin(): boolean {
    this.spinning = true;
    this.balance -= this.bet;
    this.balanceText?.setText(`$${this.balance}`);
    this.winText?.setAlpha(0);
    this.lineFx?.clear();

    // 生成最终结果
    this.reelFinal = Array.from({ length: CONFIG.REEL_COUNT }, () =>
      Array.from({ length: CONFIG.ROW_COUNT }, () => this.randomSymbol())
    );

    // 预生成符号队列
    for (let col = 0; col < CONFIG.REEL_COUNT; col++) {
      this.prepareSymbolQueue(col);
    }

    // 错峰启动和停止
    for (let col = 0; col < CONFIG.REEL_COUNT; col++) {
      this.reelSpeed[col] = 0;
      this.reelPhase[col] = 'accel';
      this.reelOffset[col] = 0;
      this.accelProgress[col] = 0;
      // 错峰停止延迟
      this.reelStopDelay[col] = CONFIG.SPIN_MIN_TIME + 
        col * CONFIG.STOP_INTERVAL_BASE + 
        Math.random() * CONFIG.STOP_INTERVAL_RAND;
    }

    return true;
  }

  private settle() {
    const g = this.reelFinal;

    // 检查中奖线
    const lines = [
      { cells: [g[0][1], g[1][1], g[2][1]], row: 1 },
      { cells: [g[0][0], g[1][0], g[2][0]], row: 0 },
      { cells: [g[0][2], g[1][2], g[2][2]], row: 2 },
      { cells: [g[0][0], g[1][1], g[2][2]], diagonal: 'down' },
      { cells: [g[0][2], g[1][1], g[2][0]], diagonal: 'up' },
    ];

    let totalWin = 0;
    const hitLines: number[] = [];
    const hitSymbols: { col: number; row: number }[] = [];

    lines.forEach((line, idx) => {
      if (line.cells[0] === line.cells[1] && line.cells[1] === line.cells[2]) {
        const symbol = line.cells[0];
        const multiplier = SYMBOL_MULTIPLIER[symbol] || 1;
        totalWin += this.bet * (2 + multiplier);
        hitLines.push(idx);

        if ('row' in line) {
          for (let c = 0; c < 3; c++) hitSymbols.push({ col: c, row: (line as any).row });
        } else if ((line as any).diagonal === 'down') {
          hitSymbols.push({ col: 0, row: 0 }, { col: 1, row: 1 }, { col: 2, row: 2 });
        } else if ((line as any).diagonal === 'up') {
          hitSymbols.push({ col: 0, row: 2 }, { col: 1, row: 1 }, { col: 2, row: 0 });
        }
      }
    });

    const win = Math.round(totalWin);

    if (win > 0) {
      this.animateWin(hitSymbols, win);
      this.drawWinLines(hitLines);

      this.time.delayedCall(1500, () => {
        this.balance += win;
        this.balanceText?.setText(`$${this.balance}`);
        this.spinning = false;
      });
    } else {
      this.showMessage('🎲 Try again!');
      this.spinning = false;
    }
  }

  private animateWin(symbols: { col: number; row: number }[], amount: number) {
    const unique = symbols.filter((s, i, arr) =>
      arr.findIndex(x => x.col === s.col && x.row === s.row) === i
    );

    unique.forEach((pos, idx) => {
      const symbol = this.reelSymbols[pos.col][pos.row + 2];
      this.time.delayedCall(idx * 100, () => {
        this.tweens.add({
          targets: symbol,
          scale: 1.3,
          duration: 200,
          yoyo: true,
          repeat: 2,
          ease: 'Bounce.easeOut',
          onStart: () => symbol.setTint(COLORS.gold),
          onComplete: () => symbol.clearTint(),
        });
      });
    });

    // 中奖金额动画
    this.winText?.setText(`🎉 WIN $${amount}! 🎉`);
    this.winText?.setAlpha(1);
    this.winText?.setScale(0);

    this.tweens.add({
      targets: this.winText,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });
  }

  private drawWinLines(hitLines: number[]) {
    const lineCoords = [
      [[55, CONFIG.REEL_TOP + CONFIG.SYMBOL_SIZE], [425, CONFIG.REEL_TOP + CONFIG.SYMBOL_SIZE]],
      [[55, CONFIG.REEL_TOP], [425, CONFIG.REEL_TOP]],
      [[55, CONFIG.REEL_TOP + CONFIG.SYMBOL_SIZE * 2], [425, CONFIG.REEL_TOP + CONFIG.SYMBOL_SIZE * 2]],
      [[55, CONFIG.REEL_TOP], [425, CONFIG.REEL_TOP + CONFIG.SYMBOL_SIZE * 2]],
      [[55, CONFIG.REEL_TOP + CONFIG.SYMBOL_SIZE * 2], [425, CONFIG.REEL_TOP]],
    ];

    hitLines.forEach((idx, i) => {
      this.time.delayedCall(i * 150, () => {
        const [[x1, y1], [x2, y2]] = lineCoords[idx];
        const line = this.add.graphics();

        this.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 300,
          onUpdate: (tween) => {
            const p = tween.getValue() ?? 0;
            line.clear();
            line.lineStyle(4, COLORS.gold, 0.9);
            line.beginPath();
            line.moveTo(x1, y1);
            line.lineTo(Phaser.Math.Linear(x1, x2, p), Phaser.Math.Linear(y1, y2, p));
            line.strokePath();
          },
        });
      });
    });
  }

  private showMessage(text: string) {
    const msg = this.add.text(CONFIG.GAME_W / 2, CONFIG.REEL_TOP + 180, text, {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#aaa',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 800,
      delay: 500,
      onComplete: () => msg.destroy(),
    });
  }
}

// 启动游戏
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.GAME_W,
  height: CONFIG.GAME_H,
  parent: 'game-container',
  backgroundColor: '#0a0a0a',
  scene: [SlotGame],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
