import Phaser from 'phaser';

/**
 * Tiny helper for building blocky "fat pixel" textures out of a color grid,
 * then baking them into a real Phaser texture. Using fillRect per-cell (no
 * circles/curves) keeps edges perfectly crisp under pixelated rendering.
 */
export class PixelGrid {
  readonly w: number;
  readonly h: number;
  private cells: (number | null)[][];

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.cells = Array.from({ length: h }, () => new Array<number | null>(w).fill(null));
  }

  set(x: number, y: number, color: number | null) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    this.cells[y][x] = color;
    return this;
  }

  get(x: number, y: number): number | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.cells[y][x];
  }

  rect(x: number, y: number, w: number, h: number, color: number) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, color);
    }
    return this;
  }

  /** Blocky filled circle via a distance test — stays crisp, no AA. */
  circle(cx: number, cy: number, r: number, color: number) {
    for (let yy = Math.floor(cy - r); yy <= Math.ceil(cy + r); yy++) {
      for (let xx = Math.floor(cx - r); xx <= Math.ceil(cx + r); xx++) {
        const dx = xx + 0.5 - cx;
        const dy = yy + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) this.set(xx, yy, color);
      }
    }
    return this;
  }

  /** Stamp a pattern of 0/1 (or char) rows at an offset, mapping truthy -> color. */
  stamp(rows: string[], ox: number, oy: number, color: number, on = '#') {
    rows.forEach((row, ry) => {
      [...row].forEach((ch, rx) => {
        if (ch === on) this.set(ox + rx, oy + ry, color);
      });
    });
    return this;
  }

  mirrorHorizontal() {
    const copy = this.cells.map((row) => [...row].reverse());
    this.cells = copy;
    return this;
  }

  toTexture(scene: Phaser.Scene, key: string, pixelSize: number) {
    const g = scene.add.graphics();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = this.cells[y][x];
        if (c === null) continue;
        g.fillStyle(c, 1);
        g.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
    g.generateTexture(key, this.w * pixelSize, this.h * pixelSize);
    g.destroy();
  }
}

export const HEART_PATTERN = ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'];
