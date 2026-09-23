const SAVE_KEY = 'gamer-platformer-save-v1';

export interface UpgradeState {
  invuln: number; // tier 0-3, extends white heart duration
  levitate: number; // tier 0-3, extends purple heart duration
  extraLife: number; // tier 0-2, +1 starting life per tier
  magnet: number; // tier 0-3, pickup attract radius
}

export interface LevelResult {
  completed: boolean;
  bestHearts: number;
  secretsFound: number;
}

export interface SaveData {
  coins: number;
  unlockedLevelIndex: number;
  levelResults: Record<string, LevelResult>;
  upgrades: UpgradeState;
  musicOn: boolean;
  sfxOn: boolean;
}

function defaultSave(): SaveData {
  return {
    coins: 0,
    unlockedLevelIndex: 0,
    levelResults: {},
    upgrades: { invuln: 0, levitate: 0, extraLife: 0, magnet: 0 },
    musicOn: true,
    sfxOn: true,
  };
}

let cache: SaveData | null = null;

export function loadSave(): SaveData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      cache = { ...defaultSave(), ...parsed, upgrades: { ...defaultSave().upgrades, ...parsed.upgrades } };
      return cache;
    }
  } catch {
    // corrupted save, fall through to defaults
  }
  cache = defaultSave();
  return cache;
}

export function saveSave(data: SaveData) {
  cache = data;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable, progress stays in-memory for this session
  }
}

export function updateSave(mutator: (draft: SaveData) => void) {
  const data = loadSave();
  const draft: SaveData = JSON.parse(JSON.stringify(data));
  mutator(draft);
  saveSave(draft);
  return draft;
}

// --- Upgrade definitions ---

export interface UpgradeDef {
  id: keyof UpgradeState;
  name: string;
  description: string;
  maxTier: number;
  costs: number[]; // cost to go from tier N to N+1, index = current tier
  effectLabel: (tier: number) => string;
}

export const UPGRADE_DEFS: UpgradeDef[] = [
  {
    id: 'invuln',
    name: 'Мраморная стойкость',
    description: 'Дольше длится неуязвимость от белого сердечка',
    maxTier: 3,
    costs: [50, 120, 250],
    effectLabel: (tier) => `${10 + tier * 4} сек`,
  },
  {
    id: 'levitate',
    name: 'Фиолетовый полёт',
    description: 'Дольше длится двойной прыжок/левитация',
    maxTier: 3,
    costs: [50, 120, 250],
    effectLabel: (tier) => `${10 + tier * 4} сек`,
  },
  {
    id: 'extraLife',
    name: 'Дополнительная жизнь',
    description: 'Увеличивает стартовый запас жизней',
    maxTier: 2,
    costs: [80, 200],
    effectLabel: (tier) => `${3 + tier} жизни`,
  },
  {
    id: 'magnet',
    name: 'Магнит сердечек',
    description: 'Притягивает ближайшие сердечки и монеты',
    maxTier: 3,
    costs: [60, 140, 280],
    effectLabel: (tier) => (tier === 0 ? 'выкл' : `радиус ${tier * 40}px`),
  },
];

export function invulnDurationMs(tier: number) {
  return (10 + tier * 4) * 1000;
}

export function levitateDurationMs(tier: number) {
  return (10 + tier * 4) * 1000;
}

export function startingLives(tier: number) {
  return 3 + tier;
}

export function magnetRadius(tier: number) {
  return tier === 0 ? 0 : tier * 40;
}

export function canAfford(save: SaveData, def: UpgradeDef): boolean {
  const tier = save.upgrades[def.id];
  if (tier >= def.maxTier) return false;
  return save.coins >= def.costs[tier];
}

export function purchaseUpgrade(id: keyof UpgradeState): SaveData {
  const save = loadSave();
  const def = UPGRADE_DEFS.find((d) => d.id === id)!;
  const tier = save.upgrades[id];
  if (tier >= def.maxTier) return save;
  const cost = def.costs[tier];
  if (save.coins < cost) return save;
  return updateSave((draft) => {
    draft.coins -= cost;
    draft.upgrades[id] += 1;
  });
}
