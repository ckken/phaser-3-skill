import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score = 0;

  constructor(private onScoreChange: (score: number) => void) {
    super('MainScene');
  }

  create(): void {
    const g = this.add.graphics();
    g.fillStyle(0x7ac943, 1).fillRect(0, 0, 64, 64).generateTexture('player', 64, 64);
    g.clear().fillStyle(0x4b6584, 1).fillRect(0, 0, 960, 40).generateTexture('ground', 960, 40);
    g.clear().fillStyle(0xffc857, 1).fillCircle(12, 12, 12).generateTexture('coin', 24, 24);
    g.destroy();

    this.add.text(20, 20, 'React + Phaser Demo', { fontSize: '24px', color: '#fff' });

    const ground = this.physics.add.staticImage(480, 520, 'ground');
    ground.refreshBody();

    this.player = this.physics.add.sprite(120, 120, 'player').setCollideWorldBounds(true).setBounce(0.1);
    this.physics.add.collider(this.player, ground);

    const coin = this.physics.add.staticImage(780, 470, 'coin');
    this.physics.add.overlap(this.player, coin, () => {
      this.score += 10;
      this.onScoreChange(this.score);
      coin.setPosition(Phaser.Math.Between(120, 900), Phaser.Math.Between(140, 470));
      coin.refreshBody();
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.onScoreChange(this.score);
  }

  update(): void {
    if (this.cursors.left.isDown) this.player.setVelocityX(-220);
    else if (this.cursors.right.isDown) this.player.setVelocityX(220);
    else this.player.setVelocityX(0);

    if (this.cursors.up.isDown && this.player.body?.touching.down) {
      this.player.setVelocityY(-420);
    }
  }
}
