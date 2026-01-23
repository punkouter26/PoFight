

import { useEffect, useState, memo } from 'react';
import { gameLoop } from '@/engine/GameLoop';
import { FightManager } from '@/engine/FightManager';
import { FighterView } from './FighterView';
import { HUD } from './HUD';
import { GAME_WIDTH, GAME_HEIGHT } from '@/engine/Constants';

const GameCanvas = memo(function GameCanvas({ manager }: { manager: FightManager }) {
    return (
        <svg
            viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`}
            className="w-full h-full max-w-[1920px] max-h-[1080px] bg-gradient-to-b from-slate-900 to-slate-800"
            xmlns="http://www.w3.org/2000/svg"
            style={{ willChange: 'contents' }}
        >
            <line x1="0" y1={GAME_HEIGHT - 100} x2={GAME_WIDTH} y2={GAME_HEIGHT - 100} stroke="#334155" strokeWidth="200" />
            <FighterView fighter={manager.player} />
            <FighterView fighter={manager.cpu} />
        </svg>
    );
});

const HUDOverlay = memo(function HUDOverlay({ manager }: { manager: FightManager }) {
    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <HUD player={manager.player} cpu={manager.cpu} />
        </div>
    );
});

export default function Stage() {
    const [manager, setManager] = useState<FightManager | null>(null);

    useEffect(() => {
        console.log('Stage: Mount Effect');
        const mgr = new FightManager(gameLoop);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setManager(mgr);

        // Start loop
        gameLoop.start();

        return () => {
            console.log('Stage: Cleanup');
            gameLoop.stop();
        };
    }, []);

    if (!manager) return <div className="text-white">Loading Arena...</div>;

    return (
        <div className="flex items-center justify-center w-full h-full bg-zinc-900 border-4 border-zinc-800 rounded-lg overflow-hidden shadow-2xl relative">
            <GameCanvas manager={manager} />
            <HUDOverlay manager={manager} />
        </div>
    );
}
