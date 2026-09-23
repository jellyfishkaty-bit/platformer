import type { LevelDef } from './types';

// Signature mechanic: timed barriers (steam/energy gates) that toggle on/off —
// you have to read the rhythm and dash through the gap.
export const halfLifeLevel: LevelDef = {
  id: 'halfLife',
  name: 'Чёрная Шахта',
  theme: 'halfLife',
  widthTiles: 62,
  heightTiles: 12,
  groundY: 10,
  playerStart: { x: 2, y: 9 },
  finish: { x: 59, y: 9 },
  musicKey: 'halfLife',
  platforms: [
    { x: 0, y: 10, w: 10, h: 2 },
    { x: 12, y: 10, w: 10, h: 2 },
    { x: 24, y: 10, w: 12, h: 2 },
    { x: 38, y: 10, w: 24, h: 2 },
    { x: 30, y: 6, w: 3, h: 1 },
    { x: 44, y: 7, w: 3, h: 1 },
  ],
  hazards: [
    { x: 16, y: 9, w: 1, h: 1, type: 'spikes' },
    { x: 22, y: 6, w: 1, h: 4, type: 'timedBarrier', onMs: 900, offMs: 1100, offsetMs: 0 },
    { x: 50, y: 5, w: 1, h: 5, type: 'timedBarrier', onMs: 800, offMs: 1000, offsetMs: 400 },
  ],
  enemies: [
    { x: 8, y: 9, type: 'slime', patrol: 1, speed: 85 },
    { x: 14, y: 9, type: 'skeleton', patrol: 1, speed: 90 },
    { x: 30, y: 9, type: 'skeleton', patrol: 1.5, speed: 95 },
    { x: 35, y: 6, type: 'drake', patrol: 2, speed: 100 },
    { x: 46, y: 9, type: 'skeleton', patrol: 1, speed: 100 },
  ],
  pickups: [
    { x: 2, y: 9, type: 'heart' },
    { x: 5, y: 9, type: 'heart' },
    { x: 10, y: 9, type: 'fireflower' },
    { x: 18, y: 9, type: 'heart' },
    { x: 26, y: 9, type: 'heart' },
    { x: 27, y: 9, type: 'heartPurple' },
    { x: 30, y: 6, type: 'heart' },
    { x: 36, y: 9, type: 'heart' },
    { x: 42, y: 9, type: 'heartWhite' },
    { x: 46, y: 9, type: 'heart' },
    { x: 54, y: 9, type: 'heart' },
    { x: 58, y: 9, type: 'heart' },
    { x: 8, y: 9, type: 'coin' },
    { x: 20, y: 9, type: 'heart' },
    { x: 56, y: 3, type: 'coin', secret: true, requiresLevitate: true },
    { x: 57, y: 3, type: 'coin', secret: true, requiresLevitate: true },
  ],
  checkpoints: [
    { x: 24, y: 9 },
    { x: 38, y: 9 },
    { x: 52, y: 9 },
  ],
};
