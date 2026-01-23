import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Fighter } from '../Fighter';
import { checkCollision } from '../Collision';
import { FIGHTER_WIDTH } from '../Constants';

// Mock the store
vi.mock('../../store/gameState', () => ({
    useGameStore: {
        getState: () => ({ currentLevel: 1 })
    }
}));

/**
 * Hit Detection Tests
 * Tests for attack hitbox collision, damage calculation, and block interaction
 */
describe('Hit Detection', () => {
    let attacker: Fighter;
    let defender: Fighter;

    beforeEach(() => {
        vi.useFakeTimers();
        attacker = new Fighter('attacker', 400, true);
        defender = new Fighter('defender', 500, false);
    });

    describe('Attack Range', () => {
        it('should detect when fighters are in attack range', () => {
            attacker.x.value = 400;
            defender.x.value = 450; // Within FIGHTER_WIDTH
            
            expect(checkCollision(attacker, defender)).toBe(true);
        });

        it('should not detect collision when out of range', () => {
            attacker.x.value = 100;
            defender.x.value = 500;
            
            expect(checkCollision(attacker, defender)).toBe(false);
        });

        it('attack range should equal FIGHTER_WIDTH', () => {
            attacker.x.value = 100;
            defender.x.value = 100 + FIGHTER_WIDTH - 1;
            
            expect(checkCollision(attacker, defender)).toBe(true);
        });
    });

    describe('Attack States', () => {
        it('should set ATTACKING state after charge release', () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);
            
            // Start charging
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            expect(attacker.state.value).toBe('CHARGING');
            
            // Charge for 0.5 seconds
            vi.spyOn(performance, 'now').mockReturnValue(500);
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            // Release
            attacker.update(0.016, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            expect(attacker.state.value).toBe('ATTACKING');
        });

        it('should track attack type (PUNCH vs KICK)', () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);
            
            attacker.update(0.016, { x: 0, y: 0, punchHeld: false, kickHeld: true });
            expect(attacker.attackType.value).toBe('KICK');
        });

        it('should track attack height based on y input at release', () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);
            
            // Start charging
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            vi.spyOn(performance, 'now').mockReturnValue(500);
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            // Release with UP held (HIGH attack)
            attacker.update(0.016, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(attacker.attackHeight.value).toBe('HIGH');
        });

        it('should set LOW attack height when releasing with DOWN', () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);
            
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            vi.spyOn(performance, 'now').mockReturnValue(500);
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            // Release with DOWN held (LOW attack)
            attacker.update(0.016, { x: 0, y: -1, punchHeld: false, kickHeld: false });
            expect(attacker.attackHeight.value).toBe('LOW');
        });

        it('should default to MID attack height', () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);
            
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            vi.spyOn(performance, 'now').mockReturnValue(500);
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            // Release with no directional input
            attacker.update(0.016, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            expect(attacker.attackHeight.value).toBe('MID');
        });
    });

    describe('Blocking Interaction', () => {
        it('defender blocking HIGH should be in BLOCKING_HIGH state', () => {
            defender.update(0.016, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            expect(defender.state.value).toBe('BLOCKING_HIGH');
        });

        it('defender blocking LOW should be in BLOCKING_LOW state', () => {
            defender.update(0.016, { x: 0, y: -1, punchHeld: false, kickHeld: false });
            expect(defender.state.value).toBe('BLOCKING_LOW');
        });

        it('block height should match attack height for successful block (HIGH)', () => {
            // Setup attacker with HIGH attack
            attacker.attackHeight.value = 'HIGH';
            attacker.state.value = 'ATTACKING';
            
            // Defender blocks HIGH
            defender.update(0.016, { x: 0, y: 1, punchHeld: false, kickHeld: false });
            
            // Block matches attack height
            const blockMatchesAttack = 
                (attacker.attackHeight.value === 'HIGH' && defender.state.value === 'BLOCKING_HIGH');
            
            expect(blockMatchesAttack).toBe(true);
        });

        it('block height mismatch should fail (HIGH attack vs LOW block)', () => {
            attacker.attackHeight.value = 'HIGH';
            attacker.state.value = 'ATTACKING';
            
            defender.update(0.016, { x: 0, y: -1, punchHeld: false, kickHeld: false });
            
            const blockFails = 
                (attacker.attackHeight.value === 'HIGH' && defender.state.value === 'BLOCKING_LOW');
            
            expect(blockFails).toBe(true);
        });
    });

    describe('Charge Level & Damage Scaling', () => {
        it('should reach max charge at 1 second', () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);
            
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            // 1 second = max charge
            vi.spyOn(performance, 'now').mockReturnValue(1000);
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            expect(attacker.chargeLevel.value).toBe(1.0);
        });

        it('should cap charge level at 1.0', () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);
            
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            // 1.5 seconds - should still be capped at 1.0
            vi.spyOn(performance, 'now').mockReturnValue(1500);
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            expect(attacker.chargeLevel.value).toBe(1.0);
        });

        it('should overheat after 2 seconds', () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);
            
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            // 2.1 seconds = overheat
            vi.spyOn(performance, 'now').mockReturnValue(2100);
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            expect(attacker.state.value).toBe('OVERHEATED');
            expect(attacker.chargeLevel.value).toBe(0);
        });

        it('should not be able to attack while overheated', () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);
            
            // Trigger overheat
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            vi.spyOn(performance, 'now').mockReturnValue(2100);
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            expect(attacker.state.value).toBe('OVERHEATED');
            
            // Try to charge again while overheated
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            
            // Should still be overheated, not charging
            expect(attacker.state.value).toBe('OVERHEATED');
        });
    });

    describe('Hit Registration Timing', () => {
        it('attack state should reset to IDLE after attack duration', async () => {
            vi.spyOn(performance, 'now').mockReturnValue(0);
            
            // Charge and release
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            vi.spyOn(performance, 'now').mockReturnValue(500);
            attacker.update(0.016, { x: 0, y: 0, punchHeld: true, kickHeld: false });
            attacker.update(0.016, { x: 0, y: 0, punchHeld: false, kickHeld: false });
            
            expect(attacker.state.value).toBe('ATTACKING');
            
            // Advance timers past attack duration (300ms)
            vi.advanceTimersByTime(350);
            
            expect(attacker.state.value).toBe('IDLE');
        });
    });
});
