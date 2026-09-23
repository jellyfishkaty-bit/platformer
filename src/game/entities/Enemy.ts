import Phaser from 'phaser';
import type { EnemyType } from '../levels/types';
import { TILE } from '../gfx/textures';

const FRAME_SWAP_MS = 260;
const GLITCH_INTERVAL_MS = 180;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  type: EnemyType;
  alive = true;

  private minX: number;
  private maxX: number;
  private speed: number;
  private dir: 1 | -1 = 1;
  private baseY: number;
  private frameTimer = 0;
  private frameToggle = false;
  private lastGlitchAt = 0;
  private ghost: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType, patrolTiles: number, speed: number) {
    super(scene, x, y, `enemy-${type}-1`);
    this.type = type;
    this.baseY = y;
    this.minX = x - patrolTiles * TILE;
    this.maxX = x + patrolTiles * TILE;
    this.speed = speed;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.width * 0.75, this.height * 0.8);

    if (type === 'drake') {
      body.setAllowGravity(false);
    } else {
      body.setGravityY(1750);
      body.setCollideWorldBounds(false);
    }
    this.setDepth(15);
    body.setVelocityX(this.dir * this.speed);

    this.ghost = scene.add.image(x, y, this.texture.key);
    this.ghost.setBlendMode(Phaser.BlendModes.ADD);
    this.ghost.setAlpha(0);
    this.ghost.setDepth(14);
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    const scene = this.scene;
    const emitter = scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 60, max: 220 },
      lifespan: 350,
      scale: { start: 3, end: 0 },
      tint: 0xffffff,
      quantity: 10,
      emitting: false,
    });
    emitter.explode(10);
    scene.time.delayedCall(400, () => emitter.destroy());
    this.ghost.destroy();
    this.destroy();
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (!this.alive) return;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.type === 'drake') {
      this.y = this.baseY + Math.sin(time / 260) * 10;
    }

    if ((this.dir === 1 && this.x >= this.maxX) || (this.dir === -1 && this.x <= this.minX)) {
      this.dir = this.dir === 1 ? -1 : 1;
      body.setVelocityX(this.dir * this.speed);
    }
    this.setFlipX(this.dir === -1);

    this.frameTimer += delta;
    if (this.frameTimer >= FRAME_SWAP_MS) {
      this.frameTimer = 0;
      this.frameToggle = !this.frameToggle;
      this.setTexture(`enemy-${this.type}-${this.frameToggle ? 2 : 1}`);
    }

    // glitch: chromatic ghost duplicate that jitters and flickers, plus tint pops
    if (time - this.lastGlitchAt > GLITCH_INTERVAL_MS) {
      this.lastGlitchAt = time;
      if (Math.random() < 0.55) {
        const jitter = 3;
        this.ghost.setTexture(this.texture.key);
        this.ghost.setPosition(
          this.x + (Math.random() - 0.5) * jitter * 2,
          this.y + (Math.random() - 0.5) * jitter * 2,
        );
        this.ghost.setFlipX(this.flipX);
        this.ghost.setTint(Math.random() < 0.5 ? 0xff33aa : 0x33ffee);
        this.ghost.setAlpha(0.45);
      } else {
        this.ghost.setAlpha(0);
      }
      if (Math.random() < 0.15) {
        this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        this.scene.time.delayedCall(40, () => this.clearTint());
      }
    } else if (this.ghost.alpha > 0) {
      this.ghost.setAlpha(this.ghost.alpha * 0.85);
    }
  }

  destroy(fromScene?: boolean) {
    this.ghost?.destroy();
    super.destroy(fromScene);
  }
}
