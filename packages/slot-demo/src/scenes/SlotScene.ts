import Phaser from 'phaser';

const SYMBOLS = ['🍒', '🍋', '⭐', '7', '🔔'];

export class SlotScene extends Phaser.Scene {
  private reels: Phaser.GameObjects.Text[][] = [];
  private balance = 1000;
  private spinning = false;
  private lineFx?: Phaser.GameObjects.Graphics;
  private reelsSpinEvents: Phaser.Time.TimerEvent[] = [];
  private colsX = [170, 270, 370];
  private rowsY = [330, 430, 530];
  private rowStep = 100;

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
    this.add.rectangle(270, 430, 420, 360, 0x0b0f1a, 0.9).setStrokeStyle(2, 0xffffff, 0.15);
    this.add.rectangle(270, 430, 406, 106, 0xffffff, 0.06).setStrokeStyle(2, 0x6ef2ff, 0.5);

    for (let c = 0; c < 3; c++) {
      this.reels[c] = [];
      for (let r = 0; r < 3; r++) {
        const t = this.add
          .text(this.colsX[c], this.rowsY[r], this.randomSymbol(), {
            fontSize: '48px'
          })
          .setOrigin(0.5);
        this.reels[c][r] = t;
      }
    }

    this.lineFx = this.add.graphics();

    this.onBalanceChange(this.balance);
    this.onSpinningChange(false);
    this.registerSpin(() => this.spin());
  }

  private randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  private startReelSpin(col: number) {
    const ev = this.time.addEvent({
      delay: 90,
      loop: true,
      callback: () => {
        // visually move symbols downward each tick
        this.reels[col].forEach((t) => {
          this.tweens.add({
            targets: t,
            y: t.y + this.rowStep,
            duration: 80,
            ease: 'Linear'
          });
        });

        this.time.delayedCall(82, () => {
          this.reels[col].forEach((t) => {
            if (t.y > this.rowsY[2] + this.rowStep / 2) {
              t.y = this.rowsY[0] - this.rowStep;
              t.setText(this.randomSymbol());
            }
          });

          // ensure center row remains visually highlighted
          this.reels[col].forEach((t) => {
            const d = Math.abs(t.y - this.rowsY[1]);
            t.setScale(d < 16 ? 1.08 : 0.95);
            t.setAlpha(d < 16 ? 1 : 0.72);
          });
        });
      }
    });
    this.reelsSpinEvents.push(ev);
  }

  private stopAllReelSpin() {
    this.reelsSpinEvents.forEach((ev) => ev.destroy());
    this.reelsSpinEvents = [];
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

    this.startReelSpin(0);
    this.time.delayedCall(110, () => this.startReelSpin(1));
    this.time.delayedCall(220, () => this.startReelSpin(2));

    const finalGrid: string[][] = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => this.randomSymbol())
    );

    [0, 1, 2].forEach((col, i) => {
      this.time.delayedCall(900 + i * 320, () => {
        this.reelsSpinEvents[col]?.destroy();
        for (let row = 0; row < 3; row++) {
          this.reels[col][row].setText(finalGrid[col][row]);
          this.reels[col][row].setY(this.rowsY[row]);
          this.reels[col][row].setScale(row === 1 ? 1.1 : 0.96);
          this.reels[col][row].setAlpha(row === 1 ? 1 : 0.76);
        }
      });
    });

    this.time.delayedCall(1900, () => {
      const lines = [
        { cells: [[0, 1], [1, 1], [2, 1]] as [number, number][], draw: [[this.colsX[0], this.rowsY[1]], [this.colsX[2], this.rowsY[1]]] },
        { cells: [[0, 0], [1, 0], [2, 0]] as [number, number][], draw: [[this.colsX[0], this.rowsY[0]], [this.colsX[2], this.rowsY[0]]] },
        { cells: [[0, 2], [1, 2], [2, 2]] as [number, number][], draw: [[this.colsX[0], this.rowsY[2]], [this.colsX[2], this.rowsY[2]]] },
        { cells: [[0, 0], [1, 1], [2, 2]] as [number, number][], draw: [[this.colsX[0], this.rowsY[0]], [this.colsX[2], this.rowsY[2]]] },
        { cells: [[0, 2], [1, 1], [2, 0]] as [number, number][], draw: [[this.colsX[0], this.rowsY[2]], [this.colsX[2], this.rowsY[0]]] }
      ];

      let hits = 0;
      const hitLines: number[] = [];
      lines.forEach((line, idx) => {
        const [a, b, c] = line.cells.map(([x, y]) => finalGrid[x][y]);
        if (a === b && b === c) {
          hits += 1;
          hitLines.push(idx);
        }
      });

      const win = hits > 0 ? bet * (3 + hits * 2) : 0;

      this.balance += win;
      this.onBalanceChange(this.balance);
      this.onWin(win);

      if (win > 0) {
        this.cameras.main.flash(180, 255, 244, 180);
        this.drawHitLines(hitLines, lines);
        const pop = this.add.text(270, 220, `中奖 +${win}`, { fontSize: '42px', color: '#ffe08a', fontStyle: 'bold' }).setOrigin(0.5);
        this.tweens.add({
          targets: pop,
          y: 175,
          alpha: 0,
          scale: 1.12,
          duration: 820,
          onComplete: () => pop.destroy()
        });
      } else {
        const miss = this.add.text(270, 220, '未中奖', { fontSize: '30px', color: '#c8d2e8' }).setOrigin(0.5);
        this.tweens.add({ targets: miss, alpha: 0, duration: 520, onComplete: () => miss.destroy() });
      }

      this.stopAllReelSpin();
      this.spinning = false;
      this.onSpinningChange(false);
    });

    return true;
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

    this.time.delayedCall(700, () => this.lineFx?.clear());
  }
}
