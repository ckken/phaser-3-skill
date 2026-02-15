import Phaser from 'phaser';

const SYMBOLS = ['🍒', '🍋', '⭐', '7', '🔔'];

export class SlotScene extends Phaser.Scene {
  private reels: Phaser.GameObjects.Text[][] = [];
  private balance = 1000;
  private spinning = false;

  constructor(
    private onBalanceChange: (v: number) => void,
    private onWin: (v: number) => void,
    private getBet: () => number,
    private registerSpin: (fn: () => void) => void
  ) {
    super('SlotScene');
  }

  create() {
    this.add.rectangle(270, 430, 420, 360, 0x0b0f1a, 0.9).setStrokeStyle(2, 0xffffff, 0.15);

    const colsX = [170, 270, 370];
    const rowsY = [330, 430, 530];

    for (let c = 0; c < 3; c++) {
      this.reels[c] = [];
      for (let r = 0; r < 3; r++) {
        const t = this.add
          .text(colsX[c], rowsY[r], this.randomSymbol(), {
            fontSize: '48px'
          })
          .setOrigin(0.5);
        this.reels[c][r] = t;
      }
    }

    this.onBalanceChange(this.balance);
    this.registerSpin(() => this.spin());
  }

  private randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  private spin() {
    if (this.spinning) return;
    const bet = this.getBet();
    if (this.balance < bet) return;

    this.spinning = true;
    this.balance -= bet;
    this.onBalanceChange(this.balance);
    this.onWin(0);

    // quick fake roll animation
    this.time.addEvent({
      delay: 60,
      repeat: 13,
      callback: () => {
        for (let c = 0; c < 3; c++) {
          for (let r = 0; r < 3; r++) {
            this.reels[c][r].setText(this.randomSymbol());
          }
        }
      }
    });

    const finalGrid: string[][] = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => this.randomSymbol())
    );

    // stop reel one by one for better slot feel
    [0, 1, 2].forEach((col, i) => {
      this.time.delayedCall(650 + i * 220, () => {
        for (let row = 0; row < 3; row++) {
          this.reels[col][row].setText(finalGrid[col][row]);
        }
      });
    });

    this.time.delayedCall(1200, () => {
      const lines = [
        [
          finalGrid[0][1],
          finalGrid[1][1],
          finalGrid[2][1]
        ], // mid
        [finalGrid[0][0], finalGrid[1][0], finalGrid[2][0]], // top
        [finalGrid[0][2], finalGrid[1][2], finalGrid[2][2]], // bottom
        [finalGrid[0][0], finalGrid[1][1], finalGrid[2][2]], // diag \\
        [finalGrid[0][2], finalGrid[1][1], finalGrid[2][0]] // diag /
      ];

      let hits = 0;
      for (const line of lines) {
        if (line[0] === line[1] && line[1] === line[2]) hits += 1;
      }

      const win = hits > 0 ? bet * (3 + hits * 2) : 0;

      this.balance += win;
      this.onBalanceChange(this.balance);
      this.onWin(win);

      if (win > 0) {
        this.cameras.main.flash(180, 255, 244, 180);
      }

      this.spinning = false;
    });
  }
}
