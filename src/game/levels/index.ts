import type { LevelDef } from './types';
import { testLevel } from './testLevel';
import { darkSoulsLevel } from './darkSouls';
import { seriousSamLevel } from './seriousSam';
import { neverhoodLevel } from './neverhood';
import { halfLifeLevel } from './halfLife';
import { sekiroLevel } from './sekiro';

export const LEVELS: LevelDef[] = [
  testLevel,
  darkSoulsLevel,
  seriousSamLevel,
  neverhoodLevel,
  halfLifeLevel,
  sekiroLevel,
];

export function getLevel(id: string): LevelDef {
  const lvl = LEVELS.find((l) => l.id === id);
  if (!lvl) throw new Error(`Unknown level: ${id}`);
  return lvl;
}

export function nextLevelId(id: string): string | null {
  const idx = LEVELS.findIndex((l) => l.id === id);
  if (idx === -1 || idx === LEVELS.length - 1) return null;
  return LEVELS[idx + 1].id;
}

export { type LevelDef };
