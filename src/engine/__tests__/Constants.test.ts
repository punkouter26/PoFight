import { describe, it, expect } from 'vitest';
import {
    GAME_WIDTH,
    GAME_HEIGHT,
    GROUND_Y,
    FIGHTER_WIDTH,
    FIGHTER_HEIGHT,
    MOVE_SPEED,
    MAX_CHARGE_TIME,
    OVERHEAT_TIME,
    ATTACK_FRAME_DATA
} from '../Constants';

describe('Game Constants', () => {
    it('should have correct game dimensions', () => {
        expect(GAME_WIDTH).toBe(1920);
        expect(GAME_HEIGHT).toBe(1080);
    });

    it('should have ground Y below game center', () => {
        expect(GROUND_Y).toBeGreaterThan(GAME_HEIGHT / 2);
        expect(GROUND_Y).toBe(900);
    });

    it('should have valid fighter dimensions', () => {
        expect(FIGHTER_WIDTH).toBeGreaterThan(0);
        expect(FIGHTER_HEIGHT).toBeGreaterThan(0);
        expect(FIGHTER_HEIGHT).toBeGreaterThan(FIGHTER_WIDTH); // Fighters are taller than wide
    });

    it('should have charge timing that allows max charge before overheat', () => {
        expect(MAX_CHARGE_TIME).toBeLessThan(OVERHEAT_TIME);
        expect(MAX_CHARGE_TIME).toBe(1.0);
        expect(OVERHEAT_TIME).toBe(2.0);
    });

    it('should have positive move speed', () => {
        expect(MOVE_SPEED).toBeGreaterThan(0);
    });

    it('should have attack frame data with valid values', () => {
        expect(ATTACK_FRAME_DATA.JAB.damage).toBeGreaterThan(0);
        expect(ATTACK_FRAME_DATA.HEAVY_PUNCH.damage).toBeGreaterThan(ATTACK_FRAME_DATA.JAB.damage);
        expect(ATTACK_FRAME_DATA.HEAVY_KICK.damage).toBeGreaterThan(ATTACK_FRAME_DATA.KICK_FLICK.damage);
    });
});
