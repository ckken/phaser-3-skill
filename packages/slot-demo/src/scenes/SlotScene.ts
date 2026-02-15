import Phaser from 'phaser';

const SYMBOLS = ['🍒', '🍋', '⭐', '7', '🔔', '💎', '🍉', '🍀'];

const SYMBOL_MULTIPLIER: Record<string, number> = {
  '💎': 5, '7': 4, '⭐': 3, '🔔': 2.5, '🍀': 2, '🍉': 1.5, '🍋': 1.2, '🍒': 1
};

export class SlotScene extends Phaser.Scene {
  private reels: Phaser.GameObjects.Text[][] = [];
  private balance = 1000;
  private spinning = false;
  private lineFx?: Phaser.GameObjects.Graphics;
  private coinEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  private colsX = [170, 270, 370];
  private rowsY = [330, 430, 530];
  private rowStep = 90;
  private reelBottom = 660;
  private reelTop = -60;

  private reelSpeed = [0, 0, 0];
  private reelPhase: ('idle' | 'spinning' | 'stopping' | 'bouncing')[] = ['idle', 'idle', 'idle'];
  private reelFinal: string[][] = [[], [], []];
  private reelBounceTime = [0, 0, 0];
  private reelTargetY: number[][] = [[], [], []];

  // 滚动速度调慢
  private baseSpeed = 650;
  private speedVariance = 50;

  private blurOverlays: Phaser.GameObjects.Rectangle[] = [];

  // Phase 4: 视觉元素
  private frameGlow?: Phaser.GameObjects.Graphics;
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private neonAlpha = 0.5;

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
    // Phase 4: 渐变背景
    this.createGradientBackground();

    // Phase 4: 背景粒子
    this.createBackgroundParticles();

    // Phase 4: 金属质感外框
    this.createMetalFrame();

    // 遮罩区域
    const maskRect = this.add.rectangle(270, 430, 400, 320, 0xffffff, 1);
    const reelMask = maskRect.createGeometryMask();

    const reelCount = 8;
    for (let c = 0; c < 3; c++) {
      this.reels[c] = [];
      for (let i = 0; i < reelCount; i++) {
        const y = this.reelTop + i * this.rowStep;
        const t = this.add.text(this.colsX[c], y, this.randomSymbol(), { fontSize: '54px' }).setOrigin(0.5);
        t.setMask(reelMask);
        this.reels[c][i] = t;
      }

      const blur = this.add.rectangle(this.colsX[c], 430, 80, 300, 0xffffff, 0.08);
      blur.setMask(reelMask);
      blur.setVisible(false);
      this.blurOverlays[c] = blur;
    }

    maskRect.destroy();
    this.lineFx = this.add.graphics();
    this.createCoinParticles();

    this.onBalanceChange(this.balance);
    this.onSpinningChange(false);
    this.registerSpin(() => this.spin());
  }

  private createGradientBackground() {
    const g = this.add.graphics();
    const w = 540, h = 860;
    for (let i = 0; i < h; i++) {
      const t = i / h;
      const r = Math.floor(Phaser.Math.Linear(0x08, 0x1a, t));
      const gr = Math.floor(Phaser.Math.Linear(0x0a, 0x0f, t));
      const b = Math.floor(Phaser.Math.Linear(0x20, 0x35, t));
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, i, w, 1);
    }
  }

  private createBackgroundParticles() {
    // 禁用背景粒子，减少闪屏
  }

  private createMetalFrame() {
    // 外框阴影
    this.add.rectangle(274, 434, 430, 370, 0x000000, 0.5);

    // 金属外框
    const frame = this.add.graphics();
    frame.fillStyle(0x2a2a3a, 1);
    frame.fillRoundedRect(55, 245, 430, 370, 12);

    // 金属高光
    frame.fillStyle(0x4a4a5a, 1);
    frame.fillRoundedRect(58, 248, 424, 8, 4);

    // 内框
    frame.fillStyle(0x0b0f1a, 1);
    frame.fillRoundedRect(65, 260, 410, 340, 8);

    // 霓虹发光层（静态绘制一次）
    this.frameGlow = this.add.graphics();
    this.drawStaticNeonGlow();

    // 内部高亮边框
    this.add.rectangle(270, 430, 406, 106, 0xffffff, 0.05).setStrokeStyle(2, 0x6ef2ff, 0.6);
  }

  private updateNeonGlow(_time: number) {
    // 静态霓虹，不再每帧重绘
  }

  private drawStaticNeonGlow() {
    if (!this.frameGlow) return;
    this.frameGlow.clear();

    const alpha = this.neonAlpha;

    this.frameGlow.lineStyle(6, 0x6ef2ff, alpha * 0.25);
    this.frameGlow.strokeRoundedRect(55, 245, 430, 370, 12);

    this.frameGlow.lineStyle(3, 0x6ef2ff, alpha * 0.5);
    this.frameGlow.strokeRoundedRect(57, 247, 426, 366, 11);

    this.frameGlow.lineStyle(1.5, 0xaef8ff, alpha * 0.8);
    this.frameGlow.strokeRoundedRect(59, 249, 422, 362, 10);
  }

  private createCoinParticles() {
    const coinG = this.add.graphics();
    coinG.fillStyle(0xffd700, 1);
    coinG.fillCircle(8, 8, 8);
    coinG.fillStyle(0xffec8b, 1);
    coinG.fillCircle(6, 6, 3);
    coinG.generateTexture('coin', 16, 16);
    coinG.destroy();

    this.coinEmitter = this.add.particles(270, -20, 'coin', {
      speed: { min: 100, max: 300 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.8, end: 0.3 },
      alpha: { start: 1, end: 0.6 },
      lifespan: 2500,
      gravityY: 200,
      quantity: 0,
      emitting: false
    });
  }

  update(_time: number, delta: number) {
    // 移除霓虹灯动画，减少闪屏
    const dt = delta / 1000;

    for (let col = 0; col < 3; col++) {
      const phase = this.reelPhase[col];

      if (phase === 'idle') {
        this.blurOverlays[col].setVisible(false);
        continue;
      }

      this.blurOverlays[col].setVisible(phase === 'spinning');
      this.blurOverlays[col].setAlpha(Math.min(this.reelSpeed[col] / 1500, 0.15));

      if (phase === 'spinning') {
        for (const t of this.reels[col]) {
          t.y += this.reelSpeed[col] * dt;
          // 平滑循环：提前重置位置，避免跳变
          if (t.y > this.reelBottom - 20) {
            t.y = this.reelTop + (t.y - this.reelBottom);
            t.setText(this.randomSymbol());
          }
          const d = Math.abs(t.y - this.rowsY[1]);
          t.setScale(d < 30 ? 1.06 : 0.95);
          t.setAlpha(d < 30 ? 1 : 0.75);
        }
      } else if (phase === 'stopping') {
        const decel = 1400 + col * 120;
        this.reelSpeed[col] = Math.max(0, this.reelSpeed[col] - decel * dt);

        for (const t of this.reels[col]) {
          t.y += this.reelSpeed[col] * dt;
          if (t.y > this.reelBottom - 20) {
            t.y = this.reelTop + (t.y - this.reelBottom);
            t.setText(this.randomSymbol());
          }
          const d = Math.abs(t.y - this.rowsY[1]);
          const slowFactor = 1 - (this.reelSpeed[col] / 800);
          t.setScale(Phaser.Math.Linear(0.95, d < 30 ? 1.08 : 0.96, slowFactor));
          t.setAlpha(Phaser.Math.Linear(0.75, d < 30 ? 1 : 0.8, slowFactor));
        }

        if (this.reelSpeed[col] <= 80) {
          this.reelSpeed[col] = 0;
          this.prepareBounceLock(col);
          this.reelPhase[col] = 'bouncing';
          this.reelBounceTime[col] = 0;
        }
      } else if (phase === 'bouncing') {
        this.reelBounceTime[col] += dt;
        const t = this.reelBounceTime[col];
        const duration = 0.25;

        if (t >= duration) {
          this.finalizeBounce(col);
          this.reelPhase[col] = 'idle';
          this.blurOverlays[col].setVisible(false);
        } else {
          const progress = t / duration;
          const bounce = this.easeOutBack(progress, 1.3);
          for (let r = 0; r < 3; r++) {
            const targetY = this.reelTargetY[col][r];
            const startY = targetY + 25;
            this.reels[col][r + 2].setY(Phaser.Math.Linear(startY, targetY, bounce));
          }
        }
      }
    }
  }

  private easeOutBack(x: number, overshoot: number): number {
    const c1 = overshoot;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  private randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
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

    this.reelSpeed = [this.baseSpeed, this.baseSpeed + this.speedVariance, this.baseSpeed + this.speedVariance * 2];
    this.reelPhase = ['spinning', 'spinning', 'spinning'];
    this.reelFinal = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => this.randomSymbol())
    );

    this.time.delayedCall(1200, () => { this.reelPhase[0] = 'stopping'; });
    this.time.delayedCall(1550, () => { this.reelPhase[1] = 'stopping'; });
    this.time.delayedCall(1900, () => { this.reelPhase[2] = 'stopping'; });
    this.time.delayedCall(2800, () => this.settle(bet));
    return true;
  }

  private prepareBounceLock(col: number) {
    const arr = this.reels[col];
    arr.sort((a, b) => a.y - b.y);

    for (let r = 0; r < 3; r++) {
      this.reelTargetY[col][r] = this.rowsY[r];
      arr[r + 2].setText(this.reelFinal[col][r]);
    }

    arr[0].setY(this.rowsY[0] - 2 * this.rowStep).setText(this.randomSymbol());
    arr[1].setY(this.rowsY[0] - 1 * this.rowStep).setText(this.randomSymbol());
    arr[5].setY(this.rowsY[2] + 1 * this.rowStep).setText(this.randomSymbol());
    arr[6].setY(this.rowsY[2] + 2 * this.rowStep).setText(this.randomSymbol());
    arr[7].setY(this.rowsY[2] + 3 * this.rowStep).setText(this.randomSymbol());
  }

  private finalizeBounce(col: number) {
    const arr = this.reels[col];
    arr.sort((a, b) => a.y - b.y);

    for (let r = 0; r < 3; r++) {
      arr[r + 2].setY(this.rowsY[r]);
      arr[r + 2].setScale(r === 1 ? 1.1 : 0.96);
      arr[r + 2].setAlpha(r === 1 ? 1 : 0.78);
    }
  }

  private settle(bet: number) {
    const g = this.reelFinal;
    const lines = [
      { cells: [g[0][1], g[1][1], g[2][1]], draw: [[this.colsX[0], this.rowsY[1]], [this.colsX[2], this.rowsY[1]]], row: 1 },
      { cells: [g[0][0], g[1][0], g[2][0]], draw: [[this.colsX[0], this.rowsY[0]], [this.colsX[2], this.rowsY[0]]], row: 0 },
      { cells: [g[0][2], g[1][2], g[2][2]], draw: [[this.colsX[0], this.rowsY[2]], [this.colsX[2], this.rowsY[2]]], row: 2 },
      { cells: [g[0][0], g[1][1], g[2][2]], draw: [[this.colsX[0], this.rowsY[0]], [this.colsX[2], this.rowsY[2]]], diagonal: 'down' },
      { cells: [g[0][2], g[1][1], g[2][0]], draw: [[this.colsX[0], this.rowsY[2]], [this.colsX[2], this.rowsY[0]]], diagonal: 'up' }
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
      this.animateWinningSymbols(hitSymbols);
      this.animateWinLines(hitLines, lines);
      this.animateWinAmount(win);

      if (hitLines.length >= 3) this.triggerJackpotEffect();

      this.cameras.main.flash(220, 255, 244, 180);

      this.time.delayedCall(1500, () => {
        this.balance += win;
        this.onBalanceChange(this.balance);
        this.onWin(win);
      });
    } else {
      const miss = this.add.text(270, 220, '未中奖', { fontSize: '30px', color: '#c8d2e8' }).setOrigin(0.5);
      this.tweens.add({ targets: miss, alpha: 0, duration: 520, onComplete: () => miss.destroy() });
      this.onWin(0);
    }

    this.spinning = false;
    this.onSpinningChange(false);
  }

  private animateWinningSymbols(symbols: { col: number; row: number }[]) {
    const unique = symbols.filter((s, i, arr) => arr.findIndex(x => x.col === s.col && x.row === s.row) === i);

    unique.forEach((pos, index) => {
      const arr = this.reels[pos.col];
      arr.sort((a, b) => a.y - b.y);
      const symbol = arr[pos.row + 2];

      this.time.delayedCall(index * 120, () => {
        this.tweens.add({
          targets: symbol,
          scale: 1.4,
          duration: 150,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut',
          onStart: () => symbol.setTint(0xffff00),
          onComplete: () => {
            symbol.clearTint();
            symbol.setScale(pos.row === 1 ? 1.1 : 0.96);
          }
        });
      });
    });
  }

  private animateWinLines(hitLines: number[], lines: Array<{ draw: number[][] }>) {
    if (!this.lineFx) return;

    hitLines.forEach((idx, i) => {
      this.time.delayedCall(i * 200, () => {
        const [[x1, y1], [x2, y2]] = lines[idx].draw;
        const sweepLine = this.add.graphics();

        this.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 300,
          ease: 'Sine.easeOut',
          onUpdate: (tween) => {
            const progress = tween.getValue();
            sweepLine.clear();
            sweepLine.lineStyle(6, 0x6ef2ff, 0.9);
            sweepLine.beginPath();
            sweepLine.moveTo(x1, y1);
            sweepLine.lineTo(Phaser.Math.Linear(x1, x2, progress), Phaser.Math.Linear(y1, y2, progress));
            sweepLine.strokePath();

            sweepLine.lineStyle(12, 0x6ef2ff, 0.3);
            sweepLine.beginPath();
            sweepLine.moveTo(x1, y1);
            sweepLine.lineTo(Phaser.Math.Linear(x1, x2, progress), Phaser.Math.Linear(y1, y2, progress));
            sweepLine.strokePath();
          },
          onComplete: () => {
            this.time.delayedCall(800, () => {
              this.tweens.add({
                targets: sweepLine,
                alpha: 0,
                duration: 300,
                onComplete: () => sweepLine.destroy()
              });
            });
          }
        });
      });
    });
  }

  private animateWinAmount(finalAmount: number) {
    const winText = this.add.text(270, 200, '中奖 +0', {
      fontSize: '48px',
      color: '#ffe08a',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0,
      to: finalAmount,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => winText.setText(`中奖 +${Math.round(tween.getValue())}`),
      onComplete: () => {
        this.tweens.add({ targets: winText, scale: 1.2, duration: 150, yoyo: true, repeat: 1, ease: 'Bounce.easeOut' });
        this.time.delayedCall(1000, () => {
          this.tweens.add({ targets: winText, y: 150, alpha: 0, scale: 1.1, duration: 600, onComplete: () => winText.destroy() });
        });
      }
    });
  }

  private triggerJackpotEffect() {
    this.cameras.main.flash(400, 255, 215, 0);

    if (this.coinEmitter) {
      this.coinEmitter.setPosition(270, 100);
      this.coinEmitter.explode(80);
      this.time.delayedCall(200, () => { this.coinEmitter?.setPosition(150, 150); this.coinEmitter?.explode(40); });
      this.time.delayedCall(400, () => { this.coinEmitter?.setPosition(390, 150); this.coinEmitter?.explode(40); });
    }

    const jackpotText = this.add.text(270, 120, '🎉 大奖 🎉', {
      fontSize: '36px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#8b4513',
      strokeThickness: 4
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: jackpotText,
      scale: 1.3,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: jackpotText, scale: 1.1, duration: 200, yoyo: true, repeat: 3 });
        this.time.delayedCall(2000, () => {
          this.tweens.add({ targets: jackpotText, alpha: 0, y: 80, duration: 500, onComplete: () => jackpotText.destroy() });
        });
      }
    });
  }
}
