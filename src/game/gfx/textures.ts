import Phaser from 'phaser';
import { PixelGrid, HEART_PATTERN } from './PixelGrid';
import { THEME_PALETTES } from './palette';
import type { ThemeId } from '../levels/types';

export const TILE = 64;

const PLAYER_PX = 5;
const ENEMY_PX = 5;
const ICON_PX = 6;
const TILE_PX = 4; // 16x16 grid * 4 = 64 = TILE

// Player palette
const OUTLINE = 0x14121a;
const SKIN = 0xe8b98a;
const SKIN_SHADE = 0xc99a6e;
const HEADPHONE = 0x2fd8e0;
const HEADPHONE_DARK = 0x137880;
const SHIRT = 0x3f5fd6;
const SHIRT_SHADE = 0x2c46a8;
const PANTS = 0x232640;
const SHOE = 0x111118;

function buildPlayerTorso(): PixelGrid {
  const g = new PixelGrid(12, 16);
  // head (outline ring trick: big dark circle, smaller skin circle on top)
  g.circle(6, 4, 4, OUTLINE);
  g.circle(6, 4, 3, SKIN);
  g.set(5, 4, OUTLINE);
  g.set(8, 4, OUTLINE); // eyes
  g.rect(5, 6, 2, 1, SKIN_SHADE); // neck
  // headphones - the "gamer" tell
  g.rect(3, 0, 6, 1, HEADPHONE);
  g.rect(2, 1, 1, 2, HEADPHONE);
  g.rect(9, 1, 1, 2, HEADPHONE);
  g.rect(1, 2, 2, 3, HEADPHONE_DARK);
  g.rect(9, 2, 2, 3, HEADPHONE_DARK);
  // torso
  g.rect(3, 7, 6, 6, OUTLINE);
  g.rect(4, 8, 4, 5, SHIRT);
  g.rect(4, 8, 1, 5, SHIRT_SHADE);
  // arms
  g.rect(2, 8, 1, 3, SKIN);
  g.rect(9, 8, 1, 3, SKIN);
  return g;
}

function legsIdle(g: PixelGrid) {
  g.rect(4, 13, 2, 3, PANTS);
  g.rect(6, 13, 2, 3, PANTS);
  g.rect(4, 15, 2, 1, SHOE);
  g.rect(6, 15, 2, 1, SHOE);
}

function legsRun(g: PixelGrid, forwardLeft: boolean) {
  const [fx, fy, bx, by] = forwardLeft ? [2, 13, 7, 12] : [7, 13, 2, 12];
  g.rect(fx, fy, 2, 3, PANTS);
  g.rect(fx, fy + 2, 2, 1, SHOE);
  g.rect(bx, by, 2, 3, PANTS);
  g.rect(bx, by + 2, 2, 1, SHOE);
}

function legsJump(g: PixelGrid) {
  g.rect(3, 13, 2, 2, PANTS);
  g.rect(7, 13, 2, 2, PANTS);
  g.rect(3, 15, 2, 1, SHOE);
  g.rect(7, 15, 2, 1, SHOE);
}

export function generatePlayerTextures(scene: Phaser.Scene) {
  const idle = buildPlayerTorso();
  legsIdle(idle);
  idle.toTexture(scene, 'player-idle', PLAYER_PX);

  const run1 = buildPlayerTorso();
  legsRun(run1, true);
  run1.toTexture(scene, 'player-run1', PLAYER_PX);

  const run2 = buildPlayerTorso();
  legsRun(run2, false);
  run2.toTexture(scene, 'player-run2', PLAYER_PX);

  const jump = buildPlayerTorso();
  legsJump(jump);
  jump.toTexture(scene, 'player-jump', PLAYER_PX);
}

// --- Hearts & pickups ---

function heartTexture(scene: Phaser.Scene, key: string, color: number, shade: number, big = false) {
  const size = (big ? 9 : 7) + 2;
  const g = new PixelGrid(size, size);
  const rows = HEART_PATTERN;
  const ox = (big ? 1 : 0) + 1;
  const oy = (big ? 1 : 0) + 1;
  // dark outline so pale hearts (white) still read against pale backgrounds
  [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ].forEach(([dx, dy]) => g.stamp(rows, ox + dx, oy + dy, 0x1a1218));
  g.stamp(rows, ox, oy, color);
  g.set(ox + 4, oy + 2, shade);
  g.toTexture(scene, key, big ? ICON_PX : ICON_PX + 1);
}

export function generateHeartTextures(scene: Phaser.Scene) {
  heartTexture(scene, 'heart-red', 0xe8304a, 0xb01030);
  heartTexture(scene, 'heart-white', 0xf4f0ff, 0xc9c0ff, true);
  heartTexture(scene, 'heart-purple', 0xa040f0, 0x6a1ec0);
  heartTexture(scene, 'heart-orange', 0xffa020, 0xd06800);

  // sparkle overlay for the white marble heart (extra frame drawn as separate particle)
  const sp = new PixelGrid(3, 3);
  sp.set(1, 0, 0xffffff);
  sp.set(0, 1, 0xffffff);
  sp.set(1, 1, 0xffffff);
  sp.set(2, 1, 0xffffff);
  sp.set(1, 2, 0xffffff);
  sp.toTexture(scene, 'sparkle', 4);
}

export function generateFireflowerTexture(scene: Phaser.Scene) {
  const g = new PixelGrid(9, 9);
  g.circle(4, 3, 3, 0xff5522);
  g.circle(4, 3, 2, 0xffaa22);
  g.rect(3, 6, 2, 3, 0x2e8b3a);
  g.rect(1, 7, 2, 1, 0x2e8b3a);
  g.rect(6, 7, 2, 1, 0x2e8b3a);
  g.toTexture(scene, 'fireflower', ICON_PX);
}

export function generateFireballTexture(scene: Phaser.Scene) {
  const g = new PixelGrid(5, 5);
  g.circle(2, 2, 2, 0xffcc33);
  g.circle(2, 2, 1, 0xff5511);
  g.toTexture(scene, 'fireball', ICON_PX);
}

export function generateParticleTexture(scene: Phaser.Scene) {
  const g = new PixelGrid(2, 2);
  g.rect(0, 0, 2, 2, 0xffffff);
  g.toTexture(scene, 'particle', 4);
}

export function generateAuraTexture(scene: Phaser.Scene) {
  const g = new PixelGrid(20, 20);
  g.circle(10, 10, 10, 0xffffff);
  g.circle(10, 10, 7, 0x000000);
  // punch a soft hole back so it reads as a ring glow when tinted+alpha blended
  g.toTexture(scene, 'aura', 4);
}

// --- Enemies (neutral palette; recolored per-theme via setTint at spawn) ---

function enemySlime(frame: 1 | 2): PixelGrid {
  const g = new PixelGrid(10, 8);
  const squash = frame === 1 ? 0 : 1;
  g.circle(5, 5 - squash, 4, 0x8ad84a);
  g.circle(5, 5 - squash, 3, 0x62c02c);
  g.set(3, 4 - squash, 0x14120a);
  g.set(7, 4 - squash, 0x14120a);
  g.rect(1, 6, 8, 1, 0x3a7a1a);
  return g;
}

function enemySkeleton(frame: 1 | 2): PixelGrid {
  const g = new PixelGrid(9, 14);
  g.circle(4, 3, 3, 0xe8e4d8);
  g.set(3, 3, 0x14120a);
  g.set(5, 3, 0x14120a);
  g.rect(2, 6, 5, 5, 0xd8d4c4);
  g.rect(3, 7, 3, 1, 0x14120a);
  const legOffset = frame === 1 ? 0 : 1;
  g.rect(2 + legOffset, 11, 2, 3, 0xc8c4b4);
  g.rect(5 - legOffset, 11, 2, 3, 0xc8c4b4);
  g.rect(0, 7, 2, 4, 0xc8c4b4);
  g.rect(7, 7, 2, 4, 0xc8c4b4);
  return g;
}

function enemyDrake(frame: 1 | 2): PixelGrid {
  const g = new PixelGrid(16, 12);
  const wingFlap = frame === 1 ? 0 : 2;
  g.rect(4, 4, 8, 5, 0x9a3030);
  g.circle(11, 5, 3, 0x9a3030);
  g.set(13, 4, 0xffcc33);
  g.rect(0, 3 + wingFlap, 5, 2, 0x6a1e1e);
  g.rect(0, 7 - wingFlap, 5, 2, 0x6a1e1e);
  g.rect(3, 9, 2, 3, 0x7a2525);
  g.rect(9, 9, 2, 3, 0x7a2525);
  return g;
}

export function generateEnemyTextures(scene: Phaser.Scene) {
  enemySlime(1).toTexture(scene, 'enemy-slime-1', ENEMY_PX);
  enemySlime(2).toTexture(scene, 'enemy-slime-2', ENEMY_PX);
  enemySkeleton(1).toTexture(scene, 'enemy-skeleton-1', ENEMY_PX);
  enemySkeleton(2).toTexture(scene, 'enemy-skeleton-2', ENEMY_PX);
  enemyDrake(1).toTexture(scene, 'enemy-drake-1', ENEMY_PX);
  enemyDrake(2).toTexture(scene, 'enemy-drake-2', ENEMY_PX);
}

// --- Theme-specific tiles, hazards, checkpoint, portal ---

export function generateThemeTextures(scene: Phaser.Scene, theme: ThemeId) {
  const p = THEME_PALETTES[theme];

  const tile = new PixelGrid(16, 16);
  tile.rect(0, 0, 16, 16, p.platformBase);
  tile.rect(0, 0, 16, 2, p.platformDetail);
  tile.rect(0, 14, 16, 2, p.platformEdge);
  for (let i = 0; i < 4; i++) {
    tile.rect(i * 4, 2, 1, 12, p.platformEdge);
  }
  tile.toTexture(scene, `tile-${theme}`, TILE_PX);

  const spike = new PixelGrid(16, 16);
  for (let i = 0; i < 4; i++) {
    const bx = i * 4;
    for (let yy = 0; yy < 8; yy++) {
      const width = 4 - Math.floor((yy / 8) * 4);
      const startX = bx + Math.floor((4 - width) / 2);
      spike.rect(startX, 15 - yy, width, 1, p.hazard);
    }
  }
  spike.toTexture(scene, `spike-${theme}`, TILE_PX);

  const flag = new PixelGrid(10, 16);
  flag.rect(4, 0, 1, 16, 0x8a8070);
  flag.rect(5, 1, 5, 4, p.accent);
  flag.rect(5, 1, 5, 1, p.platformDetail);
  flag.toTexture(scene, `checkpoint-${theme}`, TILE_PX);

  const portal = new PixelGrid(14, 20);
  portal.circle(7, 10, 7, p.platformEdge);
  portal.circle(7, 10, 5, p.accent);
  portal.circle(7, 10, 3, p.skyBottom);
  portal.toTexture(scene, `portal-${theme}`, TILE_PX);
}

export function generateAllTextures(scene: Phaser.Scene) {
  generatePlayerTextures(scene);
  generateHeartTextures(scene);
  generateFireflowerTexture(scene);
  generateFireballTexture(scene);
  generateParticleTexture(scene);
  generateAuraTexture(scene);
  generateEnemyTextures(scene);
  (Object.keys(THEME_PALETTES) as ThemeId[]).forEach((theme) => generateThemeTextures(scene, theme));
}
