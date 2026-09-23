import { useEffect, useState } from 'react';
import { pressTouchFire, pressTouchJump, releaseTouchJump, setTouchDirection } from '../game/touchInput';
import { audio } from '../game/audio';
import { gameEvents, EVT, type HudState } from '../game/events';

function btnProps(onDown: () => void, onUp?: () => void) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      onDown();
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onUp?.();
    },
    onPointerLeave: (e: React.PointerEvent) => {
      e.preventDefault();
      onUp?.();
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

const btnBase =
  'select-none flex items-center justify-center rounded-full bg-white/15 active:bg-white/30 border-2 border-white/30 text-white text-2xl font-bold touch-none';

export function TouchControls() {
  const [hasFireball, setHasFireball] = useState(false);

  useEffect(() => {
    const handler = (s: HudState) => setHasFireball(s.hasFireball);
    gameEvents.on(EVT.HUD_UPDATE, handler);
    return () => {
      gameEvents.off(EVT.HUD_UPDATE, handler);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div className="pointer-events-auto absolute bottom-4 left-4 flex gap-3">
        <div
          className={`${btnBase} h-16 w-16`}
          {...btnProps(
            () => setTouchDirection('left', true),
            () => setTouchDirection('left', false),
          )}
        >
          ◀
        </div>
        <div
          className={`${btnBase} h-16 w-16`}
          {...btnProps(
            () => setTouchDirection('right', true),
            () => setTouchDirection('right', false),
          )}
        >
          ▶
        </div>
      </div>

      <div className="pointer-events-auto absolute bottom-4 right-4 flex items-end gap-3">
        {hasFireball && (
          <div className={`${btnBase} h-14 w-14 bg-orange-500/30 border-orange-300/50`} {...btnProps(() => pressTouchFire())}>
            🔥
          </div>
        )}
        <div
          className={`${btnBase} h-20 w-20`}
          {...btnProps(
            () => pressTouchJump(),
            () => releaseTouchJump(),
          )}
        >
          ▲
        </div>
      </div>
    </div>
  );
}
