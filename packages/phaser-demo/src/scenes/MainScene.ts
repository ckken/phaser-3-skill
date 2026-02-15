import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('MainScene');
  }

  create(): void {
    const g = this.add.graphics();

    g.fillStyle(0x7ac943, 1);
    g.fillRect(0, 0, 64, 64);
    g.generateTexture('player', 64, 64);

    g.clear();
    g.fillStyle(0x4b6584, 1);
    g.fillRect(0, 0, 960, 40);
    g.generateTexture('ground', 960, 40);

    g.destroy();

    this.add.text(20, 20, 'Phaser Demo on GitHub Pages', {
      fontSize: '24px',
      color: '#ffffff'
    });

    const ground = this.physics.add.staticImage(480, 520, 'ground');
    ground.refreshBody();

    this.player = this.physics.add.sprite(120, 120, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.1);

    this.physics.add.collider(this.player, ground);

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update(): void {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-220);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(220);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.player.body?.touching.down) {
      this.player.setVelocityY(-420);
    }
  }
}
