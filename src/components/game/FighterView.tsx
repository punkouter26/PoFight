

import { useEffect, useRef, memo } from 'react';
import { Fighter } from '@/engine/Fighter';
import { FIGHTER_WIDTH, FIGHTER_HEIGHT } from '@/engine/Constants';

interface FighterViewProps {
    fighter: Fighter;
}

export const FighterView = memo(function FighterView({ fighter }: FighterViewProps) {
    const gRef = useRef<SVGGElement>(null);
    const bodyRef = useRef<SVGGElement>(null);
    const chargeRef = useRef<SVGCircleElement>(null);
    const rightArmRef = useRef<SVGPathElement>(null);
    const rightLegRef = useRef<SVGPathElement>(null);

    useEffect(() => {
        // Subscribe to Position Updates (60FPS)
        const unsubX = fighter.x.subscribe((val) => {
            if (gRef.current) {
                gRef.current.style.transform = `translate(${val}px, ${fighter.y.value}px)`;
            }
        });

        const unsubState = fighter.state.subscribe((state) => {
            if (bodyRef.current) {
                // Dynamic Coloring
                let color = '#3b82f6'; // Blue-500 default
                if (state === 'CHARGING') color = '#fbbf24'; // Amber-400
                if (state === 'ATTACKING') color = '#ef4444'; // Red-500
                if (state === 'BLOCKING_HIGH') color = '#38bdf8'; // Sky-400
                if (state === 'BLOCKING_LOW') color = '#7dd3fc'; // Sky-300
                if (state === 'OVERHEATED') color = '#78716c'; // Stone-500
                if (state === 'STUNNED') color = '#f97316'; // Orange-500

                if (fighter.id === 'cpu') {
                    if (color === '#3b82f6') color = '#dc2626'; // Red default for CPU
                }

                bodyRef.current.style.color = color;

                // Pose Logic
                if (state === 'ATTACKING') {
                    const type = fighter.attackType.peek(); // Use peek to avoid subscription recursion if synced
                    const height = fighter.attackHeight.peek();

                    if (type === 'PUNCH') {
                        // Extend Right Arm
                        let armPath = `M ${FIGHTER_WIDTH / 2 + 15},55 L ${FIGHTER_WIDTH / 2 + 60},55`; // Mid default
                        if (height === 'HIGH') armPath = `M ${FIGHTER_WIDTH / 2 + 15},55 L ${FIGHTER_WIDTH / 2 + 50},30`;
                        if (height === 'LOW') armPath = `M ${FIGHTER_WIDTH / 2 + 15},55 L ${FIGHTER_WIDTH / 2 + 50},80`;

                        if (rightArmRef.current) rightArmRef.current.setAttribute('d', armPath);
                    } else if (type === 'KICK') {
                        // Extend Right Leg
                        let legPath = `M ${FIGHTER_WIDTH / 2 + 10},110 L ${FIGHTER_WIDTH / 2 + 60},110`; // Mid/Body default
                        if (height === 'HIGH') legPath = `M ${FIGHTER_WIDTH / 2 + 10},110 L ${FIGHTER_WIDTH / 2 + 50},40`; // Head kick
                        if (height === 'LOW') legPath = `M ${FIGHTER_WIDTH / 2 + 10},110 L ${FIGHTER_WIDTH / 2 + 60},180`; // Low kick

                        if (rightLegRef.current) rightLegRef.current.setAttribute('d', legPath);
                    }
                } else {
                    // Reset Poses
                    if (rightArmRef.current) rightArmRef.current.setAttribute('d', `M ${FIGHTER_WIDTH / 2 + 15},55 L ${FIGHTER_WIDTH / 2 + 30},80 L ${FIGHTER_WIDTH / 2 + 45},60`);
                    if (rightLegRef.current) rightLegRef.current.setAttribute('d', `M ${FIGHTER_WIDTH / 2 + 10},110 L ${FIGHTER_WIDTH / 2 + 25},190`);
                }
            }
        });

        const unsubCharge = fighter.chargeLevel.subscribe((level) => {
            if (chargeRef.current) {
                // Visualize charge as a growing aura behind
                chargeRef.current.setAttribute('r', (level * 60 + 10).toString());
                chargeRef.current.setAttribute('opacity', (level * 0.5).toString());
            }
        });

        return () => {
            unsubX();
            unsubState();
            unsubCharge();
        };
    }, [fighter]);

    // Flip CPU or based on facing logic (if implemented in signals later)
    // For now, static facing based on ID
    const scaleX = fighter.id === 'cpu' ? -1 : 1;
    const offsetX = fighter.id === 'cpu' ? FIGHTER_WIDTH : 0;

    return (
        <g 
            ref={gRef} 
            style={{ 
                transform: `translate(${fighter.x.value}px, ${fighter.y.value}px)`,
                willChange: 'transform',
            }}
        >
            {/* Dynamic Shadow */}
            <ellipse cx={FIGHTER_WIDTH / 2} cy={FIGHTER_HEIGHT} rx={FIGHTER_WIDTH / 2 + 10} ry={8} fill="rgba(0,0,0,0.4)" filter="blur(4px)" />

            {/* Charge Aura (Behind) */}
            <circle
                ref={chargeRef}
                cx={FIGHTER_WIDTH / 2}
                cy={FIGHTER_HEIGHT / 2}
                r="0"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="4"
                opacity="0"
                className="text-yellow-400"
                style={{ filter: 'drop-shadow(0 0 15px currentColor)', willChange: 'r, opacity' }}
            />

            {/* Humanoid Body Group - Pivot simplified center */}
            <g
                ref={bodyRef}
                style={{ color: fighter.id === 'cpu' ? '#dc2626' : '#3b82f6', willChange: 'color' }}
                transform={`translate(${offsetX}, 0) scale(${scaleX}, 1)`}
            >
                {/* Head */}
                <circle cx={FIGHTER_WIDTH / 2} cy={30} r={15} fill="currentColor" />

                {/* Eye (White, visible direction) */}
                <circle cx={FIGHTER_WIDTH / 2 + 8} cy={28} r={3} fill="white" />

                {/* Torso - Tapered V-shape */}
                <path d={`M ${FIGHTER_WIDTH / 2 - 20},50 L ${FIGHTER_WIDTH / 2 + 20},50 L ${FIGHTER_WIDTH / 2 + 10},110 L ${FIGHTER_WIDTH / 2 - 10},110 Z`} fill="currentColor" />

                {/* Arms (Resting Pose) */}
                <path d={`M ${FIGHTER_WIDTH / 2 - 15},55 L ${FIGHTER_WIDTH / 2 - 30},90`} stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
                <path ref={rightArmRef} d={`M ${FIGHTER_WIDTH / 2 + 15},55 L ${FIGHTER_WIDTH / 2 + 30},80 L ${FIGHTER_WIDTH / 2 + 45},60`} stroke="currentColor" strokeWidth="10" strokeLinecap="round" /> {/* Guard up slightly */}

                {/* Legs */}
                <path d={`M ${FIGHTER_WIDTH / 2 - 10},110 L ${FIGHTER_WIDTH / 2 - 20},190`} stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
                <path ref={rightLegRef} d={`M ${FIGHTER_WIDTH / 2 + 10},110 L ${FIGHTER_WIDTH / 2 + 25},190`} stroke="currentColor" strokeWidth="12" strokeLinecap="round" />

                {/* Belt/Sash */}
                <rect x={FIGHTER_WIDTH / 2 - 12} y={100} width={24} height={6} fill="rgba(0,0,0,0.3)" />

            </g>

            {/* ID Label */}
            <text x={FIGHTER_WIDTH / 2} y={-20} textAnchor="middle" fill="white" className="font-bold text-lg pointer-events-none select-none tracking-widest opacity-50">
                {fighter.id.toUpperCase()}
            </text>
        </g>
    );
});
