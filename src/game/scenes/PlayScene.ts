import Phaser from 'phaser';
import { getLevel, nextLevelId, LEVELS } from '../levels';
import type { LevelDef, HazardDef, PlatformDef, PickupType } from '../levels/types';
import { TILE } from '../gfx/textures';
import { THEME_PALETTES } from '../gfx/palette';
import { Player, type PlayerInputFrame } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Fireball } from '../entities/Fireball';
import { gameEvents, EVT, type HudState } from '../events';
import { touchInput } from '../touchInput';
import { audio } from '../audio';
import {
  loadSave,
  updateSave,
  invulnDurationMs,
  levitateDurationMs,
  startingLives,
  magnetRadius,
} from '../../state/progress';

interface MovingPlatform {
  sprite: Phaser.Physics.Arcade.Sprite;
  axis: 'x' | 'y';
  base: number;
  range: number;
  speed: number;
  dir: 1 | -1;
  prevX: number;
  prevY: number;
  w: number;
}

interface TimedBarrier {
  sprite: Phaser.Physics.Arcade.Sprite;
  onMs: number;
  offMs: number;
  offsetMs: number;
}

const HEARTS_TARGET = 10;
const KILL_Y_MARGIN = 200;

export class PlayScene extends Phaser.Scene {
  private levelId!: string;
  private level!: LevelDef;

  private player!: Player;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private enemies: Enemy[] = [];
  private fireballs!: Phaser.Physics.Arcade.Group;
  private pickupGroup!: Phaser.Physics.Arcade.StaticGroup;
  private checkpointSprites: Phaser.Physics.Arcade.Sprite[] = [];
  private finishSprite!: Phaser.Physics.Arcade.Sprite;

  private movingPlatforms: MovingPlatform[] = [];
  private timedBarriers: TimedBarrier[] = [];

  private hearts = 0;
  private coins = 0;
  private secretsFound = 0;
  private secretsTotal = 0;
  private lives = 3;
  private maxLives = 3;
  private activeCheckpoint = -1;
  private frozen = false;
  private levelEnded = false;

  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    fire: Phaser.Input.Keyboard.Key;
  };
  private lastKeyboardJumpAt = -Infinity;
  private lastKeyboardFireAt = -Infinity;

  constructor() {
    super('Play');
  }

  init(data: { levelId: string }) {
    this.levelId = data.levelId;
    this.level = getLevel(this.levelId);
    this.hearts = 0;
    this.coins = 0;
    this.secretsFound = 0;
    this.secretsTotal = this.level.pickups.filter((p) => p.secret).length;
    this.activeCheckpoint = -1;
    this.frozen = false;
    this.levelEnded = false;
    this.enemies = [];
    this.movingPlatforms = [];
    this.timedBarriers = [];
    this.checkpointSprites = [];
  }

  create() {
    const save = loadSave();
    this.maxLives = startingLives(save.upgrades.extraLife);
    this.lives = this.maxLives;

    const palette = THEME_PALETTES[this.level.theme];
    const widthPx = this.level.widthTiles * TILE;
    const heightPx = this.level.heightTiles * TILE;

    this.physics.world.setBounds(0, -400, widthPx, heightPx + 400);
    this.cameras.main.setBounds(0, -400, widthPx, heightPx + 400);

    this.drawBackground(palette, widthPx, heightPx);

    this.player = new Player(this, this.level.playerStart.x * TILE + TILE / 2, this.level.playerStart.y * TILE + TILE / 2);

    const platformGroup = this.physics.add.staticGroup();
    this.level.platforms.forEach((p) => this.buildPlatform(p, platformGroup));

    this.pickupGroup = this.physics.add.staticGroup();
    this.level.pickups.forEach((pk) => this.buildPickup(pk));

    this.enemyGroup = this.physics.add.group();
    this.level.enemies.forEach((e) => {
      const enemy = new Enemy(this, e.x * TILE + TILE / 2, e.y * TILE + TILE / 2, e.type, e.patrol, e.speed);
      enemy.setTint(palette.hazard);
      this.enemyGroup.add(enemy);
      this.enemies.push(enemy);
    });

    this.buildHazards(this.level.hazards, palette);

    this.level.checkpoints.forEach((cp, i) => {
      const sprite = this.physics.add.staticSprite(
        cp.x * TILE + TILE / 2,
        cp.y * TILE + TILE / 2,
        `checkpoint-${this.level.theme}`,
      );
      sprite.setData('index', i);
      sprite.setAlpha(0.55);
      sprite.setDepth(5);
      this.checkpointSprites.push(sprite);
    });

    this.finishSprite = this.physics.add.staticSprite(
      this.level.finish.x * TILE + TILE / 2,
      this.level.finish.y * TILE + TILE / 2,
      `portal-${this.level.theme}`,
    );
    this.finishSprite.setDepth(6);
    this.tweens.add({ targets: this.finishSprite, angle: 360, duration: 4000, repeat: -1 });

    this.fireballs = this.physics.add.group({ runChildUpdate: false });

    this.physics.add.collider(this.player, platformGroup);
    this.physics.add.collider(this.enemyGroup, platformGroup);
    this.physics.add.collider(this.fireballs, platformGroup, (fb) => (fb as Fireball).destroy());

    this.physics.add.overlap(this.player, this.pickupGroup, (_p, pk) => this.collectPickup(pk as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.enemyGroup, (_p, e) => this.onPlayerEnemy(e as Enemy));
    this.physics.add.overlap(this.fireballs, this.enemyGroup, (fb, e) => {
      (fb as Fireball).destroy();
      (e as Enemy).kill();
      audio.playSfx('stomp');
    });
    this.physics.add.overlap(this.player, this.checkpointSprites, (_p, cp) => this.onCheckpoint(cp as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.finishSprite, () => this.tryFinish());

    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    const kb = this.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      fire: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
    };

    audio.startMusic(this.level.theme);
    this.updateHud();
    if (import.meta.env.DEV) (window as unknown as { __scene: PlayScene }).__scene = this;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      audio.stopMusic();
    });
  }

  private drawBackground(palette: (typeof THEME_PALETTES)['test'], widthPx: number, heightPx: number) {
    const g = this.add.graphics();
    g.fillGradientStyle(palette.skyTop, palette.skyTop, palette.skyBottom, palette.skyBottom, 1);
    g.fillRect(0, -400, Math.max(widthPx, 2000), heightPx + 800);
    g.setScrollFactor(0.25);
    g.setDepth(-10);
    for (let i = 0; i < 14; i++) {
      const x = (i / 14) * widthPx + Math.random() * 100;
      const h = 80 + Math.random() * 220;
      const deco = this.add.rectangle(x, heightPx - h / 2, 70 + Math.random() * 60, h, palette.fogColor, 0.5);
      deco.setScrollFactor(0.5);
      deco.setDepth(-9);
    }
  }

  private buildPlatform(p: PlatformDef, staticGroup: Phaser.Physics.Arcade.StaticGroup) {
    const w = p.w * TILE;
    const h = p.h * TILE;
    const cx = p.x * TILE + w / 2;
    const cy = p.y * TILE + h / 2;
    const tex = `tile-${this.level.theme}`;

    if (p.moving) {
      const sprite = this.physics.add.sprite(cx, cy, tex);
      sprite.setDisplaySize(w, h);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      (sprite.body as Phaser.Physics.Arcade.Body).setImmovable(true);
      sprite.setDepth(4);
      const base = p.moving.axis === 'x' ? cx : cy;
      this.movingPlatforms.push({
        sprite,
        axis: p.moving.axis,
        base,
        range: p.moving.range * TILE,
        speed: p.moving.speed,
        dir: 1,
        prevX: cx,
        prevY: cy,
        w,
      });
      this.physics.add.collider(this.player, sprite);
      return;
    }

    const sprite = staticGroup.create(cx, cy, tex) as Phaser.Physics.Arcade.Sprite;
    sprite.setDisplaySize(w, h);
    (sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    sprite.setDepth(4);

    if (p.wobble) {
      this.tweens.add({
        targets: sprite,
        angle: { from: -1.5, to: 1.5 },
        duration: 1400 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private buildHazards(hazards: HazardDef[], palette: (typeof THEME_PALETTES)['test']) {
    hazards.forEach((hz) => {
      const w = hz.w * TILE;
      const h = hz.h * TILE;
      const cx = hz.x * TILE + w / 2;
      const cy = hz.y * TILE + h / 2;

      if (hz.type === 'spikes') {
        const sprite = this.physics.add.staticSprite(cx, cy, `spike-${this.level.theme}`);
        sprite.setDisplaySize(w, h);
        (sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        sprite.setDepth(6);
        this.physics.add.overlap(this.player, sprite, () => this.damagePlayer(cx));
        return;
      }

      if (hz.type === 'timedBarrier') {
        const sprite = this.physics.add.sprite(cx, cy, `spike-${this.level.theme}`);
        sprite.setDisplaySize(w, h);
        sprite.setTint(palette.accent);
        (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (sprite.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        sprite.setDepth(6);
        this.timedBarriers.push({
          sprite,
          onMs: hz.onMs ?? 1000,
          offMs: hz.offMs ?? 1000,
          offsetMs: hz.offsetMs ?? 0,
        });
        this.physics.add.collider(this.player, sprite, () => {
          if (sprite.visible) this.damagePlayer(cx);
        });
      }
    });
  }

  private buildPickup(pk: { x: number; y: number; type: PickupType }) {
    const key: Record<PickupType, string> = {
      heart: 'heart-red',
      heartWhite: 'heart-white',
      heartPurple: 'heart-purple',
      coin: 'heart-orange',
      fireflower: 'fireflower',
    };
    const sprite = this.pickupGroup.create(pk.x * TILE + TILE / 2, pk.y * TILE + TILE / 2, key[pk.type]) as Phaser.Physics.Arcade.Sprite;
    sprite.setData('type', pk.type);
    sprite.setDepth(8);
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 6,
      duration: 700 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private collectPickup(sprite: Phaser.Physics.Arcade.Sprite) {
    if (!sprite.active) return;
    const type = sprite.getData('type') as PickupType;
    const wasSecret = !!this.level.pickups.find(
      (p) => Math.abs(p.x * TILE + TILE / 2 - sprite.x) < 1 && Math.abs(p.y * TILE + TILE / 2 - sprite.y) < 1 && p.secret,
    );
    sprite.destroy();
    const save = loadSave();

    switch (type) {
      case 'heart':
        this.hearts++;
        audio.playSfx('heart');
        break;
      case 'heartWhite':
        this.player.activateAbility('invuln', invulnDurationMs(save.upgrades.invuln));
        audio.playSfx('ability');
        break;
      case 'heartPurple':
        this.player.activateAbility('levitate', levitateDurationMs(save.upgrades.levitate));
        audio.playSfx('ability');
        break;
      case 'coin':
        this.coins++;
        updateSave((d) => {
          d.coins += 1;
        });
        audio.playSfx('coin');
        break;
      case 'fireflower':
        this.player.grantFireball();
        audio.playSfx('ability');
        break;
    }
    if (wasSecret) this.secretsFound++;
    this.updateHud();
  }

  private onPlayerEnemy(enemy: Enemy) {
    if (!enemy.active || !enemy.alive) return;
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    const eBody = enemy.body as Phaser.Physics.Arcade.Body;
    const isStomp = pBody.velocity.y > 0 && pBody.bottom - eBody.top < 18;
    if (isStomp) {
      enemy.kill();
      this.player.bounceOffEnemy();
      audio.playSfx('stomp');
    } else {
      this.damagePlayer(enemy.x);
    }
  }

  private onCheckpoint(sprite: Phaser.Physics.Arcade.Sprite) {
    const idx = sprite.getData('index') as number;
    if (idx <= this.activeCheckpoint) return;
    this.activeCheckpoint = idx;
    sprite.setAlpha(1);
    this.tweens.add({ targets: sprite, scale: { from: 1.4, to: 1 }, duration: 300, ease: 'Back.easeOut' });
    audio.playSfx('checkpoint');
    gameEvents.emit(EVT.CHECKPOINT, idx);
  }

  private tryFinish() {
    if (this.levelEnded) return;
    if (this.hearts < HEARTS_TARGET) {
      this.showToast(`Нужно ещё ${HEARTS_TARGET - this.hearts} сердечек!`);
      return;
    }
    this.levelEnded = true;
    this.frozen = true;
    audio.stopMusic();
    audio.playSfx('win');

    updateSave((d) => {
      const prev = d.levelResults[this.levelId];
      d.levelResults[this.levelId] = {
        completed: true,
        bestHearts: Math.max(prev?.bestHearts ?? 0, this.hearts),
        secretsFound: Math.max(prev?.secretsFound ?? 0, this.secretsFound),
      };
      const nextId = nextLevelId(this.levelId);
      if (nextId) {
        const idxNext = LEVELS.findIndex((l) => l.id === nextId);
        if (idxNext > d.unlockedLevelIndex) d.unlockedLevelIndex = idxNext;
      }
    });

    gameEvents.emit(EVT.LEVEL_END, {
      levelId: this.levelId,
      won: true,
      hearts: this.hearts,
      heartsTarget: HEARTS_TARGET,
      coinsCollected: this.coins,
      secretsFound: this.secretsFound,
      secretsTotal: this.secretsTotal,
    });
  }

  private showToast(text: string) {
    const t = this.add
      .text(this.cameras.main.width / 2, 80, text, {
        fontSize: '22px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 12, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0.5);
    this.tweens.add({ targets: t, alpha: 0, delay: 1200, duration: 400, onComplete: () => t.destroy() });
  }

  private damagePlayer(fromX: number) {
    if (this.frozen) return;
    if (!this.player.applyHit(fromX)) return;
    this.lives--;
    audio.playSfx('hurt');
    this.updateHud();
    this.frozen = true;
    (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.time.delayedCall(500, () => {
      if (this.lives <= 0) {
        this.restartLevel();
      } else {
        this.respawnAtCheckpoint();
      }
    });
  }

  private respawnAtCheckpoint() {
    const target =
      this.activeCheckpoint >= 0
        ? this.level.checkpoints[this.activeCheckpoint]
        : this.level.playerStart;
    this.player.resetAtCheckpoint(target.x * TILE + TILE / 2, target.y * TILE + TILE / 2);
    (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
    this.frozen = false;
  }

  private restartLevel() {
    audio.playSfx('lose');
    this.scene.restart({ levelId: this.levelId });
  }

  update(time: number, delta: number) {
    if (!this.player?.active) return;

    // world-bottom fall death
    const heightPx = this.level.heightTiles * TILE;
    if (!this.frozen && this.player.y > heightPx + KILL_Y_MARGIN) {
      this.damagePlayer(this.player.x - 1);
    }

    this.updateMovingPlatforms(time);
    this.updateTimedBarriers(time);
    this.updateMagnet();

    if (!this.frozen) {
      const kb = this.keys;
      if (Phaser.Input.Keyboard.JustDown(kb.up) || Phaser.Input.Keyboard.JustDown(kb.space)) {
        this.lastKeyboardJumpAt = time;
      }
      if (Phaser.Input.Keyboard.JustDown(kb.fire)) {
        this.lastKeyboardFireAt = time;
      }
      const frame: PlayerInputFrame = {
        left: kb.left.isDown || kb.a.isDown || touchInput.left,
        right: kb.right.isDown || kb.d.isDown || touchInput.right,
        jumpHeld: kb.up.isDown || kb.space.isDown || touchInput.jumpHeld,
        jumpPressedAt: Math.max(this.lastKeyboardJumpAt, touchInput.jumpPressedAt),
        firePressedAt: Math.max(this.lastKeyboardFireAt, touchInput.firePressedAt),
      };
      this.player.handleInput(frame, time, delta);

      if (this.player.fireRequested) {
        this.player.fireRequested = false;
        const fb = new Fireball(this, this.player.x + this.player.facing * 30, this.player.y - 6, this.player.facing);
        this.fireballs.add(fb);
        audio.playSfx('fireball');
      }
    }

    this.updateHud();
  }

  private updateMovingPlatforms(time: number) {
    this.movingPlatforms.forEach((mp) => {
      const t = time * mp.speed * 0.001;
      const offset = Math.sin(t) * mp.range;
      const newX = mp.axis === 'x' ? mp.base + offset : mp.sprite.x;
      const newY = mp.axis === 'y' ? mp.base + offset : mp.sprite.y;
      const dx = newX - mp.prevX;
      const dy = newY - mp.prevY;
      (mp.sprite.body as Phaser.Physics.Arcade.Body).reset(newX, newY);

      const pBody = this.player.body as Phaser.Physics.Arcade.Body;
      const standingOn =
        pBody.touching.down &&
        Math.abs(this.player.y + pBody.halfHeight - (mp.sprite.y - mp.sprite.displayHeight / 2)) < 6 &&
        Math.abs(this.player.x - mp.sprite.x) < mp.w / 2 + 20;
      if (standingOn) {
        this.player.x += dx;
        this.player.y += dy;
      }
      mp.prevX = newX;
      mp.prevY = newY;
    });
  }

  private updateTimedBarriers(time: number) {
    this.timedBarriers.forEach((tb) => {
      const cycle = tb.onMs + tb.offMs;
      const phase = (time + tb.offsetMs) % cycle;
      const active = phase < tb.onMs;
      tb.sprite.setVisible(active);
      (tb.sprite.body as Phaser.Physics.Arcade.Body).enable = active;
    });
  }

  private updateMagnet() {
    const save = loadSave();
    const radius = magnetRadius(save.upgrades.magnet);
    if (radius <= 0) return;
    for (const child of this.pickupGroup.children) {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (!sprite.active) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (d < radius && d > 4) {
        const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
        sprite.x += Math.cos(angle) * 6;
        sprite.y += Math.sin(angle) * 6;
      }
    }
  }

  private updateHud() {
    const save = loadSave();
    const state: HudState = {
      hearts: this.hearts,
      heartsTarget: HEARTS_TARGET,
      lives: this.lives,
      maxLives: this.maxLives,
      coins: save.coins,
      ability: this.player.ability,
      abilityRemainingMs: Math.max(0, this.player.abilityEndsAt - this.time.now),
      hasFireball: this.player.hasFireball,
      fireballCharges: -1,
    };
    gameEvents.emit(EVT.HUD_UPDATE, state);
  }
}
