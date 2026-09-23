export type ThemeId =
  | 'test'
  | 'darkSouls'
  | 'seriousSam'
  | 'neverhood'
  | 'halfLife'
  | 'sekiro';

export interface PlatformDef {
  x: number; // tile coords
  y: number;
  w: number;
  h: number;
  moving?: { axis: 'x' | 'y'; range: number; speed: number };
  wobble?: boolean;
}

export type HazardType = 'spikes' | 'pit' | 'timedBarrier';

export interface HazardDef {
  x: number;
  y: number;
  w: number;
  h: number;
  type: HazardType;
  onMs?: number;
  offMs?: number;
  offsetMs?: number;
}

export type EnemyType = 'slime' | 'skeleton' | 'drake';

export interface EnemyDef {
  x: number;
  y: number;
  type: EnemyType;
  patrol: number; // tiles either side of x
  speed: number;
}

export type PickupType = 'heart' | 'heartWhite' | 'heartPurple' | 'coin' | 'fireflower';

export interface PickupDef {
  x: number;
  y: number;
  type: PickupType;
  secret?: boolean;
  requiresLevitate?: boolean;
}

export interface CheckpointDef {
  x: number;
  y: number;
}

export interface LevelDef {
  id: string;
  name: string;
  theme: ThemeId;
  widthTiles: number;
  heightTiles: number;
  playerStart: { x: number; y: number };
  finish: { x: number; y: number };
  groundY: number; // tile row that is the fallback ground level (visual)
  platforms: PlatformDef[];
  hazards: HazardDef[];
  enemies: EnemyDef[];
  pickups: PickupDef[];
  checkpoints: CheckpointDef[]; // exactly 3
  narrowLedgeFall?: boolean; // Dark Souls / Sekiro: one touch off a narrow ledge = fall
  musicKey: string;
}
