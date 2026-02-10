import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Fighter } from '../Fighter';
import { MAX_CHARGE_TIME, WIND_UP_TIME, OVERHEAT_TIME } from '../Constants';

/**
 * Power Bar / Charge Level Tests
 *
 * Verifies charge signal values that drive the PowerBar component,
 * color ramp thresholds, wind-up progress, and reset behaviour.
 */
describe('Power Bar (chargeLevel)', () => {
    let fighter: Fighter;
    const dt = 0.016;

    beforeEach(() => {
        vi.useFakeTimers();
        fighter = new Fighter('testPlayer', 500, true);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ── Charge Signal Values ────────────────────────────────────────

    describe('Charge Level Signal', () => {
        it('should start at zero', () => {
            expect(fighter.chargeLevel.value).toBe(0);
        });

        it('should be 0.5 after 0.5 seconds of charging', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);

            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(500); // 0.5s
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            expect(fighter.chargeLevel.value).toBeCloseTo(0.5, 2);
        });

        it('should be 1.0 after MAX_CHARGE_TIME (1.0s)', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);

            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(MAX_CHARGE_TIME * 1000);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            expect(fighter.chargeLevel.value).toBe(1.0);
        });

        it('should cap at 1.0 when charging beyond MAX_CHARGE_TIME', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);

            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(1500); // 1.5s
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            expect(fighter.chargeLevel.value).toBe(1.0);
        });

        it('should increase linearly with time', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);

            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            const samples: number[] = [];
            for (let ms = 100; ms <= 1000; ms += 100) {
                now.mockReturnValue(ms);
                fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });
                samples.push(fighter.chargeLevel.value);
            }

            // Each sample should be roughly 0.1 apart (linear)
            for (let i = 1; i < samples.length; i++) {
                const delta = samples[i] - samples[i - 1];
                expect(delta).toBeCloseTo(0.1, 1);
            }
        });
    });

    // ── Color Ramp Thresholds ───────────────────────────────────────

    describe('Color Ramp Thresholds', () => {
        // These thresholds correspond to PowerBar component logic:
        // green (0–0.5), yellow (0.5–0.9), red (>=0.9)

        it('should be in green zone at charge 0.3', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(300);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            // charge ≈ 0.3 → green zone
            expect(fighter.chargeLevel.value).toBeLessThanOrEqual(0.5);
        });

        it('should cross into yellow zone after 0.5s', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(600);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            // charge ≈ 0.6 → yellow zone
            expect(fighter.chargeLevel.value).toBeGreaterThan(0.5);
            expect(fighter.chargeLevel.value).toBeLessThan(0.9);
        });

        it('should enter red zone at 0.9s', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(900);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            expect(fighter.chargeLevel.value).toBeCloseTo(0.9, 2);
        });

        it('should be at full red at 1.0s', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(1000);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            expect(fighter.chargeLevel.value).toBeGreaterThanOrEqual(0.9);
        });
    });

    // ── Wind-Up Progress ────────────────────────────────────────────

    describe('Wind-Up Progress (visual cue)', () => {
        it('should be 0 when no charge', () => {
            expect(fighter.windUpProgress).toBe(0);
        });

        it('should reach 1.0 at WIND_UP_TIME (0.5s) while charge is only 0.5', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(WIND_UP_TIME * 1000);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            expect(fighter.chargeLevel.value).toBeCloseTo(0.5, 2);
            expect(fighter.windUpProgress).toBe(1.0);
        });

        it('should stay clamped at 1.0 after wind-up time', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(800); // 0.8s
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            expect(fighter.chargeLevel.value).toBeCloseTo(0.8, 2);
            expect(fighter.windUpProgress).toBe(1.0);
        });

        it('should be proportional to charge below wind-up time', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            // At 0.25s: charge = 0.25, windUp = 0.25/0.5 = 0.5
            now.mockReturnValue(250);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            expect(fighter.windUpProgress).toBeCloseTo(0.5, 1);
        });
    });

    // ── Reset Behaviour ─────────────────────────────────────────────

    describe('Reset Behaviour', () => {
        it('should reset chargeLevel to 0 after attack completes', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);

            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(500);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            // Release → ATTACKING (chargeLevel preserved)
            fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('ATTACKING');
            expect(fighter.chargeLevel.value).toBeGreaterThan(0);

            // Advance past attack duration + recovery
            vi.advanceTimersByTime(500);

            expect(fighter.state.value).toBe('IDLE');
            expect(fighter.chargeLevel.value).toBe(0);
        });

        it('should reset chargeLevel to 0 on overheat', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);

            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(OVERHEAT_TIME * 1000 + 100);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            expect(fighter.state.value).toBe('OVERHEATED');
            expect(fighter.chargeLevel.value).toBe(0);
        });

        it('should preserve chargeLevel during ATTACKING state for damage calc', () => {
            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);

            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(900); // 0.9 charge
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            const chargeBeforeRelease = fighter.chargeLevel.value;

            fighter.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            expect(fighter.state.value).toBe('ATTACKING');
            expect(fighter.chargeLevel.value).toBe(chargeBeforeRelease);
        });

        it('should notify subscribers when chargeLevel changes', () => {
            const changes: number[] = [];
            fighter.chargeLevel.subscribe((val) => changes.push(val));

            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);

            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(300);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            // Should have received at least one non-zero charge notification
            expect(changes.length).toBeGreaterThan(0);
            expect(changes.some((v) => v > 0)).toBe(true);
        });
    });

    // ── Both Fighters ───────────────────────────────────────────────

    describe('Multi-Fighter Support', () => {
        it('should track charge independently for two fighters', () => {
            const fighter2 = new Fighter('cpu', 800, false);

            const now = vi.spyOn(performance, 'now');
            now.mockReturnValue(0);

            // Fighter 1 charges punch
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            now.mockReturnValue(500);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });

            // Fighter 2 charges kick at a different time
            now.mockReturnValue(500);
            fighter2.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: true });

            now.mockReturnValue(700);
            fighter.update(dt, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            fighter2.update(dt, { x: 0, y: 0, punchHeld: false, kickHeld: true });

            // Fighter 1 has been charging longer
            expect(fighter.chargeLevel.value).toBeGreaterThan(fighter2.chargeLevel.value);
        });
    });
});
