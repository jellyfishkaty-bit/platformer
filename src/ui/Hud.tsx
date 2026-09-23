import { useEffect, useState } from 'react';
import { gameEvents, EVT, type HudState } from '../game/events';

const initial: HudState = {
  hearts: 0,
  heartsTarget: 10,
  lives: 3,
  maxLives: 3,
  coins: 0,
  ability: 'none',
  abilityRemainingMs: 0,
  hasFireball: false,
  fireballCharges: -1,
};

export function Hud() {
  const [state, setState] = useState<HudState>(initial);

  useEffect(() => {
    const handler = (s: HudState) => setState(s);
    gameEvents.on(EVT.HUD_UPDATE, handler);
    return () => {
      gameEvents.off(EVT.HUD_UPDATE, handler);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-3 text-white">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1">
          <span className="text-red-400">♥</span>
          <span className="font-bold tabular-nums">
            {state.hearts}/{state.heartsTarget}
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1">
          {Array.from({ length: state.maxLives }).map((_, i) => (
            <span key={i} className={i < state.lives ? 'text-yellow-300' : 'text-gray-600'}>
              ●
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1">
          <span className="text-orange-400">♥</span>
          <span className="font-bold tabular-nums">{state.coins}</span>
        </div>
        {state.hasFireball && (
          <div className="rounded-lg bg-black/40 px-2 py-1 text-orange-300">🔥 файербол</div>
        )}
        {state.ability !== 'none' && (
          <div
            className={`rounded-lg px-2 py-1 font-bold ${
              state.ability === 'invuln' ? 'bg-white/70 text-black' : 'bg-purple-600/70 text-white'
            }`}
          >
            {state.ability === 'invuln' ? 'Неуязвимость' : 'Левитация'} {(state.abilityRemainingMs / 1000).toFixed(1)}с
          </div>
        )}
      </div>
    </div>
  );
}
