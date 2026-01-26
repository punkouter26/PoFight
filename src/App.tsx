import { useState } from 'react';
import Stage from '@/components/game/Stage';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
import { CharacterSelect } from '@/components/game/CharacterSelect';
import { Home } from '@/components/game/Home';

type Screen = 'HOME' | 'SELECT' | 'GAME';
type GameMode = 'PvCPU' | 'CPUvCPU';

export default function App() {
  const [screen, setScreen] = useState<Screen>('HOME');
  const [gameMode, setGameMode] = useState<GameMode>('PvCPU');

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    setScreen('SELECT');
  };

  const handleStartGame = () => {
    setScreen('GAME');
  };

  return (
    <main className="flex w-screen h-screen flex-col items-center justify-center bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black opacity-80" />
      <div className="z-10 w-full h-full max-w-[1920px] max-h-[1080px] p-4">
        <GameErrorBoundary>
          {screen === 'HOME' && (
            <Home onSelectMode={handleSelectMode} />
          )}
          {screen === 'SELECT' && (
            <CharacterSelect onStart={handleStartGame} mode={gameMode} />
          )}
          {screen === 'GAME' && (
            <Stage gameMode={gameMode} />
          )}
        </GameErrorBoundary>
      </div>
    </main>
  );
}
