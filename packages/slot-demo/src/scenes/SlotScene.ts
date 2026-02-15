import Phaser from 'phaser';

const SYMBOLS = ['🍒', '🍋', '⭐', '7', '🔔', '💎', '🍉', '🍀'];

export class SlotScene extends Phaser.Scene {
  private reels: Phaser.GameObjects.Text[][] = [];
  private balance = 1000;
  private spinning = false;
  private lineFx?: Phaser.GameObjects.Graphics;

  private colsX = [170, 270, 370];
  private rowsY = [330, 430, 530];
  private rowStep = 90;
  private reelBottom = 660;
  private reelTop = -60;

  private reelSpeed = [0, 0, 0];
  private reelStopping = [false, false, false];
  private reelFinal: string[][] = [[], [], []];

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
    }

    maskRect.destroy();

    this.lineFx = this.add.graphics();

    this.onBalanceChange(this.balance);
    this.onSpinningChange(false);
    this.registerSpin(() => this.spin());
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;

    for (let col = 0; col < 3; col++) {
      if (this.reelSpeed[col] <= 0) continue;

      // deceleration after stop signal
      if (this.reelStopping[col]) {
        this.reelSpeed[col] = Math.max(0, this.reelSpeed[col] - 1800 * dt);
      }

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

      // finish one reel when slow enough
      if (this.reelStopping[col] && this.reelSpeed[col] <= 120) {
        this.reelSpeed[col] = 0;
        this.lockReelToResult(col);
      }
    }
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

    // initial speed
    this.reelSpeed = [980, 1050, 1120];
    this.reelStopping = [false, false, false];
    this.reelFinal = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => this.randomSymbol())
    );

    // staggered stop signal
    this.time.delayedCall(1000, () => (this.reelStopping[0] = true));
    this.time.delayedCall(1350, () => (this.reelStopping[1] = true));
    this.time.delayedCall(1720, () => (this.reelStopping[2] = true));

    // settlement wait
    this.time.delayedCall(2250, () => this.settle(bet));
    return true;
  }

  private lockReelToResult(col: number) {
    const arr = this.reels[col];
    // sort by y so we can place deterministic rows
    arr.sort((a, b) => a.y - b.y);

    // place center 3 visible rows as final result
    const visible = [arr[2], arr[3], arr[4]];
    for (let r = 0; r < 3; r++) {
      visible[r].setY(this.rowsY[r]);
      visible[r].setText(this.reelFinal[col][r]);
      visible[r].setScale(r === 1 ? 1.1 : 0.96);
      visible[r].setAlpha(r === 1 ? 1 : 0.78);
    }

    // place other hidden symbols above/below to keep continuity
    const upper = [arr[0], arr[1]];
    upper[0].setY(this.rowsY[0] - 2 * this.rowStep).setText(this.randomSymbol());
    upper[1].setY(this.rowsY[0] - 1 * this.rowStep).setText(this.randomSymbol());

    const lower = [arr[5], arr[6], arr[7]];
    lower[0].setY(this.rowsY[2] + 1 * this.rowStep).setText(this.randomSymbol());
    lower[1].setY(this.rowsY[2] + 2 * this.rowStep).setText(this.randomSymbol());
    lower[2].setY(this.rowsY[2] + 3 * this.rowStep).setText(this.randomSymbol());
  }

  private settle(bet: number) {
    const g = this.reelFinal;
    const lines = [
      { cells: [g[0][1], g[1][1], g[2][1]], draw: [[this.colsX[0], this.rowsY[1]], [this.colsX[2], this.rowsY[1]]] },
      { cells: [g[0][0], g[1][0], g[2][0]], draw: [[this.colsX[0], this.rowsY[0]], [this.colsX[2], this.rowsY[0]]] },
      { cells: [g[0][2], g[1][2], g[2][2]], draw: [[this.colsX[0], this.rowsY[2]], [this.colsX[2], this.rowsY[2]]] },
      { cells: [g[0][0], g[1][1], g[2][2]], draw: [[this.colsX[0], this.rowsY[0]], [this.colsX[2], this.rowsY[2]]] },
      { cells: [g[0][2], g[1][1], g[2][0]], draw: [[this.colsX[0], this.rowsY[2]], [this.colsX[2], this.rowsY[0]]] }
    ];

    let hits = 0;
    const hitLines: number[] = [];
    lines.forEach((line, idx) => {
      if (line.cells[0] === line.cells[1] && line.cells[1] === line.cells[2]) {
        hits += 1;
        hitLines.push(idx);
      }
    });

    const win = hits > 0 ? bet * (3 + hits * 2) : 0;

    this.balance += win;
    this.onBalanceChange(this.balance);
    this.onWin(win);

    if (win > 0) {
      this.cameras.main.flash(220, 255, 244, 180);
      this.drawHitLines(hitLines, lines);
      const pop = this.add
        .text(270, 220, `中奖 +${win}`, { fontSize: '44px', color: '#ffe08a', fontStyle: 'bold' })
        .setOrigin(0.5);
      this.tweens.add({ targets: pop, y: 170, alpha: 0, scale: 1.14, duration: 900, onComplete: () => pop.destroy() });
    } else {
      const miss = this.add.text(270, 220, '未中奖', { fontSize: '30px', color: '#c8d2e8' }).setOrigin(0.5);
      this.tweens.add({ targets: miss, alpha: 0, duration: 520, onComplete: () => miss.destroy() });
    }

    this.spinning = false;
    this.onSpinningChange(false);
  }

  private drawHitLines(hitLines: number[], lines: Array<{ draw: number[][] }>) {
    if (!this.lineFx) return;
    this.lineFx.clear();
    this.lineFx.lineStyle(5, 0x6ef2ff, 0.9);

    hitLines.forEach((idx) => {
      const [[x1, y1], [x2, y2]] = lines[idx].draw;
      this.lineFx!.beginPath();
      this.lineFx!.moveTo(x1, y1);
      this.lineFx!.lineTo(x2, y2);
      this.lineFx!.strokePath();
    });

    this.time.delayedCall(800, () => this.lineFx?.clear());
  }
}
