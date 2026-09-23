import { useEffect, useState } from 'react';
import { gameEvents, EVT, type LevelEndPayload } from '../game/events';
import { getLevel, nextLevelId } from '../game/levels';

interface Props {
  onRetry: () => void;
  onNext: (levelId: string) => void;
  onExitToLevels: () => void;
}

export function ResultsOverlay({ onRetry, onNext, onExitToLevels }: Props) {
  const [result, setResult] = useState<LevelEndPayload | null>(null);

  useEffect(() => {
    const handler = (payload: LevelEndPayload) => setResult(payload);
    gameEvents.on(EVT.LEVEL_END, handler);
    return () => {
      gameEvents.off(EVT.LEVEL_END, handler);
    };
  }, []);

  if (!result) return null;

  const next = nextLevelId(result.levelId);
  const levelName = getLevel(result.levelId).name;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="w-80 rounded-2xl border border-white/20 bg-[#181622] p-6 text-center text-white shadow-2xl">
        <h2 className="mb-1 text-2xl font-bold text-emerald-400">Уровень пройден!</h2>
        <p className="mb-4 text-sm text-white/60">{levelName}</p>
        <div className="mb-6 space-y-2 text-left text-sm">
          <div className="flex justify-between">
            <span>Сердечки</span>
            <span className="font-bold">
              {result.hearts}/{result.heartsTarget}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Монеты</span>
            <span className="font-bold text-orange-300">{result.coinsCollected}</span>
          </div>
          <div className="flex justify-between">
            <span>Секреты</span>
            <span className="font-bold text-purple-300">
              {result.secretsFound}/{result.secretsTotal}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {next && (
            <button
              className="rounded-lg bg-emerald-500 py-2 font-bold text-black hover:bg-emerald-400"
              onClick={() => {
                setResult(null);
                onNext(next);
              }}
            >
              Следующий уровень &rarr;
            </button>
          )}
          <button
            className="rounded-lg bg-white/10 py-2 font-semibold hover:bg-white/20"
            onClick={() => {
              setResult(null);
              onRetry();
            }}
          >
            Переиграть
          </button>
          <button
            className="rounded-lg bg-white/10 py-2 font-semibold hover:bg-white/20"
            onClick={() => {
              setResult(null);
              onExitToLevels();
            }}
          >
            К выбору уровней
          </button>
        </div>
      </div>
    </div>
  );
}
