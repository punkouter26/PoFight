import { Fighter } from './Fighter';


export class AIController {
    private me: Fighter;
    private opponent: Fighter;

    private mistakeRate: number;
    private aggression: number;

    private nextActionTime: number = 0;

    constructor(me: Fighter, opponent: Fighter, level: number) {
        this.me = me;
        this.opponent = opponent;

        // Config based on level
        // this._reactionDelay = ... (unused)
        this.mistakeRate = Math.max(0, 0.5 - (level * 0.1)); // Lv1: 50% mistake chance
        this.aggression = level * 0.2; // Lv1: 0.2, Lv5: 1.0
    }

    public update(_dt: number, _time: number) {
        if (this.nextActionTime > _time) return;

        // Decide input for this frame based on currentAction
        // Note: Fighter.setInput is not fully implemented in Fighter.ts yet, we focused on update() loop inputs.
        // We need to simulate the `input` object that Fighter.update expects.
        // Ideally Fighter.update takes an input usage object.

        // For now, we will return the input object to be fed into the fighter. Since AI is driven frame-by-frame.
        // This design might need inversion: FightManager asks AI for input.
    }

    public getInput(): { x: number, y: number, punchHeld: boolean, kickHeld: boolean } {
        // Simple state machine
        const dist = Math.abs(this.me.x.value - this.opponent.x.value);
        const opponentAttacking = this.opponent.state.value === 'ATTACKING' || this.opponent.chargeLevel.value > 0.5;

        const input = { x: 0, y: 0, punchHeld: false, kickHeld: false };

        // Defensive Logic
        if (opponentAttacking) {
            // Randomly block or mistake based on level
            if (Math.random() > this.mistakeRate) {
                // Omni-block high/low heuristic (simplified)
                // In real game, read opponent modifier? Or guess?
                // Level 5 reads inputs (cheats?), Level 1 guesses.
                const guessHigh = Math.random() > 0.5;
                input.y = guessHigh ? 1 : -1;
                return input;
            }
        }

        // Offensive Logic
        if (dist > 150) {
            input.x = this.me.x.value < this.opponent.x.value ? 1 : -1; // Move towards
        } else {
            // Attack range
            if (Math.random() < this.aggression * 0.1) {
                input.punchHeld = true; // Hold to charge
                // Release logic needs state memory in AI... 
                // "Hold-and-Release" requires AI to hold for frames.
            }
        }

        return input;
    }
}
