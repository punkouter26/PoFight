import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Fighter } from '../Fighter';
import { GROUND_Y, MOVE_SPEED, JUMP_VELOCITY, GRAVITY } from '../Constants';

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

        it('should report isGrounded when at GROUND_Y', () => {
            expect(fighter.isGrounded).toBe(true);
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
        it('should block when y input is negative (DOWN)', () => {
            fighter.update(0.016, { x: 0, y: -1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('BLOCKING');
        });

        it('should return to IDLE when blocking stops', () => {
            fighter.update(0.016, { x: 0, y: -1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('BLOCKING');
            
            fighter.update(0.016, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('IDLE');
        });

        it('should not charge while blocking', () => {
            fighter.update(0.016, { x: 0, y: -1, punchHeld: true, kickHeld: false });
            
            expect(fighter.state.value).toBe('BLOCKING');
            expect(fighter.chargeLevel.value).toBe(0);
        });
    });

    describe('Jumping', () => {
        it('should jump when y input is positive (UP)', () => {
            fighter.update(0.016, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('JUMPING');
        });

        it('should apply jump velocity when jumping', () => {
            fighter.update(0.016, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.y.value).toBeLessThan(GROUND_Y);
        });

        it('should allow horizontal movement during jump', () => {
            const initialX = fighter.x.value;
            // Start jump
            fighter.update(0.016, { x: 1, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('JUMPING');
            expect(fighter.x.value).toBeGreaterThan(initialX);
        });

        it('should land and return to IDLE', () => {
            // Jump
            fighter.update(0.016, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('JUMPING');
            
            // Simulate enough time for full jump arc
            for (let i = 0; i < 200; i++) {
                fighter.update(0.016, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            }
            
            expect(fighter.y.value).toBe(GROUND_Y);
            expect(fighter.state.value).toBe('IDLE');
        });

        it('should not jump while charging', () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);
            fighter.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            expect(fighter.state.value).toBe('CHARGING');
            
            // Try to jump while charging
            fighter.update(0.016, { x: 0, y: 1, punchHeld: true, kickHeld: false });
            expect(fighter.state.value).toBe('CHARGING');
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
            fighter.update(0.016, { x: 0, y: -1, punchHeld: true, kickHeld: false });
            
            expect(fighter.state.value).toBe('BLOCKING');
            expect(fighter.chargeLevel.value).toBe(0);
        });
    });

    describe('Wind-up Progress', () => {
        it('should reach full wind-up at WIND_UP_TIME (0.5s)', () => {
            const nowMock = vi.spyOn(performance, 'now');
            nowMock.mockReturnValue(0);
            
            fighter.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            // At 0.5s, chargeLevel = 0.5, windUp should be 1.0
            nowMock.mockReturnValue(500);
            fighter.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            expect(fighter.windUpProgress).toBe(1.0);
        });

        it('should clamp wind-up at 1.0 even when charge exceeds wind-up ratio', () => {
            const nowMock = vi.spyOn(performance, 'now');
            nowMock.mockReturnValue(0);
            
            fighter.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            nowMock.mockReturnValue(800); // 0.8s → chargeLevel=0.8, windUp clamped at 1.0
            fighter.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            expect(fighter.windUpProgress).toBe(1.0);
        });
    });
});
