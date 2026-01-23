import { describe, it, expect, vi } from 'vitest';
import { Signal, createSignal } from '../Signals';

describe('Signal', () => {
    it('should initialize with the correct value', () => {
        const signal = new Signal(42);
        expect(signal.value).toBe(42);
    });

    it('should update value correctly', () => {
        const signal = new Signal(10);
        signal.value = 20;
        expect(signal.value).toBe(20);
    });

    it('should notify subscribers on value change', () => {
        const signal = new Signal('initial');
        const callback = vi.fn();
        
        signal.subscribe(callback);
        signal.value = 'updated';
        
        expect(callback).toHaveBeenCalledWith('updated');
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not notify if value does not change', () => {
        const signal = new Signal(100);
        const callback = vi.fn();
        
        signal.subscribe(callback);
        signal.value = 100; // Same value
        
        expect(callback).not.toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
        const signal = new Signal(0);
        const callback = vi.fn();
        
        const unsubscribe = signal.subscribe(callback);
        unsubscribe();
        signal.value = 1;
        
        expect(callback).not.toHaveBeenCalled();
    });

    it('peek() should return current value without subscription', () => {
        const signal = new Signal('hello');
        expect(signal.peek()).toBe('hello');
    });
});

describe('createSignal', () => {
    it('should create a Signal instance', () => {
        const signal = createSignal(5);
        expect(signal).toBeInstanceOf(Signal);
        expect(signal.value).toBe(5);
    });
});
