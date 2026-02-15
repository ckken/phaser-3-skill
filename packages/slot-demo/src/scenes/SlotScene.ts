import Phaser from 'phaser';

const SYMBOLS = ['🍒', '🍋', '⭐', '7', '🔔', '💎', '🍉', '🍀'];

// 符号赔率
const SYMBOL_MULTIPLIER: Record<string, number> = {
  '💎': 5,
  '7': 4,
  '⭐': 3,
  '🔔': 2.5,
  '🍀': 2,
  '🍉': 1.5,
  '🍋': 1.2,
  '🍒': 1
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

  // Phase 1: 模糊效果
  private blurOverlays: Phaser.GameObjects.Rectangle[] = [];

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
    // machine frame
    this.add.rectangle(270, 430, 420, 360, 0x0b0f1a, 0.95).setStrokeStyle(2, 0xffffff, 0.18);
    this.add.rectangle(270, 430, 406, 106, 0xffffff, 0.07).setStrokeStyle(2, 0x6ef2ff, 0.55);

    // mask area so "from top to bottom" feels like a real reel window
    const maskRect = this.add.rectangle(270, 430, 400, 320, 0xffffff, 1);
    const reelMask = maskRect.createGeometryMask();

    const reelCount = 8;

    for (let c = 0; c < 3; c++) {
      this.reels[c] = [];
      for (let i = 0; i < reelCount; i++) {
        const y = this.reelTop + i * this.rowStep;
        const t = this.add
          .text(this.colsX[c], y, this.randomSymbol(), {
            fontSize: '54px'
          })
          .setOrigin(0.5);
        t.setMask(reelMask);
        this.reels[c][i] = t;
      }

      // Phase 1: 模糊遮罩（滚动时显示）
      const blur = this.add.rectangle(this.colsX[c], 430, 80, 300, 0xffffff, 0.08);
      blur.setMask(reelMask);
      blur.setVisible(false);
      this.blurOverlays[c] = blur;
    }

    maskRect.destroy();

    this.lineFx = this.add.graphics();

    // Phase 2: 金币粒子系统
    this.createCoinParticles();

    this.onBalanceChange(this.balance);
    this.onSpinningChange(false);
    this.registerSpin(() => this.spin());
  }

  private createCoinParticles() {
    // 创建金币纹理
    const coinGraphics = this.add.graphics();
    coinGraphics.fillStyle(0xffd700, 1);
    coinGraphics.fillCircle(8, 8, 8);
    coinGraphics.fillStyle(0xffec8b, 1);
    coinGraphics.fillCircle(6, 6, 3);
    coinGraphics.generateTexture('coin', 16, 16);
    coinGraphics.destroy();

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
    const dt = delta / 1000;

    for (let col = 0; col < 3; col++) {
      const phase = this.reelPhase[col];

      if (phase === 'idle') {
        this.blurOverlays[col].setVisible(false);
        continue;
      }

      // Phase 1: 显示模糊效果
      this.blurOverlays[col].setVisible(phase === 'spinning');
      this.blurOverlays[col].setAlpha(Math.min(this.reelSpeed[col] / 1500, 0.15));

      if (phase === 'spinning') {
        // 正常高速滚动
        for (const t of this.reels[col]) {
          t.y += this.reelSpeed[col] * dt;

          if (t.y > this.reelBottom) {
            t.y -= (this.reelBottom - this.reelTop + this.rowStep);
            t.setText(this.randomSymbol());
          }

          const d = Math.abs(t.y - this.rowsY[1]);
          t.setScale(d < 20 ? 1.08 : 0.94);
          t.setAlpha(d < 20 ? 1 : 0.7);
        }
      } else if (phase === 'stopping') {
        // Phase 1: easeOut 减速
        const decel = 2200 + col * 200;
        this.reelSpeed[col] = Math.max(0, this.reelSpeed[col] - decel * dt);

        for (const t of this.reels[col]) {
          t.y += this.reelSpeed[col] * dt;

          if (t.y > this.reelBottom) {
            t.y -= (this.reelBottom - this.reelTop + this.rowStep);
            t.setText(this.randomSymbol());
          }

          const d = Math.abs(t.y - this.rowsY[1]);
          const slowFactor = 1 - (this.reelSpeed[col] / 1200);
          t.setScale(Phaser.Math.Linear(0.94, d < 20 ? 1.1 : 0.96, slowFactor));
          t.setAlpha(Phaser.Math.Linear(0.7, d < 20 ? 1 : 0.78, slowFactor));
        }

        // 速度足够慢时进入弹跳阶段
        if (this.reelSpeed[col] <= 80) {
          this.reelSpeed[col] = 0;
          this.prepareBounceLock(col);
          this.reelPhase[col] = 'bouncing';
          this.reelBounceTime[col] = 0;
          console.log(`[音效] 轮${col + 1}停止 - click`);
        }
      } else if (phase === 'bouncing') {
        // Phase 1: 微弹回弹效果
        this.reelBounceTime[col] += dt;
        const t = this.reelBounceTime[col];
        const duration = 0.25;

        if (t >= duration) {
          // 弹跳结束，锁定最终位置
          this.finalizeBounce(col);
          this.reelPhase[col] = 'idle';
          this.blurOverlays[col].setVisible(false);
        } else {
          // overshoot 弹跳曲线
          const progress = t / duration;
          const overshoot = 1.3;
          const bounce = this.easeOutBack(progress, overshoot);

          for (let r = 0; r < 3; r++) {
            const targetY = this.reelTargetY[col][r];
            const startY = targetY + 25; // 从下方 25px 开始
            const currentY = Phaser.Math.Linear(startY, targetY, bounce);
            this.reels[col][r + 2].setY(currentY);
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

    console.log('[音效] 开始旋转 - spin_start');

    // initial speed with slight variation
    this.reelSpeed = [1100, 1180, 1260];
    this.reelPhase = ['spinning', 'spinning', 'spinning'];
    this.reelFinal = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => this.randomSymbol())
    );

    // staggered stop signal
    this.time.delayedCall(900, () => {
      this.reelPhase[0] = 'stopping';
      console.log('[音效] 轮1减速 - reel_slow');
    });
    this.time.delayedCall(1200, () => {
      this.reelPhase[1] = 'stopping';
      console.log('[音效] 轮2减速 - reel_slow');
    });
    this.time.delayedCall(1500, () => {
      this.reelPhase[2] = 'stopping';
      console.log('[音效] 轮3减速 - reel_slow');
    });

    // settlement wait
    this.time.delayedCall(2400, () => this.settle(bet));
    return true;
  }

  private prepareBounceLock(col: number) {
    const arr = this.reels[col];
    arr.sort((a, b) => a.y - b.y);

    // 记录目标位置
    for (let r = 0; r < 3; r++) {
      this.reelTargetY[col][r] = this.rowsY[r];
      arr[r + 2].setText(this.reelFinal[col][r]);
    }

    // 设置隐藏符号
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

        // 记录中奖符号位置
        if ('row' in line && typeof line.row === 'number') {
          for (let c = 0; c < 3; c++) {
            hitSymbols.push({ col: c, row: line.row });
          }
        } else if (line.diagonal === 'down') {
          hitSymbols.push({ col: 0, row: 0 }, { col: 1, row: 1 }, { col: 2, row: 2 });
        } else if (line.diagonal === 'up') {
          hitSymbols.push({ col: 0, row: 2 }, { col: 1, row: 1 }, { col: 2, row: 0 });
        }
      }
    });

    const win = Math.round(totalWin);

    if (win > 0) {
      console.log(`[音效] 中奖 ${hitLines.length} 线 - win_${hitLines.length >= 3 ? 'big' : 'small'}`);

      // Phase 2: 中奖符号高亮动画
      this.animateWinningSymbols(hitSymbols);

      // Phase 2: 连线扫光动画
      this.animateWinLines(hitLines, lines);

      // Phase 2: 金额滚动
      this.animateWinAmount(win);

      // Phase 2: 大奖特效（3线以上）
      if (hitLines.length >= 3) {
        this.triggerJackpotEffect();
      }

      this.cameras.main.flash(220, 255, 244, 180);

      // 延迟更新余额，等动画播放
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

  // Phase 2: 中奖符号逐个闪烁放大
  private animateWinningSymbols(symbols: { col: number; row: number }[]) {
    const uniqueSymbols = symbols.filter((s, i, arr) =>
      arr.findIndex(x => x.col === s.col && x.row === s.row) === i
    );

    uniqueSymbols.forEach((pos, index) => {
      const arr = this.reels[pos.col];
      arr.sort((a, b) => a.y - b.y);
      const symbol = arr[pos.row + 2];

      this.time.delayedCall(index * 120, () => {
        // 闪烁放大效果
        this.tweens.add({
          targets: symbol,
          scale: 1.4,
          duration: 150,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut',
          onStart: () => {
            symbol.setTint(0xffff00);
            console.log(`[音效] 符号高亮 - symbol_highlight`);
          },
          onComplete: () => {
            symbol.clearTint();
            symbol.setScale(pos.row === 1 ? 1.1 : 0.96);
          }
        });
      });
    });
  }

  // Phase 2: 连线扫光动画
  private animateWinLines(hitLines: number[], lines: Array<{ draw: number[][] }>) {
    if (!this.lineFx) return;

    hitLines.forEach((idx, i) => {
      this.time.delayedCall(i * 200, () => {
        const [[x1, y1], [x2, y2]] = lines[idx].draw;

        // 创建扫光效果
        const sweepLine = this.add.graphics();
        sweepLine.lineStyle(6, 0x6ef2ff, 1);

        // 动画扫光
        let progress = 0;
        const sweepTween = this.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 300,
          ease: 'Sine.easeOut',
          onUpdate: (tween) => {
            progress = tween.getValue();
            sweepLine.clear();
            sweepLine.lineStyle(6, 0x6ef2ff, 0.9);
            sweepLine.beginPath();
            sweepLine.moveTo(x1, y1);
            sweepLine.lineTo(
              Phaser.Math.Linear(x1, x2, progress),
              Phaser.Math.Linear(y1, y2, progress)
            );
            sweepLine.strokePath();

            // 发光效果
            sweepLine.lineStyle(12, 0x6ef2ff, 0.3);
            sweepLine.beginPath();
            sweepLine.moveTo(x1, y1);
            sweepLine.lineTo(
              Phaser.Math.Linear(x1, x2, progress),
              Phaser.Math.Linear(y1, y2, progress)
            );
            sweepLine.strokePath();
          },
          onComplete: () => {
            // 保持线条显示一段时间后消失
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

        console.log(`[音效] 连线扫光 - line_sweep`);
      });
    });
  }

  // Phase 2: 金额滚动动画
  private animateWinAmount(finalAmount: number) {
    const winText = this.add
      .text(270, 200, '中奖 +0', {
        fontSize: '48px',
        color: '#ffe08a',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
      })
      .setOrigin(0.5);

    // 数字滚动
    this.tweens.addCounter({
      from: 0,
      to: finalAmount,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        const value = Math.round(tween.getValue());
        winText.setText(`中奖 +${value}`);
      },
      onComplete: () => {
        // 最终弹跳效果
        this.tweens.add({
          targets: winText,
          scale: 1.2,
          duration: 150,
          yoyo: true,
          repeat: 1,
          ease: 'Bounce.easeOut'
        });

        // 淡出
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: winText,
            y: 150,
            alpha: 0,
            scale: 1.1,
            duration: 600,
            onComplete: () => winText.destroy()
          });
        });
      }
    });

    console.log(`[音效] 金额滚动 - coin_count`);
  }

  // Phase 2: 大奖全屏金币粒子
  private triggerJackpotEffect() {
    console.log('[音效] 大奖特效 - jackpot');

    // 全屏闪烁
    this.cameras.main.flash(400, 255, 215, 0);

    // 金币粒子爆发
    if (this.coinEmitter) {
      this.coinEmitter.setPosition(270, 100);
      this.coinEmitter.explode(80);

      // 多点爆发
      this.time.delayedCall(200, () => {
        this.coinEmitter?.setPosition(150, 150);
        this.coinEmitter?.explode(40);
      });
      this.time.delayedCall(400, () => {
        this.coinEmitter?.setPosition(390, 150);
        this.coinEmitter?.explode(40);
      });
    }

    // 大奖文字
    const jackpotText = this.add
      .text(270, 120, '🎉 大奖 🎉', {
        fontSize: '36px',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#8b4513',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setScale(0);

    this.tweens.add({
      targets: jackpotText,
      scale: 1.3,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: jackpotText,
          scale: 1.1,
          duration: 200,
          yoyo: true,
          repeat: 3
        });

        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: jackpotText,
            alpha: 0,
            y: 80,
            duration: 500,
            onComplete: () => jackpotText.destroy()
          });
        });
      }
    });
  }
}
