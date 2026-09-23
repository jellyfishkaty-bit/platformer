import { useState } from 'react';
import { loadSave, updateSave } from '../state/progress';
import { audio } from '../game/audio';

interface Props {
  onPlay: () => void;
  onLevels: () => void;
  onUpgrade: () => void;
}

export function MainMenu({ onPlay, onLevels, onUpgrade }: Props) {
  const [save, setSave] = useState(loadSave());

  const toggleMusic = () => {
    const next = updateSave((d) => {
      d.musicOn = !d.musicOn;
    });
    audio.setMusicOn(next.musicOn);
    setSave({ ...next });
  };
  const toggleSfx = () => {
    const next = updateSave((d) => {
      d.sfxOn = !d.sfxOn;
    });
    audio.setSfxOn(next.sfxOn);
    setSave({ ...next });
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#1a1230] to-[#0a0a12] px-6 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-wide text-emerald-400 drop-shadow">ГЕЙМЕР</h1>
        <p className="mt-1 text-sm text-white/60">Пиксельный платформер по мотивам культовых игр</p>
      </div>

      <div className="flex w-64 flex-col gap-3">
        <button
          className="rounded-xl bg-emerald-500 py-3 text-lg font-bold text-black hover:bg-emerald-400"
          onClick={() => {
            audio.unlock();
            onPlay();
          }}
        >
          Играть
        </button>
        <button
          className="rounded-xl bg-white/10 py-3 font-semibold hover:bg-white/20"
          onClick={() => {
            audio.unlock();
            onLevels();
          }}
        >
          Уровни
        </button>
        <button
          className="rounded-xl bg-white/10 py-3 font-semibold hover:bg-white/20"
          onClick={() => {
            audio.unlock();
            onUpgrade();
          }}
        >
          Прокачка ({save.coins} <span className="text-orange-300">♥</span>)
        </button>
      </div>

      <div className="mt-4 flex gap-4 text-sm text-white/70">
        <button className="rounded-lg bg-black/30 px-3 py-2" onClick={toggleMusic}>
          Музыка: {save.musicOn ? 'вкл' : 'выкл'}
        </button>
        <button className="rounded-lg bg-black/30 px-3 py-2" onClick={toggleSfx}>
          Звуки: {save.sfxOn ? 'вкл' : 'выкл'}
        </button>
      </div>
    </div>
  );
}
