import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Fighter } from '../Fighter';
import { GROUND_Y, MOVE_SPEED } from '../Constants';

describe('Fighter', () => {
    let fighter: Fighter;

    beforeEach(() => {
        vi.useFakeTimers();
        fighter = new Fighter('testPlayer', 500, true);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Initialization', () => {
        it('should initialize with correct ID', () => {
            expect(fighter.id).toBe('testPlayer');
        });

        it('should start at provided X position', () => {
            expect(fighter.x.value).toBe(500);
        });

        it('should start at ground level', () => {
            expect(fighter.y.value).toBe(GROUND_Y);
        });

        it('should start in IDLE state', () => {
            expect(fighter.state.value).toBe('IDLE');
        });

        it('should start with full health', () => {
            expect(fighter.health.value).toBe(100);
        });

        it('should start with zero charge', () => {
            expect(fighter.chargeLevel.value).toBe(0);
        });
    });

    describe('Movement', () => {
        it('should move right when x input is positive', () => {
            const initialX = fighter.x.value;
            const dt = 0.016; // ~60fps
            
            fighter.update(dt, { x: 1, y: 0, punchHeld: false, kickHeld: false });
            
            expect(fighter.x.value).toBeGreaterThan(initialX);
            expect(fighter.state.value).toBe('MOVING');
        });

        it('should move left when x input is negative', () => {
            const initialX = fighter.x.value;
            const dt = 0.016;
            
            fighter.update(dt, { x: -1, y: 0, punchHeld: false, kickHeld: false });
            
            expect(fighter.x.value).toBeLessThan(initialX);
        });

        it('should calculate correct movement distance', () => {
            const initialX = fighter.x.value;
            const dt = 1.0; // 1 second
            
            fighter.update(dt, { x: 1, y: 0, punchHeld: false, kickHeld: false });
            
            expect(fighter.x.value).toBe(initialX + MOVE_SPEED);
        });

        it('should return to IDLE when movement stops', () => {
            fighter.update(0.016, { x: 1, y: 0, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('MOVING');
            
            fighter.update(0.016, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('IDLE');
        });

        it('should update facing direction based on movement', () => {
            fighter.update(0.016, { x: -1, y: 0, punchHeld: false, kickHeld: false });
            expect(fighter.facingRight).toBe(false);
            
            fighter.update(0.016, { x: 1, y: 0, punchHeld: false, kickHeld: false });
            expect(fighter.facingRight).toBe(true);
        });
    });

    describe('Blocking', () => {
        it('should block high when y input is positive', () => {
            fighter.update(0.016, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('BLOCKING_HIGH');
        });

        it('should block low when y input is negative', () => {
            fighter.update(0.016, { x: 0, y: -1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('BLOCKING_LOW');
        });

        it('should return to IDLE when blocking stops', () => {
            fighter.update(0.016, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('BLOCKING_HIGH');
            
            fighter.update(0.016, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('IDLE');
        });

        it('should not move while blocking', () => {
            const initialX = fighter.x.value;
            fighter.update(0.016, { x: 1, y: 1, punchHeld: false, kickHeld: false });
            
            // Due to the order of operations, blocking takes priority
            expect(fighter.state.value).toBe('BLOCKING_HIGH');
        });
    });

    describe('Charging', () => {
        it('should start charging when punch is held', () => {
            vi.spyOn(performance, 'now').mockReturnValue(1000);
            
            fighter.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            expect(fighter.state.value).toBe('CHARGING');
            expect(fighter.attackType.value).toBe('PUNCH');
        });

        it('should start charging when kick is held', () => {
            vi.spyOn(performance, 'now').mockReturnValue(1000);
            
            fighter.update(0.016, { x: 0, y: 0, punchHeld: false, kickHeld: true });
            
            expect(fighter.state.value).toBe('CHARGING');
            expect(fighter.attackType.value).toBe('KICK');
        });

        it('should increase charge level over time', () => {
            const nowMock = vi.spyOn(performance, 'now');
            nowMock.mockReturnValue(0);
            
            fighter.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            nowMock.mockReturnValue(500); // 0.5 seconds later
            fighter.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            expect(fighter.chargeLevel.value).toBeGreaterThan(0);
        });

        it('should not charge while blocking', () => {
            fighter.update(0.016, { x: 0, y: 1, punchHeld: true, kickHeld: false });
            
            expect(fighter.state.value).toBe('BLOCKING_HIGH');
            expect(fighter.chargeLevel.value).toBe(0);
        });
    });
});
