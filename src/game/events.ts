import Phaser from 'phaser';

export type AbilityKind = 'none' | 'invuln' | 'levitate';

export interface HudState {
  hearts: number;
  heartsTarget: number;
  lives: number;
  maxLives: number;
  coins: number;
  ability: AbilityKind;
  abilityRemainingMs: number;
  hasFireball: boolean;
  fireballCharges: number;
}

export interface LevelEndPayload {
  levelId: string;
  won: boolean;
  hearts: number;
  heartsTarget: number;
  coinsCollected: number;
  secretsFound: number;
  secretsTotal: number;
}

class GameEvents extends Phaser.Events.EventEmitter {}

/** Shared bus between React UI and Phaser scenes. */
export const gameEvents = new GameEvents();

export const EVT = {
  HUD_UPDATE: 'hud-update',
  LEVEL_END: 'level-end',
  CHECKPOINT: 'checkpoint',
  REQUEST_EXIT: 'request-exit',
} as const;
