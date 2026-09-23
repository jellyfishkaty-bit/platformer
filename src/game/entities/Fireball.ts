import Phaser from 'phaser';

const SPEED = 520;
const LIFESPAN_MS = 1400;

export class Fireball extends Phaser.Physics.Arcade.Sprite {
  private bornAt: number;

  constructor(scene: Phaser.Scene, x: number, y: number, dir: 1 | -1) {
    super(scene, x, y, 'fireball');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityX(dir * SPEED);
    body.setSize(this.width * 0.8, this.height * 0.8);
    this.setDepth(18);
    this.bornAt = scene.time.now;
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.angle += delta * 0.8;
    if (time - this.bornAt > LIFESPAN_MS) {
      this.destroy();
    }
  }
}
