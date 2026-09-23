import type { ThemeId } from '../levels/types';

export interface ThemePalette {
  skyTop: number;
  skyBottom: number;
  fogColor: number;
  platformBase: number;
  platformEdge: number;
  platformDetail: number;
  accent: number;
  hazard: number;
  particle: number;
}

export const THEME_PALETTES: Record<ThemeId, ThemePalette> = {
  test: {
    skyTop: 0x2b2f4a,
    skyBottom: 0x1a1c2e,
    fogColor: 0x3a3f5c,
    platformBase: 0x6b5b45,
    platformEdge: 0x4a3f30,
    platformDetail: 0x8a7355,
    accent: 0x55c4ff,
    hazard: 0xcc3333,
    particle: 0xffffff,
  },
  darkSouls: {
    skyTop: 0x1a1418,
    skyBottom: 0x0c0a0d,
    fogColor: 0x2e2226,
    platformBase: 0x4a4650,
    platformEdge: 0x2a2730,
    platformDetail: 0x655f6b,
    accent: 0x8a2626,
    hazard: 0x7a2020,
    particle: 0xff7722,
  },
  seriousSam: {
    skyTop: 0xe8b04a,
    skyBottom: 0xc47a2e,
    fogColor: 0xf0c878,
    platformBase: 0xc9a05a,
    platformEdge: 0x8a6530,
    platformDetail: 0xe0c088,
    accent: 0xff6622,
    hazard: 0xaa3311,
    particle: 0xffdd55,
  },
  neverhood: {
    skyTop: 0xe8a0d8,
    skyBottom: 0xffd070,
    fogColor: 0xf0b8e8,
    platformBase: 0xc85a9a,
    platformEdge: 0x8a3a6a,
    platformDetail: 0xffe070,
    accent: 0x50d0a0,
    hazard: 0xff5090,
    particle: 0xffffff,
  },
  halfLife: {
    skyTop: 0x2e3830,
    skyBottom: 0x1a201c,
    fogColor: 0x3a4a3e,
    platformBase: 0x4a524a,
    platformEdge: 0x2a302a,
    platformDetail: 0x6a7a6a,
    accent: 0xa8c020,
    hazard: 0xd08010,
    particle: 0xa8ff40,
  },
  sekiro: {
    skyTop: 0x2a1418,
    skyBottom: 0x140a0c,
    fogColor: 0x4a1e24,
    platformBase: 0x3a2a2e,
    platformEdge: 0x1e1416,
    platformDetail: 0x5a3a40,
    accent: 0xcc2233,
    hazard: 0x8a1522,
    particle: 0xffb0c0,
  },
};

export const THEME_NAMES: Record<ThemeId, string> = {
  test: 'Тестовый полигон',
  darkSouls: 'Тёмные Руины',
  seriousSam: 'Пески Безумия',
  neverhood: 'Пластилиновый Сон',
  halfLife: 'Чёрная Шахта',
  sekiro: 'Клинок и Сакура',
};
