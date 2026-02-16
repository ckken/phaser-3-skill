import Phaser from 'phaser';

// 斗牛主题符号 - 使用 emoji 占位
const SYMBOLS = ['🐂', '🌹', '⚔️', '🏆', '💃', '🎺', '🍷', '👑'];

const SYMBOL_MULTIPLIER: Record<string, number> = {
  '👑': 10, '🏆': 5, '🐂': 4, '⚔️': 3, '💃': 2.5, '🌹': 2, '🎺': 1.5, '🍷': 1
};

// 配色方案 - CASINO CORRIDA 风格
const COLORS = {
  bgDark: 0x1a0a0a,
  bgMid: 0x2d1515,
  gold: 0xffd700,
  goldDark: 0xb8860b,
  red: 0xc41e3a,
  redDark: 0x8b0000,
  cream: 0xfff8dc,
  bronze: 0xcd7f32,
};

export class SlotScene extends Phaser.Scene {
  private reels: Phaser.GameObjects.Container[] = [];
  private reelSymbols: Phaser.GameObjects.Text[][] = [];
  private balance = 1000;
  private spinning = false;
  private lineFx?: Phaser.GameObjects.Graphics;
  private coinEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  // 布局参数
  private readonly GAME_W = 540;
  private readonly GAME_H = 960;
  private readonly REEL_COUNT = 3;
  private readonly ROW_COUNT = 3;
  private readonly SYMBOL_SIZE = 80;
  private readonly REEL_SPACING = 130;
  private readonly REEL_START_X = 140;
  private readonly REEL_TOP = 340;
  // 增加可见符号数量，确保滚动路径连续可见
  private readonly VISIBLE_SYMBOLS = 7;

  // 滚动参数 - 增强动感
  private reelSpeed = [0, 0, 0];
  private reelPhase: ('idle' | 'accel' | 'spinning' | 'decel' | 'bounce')[] = ['idle', 'idle', 'idle'];
  private reelFinal: string[][] = [[], [], []];
  private reelOffset = [0, 0, 0];
  private reelStopDelay = [0, 0, 0];
  private bounceProgress = [0, 0, 0];
  private accelProgress = [0, 0, 0];
  // 预生成符号队列，避免滚动时随机生成导致闪动
  private symbolQueue: string[][] = [[], [], []];
  private queueIndex = [0, 0, 0];

  // 速度参数 - 优化动感（向下滚动）
  private readonly MAX_SPEED = 1800;        // 最大速度（像素/秒）
  private readonly ACCEL_DURATION = 0.4;    // 加速时长（秒）- 快速启动
  private readonly SPIN_MIN_TIME = 1.0;     // 最小匀速时间
  private readonly DECEL_DURATION = 0.7;    // 减速时长 - 更长的减速感
  private readonly BOUNCE_DURATION = 0.3;   // 回弹时长
  private readonly BOUNCE_OVERSHOOT = 12;   // 回弹幅度（像素）
  private readonly STOP_INTERVAL_BASE = 0.5; // 错峰停轮基础间隔
  private readonly STOP_INTERVAL_RAND = 0.2; // 错峰随机范围

  constructor(
    private onBalanceChange: (v: number) => void,
    private onWin: (v: number) => void,
    private onSpinningChange: (v: boolean) => void,
    private getBet: () => number,
    private registerSpin: (fn: () => boolean) => void
  ) {
    super('SlotScene');
  }

  create() {
    this.createBackground();
    this.createTitle();
    this.createReelFrame();
    this.createReels();
    this.createCoinParticles();
    this.lineFx = this.add.graphics();

    this.onBalanceChange(this.balance);
    this.onSpinningChange(false);
    this.registerSpin(() => this.spin());
  }

  private createBackground() {
    // 深红渐变背景
    const g = this.add.graphics();
    for (let i = 0; i < this.GAME_H; i++) {
      const t = i / this.GAME_H;
      const r = Math.floor(Phaser.Math.Linear(0x1a, 0x0d, t));
      const gr = Math.floor(Phaser.Math.Linear(0x0a, 0x05, t));
      const b = Math.floor(Phaser.Math.Linear(0x0a, 0x05, t));
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, i, this.GAME_W, 1);
    }

    // 装饰性图案 - 顶部和底部金色边条
    this.add.rectangle(this.GAME_W / 2, 25, this.GAME_W - 40, 4, COLORS.gold, 0.6);
    this.add.rectangle(this.GAME_W / 2, this.GAME_H - 25, this.GAME_W - 40, 4, COLORS.gold, 0.6);

    // 角落装饰
    this.drawCornerOrnament(30, 30, 1, 1);
    this.drawCornerOrnament(this.GAME_W - 30, 30, -1, 1);
    this.drawCornerOrnament(30, this.GAME_H - 30, 1, -1);
    this.drawCornerOrnament(this.GAME_W - 30, this.GAME_H - 30, -1, -1);
  }

  private drawCornerOrnament(x: number, y: number, sx: number, sy: number) {
    const g = this.add.graphics();
    g.lineStyle(2, COLORS.gold, 0.7);
    g.beginPath();
    g.moveTo(x, y + sy * 20);
    g.lineTo(x, y);
    g.lineTo(x + sx * 20, y);
    g.strokePath();
  }

  private createTitle() {
    // 标题背景装饰
    const titleBg = this.add.graphics();
    titleBg.fillStyle(COLORS.redDark, 0.8);
    titleBg.fillRoundedRect(70, 100, 400, 80, 12);
    titleBg.lineStyle(3, COLORS.gold, 0.9);
    titleBg.strokeRoundedRect(70, 100, 400, 80, 12);

    // 主标题
    this.add.text(this.GAME_W / 2, 125, '🐂 TORO SLOTS 🐂', {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      stroke: '#8b0000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // 副标题
    this.add.text(this.GAME_W / 2, 158, '¡Olé! Fortune Awaits', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#fff8dc',
    }).setOrigin(0.5);
  }

  private createReelFrame() {
    const frameX = 50;
    const frameY = this.REEL_TOP - 60;
    const frameW = 440;
    const frameH = 300;

    // 外框阴影
    this.add.rectangle(frameX + frameW / 2 + 4, frameY + frameH / 2 + 4, frameW, frameH, 0x000000, 0.5)
      .setOrigin(0.5);

    // 主框架 - 深红木质感
    const frame = this.add.graphics();
    frame.fillStyle(COLORS.bgMid, 1);
    frame.fillRoundedRect(frameX, frameY, frameW, frameH, 16);

    // 金色边框
    frame.lineStyle(4, COLORS.gold, 1);
    frame.strokeRoundedRect(frameX, frameY, frameW, frameH, 16);

    // 内边框
    frame.lineStyle(2, COLORS.goldDark, 0.6);
    frame.strokeRoundedRect(frameX + 8, frameY + 8, frameW - 16, frameH - 16, 12);

    // 轮盘区域背景
    const reelBg = this.add.graphics();
    reelBg.fillStyle(0x0d0505, 1);
    reelBg.fillRoundedRect(frameX + 15, frameY + 15, frameW - 30, frameH - 30, 8);

    // 中奖线指示器
    const lineY = this.REEL_TOP + this.SYMBOL_SIZE;
    this.add.rectangle(frameX + 8, lineY, 8, 60, COLORS.gold, 0.8);
    this.add.rectangle(frameX + frameW - 8, lineY, 8, 60, COLORS.gold, 0.8);
  }

  private createReels() {
    const maskG = this.add.graphics();
    maskG.fillStyle(0xffffff);
    maskG.fillRect(65, this.REEL_TOP - 45, 410, 250);
    const mask = maskG.createGeometryMask();
    maskG.setVisible(false);

    for (let col = 0; col < this.REEL_COUNT; col++) {
      const container = this.add.container(this.REEL_START_X + col * this.REEL_SPACING, 0);
      container.setMask(mask);
      this.reels[col] = container;
      this.reelSymbols[col] = [];

      // 创建足够多的符号用于滚动（增加数量确保连续可见）
      for (let i = 0; i < this.VISIBLE_SYMBOLS; i++) {
        const y = this.REEL_TOP - this.SYMBOL_SIZE * 2 + i * this.SYMBOL_SIZE;
        const symbol = this.add.text(0, y, this.randomSymbol(), {
          fontSize: '56px',
        }).setOrigin(0.5);
        container.add(symbol);
        this.reelSymbols[col].push(symbol);
      }
    }
  }

  private createCoinParticles() {
    const coinG = this.add.graphics();
    coinG.fillStyle(COLORS.gold, 1);
    coinG.fillCircle(10, 10, 10);
    coinG.fillStyle(0xffec8b, 1);
    coinG.fillCircle(7, 7, 4);
    coinG.generateTexture('coin', 20, 20);
    coinG.destroy();

    this.coinEmitter = this.add.particles(this.GAME_W / 2, 200, 'coin', {
      speed: { min: 150, max: 400 },
      angle: { min: 60, max: 120 },
      scale: { start: 1, end: 0.3 },
      alpha: { start: 1, end: 0.5 },
      lifespan: 2000,
      gravityY: 300,
      quantity: 0,
      emitting: false,
    });
  }

  private randomSymbol(): string {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  // 预生成符号队列，避免滚动时随机生成
  private prepareSymbolQueue(col: number) {
    // 生成足够多的符号（约50个，足够整个滚动过程）
    this.symbolQueue[col] = [];
    for (let i = 0; i < 50; i++) {
      this.symbolQueue[col].push(this.randomSymbol());
    }
    this.queueIndex[col] = 0;
  }

  private getNextSymbol(col: number): string {
    const queue = this.symbolQueue[col];
    if (this.queueIndex[col] >= queue.length) {
      // 队列用完，追加更多
      for (let i = 0; i < 20; i++) {
        queue.push(this.randomSymbol());
      }
    }
    return queue[this.queueIndex[col]++];
  }

  // 缓动函数：快速启动的加速曲线（easeOutQuad）
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  // 缓动函数：平滑减速曲线（easeOutCubic - 更自然的惯性感）
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  // 弹性缓动：停轮回弹（轻微弹跳）
  private easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;

    for (let col = 0; col < this.REEL_COUNT; col++) {
      const phase = this.reelPhase[col];
      if (phase === 'idle') continue;

      if (phase === 'accel') {
        // 加速阶段 - 快速启动
        this.accelProgress[col] += dt / this.ACCEL_DURATION;
        const t = Math.min(this.accelProgress[col], 1);
        const eased = this.easeOutQuad(t);
        this.reelSpeed[col] = this.MAX_SPEED * eased;

        if (t >= 1) {
          this.reelPhase[col] = 'spinning';
          this.reelSpeed[col] = this.MAX_SPEED;
        }
        this.updateReelScroll(col, dt);
      } else if (phase === 'spinning') {
        // 匀速阶段 - 稳定滚动
        this.reelStopDelay[col] -= dt;
        if (this.reelStopDelay[col] <= 0) {
          this.reelPhase[col] = 'decel';
          this.accelProgress[col] = 0;
        }
        this.updateReelScroll(col, dt);
      } else if (phase === 'decel') {
        // 减速阶段 - 惯性减速
        this.accelProgress[col] += dt / this.DECEL_DURATION;
        const t = Math.min(this.accelProgress[col], 1);
        // 使用 easeOutCubic 让减速更有惯性感
        const eased = this.easeOutCubic(t);
        this.reelSpeed[col] = this.MAX_SPEED * (1 - eased);

        this.updateReelScroll(col, dt);

        if (t >= 1) {
          this.reelSpeed[col] = 0;
          this.snapToFinal(col);
          this.reelPhase[col] = 'bounce';
          this.bounceProgress[col] = 0;
        }
      } else if (phase === 'bounce') {
        // 回弹阶段 - 轻微弹跳
        this.bounceProgress[col] += dt;
        const t = Math.min(this.bounceProgress[col] / this.BOUNCE_DURATION, 1);
        // 使用 easeOutBack 实现轻微回弹
        const bounce = this.easeOutBack(t);
        
        // 应用弹跳偏移（先向下过冲，再回弹）
        const bounceOffset = (1 - bounce) * this.BOUNCE_OVERSHOOT;
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
    // 向下滚动（y 增加）
    this.reelOffset[col] += this.reelSpeed[col] * dt;
    const symbols = this.reelSymbols[col];

    // 循环滚动 - 当偏移超过一个符号高度时，回收顶部符号到底部
    while (this.reelOffset[col] >= this.SYMBOL_SIZE) {
      this.reelOffset[col] -= this.SYMBOL_SIZE;
      // 将顶部符号移到底部，使用预生成的符号
      const topSymbol = symbols.shift()!;
      topSymbol.setText(this.getNextSymbol(col));
      symbols.push(topSymbol);
    }

    // 更新所有符号位置 - 保持完全可见，不做透明度变化
    for (let i = 0; i < symbols.length; i++) {
      const baseY = this.REEL_TOP - this.SYMBOL_SIZE * 2 + i * this.SYMBOL_SIZE;
      symbols[i].setY(baseY + this.reelOffset[col]);
      // 保持符号完全可见，不改变透明度和缩放
      symbols[i].setAlpha(1);
      symbols[i].setScale(1);
    }
  }

  private snapToFinal(col: number) {
    const symbols = this.reelSymbols[col];
    this.reelOffset[col] = 0;

    // 设置最终符号（中间3行是可见的结果）
    for (let i = 0; i < symbols.length; i++) {
      const row = i - 2; // 调整索引，使 row 0-2 对应可见区域
      if (row >= 0 && row < this.ROW_COUNT) {
        symbols[i].setText(this.reelFinal[col][row]);
      } else {
        symbols[i].setText(this.randomSymbol());
      }
      symbols[i].setY(this.REEL_TOP - this.SYMBOL_SIZE * 2 + i * this.SYMBOL_SIZE);
      symbols[i].setAlpha(1);
      symbols[i].setScale(1);
    }
  }

  private applyBounceOffset(col: number, offset: number) {
    const symbols = this.reelSymbols[col];
    for (let i = 0; i < symbols.length; i++) {
      const baseY = this.REEL_TOP - this.SYMBOL_SIZE * 2 + i * this.SYMBOL_SIZE;
      symbols[i].setY(baseY + offset);
    }
  }

  private checkAllStopped() {
    if (this.reelPhase.every(p => p === 'idle')) {
      this.settle();
    }
  }

  private spin(): boolean {
    if (this.spinning) return false;
    const bet = this.getBet();
    if (this.balance < bet) return false;

    this.spinning = true;
    this.onSpinningChange(true);
    this.lineFx?.clear();

    this.balance -= bet;
    this.onBalanceChange(this.balance);
    this.onWin(0);

    // 生成最终结果
    this.reelFinal = Array.from({ length: this.REEL_COUNT }, () =>
      Array.from({ length: this.ROW_COUNT }, () => this.randomSymbol())
    );

    // 为每列预生成符号队列
    for (let col = 0; col < this.REEL_COUNT; col++) {
      this.prepareSymbolQueue(col);
    }

    // 错峰启动和停止 - 明显的节奏差异
    for (let col = 0; col < this.REEL_COUNT; col++) {
      this.reelSpeed[col] = 0;
      this.reelPhase[col] = 'accel';
      this.reelOffset[col] = 0;
      this.accelProgress[col] = 0;
      // 错峰停止延迟：基础时间 + 列索引递增 + 随机抖动
      // 第一列最先停，第三列最后停
      this.reelStopDelay[col] = this.SPIN_MIN_TIME + 
        col * this.STOP_INTERVAL_BASE + 
        Math.random() * this.STOP_INTERVAL_RAND;
    }

    return true;
  }

  private settle() {
    const bet = this.getBet();
    const g = this.reelFinal;

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
        totalWin += bet * (2 + multiplier);
        hitLines.push(idx);

        if ('row' in line && typeof line.row === 'number') {
          for (let c = 0; c < 3; c++) hitSymbols.push({ col: c, row: line.row });
        } else if (line.diagonal === 'down') {
          hitSymbols.push({ col: 0, row: 0 }, { col: 1, row: 1 }, { col: 2, row: 2 });
        } else if (line.diagonal === 'up') {
          hitSymbols.push({ col: 0, row: 2 }, { col: 1, row: 1 }, { col: 2, row: 0 });
        }
      }
    });

    const win = Math.round(totalWin);

    if (win > 0) {
      this.animateWin(hitSymbols, win);
      this.drawWinLines(hitLines);

      if (hitLines.length >= 2) {
        this.triggerBigWin();
      }

      this.time.delayedCall(1500, () => {
        this.balance += win;
        this.onBalanceChange(this.balance);
        this.onWin(win);
        this.spinning = false;
        this.onSpinningChange(false);
      });
    } else {
      this.showNoWin();
      this.spinning = false;
      this.onSpinningChange(false);
    }
  }

  private animateWin(symbols: { col: number; row: number }[], amount: number) {
    // 中奖符号动画
    const unique = symbols.filter((s, i, arr) =>
      arr.findIndex(x => x.col === s.col && x.row === s.row) === i
    );

    unique.forEach((pos, idx) => {
      // 调整索引以匹配新的符号数组布局
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

    // 中奖金额显示
    const winText = this.add.text(this.GAME_W / 2, 240, '', {
      fontSize: '42px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      stroke: '#8b0000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0,
      to: amount,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => winText.setText(`¡GANASTE +${Math.round(tween.getValue() ?? 0)}!`),
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: winText,
            alpha: 0,
            y: 200,
            duration: 500,
            onComplete: () => winText.destroy(),
          });
        });
      },
    });
  }

  private drawWinLines(hitLines: number[]) {
    if (!this.lineFx) return;

    const lineCoords = [
      [[80, this.REEL_TOP + this.SYMBOL_SIZE], [460, this.REEL_TOP + this.SYMBOL_SIZE]],
      [[80, this.REEL_TOP], [460, this.REEL_TOP]],
      [[80, this.REEL_TOP + this.SYMBOL_SIZE * 2], [460, this.REEL_TOP + this.SYMBOL_SIZE * 2]],
      [[80, this.REEL_TOP], [460, this.REEL_TOP + this.SYMBOL_SIZE * 2]],
      [[80, this.REEL_TOP + this.SYMBOL_SIZE * 2], [460, this.REEL_TOP]],
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
          onComplete: () => {
            this.time.delayedCall(1000, () => {
              this.tweens.add({
                targets: line,
                alpha: 0,
                duration: 300,
                onComplete: () => line.destroy(),
              });
            });
          },
        });
      });
    });
  }

  private triggerBigWin() {
    this.cameras.main.flash(300, 255, 215, 0);

    if (this.coinEmitter) {
      this.coinEmitter.explode(60);
      this.time.delayedCall(200, () => this.coinEmitter?.explode(40));
    }

    const bigWinText = this.add.text(this.GAME_W / 2, 300, '🎉 ¡GRANDE! 🎉', {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      stroke: '#8b0000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: bigWinText,
      scale: 1.2,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({
            targets: bigWinText,
            alpha: 0,
            duration: 400,
            onComplete: () => bigWinText.destroy(),
          });
        });
      },
    });
  }

  private showNoWin() {
    const text = this.add.text(this.GAME_W / 2, 240, '¡Otra vez!', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#c8d2e8',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      alpha: 0,
      duration: 800,
      delay: 500,
      onComplete: () => text.destroy(),
    });
  }
}
