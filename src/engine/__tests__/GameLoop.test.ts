import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameLoop } from '../GameLoop';

describe('GameLoop', () => {
    let gameLoop: GameLoop;
    let mockCallback: ReturnType<typeof vi.fn>;
    let rafCallbacks: ((timestamp: number) => void)[];

    beforeEach(() => {
        rafCallbacks = [];
        
        // Mock requestAnimationFrame
        vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
            rafCallbacks.push(cb);
            return rafCallbacks.length;
        });
        
        vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
        vi.spyOn(performance, 'now').mockReturnValue(0);
        
        gameLoop = new GameLoop();
        mockCallback = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should create a GameLoop instance', () => {
            expect(gameLoop).toBeDefined();
        });

        it('should accept an update callback', () => {
            gameLoop.setUpdateCallback(mockCallback);
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('start()', () => {
        it('should start the game loop', () => {
            gameLoop.start();
            expect(requestAnimationFrame).toHaveBeenCalled();
        });

        it('should not start twice if already running', () => {
            gameLoop.start();
            gameLoop.start();
            expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
        });
    });

    describe('stop()', () => {
        it('should stop the game loop', () => {
            gameLoop.start();
            gameLoop.stop();
            expect(cancelAnimationFrame).toHaveBeenCalled();
        });

        it('should handle stop when not running', () => {
            expect(() => gameLoop.stop()).not.toThrow();
        });
    });

    describe('Frame Updates', () => {
        it('should call update callback with fixed timestep', () => {
            gameLoop.setUpdateCallback(mockCallback);
            gameLoop.start();
            
            // Simulate frame at 16.67ms (60fps)
            const frameTime = 1000 / 60;
            rafCallbacks[0](frameTime);
            
            expect(mockCallback).toHaveBeenCalledWith(frameTime / 1000);
        });

        it('should accumulate time for fixed timestep updates', () => {
            gameLoop.setUpdateCallback(mockCallback);
            gameLoop.start();
            
            // Simulate a frame that's 2x the timestep
            const frameTime = (1000 / 60) * 2;
            rafCallbacks[0](frameTime);
            
            // Should call update twice for accumulated time
            expect(mockCallback).toHaveBeenCalledTimes(2);
        });

        it('should cap delta time to prevent spiral of death', () => {
            gameLoop.setUpdateCallback(mockCallback);
            gameLoop.start();
            
            // Simulate a huge lag spike (2 seconds)
            rafCallbacks[0](2000);
            
            // Should cap at 1000ms, calling update ~60 times (1000 / 16.67)
            expect(mockCallback.mock.calls.length).toBeLessThanOrEqual(60);
        });

        it('should continue requesting frames while running', () => {
            gameLoop.setUpdateCallback(mockCallback);
            gameLoop.start();
            
            expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
            
            rafCallbacks[0](16.67);
            
            expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
        });

        it('should stop requesting frames after stop()', () => {
            gameLoop.setUpdateCallback(mockCallback);
            gameLoop.start();
            gameLoop.stop();
            
            // Try to run the callback after stop
            rafCallbacks[0](16.67);
            
            // Should not have requested another frame
            expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
        });
    });

    describe('Delta Time Calculation', () => {
        it('should pass correct delta time in seconds', () => {
            gameLoop.setUpdateCallback(mockCallback);
            gameLoop.start();
            
            const timestep = 1000 / 60; // ~16.67ms
            rafCallbacks[0](timestep);
            
            // Delta should be timestep / 1000 = ~0.01667 seconds
            expect(mockCallback).toHaveBeenCalledWith(expect.closeTo(0.01667, 3));
        });
    });
});
