# 游戏玩法增强

## 1. 目标机制

### 计分系统

```typescript
class ScoreManager {
  private score = 0;
  private combo = 0;
  private lastScoreTime = 0;
  private readonly COMBO_TIMEOUT = 2000; // 2秒内连续得分保持连击
  
  addScore(base: number, time: number) {
    // 检查连击
    if (time - this.lastScoreTime < this.COMBO_TIMEOUT) {
      this.combo++;
    } else {
      this.combo = 1;
    }
    
    // 连击加成
    const multiplier = 1 + (this.combo - 1) * 0.1; // 每连击+10%
    const finalScore = Math.floor(base * multiplier);
    
    this.score += finalScore;
    this.lastScoreTime = time;
    
    return { score: finalScore, combo: this.combo };
  }
  
  getScore() { return this.score; }
  getCombo() { return this.combo; }
}
```

### 星级评价

```typescript
class StarRating {
  static calculate(score: number, time: number, maxTime: number): number {
    const timeBonus = Math.max(0, 1 - time / maxTime);
    const finalScore = score * (1 + timeBonus * 0.5);
    
    if (finalScore >= 10000) return 3;
    if (finalScore >= 5000) return 2;
    if (finalScore >= 1000) return 1;
    return 0;
  }
  
  static display(scene: Phaser.Scene, stars: number, x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const star = scene.add.text(x + i * 40, y, '★', {
        fontSize: '32px',
        color: i < stars ? '#ffd700' : '#333',
      }).setOrigin(0.5);
      
      if (i < stars) {
        // 星星动画
        scene.tweens.add({
          targets: star,
          scale: { from: 0, to: 1 },
          duration: 300,
          delay: i * 200,
          ease: 'Back.easeOut',
        });
      }
    }
  }
}
```

## 2. 计时模式

### 倒计时

```typescript
class CountdownTimer {
  private timeLeft: number;
  private timerEvent?: Phaser.Time.TimerEvent;
  private text: Phaser.GameObjects.Text;
  private onComplete: () => void;
  
  constructor(scene: Phaser.Scene, seconds: number, x: number, y: number, onComplete: () => void) {
    this.timeLeft = seconds;
    this.onComplete = onComplete;
    
    this.text = scene.add.text(x, y, this.format(), {
      fontSize: '48px',
      color: '#fff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    
    this.timerEvent = scene.time.addEvent({
      delay: 1000,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });
  }
  
  private tick() {
    this.timeLeft--;
    this.text.setText(this.format());
    
    // 最后10秒变红闪烁
    if (this.timeLeft <= 10) {
      this.text.setColor('#ff3333');
      this.text.scene.tweens.add({
        targets: this.text,
        scale: 1.2,
        duration: 100,
        yoyo: true,
      });
    }
    
    if (this.timeLeft <= 0) {
      this.timerEvent?.destroy();
      this.onComplete();
    }
  }
  
  private format(): string {
    const min = Math.floor(this.timeLeft / 60);
    const sec = this.timeLeft % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }
  
  addTime(seconds: number) {
    this.timeLeft += seconds;
  }
  
  pause() { this.timerEvent?.paused = true; }
  resume() { this.timerEvent?.paused = false; }
}
```

### 计时挑战

```typescript
class TimeAttackMode {
  private startTime: number;
  private bestTime: number;
  
  constructor(scene: Phaser.Scene) {
    this.startTime = scene.time.now;
    this.bestTime = this.loadBestTime();
  }
  
  getElapsed(scene: Phaser.Scene): number {
    return scene.time.now - this.startTime;
  }
  
  finish(scene: Phaser.Scene): { time: number; isNewRecord: boolean } {
    const time = this.getElapsed(scene);
    const isNewRecord = time < this.bestTime;
    
    if (isNewRecord) {
      this.bestTime = time;
      this.saveBestTime(time);
    }
    
    return { time, isNewRecord };
  }
  
  private loadBestTime(): number {
    return parseInt(localStorage.getItem('bestTime') || '999999');
  }
  
  private saveBestTime(time: number) {
    localStorage.setItem('bestTime', time.toString());
  }
}
```

## 3. 连击可视化

### 连击计数器

```typescript
class ComboDisplay {
  private container: Phaser.GameObjects.Container;
  private comboText: Phaser.GameObjects.Text;
  private multiplierText: Phaser.GameObjects.Text;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    
    this.comboText = scene.add.text(0, 0, '', {
      fontSize: '64px',
      color: '#fff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    
    this.multiplierText = scene.add.text(0, 40, '', {
      fontSize: '24px',
      color: '#ffd700',
    }).setOrigin(0.5);
    
    this.container.add([this.comboText, this.multiplierText]);
    this.container.setAlpha(0);
  }
  
  show(combo: number, scene: Phaser.Scene) {
    if (combo < 2) {
      this.container.setAlpha(0);
      return;
    }
    
    this.comboText.setText(`${combo} COMBO!`);
    this.multiplierText.setText(`x${(1 + (combo - 1) * 0.1).toFixed(1)}`);
    
    // 颜色随连击数变化
    const colors = ['#fff', '#ffff00', '#ff9900', '#ff3300', '#ff00ff'];
    const colorIndex = Math.min(combo - 2, colors.length - 1);
    this.comboText.setColor(colors[colorIndex]);
    
    // 弹出动画
    this.container.setAlpha(1).setScale(0.5);
    scene.tweens.add({
      targets: this.container,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
    
    // 抖动效果（高连击）
    if (combo >= 5) {
      scene.cameras.main.shake(100, 0.005);
    }
  }
}
```

### 得分飘字

```typescript
class FloatingScore {
  static show(scene: Phaser.Scene, x: number, y: number, score: number, combo: number) {
    const color = combo >= 5 ? '#ff00ff' : combo >= 3 ? '#ffd700' : '#fff';
    const size = Math.min(24 + combo * 4, 48);
    
    const text = scene.add.text(x, y, `+${score}`, {
      fontSize: `${size}px`,
      color,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    
    scene.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }
}
```

### 连击条

```typescript
class ComboBar {
  private bar: Phaser.GameObjects.Graphics;
  private progress = 0;
  private decayRate = 0.3; // 每秒衰减30%
  
  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    this.bar = scene.add.graphics();
    this.draw(x, y, width);
  }
  
  private draw(x: number, y: number, width: number) {
    this.bar.clear();
    
    // 背景
    this.bar.fillStyle(0x333333);
    this.bar.fillRoundedRect(x, y, width, 10, 5);
    
    // 进度
    if (this.progress > 0) {
      const gradient = this.progress > 0.7 ? 0xff3300 : 
                       this.progress > 0.4 ? 0xffaa00 : 0x00ff00;
      this.bar.fillStyle(gradient);
      this.bar.fillRoundedRect(x, y, width * this.progress, 10, 5);
    }
  }
  
  hit() {
    this.progress = Math.min(this.progress + 0.2, 1);
  }
  
  update(delta: number, x: number, y: number, width: number) {
    this.progress = Math.max(0, this.progress - this.decayRate * (delta / 1000));
    this.draw(x, y, width);
  }
  
  isActive(): boolean {
    return this.progress > 0;
  }
}
```

## 4. 成就系统

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (stats: GameStats) => boolean;
  unlocked: boolean;
}

class AchievementManager {
  private achievements: Achievement[] = [
    {
      id: 'first_win',
      name: '初次胜利',
      description: '完成第一关',
      condition: (s) => s.levelsCompleted >= 1,
      unlocked: false,
    },
    {
      id: 'combo_master',
      name: '连击大师',
      description: '达成10连击',
      condition: (s) => s.maxCombo >= 10,
      unlocked: false,
    },
    {
      id: 'speed_demon',
      name: '速度恶魔',
      description: '30秒内完成一关',
      condition: (s) => s.fastestTime <= 30000,
      unlocked: false,
    },
  ];
  
  check(stats: GameStats, scene: Phaser.Scene) {
    for (const achievement of this.achievements) {
      if (!achievement.unlocked && achievement.condition(stats)) {
        achievement.unlocked = true;
        this.showUnlock(achievement, scene);
        this.save();
      }
    }
  }
  
  private showUnlock(achievement: Achievement, scene: Phaser.Scene) {
    const popup = scene.add.container(scene.cameras.main.width / 2, -100);
    
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-150, -40, 300, 80, 10);
    
    const icon = scene.add.text(-120, 0, '🏆', { fontSize: '32px' }).setOrigin(0.5);
    const title = scene.add.text(-80, -10, achievement.name, { 
      fontSize: '20px', color: '#ffd700' 
    });
    const desc = scene.add.text(-80, 15, achievement.description, { 
      fontSize: '14px', color: '#aaa' 
    });
    
    popup.add([bg, icon, title, desc]);
    
    // 滑入动画
    scene.tweens.add({
      targets: popup,
      y: 60,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.time.delayedCall(2000, () => {
          scene.tweens.add({
            targets: popup,
            y: -100,
            duration: 300,
            onComplete: () => popup.destroy(),
          });
        });
      },
    });
  }
  
  private save() {
    const unlocked = this.achievements.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem('achievements', JSON.stringify(unlocked));
  }
}
```
