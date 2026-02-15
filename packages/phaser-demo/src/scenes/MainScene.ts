import Phaser from 'phaser';
import type { MutableRefObject } from 'react';
import type { ControlState } from '../GameView';

type Viewport = { width: number; height: number; portrait: boolean };

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private coin!: Phaser.Physics.Arcade.StaticImage;
  private score = 0;
  private wasOnGround = false;
  private jumpPressed = false;

  constructor(
    private onScoreChange: (score: number) => void,
    private controlsRef: MutableRefObject<ControlState>,
    private viewport: Viewport
  ) {
    super('MainScene');
  }

  create(): void {
    const W = this.viewport.width;
    const H = this.viewport.height;

    const groundH = Math.max(36, Math.round(H * 0.07));
    const platformW = this.viewport.portrait ? Math.round(W * 0.28) : Math.round(W * 0.2);
    const platformH = Math.max(16, Math.round(H * 0.025));
    const playerSize = this.viewport.portrait ? 52 : 58;

    const g = this.add.graphics();
    g.fillStyle(0x121826, 1).fillRect(0, 0, W, H).generateTexture('bg', W, H);
    g.clear().fillStyle(0x2a3652, 1).fillRect(0, 0, Math.round(W * 0.35), Math.round(H * 0.16)).generateTexture('hill', Math.round(W * 0.35), Math.round(H * 0.16));
    g.clear().fillStyle(0x7ac943, 1).fillRect(0, 0, playerSize, playerSize).generateTexture('player', playerSize, playerSize);
    g.clear().fillStyle(0x4b6584, 1).fillRect(0, 0, W, groundH).generateTexture('ground', W, groundH);
    g.clear().fillStyle(0x5f7599, 1).fillRect(0, 0, platformW, platformH).generateTexture('platform', platformW, platformH);
    g.clear().fillStyle(0xffc857, 1).fillCircle(12, 12, 12).generateTexture('coin', 24, 24);
    g.clear().fillStyle(0xffffff, 1).fillCircle(3, 3, 3).generateTexture('spark', 6, 6);
    g.destroy();

    this.add.image(W / 2, H / 2, 'bg');
    const hills = this.add.tileSprite(W / 2, H - groundH - Math.round(H * 0.08), W, Math.round(H * 0.18), 'hill').setAlpha(0.35);

    const ground = this.physics.add.staticImage(W / 2, H - groundH / 2, 'ground');
    ground.refreshBody();

    const pYs = this.viewport.portrait
      ? [Math.round(H * 0.72), Math.round(H * 0.58), Math.round(H * 0.44), Math.round(H * 0.32)]
      : [Math.round(H * 0.78), Math.round(H * 0.63), Math.round(H * 0.5)];
    const pXs = this.viewport.portrait
      ? [Math.round(W * 0.23), Math.round(W * 0.72), Math.round(W * 0.35), Math.round(W * 0.78)]
      : [Math.round(W * 0.28), Math.round(W * 0.66), Math.round(W * 0.84)];

    const platforms = pXs.map((x, i) => {
      const p = this.physics.add.staticImage(x, pYs[i], 'platform');
      p.refreshBody();
      return p;
    });

    this.player = this.physics.add
      .sprite(Math.round(W * 0.15), Math.round(H * 0.2), 'player')
      .setCollideWorldBounds(true)
      .setBounce(0.06)
      .setDragX(1200)
      .setMaxVelocity(340, 900);

    this.physics.add.collider(this.player, ground);
    platforms.forEach((p) => this.physics.add.collider(this.player, p));

    this.tweens.add({ targets: this.player, scaleX: 1.04, scaleY: 0.96, yoyo: true, repeat: -1, duration: 420 });

    this.coin = this.physics.add.staticImage(Math.round(W * 0.82), Math.round(H * 0.22), 'coin');
    this.tweens.add({ targets: this.coin, angle: 360, duration: 1100, repeat: -1, ease: 'Linear' });

    this.physics.add.overlap(this.player, this.coin, () => this.collectCoin());

    this.cursors = this.input.keyboard.createCursorKeys();
    this.onScoreChange(this.score);

    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        hills.tilePositionX += this.viewport.portrait ? 0.18 : 0.3;
      }
    });
  }

  private collectCoin(): void {
    const W = this.viewport.width;
    const H = this.viewport.height;

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
    this.time.delayedCall(420, () => p.destroy());

    this.playTone(660, 0.08, 'triangle');

    this.coin.setPosition(Phaser.Math.Between(Math.round(W * 0.12), Math.round(W * 0.9)), Phaser.Math.Between(Math.round(H * 0.14), Math.round(H * 0.82)));
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
    const ctl = this.controlsRef.current;

    const goLeft = this.cursors.left.isDown || ctl.left;
    const goRight = this.cursors.right.isDown || ctl.right;
    const wantJump = this.cursors.up.isDown || ctl.jump;

    const speed = this.viewport.portrait ? 220 : 250;
    const jumpV = this.viewport.portrait ? -520 : -450;

    if (goLeft) {
      this.player.setVelocityX(-speed);
      this.player.setTint(0x8fd3ff);
    } else if (goRight) {
      this.player.setVelocityX(speed);
      this.player.setTint(0x8fd3ff);
    } else {
      this.player.setVelocityX(0);
      this.player.clearTint();
    }

    if (wantJump && onGround && !this.jumpPressed) {
      this.player.setVelocityY(jumpV);
      this.playTone(280, 0.06, 'square');
    }
    this.jumpPressed = wantJump;

    if (!this.wasOnGround && onGround) {
      this.playTone(180, 0.04, 'sine');
    }
    this.wasOnGround = onGround;
  }
}
