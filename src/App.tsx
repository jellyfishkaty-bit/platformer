import { useState } from 'react';
import { PhaserGame } from './game/PhaserGame';
import { Hud } from './ui/Hud';
import { TouchControls } from './ui/TouchControls';
import { ResultsOverlay } from './ui/ResultsOverlay';
import { MainMenu } from './ui/MainMenu';
import { LevelSelect } from './ui/LevelSelect';
import { UpgradeScreen } from './ui/UpgradeScreen';
import { LEVELS } from './game/levels';
import { loadSave } from './state/progress';

type Screen = 'menu' | 'levels' | 'upgrade' | 'play';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [levelId, setLevelId] = useState<string>(LEVELS[0].id);
  const [attempt, setAttempt] = useState(0);

  const startLevel = (id: string) => {
    setLevelId(id);
    setAttempt(0);
    setScreen('play');
  };

  const playFromMenu = () => {
    const save = loadSave();
    const id = LEVELS[Math.min(save.unlockedLevelIndex, LEVELS.length - 1)].id;
    startLevel(id);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      {screen === 'menu' && (
        <MainMenu onPlay={playFromMenu} onLevels={() => setScreen('levels')} onUpgrade={() => setScreen('upgrade')} />
      )}

      {screen === 'levels' && <LevelSelect onSelect={startLevel} onBack={() => setScreen('menu')} />}

      {screen === 'upgrade' && <UpgradeScreen onBack={() => setScreen('menu')} />}

      {screen === 'play' && (
        <div className="relative h-full w-full">
          <PhaserGame key={`${levelId}-${attempt}`} levelId={levelId} />
          <Hud />
          <TouchControls />
          <ResultsOverlay
            onRetry={() => setAttempt((a) => a + 1)}
            onNext={(nextId) => startLevel(nextId)}
            onExitToLevels={() => setScreen('levels')}
          />
          <button
            className="absolute left-2 top-2 z-30 rounded-lg bg-black/50 px-3 py-1 text-sm text-white/70"
            onClick={() => setScreen('levels')}
          >
            ✕ выход
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
