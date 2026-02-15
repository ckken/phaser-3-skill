import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private coin!: Phaser.Physics.Arcade.StaticImage;
  private score = 0;
  private wasOnGround = false;

  constructor(private onScoreChange: (score: number) => void) {
    super('MainScene');
  }

  create(): void {
    const g = this.add.graphics();
    g.fillStyle(0x7ac943, 1).fillRect(0, 0, 64, 64).generateTexture('player', 64, 64);
    g.clear().fillStyle(0x4b6584, 1).fillRect(0, 0, 960, 40).generateTexture('ground', 960, 40);
    g.clear().fillStyle(0xffc857, 1).fillCircle(12, 12, 12).generateTexture('coin', 24, 24);
    g.clear().fillStyle(0xffffff, 1).fillCircle(3, 3, 3).generateTexture('spark', 6, 6);
    g.destroy();

    this.add.text(20, 20, 'React + Phaser Demo (Phase 3 WIP)', { fontSize: '24px', color: '#fff' });

    const ground = this.physics.add.staticImage(480, 520, 'ground');
    ground.refreshBody();

    this.player = this.physics.add.sprite(120, 120, 'player').setCollideWorldBounds(true).setBounce(0.1);
    this.physics.add.collider(this.player, ground);

    // subtle idle animation
    this.tweens.add({
      targets: this.player,
      scaleX: 1.05,
      scaleY: 0.95,
      yoyo: true,
      repeat: -1,
      duration: 450
    });

    this.coin = this.physics.add.staticImage(780, 470, 'coin');
    this.tweens.add({
      targets: this.coin,
      angle: 360,
      duration: 1200,
      repeat: -1,
      ease: 'Linear'
    });

    this.physics.add.overlap(this.player, this.coin, () => {
      this.collectCoin();
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.onScoreChange(this.score);
  }

  private collectCoin(): void {
    this.score += 10;
    this.onScoreChange(this.score);

    const p = this.add.particles(this.coin.x, this.coin.y, 'spark', {
      speed: { min: 40, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 350,
      quantity: 20,
      blendMode: 'ADD'
    });
    p.explode(24, this.coin.x, this.coin.y);
    this.time.delayedCall(400, () => p.destroy());

    this.playTone(660, 0.08, 'triangle');

    this.coin.setPosition(Phaser.Math.Between(120, 900), Phaser.Math.Between(140, 470));
    this.coin.refreshBody();
  }

  private playTone(freq: number, duration = 0.08, type: OscillatorType = 'sine'): void {
    const ctx = (this.sound as any)?.context as AudioContext | undefined;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.001;

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  update(): void {
    const onGround = !!this.player.body?.touching.down;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-220);
      this.player.setTint(0x8fd3ff);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(220);
      this.player.setTint(0x8fd3ff);
    } else {
      this.player.setVelocityX(0);
      this.player.clearTint();
    }

    if (this.cursors.up.isDown && onGround) {
      this.player.setVelocityY(-420);
      this.playTone(280, 0.06, 'square');
    }

    if (!this.wasOnGround && onGround) {
      this.playTone(180, 0.04, 'sine');
    }

    this.wasOnGround = onGround;
  }
}
