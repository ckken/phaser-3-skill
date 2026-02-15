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
      repeat: 10,
      callback: () => {
        for (let c = 0; c < 3; c++) {
          for (let r = 0; r < 3; r++) {
            this.reels[c][r].setText(this.randomSymbol());
          }
        }
      }
    });

    this.time.delayedCall(900, () => {
      // final result for middle line
      const middle = [this.randomSymbol(), this.randomSymbol(), this.randomSymbol()];
      for (let c = 0; c < 3; c++) {
        this.reels[c][1].setText(middle[c]);
      }

      let win = 0;
      if (middle[0] === middle[1] && middle[1] === middle[2]) {
        win = bet * 5;
      }

      this.balance += win;
      this.onBalanceChange(this.balance);
      this.onWin(win);
      this.spinning = false;
    });
  }
}
