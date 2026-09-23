import Phaser from 'phaser';
import type { AbilityKind } from '../events';

export interface PlayerInputFrame {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressedAt: number;
  firePressedAt: number;
}

const MOVE_SPEED = 260;
const ACCEL = 2000;
const AIR_ACCEL = 1400;
const DRAG = 1600;
const JUMP_VELOCITY = -640;
const GRAVITY_Y = 1750;
const LEVITATE_GRAVITY_MUL = 0.35;
const LEVITATE_FALL_CAP = 90;
const MAX_FALL_SPEED = 920;
const COYOTE_MS = 130;
const BUFFER_MS = 130;
const POST_HIT_INVULN_MS = 1500;
const KNOCKBACK_X = 320;
const KNOCKBACK_Y = -320;
const RUN_FRAME_MS = 110;

export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: 1 | -1 = 1;

  ability: AbilityKind = 'none';
  abilityEndsAt = 0;
  hasFireball = false;

  private lastGroundedAt = 0;
  private lastJumpPressedAt = -Infinity;
  private jumpConsumed = false;
  private extraJumpAvailable = false;
  private extraJumpUsed = false;

  private postHitInvulnUntil = 0;
  private blinkOn = true;
  private lastBlinkToggle = 0;

  private runFrameTimer = 0;
  private runFrameToggle = false;
  private lastFireHandled = 0;

  private aura: Phaser.GameObjects.Image;

  fireRequested = false;
  onLand?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(34, 72);
    body.setMaxVelocity(MOVE_SPEED + 40, MAX_FALL_SPEED);
    body.setDragX(DRAG);
    body.setGravityY(GRAVITY_Y);
    this.setDepth(20);

    this.aura = scene.add.image(x, y, 'aura');
    this.aura.setBlendMode(Phaser.BlendModes.ADD);
    this.aura.setAlpha(0);
    this.aura.setDepth(19);
    this.aura.setScale(3.2);
  }

  activateAbility(kind: AbilityKind, durationMs: number) {
    this.ability = kind;
    this.abilityEndsAt = this.scene.time.now + durationMs;
    if (kind === 'levitate') {
      this.extraJumpAvailable = true;
    }
  }

  grantFireball() {
    this.hasFireball = true;
  }

  get isAbilityInvulnerable() {
    return this.ability === 'invuln' && this.scene.time.now < this.abilityEndsAt;
  }

  get isPostHitInvulnerable() {
    return this.scene.time.now < this.postHitInvulnUntil;
  }

  get isInvulnerable() {
    return this.isAbilityInvulnerable || this.isPostHitInvulnerable;
  }

  /** Returns true if the hit actually applied damage/knockback. */
  applyHit(fromX: number): boolean {
    if (this.isInvulnerable) return false;
    const dir = this.x < fromX ? -1 : 1;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(dir * KNOCKBACK_X);
    body.setVelocityY(KNOCKBACK_Y);
    this.postHitInvulnUntil = this.scene.time.now + POST_HIT_INVULN_MS;
    return true;
  }

  bounceOffEnemy() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-460);
  }

  resetAtCheckpoint(x: number, y: number) {
    this.setPosition(x, y);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.postHitInvulnUntil = this.scene.time.now + 800;
    this.ability = 'none';
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.aura.setPosition(this.x, this.y - 4);
    if (this.ability !== 'none' && time > this.abilityEndsAt) {
      this.ability = 'none';
      this.extraJumpAvailable = false;
    }
  }

  handleInput(input: PlayerInputFrame, time: number, delta: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) {
      this.lastGroundedAt = time;
      this.extraJumpUsed = false;
    }

    // horizontal movement with acceleration/deceleration
    const dir = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const accel = onGround ? ACCEL : AIR_ACCEL;
    if (dir !== 0) {
      body.setAccelerationX(dir * accel);
      this.facing = dir > 0 ? 1 : -1;
      this.setFlipX(this.facing < 0);
    } else {
      body.setAccelerationX(0);
    }

    // jump buffering + coyote time
    if (input.jumpPressedAt > this.lastJumpPressedAt) {
      this.lastJumpPressedAt = input.jumpPressedAt;
      this.jumpConsumed = false;
    }
    const bufferActive = !this.jumpConsumed && time - this.lastJumpPressedAt <= BUFFER_MS;
    const coyoteActive = time - this.lastGroundedAt <= COYOTE_MS;

    if (bufferActive && (onGround || coyoteActive)) {
      body.setVelocityY(JUMP_VELOCITY);
      this.jumpConsumed = true;
      this.lastGroundedAt = -Infinity;
    } else if (bufferActive && this.extraJumpAvailable && !this.extraJumpUsed && !onGround) {
      body.setVelocityY(JUMP_VELOCITY * 0.9);
      this.jumpConsumed = true;
      this.extraJumpUsed = true;
    }

    // levitation: while ability active and holding jump while falling, float
    if (this.ability === 'levitate' && input.jumpHeld && body.velocity.y > 0) {
      body.setGravityY(GRAVITY_Y * LEVITATE_GRAVITY_MUL);
      if (body.velocity.y > LEVITATE_FALL_CAP) body.setVelocityY(LEVITATE_FALL_CAP);
    } else {
      body.setGravityY(GRAVITY_Y);
    }

    if (input.firePressedAt > this.lastFireHandled) {
      this.lastFireHandled = input.firePressedAt;
      this.fireRequested = this.hasFireball;
    }

    this.updateAnimation(onGround, dir, delta);
    this.updateVisualFeedback(time);
  }

  private updateAnimation(onGround: boolean, dir: number, delta: number) {
    if (!onGround) {
      this.setTexture('player-jump');
      return;
    }
    if (dir === 0) {
      this.setTexture('player-idle');
      return;
    }
    this.runFrameTimer += delta;
    if (this.runFrameTimer >= RUN_FRAME_MS) {
      this.runFrameTimer = 0;
      this.runFrameToggle = !this.runFrameToggle;
    }
    this.setTexture(this.runFrameToggle ? 'player-run1' : 'player-run2');
  }

  private updateVisualFeedback(time: number) {
    // post-hit invulnerability blink
    if (this.isPostHitInvulnerable) {
      if (time - this.lastBlinkToggle > 70) {
        this.lastBlinkToggle = time;
        this.blinkOn = !this.blinkOn;
      }
      this.setAlpha(this.blinkOn ? 1 : 0.25);
    } else {
      this.setAlpha(1);
    }

    // ability aura
    if (this.ability === 'invuln') {
      this.aura.setTint(0xffffff);
      this.aura.setAlpha(0.35 + Math.sin(time / 90) * 0.15);
    } else if (this.ability === 'levitate') {
      this.aura.setTint(0xa040f0);
      this.aura.setAlpha(0.35 + Math.sin(time / 90) * 0.15);
    } else {
      this.aura.setAlpha(0);
    }
  }

  destroy(fromScene?: boolean) {
    this.aura.destroy();
    super.destroy(fromScene);
  }
}
