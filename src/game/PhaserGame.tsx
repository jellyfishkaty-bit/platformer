import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config';

interface Props {
  levelId: string;
}

/** Mounts one Phaser.Game for its lifetime. Parent remounts (new `key`) to change level or retry. */
export function PhaserGame({ levelId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    const game = new Phaser.Game(createGameConfig(containerRef.current));
    game.registry.set('levelId', levelId);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="flex h-full w-full items-center justify-center" />;
}
