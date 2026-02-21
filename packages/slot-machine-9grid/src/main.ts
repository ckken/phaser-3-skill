import Phaser from 'phaser';

// ============ 配置 ============
const CONFIG = {
  WIDTH: 400,
  HEIGHT: 720,
  REEL_COUNT: 3,
  VISIBLE_ROWS: 3,
  SYMBOL_SIZE: 90,
  REEL_GAP: 10,

  // 物理滚动配置
  BUFFER_SYMBOLS: 5,
  MAX_SPEED: 1800,       // px/s - 最大滚动速度
  ACCEL: 3000,           // px/s² - 加速度
  DECEL: 800,            // px/s² - 减速度（更慢，拉扯感更强）
  MIN_SPIN_TIME: 1200,   // ms - 最小匀速旋转时间
  STOP_STAGGER: 500,     // ms - 每个轮盘停止的间隔
  BOUNCE_OVERSHOOT: 18,  // px - 过冲距离
  BOUNCE_DURATION: 400,  // ms - 回弹动画时长
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

// Build version for cache busting
const BUILD_VERSION = 'v3.0.0-enhanced';

// ============ 滚动状态枚举 ============
enum ReelState {
  IDLE,
  ACCELERATING,
  SPINNING,
  DECELERATING,
  LANDING,
}

// ============ 物理驱动的轮盘类 ============
class Reel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private symbols: Phaser.GameObjects.Container[] = [];
  private symbolData: typeof SYMBOLS[number][] = [];

  private x: number;
  private topY: number;

  // 物理状态
  private scrollY = 0;
  private velocity = 0;          // px/s - 当前速度
  private state: ReelState = ReelState.IDLE;
  private targetSymbols: typeof SYMBOLS[number][] = [];
  private spinTimer = 0;         // ms - 匀速阶段计时
  private minSpinTime = 0;       // ms - 最小匀速时间（含 stagger）
  private finalPrepared = false;
  private landingTarget = -1;    // 减速阶段的目标 scrollY

  constructor(scene: Phaser.Scene, x: number, topY: number, maskGraphics: Phaser.GameObjects.Graphics) {
    this.scene = scene;
    this.x = x;
    this.topY = topY;

    this.container = scene.add.container(x, 0);

    const totalSymbols = CONFIG.VISIBLE_ROWS + CONFIG.BUFFER_SYMBOLS * 2;
    for (let i = 0; i < totalSymbols; i++) {
      const sym = this.createSymbol();
      this.symbols.push(sym);
      this.symbolData.push(this.randomSymbol());
      this.container.add(sym);
    }

    this.updateSymbolPositions();

    const mask = maskGraphics.createGeometryMask();
    this.container.setMask(mask);
  }

  private createSymbol(): Phaser.GameObjects.Container {
    const cont = this.scene.add.container(0, 0);

    // Gradient background with glow
    const bg = this.scene.add.graphics();
    const s = CONFIG.SYMBOL_SIZE;
    bg.fillStyle(0x1a1a3e, 1);
    bg.fillRoundedRect(-s / 2 + 4, -s / 2 + 4, s - 8, s - 8, 10);
    // Inner highlight
    bg.fillStyle(0x2a2a5e, 0.5);
    bg.fillRoundedRect(-s / 2 + 8, -s / 2 + 8, s - 16, (s - 16) / 2, { tl: 8, tr: 8, bl: 0, br: 0 });
    cont.add(bg);

    const text = this.scene.add.text(0, 0, '', {
      fontSize: '52px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add(text);
    cont.setData('text', text);
    cont.setData('bg', bg);

    return cont;
  }

  private randomSymbol(): typeof SYMBOLS[number] {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  private updateSymbolPositions() {
    const startY = this.topY - CONFIG.BUFFER_SYMBOLS * CONFIG.SYMBOL_SIZE;
    // Speed-based blur: reduce alpha when spinning fast
    const speedRatio = this.velocity / CONFIG.MAX_SPEED;
    const symbolAlpha = this.state === ReelState.IDLE ? 1 : Math.max(0.4, 1 - speedRatio * 0.6);

    for (let i = 0; i < this.symbols.length; i++) {
      const sym = this.symbols[i];
      const data = this.symbolData[i];

      const y = startY + i * CONFIG.SYMBOL_SIZE + this.scrollY;
      sym.setY(y);
      sym.setAlpha(symbolAlpha);

      const text = sym.getData('text') as Phaser.GameObjects.Text;
      if (text.text !== data.label) {
        text.setText(data.label);
        text.setColor(Phaser.Display.Color.IntegerToColor(data.color).rgba);
      }
    }
  }

  private recycleSymbols() {
    while (this.scrollY >= CONFIG.SYMBOL_SIZE) {
      this.scrollY -= CONFIG.SYMBOL_SIZE;
      // Adjust landing target to stay in sync
      if (this.landingTarget > 0) {
        this.landingTarget -= CONFIG.SYMBOL_SIZE;
      }
      const first = this.symbolData.shift()!;
      // During spinning, push random symbols; during decel, recycle existing
      if (this.state === ReelState.ACCELERATING || this.state === ReelState.SPINNING) {
        this.symbolData.push(this.randomSymbol());
      } else {
        this.symbolData.push(first);
      }
    }
  }

  private prepareFinalSymbols() {
    if (this.finalPrepared) return;
    this.finalPrepared = true;
    const startIdx = CONFIG.BUFFER_SYMBOLS;
    for (let i = 0; i < CONFIG.VISIBLE_ROWS; i++) {
      this.symbolData[startIdx + i] = this.targetSymbols[i];
    }
  }

  /**
   * Start spinning
   */
  spin(targetSymbols: typeof SYMBOLS[number][], stopDelay: number) {
    if (this.state !== ReelState.IDLE) return;

    this.targetSymbols = targetSymbols;
    this.scrollY = 0;
    this.velocity = 0;
    this.spinTimer = 0;
    this.minSpinTime = CONFIG.MIN_SPIN_TIME + stopDelay * 1000;
    this.finalPrepared = false;
    this.landingTarget = -1;
    this.state = ReelState.ACCELERATING;
  }

  /**
   * Physics update - called every frame from scene.update()
   */
  update(dt: number) {
    if (this.state === ReelState.IDLE) return;

    const dtSec = dt / 1000;

    switch (this.state) {
      case ReelState.ACCELERATING: {
        // Increase velocity with acceleration
        this.velocity += CONFIG.ACCEL * dtSec;
        if (this.velocity >= CONFIG.MAX_SPEED) {
          this.velocity = CONFIG.MAX_SPEED;
          this.state = ReelState.SPINNING;
        }
        break;
      }

      case ReelState.SPINNING: {
        // Constant speed, count time
        this.velocity = CONFIG.MAX_SPEED;
        this.spinTimer += dt;
        if (this.spinTimer >= this.minSpinTime) {
          // Prepare final symbols and start decelerating
          this.prepareFinalSymbols();
          // Calculate landing target: align to next symbol boundary + buffer symbols
          const currentOffset = this.scrollY % CONFIG.SYMBOL_SIZE;
          const toNextBoundary = currentOffset > 0.01
            ? CONFIG.SYMBOL_SIZE - currentOffset
            : 0;
          this.landingTarget = this.scrollY + toNextBoundary + CONFIG.BUFFER_SYMBOLS * CONFIG.SYMBOL_SIZE;
          this.state = ReelState.DECELERATING;
        }
        break;
      }

      case ReelState.DECELERATING: {
        // Smooth deceleration using exponential decay
        // Instead of linear decel, velocity drops faster at high speed and slower near stop
        const remaining = this.landingTarget - this.scrollY;
        
        if (remaining <= 0) {
          // Arrived at target - start bounce
          this.scrollY = this.landingTarget;
          this.velocity = 0;
          this.state = ReelState.LANDING;
        } else {
          // Exponential slowdown: speed proportional to remaining distance
          // This creates a natural "easing out" feel
          const targetVelocity = Math.max(60, remaining * 3.5);
          // Blend current velocity toward target (smooth transition)
          this.velocity = this.velocity * 0.92 + targetVelocity * 0.08;
          // Clamp to avoid overshooting
          if (this.velocity > CONFIG.MAX_SPEED) this.velocity = CONFIG.MAX_SPEED;
        }
        break;
      }

      case ReelState.LANDING: {
        // Snap to exact symbol boundary
        const remainder = this.scrollY % CONFIG.SYMBOL_SIZE;
        if (remainder > 0.5) {
          this.scrollY -= remainder;
        }
        this.recycleSymbols();
        this.updateSymbolPositions();
        this.state = ReelState.IDLE;
        this.playBounceStop();
        return;
      }
    }

    // Apply velocity to position
    this.scrollY += this.velocity * dtSec;
    this.recycleSymbols();
    this.updateSymbolPositions();
  }

  /**
   * Bounce stop effect - overshoot then spring back
   */
  private playBounceStop() {
    const visibleSymbols = this.symbols.slice(
      CONFIG.BUFFER_SYMBOLS,
      CONFIG.BUFFER_SYMBOLS + CONFIG.VISIBLE_ROWS
    );

    // Overshoot: move all visible symbols down, then bounce back up
    visibleSymbols.forEach((sym, idx) => {
      const originalY = sym.y;
      this.scene.tweens.add({
        targets: sym,
        y: originalY + CONFIG.BOUNCE_OVERSHOOT,
        duration: CONFIG.BOUNCE_DURATION * 0.3,
        ease: 'Quad.easeOut',
        delay: idx * 30,
        onComplete: () => {
          this.scene.tweens.add({
            targets: sym,
            y: originalY,
            duration: CONFIG.BOUNCE_DURATION * 0.7,
            ease: 'Bounce.easeOut',
          });
        }
      });

      // Scale pulse on stop
      const text = sym.getData('text') as Phaser.GameObjects.Text;
      this.scene.tweens.add({
        targets: text,
        scale: 1.15,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut',
        delay: idx * 30 + CONFIG.BOUNCE_DURATION * 0.3,
      });
    });
  }

  isIdle(): boolean {
    return this.state === ReelState.IDLE;
  }

  getVisibleSymbols(): typeof SYMBOLS[number][] {
    const start = CONFIG.BUFFER_SYMBOLS;
    return this.symbolData.slice(start, start + CONFIG.VISIBLE_ROWS);
  }
}

// ============ 主场景 ============
class SlotScene extends Phaser.Scene {
  private reels: Reel[] = [];
  private balance = 1000;
  private bet = 10;
  private spinning = false;
  private pendingResults: typeof SYMBOLS[number][][] = [];

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

  // Physics update loop - drives all reels
  update(_time: number, delta: number) {
    if (!this.spinning) return;

    for (const reel of this.reels) {
      reel.update(delta);
    }

    // Check if all reels stopped
    if (this.reels.every(r => r.isIdle())) {
      this.spinning = false;
      this.checkWin(this.pendingResults);
    }
  }

  private createBackground() {
    const g = this.add.graphics();
    for (let y = 0; y < CONFIG.HEIGHT; y++) {
      const t = y / CONFIG.HEIGHT;
      const startColor = Phaser.Display.Color.ValueToColor(0x0d0d1a);
      const endColor = Phaser.Display.Color.ValueToColor(0x05050f);
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        startColor, endColor, 100, t * 100
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

    // Mask
    const maskG = this.add.graphics();
    maskG.fillStyle(0xffffff);
    maskG.fillRect(areaX - 5, areaY - 5, areaWidth + 10, areaHeight + 10);
    maskG.setVisible(false);

    // Create reels
    for (let i = 0; i < CONFIG.REEL_COUNT; i++) {
      const reelX = areaX + CONFIG.SYMBOL_SIZE / 2 + i * (CONFIG.SYMBOL_SIZE + CONFIG.REEL_GAP);
      const reel = new Reel(this, reelX, areaY + CONFIG.SYMBOL_SIZE / 2, maskG);
      this.reels.push(reel);
    }

    // Separator lines
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

    // Shine effect on button
    const shine = this.add.graphics();
    shine.fillStyle(0xffffff, 0.15);
    shine.fillRoundedRect(-66, -26, 132, 25, { tl: 10, tr: 10, bl: 0, br: 0 });

    const text = this.add.text(0, 0, '🎰 SPIN', {
      fontSize: '26px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.add([bg, shine, text]);
    btn.setSize(140, 60);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      btn.setScale(0.95);
      this.handleSpin();
    });
    btn.on('pointerup', () => btn.setScale(1));
    btn.on('pointerover', () => {
      if (!this.spinning) btn.setScale(1.05);
    });
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

    // Generate random results
    const results: typeof SYMBOLS[number][][] = [];
    for (let i = 0; i < CONFIG.REEL_COUNT; i++) {
      const col: typeof SYMBOLS[number][] = [];
      for (let j = 0; j < CONFIG.VISIBLE_ROWS; j++) {
        col.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }
      results.push(col);
    }
    this.pendingResults = results;

    // Staggered start
    for (let i = 0; i < CONFIG.REEL_COUNT; i++) {
      const stopDelay = i * (CONFIG.STOP_STAGGER / 1000);
      this.reels[i].spin(results[i], stopDelay);
    }
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

    // Gold coin particle effect
    this.spawnWinParticles();

    // Flash the reel area border
    this.flashReelBorder();
  }

  private spawnWinParticles() {
    const colors = [0xffd700, 0xffaa00, 0xffdd33, 0xffffff];
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(60, CONFIG.WIDTH - 60);
      const y = Phaser.Math.Between(130, 400);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Phaser.Math.Between(3, 8);

      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, size);
      particle.setPosition(x, y);
      particle.setAlpha(1);

      this.tweens.add({
        targets: particle,
        y: y - Phaser.Math.Between(80, 200),
        x: x + Phaser.Math.Between(-60, 60),
        alpha: 0,
        scale: 0.3,
        duration: Phaser.Math.Between(600, 1200),
        delay: Phaser.Math.Between(0, 300),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private reelBorderGraphics?: Phaser.GameObjects.Graphics;

  private flashReelBorder() {
    if (!this.reelBorderGraphics) return;
    
    // Create a flash overlay
    const areaWidth = CONFIG.REEL_COUNT * CONFIG.SYMBOL_SIZE + (CONFIG.REEL_COUNT - 1) * CONFIG.REEL_GAP;
    const areaHeight = CONFIG.VISIBLE_ROWS * CONFIG.SYMBOL_SIZE;
    const areaX = (CONFIG.WIDTH - areaWidth) / 2;
    const areaY = 130;

    const flash = this.add.graphics();
    flash.lineStyle(6, 0xffd700, 1);
    flash.strokeRoundedRect(areaX - 15, areaY - 15, areaWidth + 30, areaHeight + 30, 12);
    flash.setAlpha(1);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => flash.destroy(),
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

// Update version display
window.addEventListener('load', () => {
  const el = document.getElementById('version');
  if (el) el.textContent = BUILD_VERSION;
});
