import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkCollision, resolvePushCollision } from '../Collision';
import { Fighter } from '../Fighter';

// Mock the store
vi.mock('../../store/gameState', () => ({
    useGameStore: {
        getState: () => ({ currentLevel: 1 })
    }
}));

describe('Collision Detection', () => {
    let fighter1: Fighter;
    let fighter2: Fighter;

    beforeEach(() => {
        fighter1 = new Fighter('p1', 100, true);
        fighter2 = new Fighter('p2', 300, false);
    });

    describe('checkCollision', () => {
        it('should return false when fighters are far apart', () => {
            fighter1.x.value = 100;
            fighter2.x.value = 500;
            expect(checkCollision(fighter1, fighter2)).toBe(false);
        });

        it('should return true when fighters overlap', () => {
            fighter1.x.value = 100;
            fighter2.x.value = 150; // Within FIGHTER_WIDTH (100)
            expect(checkCollision(fighter1, fighter2)).toBe(true);
        });

        it('should return true when fighters are exactly at collision threshold', () => {
            fighter1.x.value = 100;
            fighter2.x.value = 199; // Just under FIGHTER_WIDTH
            expect(checkCollision(fighter1, fighter2)).toBe(true);
        });

        it('should handle negative positions', () => {
            fighter1.x.value = -50;
            fighter2.x.value = 0;
            expect(checkCollision(fighter1, fighter2)).toBe(true);
        });
    });

    describe('resolvePushCollision', () => {
        it('should push fighters apart when overlapping', () => {
            fighter1.x.value = 100;
            fighter2.x.value = 120;
            
            const initialDist = Math.abs(fighter2.x.value - fighter1.x.value);
            resolvePushCollision(fighter1, fighter2);
            const finalDist = Math.abs(fighter2.x.value - fighter1.x.value);
            
            expect(finalDist).toBeGreaterThan(initialDist);
        });

        it('should preserve relative positions (f1 left of f2)', () => {
            fighter1.x.value = 100;
            fighter2.x.value = 120;
            
            resolvePushCollision(fighter1, fighter2);
            
            expect(fighter1.x.value).toBeLessThan(fighter2.x.value);
        });

        it('should handle reverse positions (f2 left of f1)', () => {
            fighter1.x.value = 200;
            fighter2.x.value = 180;
            
            resolvePushCollision(fighter1, fighter2);
            
            expect(fighter2.x.value).toBeLessThan(fighter1.x.value);
        });
    });
});
