import Phaser from 'phaser';
import { generateAllTextures } from '../gfx/textures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    generateAllTextures(this);
    const levelId = this.game.registry.get('levelId') as string;
    this.scene.start('Play', { levelId });
  }
}
