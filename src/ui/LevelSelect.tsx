import { LEVELS } from '../game/levels';
import { THEME_NAMES } from '../game/gfx/palette';
import { loadSave } from '../state/progress';

interface Props {
  onSelect: (levelId: string) => void;
  onBack: () => void;
}

export function LevelSelect({ onSelect, onBack }: Props) {
  const save = loadSave();

  return (
    <div className="flex h-full w-full flex-col items-center gap-4 overflow-y-auto bg-[#0a0a12] p-6 text-white">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h2 className="text-2xl font-bold">Уровни</h2>
        <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={onBack}>
          Назад
        </button>
      </div>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {LEVELS.map((lvl, i) => {
          const unlocked = i <= save.unlockedLevelIndex;
          const result = save.levelResults[lvl.id];
          return (
            <button
              key={lvl.id}
              disabled={!unlocked}
              onClick={() => onSelect(lvl.id)}
              className={`rounded-xl border p-4 text-left transition ${
                unlocked
                  ? 'border-white/20 bg-white/5 hover:bg-white/10'
                  : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-40'
              }`}
            >
              <div className="text-xs uppercase tracking-wide text-white/50">Уровень {i + 1}</div>
              <div className="text-lg font-bold">{unlocked ? THEME_NAMES[lvl.theme] : '???'}</div>
              {result?.completed && (
                <div className="mt-1 text-sm text-emerald-400">
                  ✓ пройден · {result.bestHearts}/10 ♥ · секретов {result.secretsFound}
                </div>
              )}
              {!unlocked && <div className="mt-1 text-sm text-white/40">🔒 заблокирован</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
