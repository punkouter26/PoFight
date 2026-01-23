import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputManager, KEY_MAPPINGS, InputKey } from '../InputManager';

describe('InputManager', () => {
    let inputManager: InputManager;

    beforeEach(() => {
        vi.spyOn(performance, 'now').mockReturnValue(0);
        inputManager = new InputManager();
    });

    afterEach(() => {
        inputManager.cleanup();
        vi.restoreAllMocks();
    });

    describe('KEY_MAPPINGS', () => {
        it('should map WASD keys correctly', () => {
            expect(KEY_MAPPINGS['w']).toBe('UP');
            expect(KEY_MAPPINGS['a']).toBe('LEFT');
            expect(KEY_MAPPINGS['s']).toBe('DOWN');
            expect(KEY_MAPPINGS['d']).toBe('RIGHT');
        });

        it('should map arrow keys correctly', () => {
            expect(KEY_MAPPINGS['arrowup']).toBe('UP');
            expect(KEY_MAPPINGS['arrowdown']).toBe('DOWN');
            expect(KEY_MAPPINGS['arrowleft']).toBe('LEFT');
            expect(KEY_MAPPINGS['arrowright']).toBe('RIGHT');
        });

        it('should map attack keys correctly', () => {
            expect(KEY_MAPPINGS['r']).toBe('PUNCH');
            expect(KEY_MAPPINGS['f']).toBe('KICK');
        });
    });

    describe('isPressed()', () => {
        it('should return false for unpressed keys', () => {
            expect(inputManager.isPressed('UP')).toBe(false);
            expect(inputManager.isPressed('PUNCH')).toBe(false);
        });

        it('should return true after keydown event', () => {
            const event = new KeyboardEvent('keydown', { key: 'w' });
            window.dispatchEvent(event);
            
            expect(inputManager.isPressed('UP')).toBe(true);
        });

        it('should return false after keyup event', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
            
            expect(inputManager.isPressed('UP')).toBe(false);
        });

        it('should handle case insensitive keys', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'W' }));
            expect(inputManager.isPressed('UP')).toBe(true);
        });

        it('should ignore unmapped keys', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
            
            // All states should remain false
            const allKeys: InputKey[] = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'PUNCH', 'KICK'];
            allKeys.forEach(key => {
                expect(inputManager.isPressed(key)).toBe(false);
            });
        });
    });

    describe('getAxis()', () => {
        it('should return zero when no keys pressed', () => {
            const axis = inputManager.getAxis();
            expect(axis.x).toBe(0);
            expect(axis.y).toBe(0);
        });

        it('should return positive x for RIGHT', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
            expect(inputManager.getAxis().x).toBe(1);
        });

        it('should return negative x for LEFT', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            expect(inputManager.getAxis().x).toBe(-1);
        });

        it('should return positive y for UP', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            expect(inputManager.getAxis().y).toBe(1);
        });

        it('should return negative y for DOWN', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
            expect(inputManager.getAxis().y).toBe(-1);
        });

        it('should cancel out opposing directions', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
            
            expect(inputManager.getAxis().x).toBe(0);
        });

        it('should handle diagonal input', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
            
            const axis = inputManager.getAxis();
            expect(axis.x).toBe(1);
            expect(axis.y).toBe(1);
        });
    });

    describe('getHoldDuration()', () => {
        it('should return 0 for unpressed keys', () => {
            expect(inputManager.getHoldDuration('PUNCH')).toBe(0);
        });

        it('should return duration since key press', () => {
            vi.spyOn(performance, 'now').mockReturnValue(1000); // 1 second
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
            
            vi.spyOn(performance, 'now').mockReturnValue(2500); // 2.5 seconds
            expect(inputManager.getHoldDuration('PUNCH')).toBe(1.5);
        });

        it('should reset duration after keyup', () => {
            vi.spyOn(performance, 'now').mockReturnValue(1000);
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'r' }));
            
            expect(inputManager.getHoldDuration('PUNCH')).toBe(0);
        });
    });

    describe('Multiple Simultaneous Keys', () => {
        it('should track multiple keys independently', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
            
            expect(inputManager.isPressed('PUNCH')).toBe(true);
            expect(inputManager.isPressed('KICK')).toBe(true);
            expect(inputManager.isPressed('RIGHT')).toBe(true);
            expect(inputManager.isPressed('LEFT')).toBe(false);
        });

        it('should release only the key that was released', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'r' }));
            
            expect(inputManager.isPressed('PUNCH')).toBe(false);
            expect(inputManager.isPressed('KICK')).toBe(true);
        });
    });

    describe('cleanup()', () => {
        it('should remove event listeners', () => {
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
            inputManager.cleanup();
            
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
        });
    });
});
