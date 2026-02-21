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
  BUFFER_SYMBOLS: 5, // 增加缓冲区，确保循环无缝
  SPIN_SPEED: 1200, // px/s - 降低速度，更容易看清
  ACCEL_DURATION: 500, // ms - 更长的加速时间
  MIN_SPIN_DURATION: 2500, // ms - 延长最小旋转时间
  DECEL_DURATION: 1500, // ms - 更长的减速时间，更明显的减速效果
  STOP_STAGGER: 500, // ms - 每个轮盘停止的间隔
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
  private scrollY = 0; // 当前滚动偏移（浮点数，保持精度）
  private isSpinning = false;
  private targetSymbols: typeof SYMBOLS[number][] = [];
  
  // Tween 引用
  private spinTween: Phaser.Tweens.Tween | null = null;
  
  constructor(scene: Phaser.Scene, x: number, topY: number, maskGraphics: Phaser.GameObjects.Graphics) {
    this.scene = scene;
    this.x = x;
    this.topY = topY;
    
    this.container = scene.add.container(x, 0);
    
    // 创建符号池：可见区域 + 上下缓冲区
    const totalSymbols = CONFIG.VISIBLE_ROWS + CONFIG.BUFFER_SYMBOLS * 2;
    for (let i = 0; i < totalSymbols; i++) {
      const sym = this.createSymbol();
      this.symbols.push(sym);
      this.symbolData.push(this.randomSymbol());
      this.container.add(sym);
    }
    
    this.updateSymbolPositions();
    
    // 应用遮罩
    const mask = maskGraphics.createGeometryMask();
    this.container.setMask(mask);
  }
  
  private createSymbol(): Phaser.GameObjects.Container {
    const cont = this.scene.add.container(0, 0);
    
    // 背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x222244, 1);
    bg.fillRoundedRect(
      -CONFIG.SYMBOL_SIZE / 2 + 4,
      -CONFIG.SYMBOL_SIZE / 2 + 4,
      CONFIG.SYMBOL_SIZE - 8,
      CONFIG.SYMBOL_SIZE - 8,
      8
    );
    cont.add(bg);
    
    // 文本
    const text = this.scene.add.text(0, 0, '', {
      fontSize: '42px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add(text);
    cont.setData('text', text);
    
    return cont;
  }
  
  private randomSymbol(): typeof SYMBOLS[number] {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }
  
  /**
   * 更新所有符号的位置和显示内容
   * 关键：使用浮点数精度，不四舍五入
   */
  private updateSymbolPositions() {
    const startY = this.topY - CONFIG.BUFFER_SYMBOLS * CONFIG.SYMBOL_SIZE;
    
    for (let i = 0; i < this.symbols.length; i++) {
      const sym = this.symbols[i];
      const data = this.symbolData[i];
      
      // 🎯 关键：保持浮点数精度，让 Phaser 的渲染器处理亚像素
      const y = startY + i * CONFIG.SYMBOL_SIZE + this.scrollY;
      sym.setY(y);
      
      // 更新文本内容和颜色
      const text = sym.getData('text') as Phaser.GameObjects.Text;
      if (text.text !== data.label) {
        text.setText(data.label);
        text.setColor(Phaser.Display.Color.IntegerToColor(data.color).rgba);
      }
    }
  }
  
  /**
   * 循环符号：当符号移出底部时，移到顶部
   * 这是实现无缝滚动的关键
   */
  private recycleSymbols() {
    // 当滚动超过一个符号高度时，循环
    while (this.scrollY >= CONFIG.SYMBOL_SIZE) {
      this.scrollY -= CONFIG.SYMBOL_SIZE;
      
      // 🎯 修复：将顶部符号移到底部，保持符号连续性
      const first = this.symbolData.shift()!;
      this.symbolData.push(first); // 复用符号，不生成新的
    }
  }
  
  /**
   * 准备最终结果：在减速前将目标符号插入到符号池中
   */
  private prepareFinalSymbols() {
    // 将目标符号放到缓冲区后的可见位置
    const startIdx = CONFIG.BUFFER_SYMBOLS;
    for (let i = 0; i < CONFIG.VISIBLE_ROWS; i++) {
      this.symbolData[startIdx + i] = this.targetSymbols[i];
    }
  }
  
  /**
   * 开始旋转
   * @param targetSymbols 最终要显示的符号（从上到下）
   * @param stopDelay 延迟多久后开始减速（秒）
   */
  spin(targetSymbols: typeof SYMBOLS[number][], stopDelay: number) {
    if (this.isSpinning) return;
    
    this.targetSymbols = targetSymbols;
    this.isSpinning = true;
    this.scrollY = 0;
    
    // 停止之前的 Tween
    if (this.spinTween) {
      this.spinTween.stop();
      this.spinTween = null;
    }
    
    // 🎯 阶段1：加速阶段
    // 简化：使用固定距离，避免复杂的积分计算
    const accelDistance = CONFIG.SYMBOL_SIZE * 3; // 固定滚动 3 个符号的距离
    
    this.spinTween = this.scene.tweens.add({
      targets: this,
      scrollY: accelDistance,
      duration: CONFIG.ACCEL_DURATION,
      ease: 'Quad.easeIn', // 更平缓的加速
      onUpdate: () => {
        this.recycleSymbols();
        this.updateSymbolPositions();
      },
      onComplete: () => {
        // 🎯 阶段2：匀速旋转阶段
        this.startConstantSpin(stopDelay);
      }
    });
  }
  
  /**
   * 匀速旋转阶段
   */
  private startConstantSpin(stopDelay: number) {
    // 计算匀速旋转需要移动的距离
    const spinDuration = CONFIG.MIN_SPIN_DURATION + stopDelay * 1000;
    const spinDistance = CONFIG.SPIN_SPEED * (spinDuration / 1000);
    
    const startScrollY = this.scrollY;
    
    // 🎯 提前准备最终符号：在匀速阶段快结束时插入
    // 确保目标符号在减速前已经在符号池中，避免可见区域突nst prepareTime = Math.max(500, CONFIG.DECEL_DURATION * 0.3);
    
    this.spinTween = this.scene.tweens.add({
      targets: this,
      scrollY: startScrollY + spinDistance,
      duration: spinDuration,
      ease: 'Linear',
      onUpdate: (tween) => {
        // 在接近结束时准备最终符号
        if (tween.progress > 0.7 && this.targetSymbols.length > 0) {
          this.prepareFinalSymbols();
          this.targetSymbols = []; // 标记已准备，避免重复
        }
        this.recycleSymbols();
        this.updateSymbolPositions();
      },
      onComplete: () => {
        // 🎯 阶段3：减速阶段
        this.startDeceleration();
      }
    });
  }
  
  /**
   * 减速阶段：平滑停止到目标符号
   */
  private startDeceleration() {
    // 🎯 移除：prepareFinalSymbols() 已在匀速阶段完成
    
    // 计算需要滚动多少才能让第一个目标符号对齐到顶部
    // 当前 scrollY 可能在任意位置，我们需要滚动到下一个符号边界
    const currentOffset = this.scrollY % CONFIG.SYMBOL_SIZE;
    const distanceToNextBoundary = CONFIG.SYMBOL_SIZE - currentOffset;
    
    // 额外滚动几个符号，确保目标符号进入可见区域
    const extraSymbols = CONFIG.BUFFER_SYMBOLS;
    const decelDistance = distanceToNextBoundary + extraSymbols * CONFIG.SYMBOL_SIZE;
    
    const startScrollY = this.scrollY;
    const targetScrollY = startScrollY + decelDistance;
    
    this.spinTween = this.scene.tweens.add({
      targets: this,
      scrollY: targetScrollY,
      duration: CONFIG.DECEL_DURATION,
      ease: 'Cubic.easeOut', // 三次方缓动，更明显的减速效果
      onUpdate: () => {
        this.recycleSymbols();
        this.updateSymbolPositions();
      },
      onComplete: () => {
        // 🎯 最终对齐：确保精确停在符号边界
        this.finalizeStop();
      }
    });
  }
  
  /**
   * 最终停止：微调到精确位置
   */
  private finalizeStop() {
    // 将 scrollY 对齐到最近的符号边界
    const remainder = this.scrollY % CONFIG.SYMBOL_SIZE;
    if (remainder > 0) {
      this.scrollY -= remainder;
    }
    
    this.updateSymbolPositions();
    this.isSpinning = false;
    this.spinTween = null;
    
    // 播放停止动画
    this.playStopAnimation();
  }
  
  /**
   * 停止时的弹跳动画
   */
  private playStopAnimation() {
    const visibleSymbols = this.symbols.slice(
      CONFIG.BUFFER_SYMBOLS,
      CONFIG.BUFFER_SYMBOLS + CONFIG.VISIBLE_ROWS
    );
    
    visibleSymbols.forEach((sym, idx) => {
      // 轻微的弹跳效果
      this.scene.tweens.add({
        targets: sym,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut',
        delay: idx * 40,
      });
      
      // 文本放大效果
      const text = sym.getData('text') as Phaser.GameObjects.Text;
      this.scene.tweens.add({
        targets: text,
        scale: 1.15,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut',
        delay: idx * 40,
      });
    });
  }
  
  isIdle(): boolean {
    return !this.isSpinning;
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
      const startColor = Phaser.Display.Color.ValueToColor(0x0d0d1a);
      const endColor = Phaser.Display.Color.ValueToColor(0x05050f);
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        startColor,
        endColor,
        100, 
        t * 100
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
    
    // 创建遮罩
    const maskG = this.add.graphics();
    maskG.fillStyle(0xffffff);
    maskG.fillRect(areaX - 5, areaY - 5, areaWidth + 10, areaHeight + 10);
    maskG.setVisible(false);
    
    // 创建轮盘
    for (let i = 0; i < CONFIG.REEL_COUNT; i++) {
      const reelX = areaX + CONFIG.SYMBOL_SIZE / 2 + i * (CONFIG.SYMBOL_SIZE + CONFIG.REEL_GAP);
      const reel = new Reel(this, reelX, areaY + CONFIG.SYMBOL_SIZE / 2, maskG);
      this.reels.push(reel);
    }
    
    // 分隔线
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
    
    // 生成随机结果
    const results: typeof SYMBOLS[number][][] = [];
    for (let i = 0; i < CONFIG.REEL_COUNT; i++) {
      const col: typeof SYMBOLS[number][] = [];
      for (let j = 0; j < CONFIG.VISIBLE_ROWS; j++) {
        col.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }
      results.push(col);
    }
    
    // 🎯 错峰停止：每个轮盘延迟不同时间
    for (let i = 0; i < CONFIG.REEL_COUNT; i++) {
      const stopDelay = i * (CONFIG.STOP_STAGGER / 1000);
      this.reels[i].spin(results[i], stopDelay);
    }
    
    // 等待所有轮盘停止
    const totalDuration = CONFIG.ACCEL_DURATION + CONFIG.MIN_SPIN_DURATION + 
                          (CONFIG.REEL_COUNT - 1) * CONFIG.STOP_STAGGER + 
                          CONFIG.DECEL_DURATION;
    
    this.time.delayedCall(totalDuration + 200, () => {
      this.checkWin(results);
      this.spinning = false;
    });
  }
  
  private checkWin(results: typeof SYMBOLS[number][][]) {
    const lines = [
      [results[0][0], results[1][0], results[2][0]], // 上
      [results[0][1], results[1][1], results[2][1]], // 中
      [results[0][2], results[1][2], results[2][2]], // 下
      [results[0][0], results[1][1], results[2][2]], // 对角线 ↘
      [results[0][2], results[1][1], results[2][0]], // 对角线 ↗
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
