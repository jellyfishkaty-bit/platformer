import { useState } from 'react';
import { loadSave, purchaseUpgrade, canAfford, UPGRADE_DEFS } from '../state/progress';
import { audio } from '../game/audio';

interface Props {
  onBack: () => void;
}

export function UpgradeScreen({ onBack }: Props) {
  const [save, setSave] = useState(loadSave());

  const buy = (id: (typeof UPGRADE_DEFS)[number]['id']) => {
    const next = purchaseUpgrade(id);
    audio.playSfx('coin');
    setSave({ ...next });
  };

  return (
    <div className="flex h-full w-full flex-col items-center gap-4 overflow-y-auto bg-[#0a0a12] p-6 text-white">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h2 className="text-2xl font-bold">Прокачка</h2>
        <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={onBack}>
          Назад
        </button>
      </div>
      <div className="w-full max-w-2xl rounded-xl bg-orange-500/10 px-4 py-2 text-center font-bold text-orange-300">
        Монеты: {save.coins}
      </div>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {UPGRADE_DEFS.map((def) => {
          const tier = save.upgrades[def.id];
          const maxed = tier >= def.maxTier;
          const cost = maxed ? null : def.costs[tier];
          const affordable = !maxed && canAfford(save, def);
          return (
            <div key={def.id} className="flex flex-col gap-2 rounded-xl border border-white/15 bg-white/5 p-4">
              <div className="text-lg font-bold">{def.name}</div>
              <div className="text-sm text-white/60">{def.description}</div>
              <div className="flex items-center gap-1 text-xs">
                {Array.from({ length: def.maxTier }).map((_, i) => (
                  <span key={i} className={`h-2 flex-1 rounded ${i < tier ? 'bg-emerald-400' : 'bg-white/15'}`} />
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Сейчас: {def.effectLabel(tier)}</span>
                {!maxed && <span className="text-white/50">Далее: {def.effectLabel(tier + 1)}</span>}
              </div>
              <button
                disabled={maxed || !affordable}
                onClick={() => buy(def.id)}
                className={`mt-1 rounded-lg py-2 font-bold ${
                  maxed
                    ? 'cursor-default bg-white/10 text-white/40'
                    : affordable
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'cursor-not-allowed bg-white/10 text-white/40'
                }`}
              >
                {maxed ? 'Максимум' : `Улучшить · ${cost} ♥`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
