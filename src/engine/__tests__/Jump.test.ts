import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Fighter } from '../Fighter';
import { GROUND_Y, JUMP_VELOCITY, GRAVITY, MOVE_SPEED } from '../Constants';

/**
 * Jump Mechanics Tests
 *
 * Verifies jump initiation, parabolic arc physics, landing,
 * diagonal movement, and state restrictions.
 */
describe('Jump Mechanics', () => {
    let fighter: Fighter;
    const dt = 0.016; // ~60fps

    beforeEach(() => {
        vi.useFakeTimers();
        fighter = new Fighter('testPlayer', 500, true);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ── Initiation ──────────────────────────────────────────────────

    describe('Initiation', () => {
        it('should enter JUMPING state when UP is pressed on ground', () => {
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('JUMPING');
        });

        it('should leave the ground on the same frame as jump input', () => {
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.y.value).toBeLessThan(GROUND_Y);
        });

        it('should not jump when y input is below threshold (0.5)', () => {
            fighter.update(dt, { x: 0, y: 0.4, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('IDLE');
            expect(fighter.y.value).toBe(GROUND_Y);
        });

        it('should not double-jump (no jump while airborne)', () => {
            // First jump
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            const yAfterFirst = fighter.y.value;

            // Simulate a few frames in air, then try to jump again
            fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            const yBeforeSecondAttempt = fighter.y.value;

            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });

            // State should still be JUMPING from original jump, not a fresh jump
            expect(fighter.state.value).toBe('JUMPING');
            // Y should continue on the existing arc, not teleport back to a fresh jump
            expect(fighter.y.value).not.toBe(yAfterFirst);
        });

        it('should report isGrounded=false while airborne', () => {
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });

            // Need at least one frame where fighter hasn't landed yet
            expect(fighter.y.value).toBeLessThan(GROUND_Y);
            expect(fighter.isGrounded).toBe(false);
        });
    });

    // ── Physics Arc ─────────────────────────────────────────────────

    describe('Physics Arc', () => {
        it('should rise then fall during jump (parabolic arc)', () => {
            // Initiate jump
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });

            const yValues: number[] = [fighter.y.value];

            // Simulate ~1s of frames
            for (let i = 0; i < 60; i++) {
                fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
                yValues.push(fighter.y.value);
            }

            // Find the peak (minimum Y in screen coords)
            const peakY = Math.min(...yValues);
            const peakIndex = yValues.indexOf(peakY);

            // Peak should be above ground
            expect(peakY).toBeLessThan(GROUND_Y);

            // Peak should be somewhere in the middle, not at start or end
            expect(peakIndex).toBeGreaterThan(0);
            expect(peakIndex).toBeLessThan(yValues.length - 1);
        });

        it('should apply gravity each frame (velocity increases downward)', () => {
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            const y1 = fighter.y.value;

            fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            const y2 = fighter.y.value;

            fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            const y3 = fighter.y.value;

            // Displacement increases each frame due to gravity
            const delta1 = y2 - y1;
            const delta2 = y3 - y2;

            // delta2 should be more positive (or less negative) than delta1
            // because gravity pulls downward
            expect(delta2).toBeGreaterThan(delta1);
        });

        it('should reach a peak height consistent with physics constants', () => {
            // Peak height = v^2 / (2*g) = 600^2 / (2*1800) = 100px above GROUND_Y
            const theoreticalPeakHeight = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY);

            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });

            let minY = fighter.y.value;
            for (let i = 0; i < 200; i++) {
                fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
                if (fighter.y.value < minY) minY = fighter.y.value;
            }

            const actualPeakHeight = GROUND_Y - minY;

            // Allow ~15% tolerance for discrete time-stepping
            expect(actualPeakHeight).toBeGreaterThan(theoreticalPeakHeight * 0.85);
            expect(actualPeakHeight).toBeLessThan(theoreticalPeakHeight * 1.15);
        });
    });

    // ── Landing ─────────────────────────────────────────────────────

    describe('Landing', () => {
        it('should clamp Y to GROUND_Y on landing (no sinking)', () => {
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });

            for (let i = 0; i < 200; i++) {
                fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            }

            expect(fighter.y.value).toBe(GROUND_Y);
        });

        it('should return to IDLE state on landing', () => {
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });

            for (let i = 0; i < 200; i++) {
                fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            }

            expect(fighter.state.value).toBe('IDLE');
        });

        it('should be grounded after landing', () => {
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });

            for (let i = 0; i < 200; i++) {
                fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            }

            expect(fighter.isGrounded).toBe(true);
        });

        it('should allow jumping again after landing', () => {
            // First jump
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });

            for (let i = 0; i < 200; i++) {
                fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            }

            expect(fighter.state.value).toBe('IDLE');
            expect(fighter.isGrounded).toBe(true);

            // Second jump
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('JUMPING');
            expect(fighter.y.value).toBeLessThan(GROUND_Y);
        });
    });

    // ── Diagonal Jump ───────────────────────────────────────────────

    describe('Diagonal Jump', () => {
        it('should move right during jump when holding RIGHT', () => {
            const initialX = fighter.x.value;

            fighter.update(dt, { x: 1, y: 1, punchHeld: false, kickHeld: false });

            // Continue holding right while airborne
            for (let i = 0; i < 10; i++) {
                fighter.update(dt, { x: 1, y: 0, punchHeld: false, kickHeld: false });
            }

            expect(fighter.x.value).toBeGreaterThan(initialX);
            expect(fighter.state.value).toBe('JUMPING');
        });

        it('should move left during jump when holding LEFT', () => {
            const initialX = fighter.x.value;

            fighter.update(dt, { x: -1, y: 1, punchHeld: false, kickHeld: false });

            for (let i = 0; i < 10; i++) {
                fighter.update(dt, { x: -1, y: 0, punchHeld: false, kickHeld: false });
            }

            expect(fighter.x.value).toBeLessThan(initialX);
            expect(fighter.facingRight).toBe(false);
        });

        it('should apply correct horizontal distance during jump', () => {
            const initialX = fighter.x.value;

            fighter.update(dt, { x: 1, y: 1, punchHeld: false, kickHeld: false });

            // 10 more frames with right held
            for (let i = 0; i < 10; i++) {
                fighter.update(dt, { x: 1, y: 0, punchHeld: false, kickHeld: false });
            }

            // 11 total frames * dt * MOVE_SPEED
            const expectedDx = 11 * dt * MOVE_SPEED;
            expect(fighter.x.value).toBeCloseTo(initialX + expectedDx, 1);
        });

        it('should not change to MOVING state while airborne', () => {
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });

            // Move horizontally while airborne
            fighter.update(dt, { x: 1, y: 0, punchHeld: false, kickHeld: false });

            expect(fighter.state.value).toBe('JUMPING');
        });
    });

    // ── State Restrictions ──────────────────────────────────────────

    describe('State Restrictions', () => {
        it('should not jump while blocking', () => {
            // Block first
            fighter.update(dt, { x: 0, y: -1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('BLOCKING');

            // The block check runs first each frame, so y=-1 keeps BLOCKING
            // and the jump check sees isBlocking=true
            fighter.update(dt, { x: 0, y: -1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('BLOCKING');
            expect(fighter.y.value).toBe(GROUND_Y);
        });

        it('should not jump while stunned', () => {
            fighter.state.value = 'STUNNED';

            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('STUNNED');
            expect(fighter.y.value).toBe(GROUND_Y);
        });

        it('should not jump while attacking', () => {
            fighter.state.value = 'ATTACKING';

            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('ATTACKING');
        });

        it('should not jump while overheated', () => {
            fighter.state.value = 'OVERHEATED';

            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('OVERHEATED');
        });

        it('should not block while airborne', () => {
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('JUMPING');

            // Try to block while in air
            fighter.update(dt, { x: 0, y: -1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('JUMPING');
        });

        it('should allow charging in the air', () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);

            // Jump
            fighter.update(dt, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('JUMPING');

            // Start charging while airborne
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            expect(fighter.state.value).toBe('CHARGING');
        });
    });
});
