import Stage from '@/components/game/Stage';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';

export default function App() {
  return (
    <main className="flex w-screen h-screen flex-col items-center justify-center bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black opacity-80" />
      <div className="z-10 w-full h-full max-w-[1920px] max-h-[1080px] p-4">
        <GameErrorBoundary>
          <Stage />
        </GameErrorBoundary>
      </div>
    </main>
  );
}
