import { Signal, createSignal } from './Signals';
import { MAX_CHARGE_TIME, OVERHEAT_TIME, MOVE_SPEED, GROUND_Y } from './Constants';
import { soundManager } from './SoundManager';

export type FighterState =
    | 'IDLE'
    | 'MOVING'
    | 'CHARGING'
    | 'ATTACKING'
    | 'BLOCKING_HIGH'
    | 'BLOCKING_LOW'
    | 'STUNNED'
    | 'OVERHEATED';

export class Fighter {
    public id: string;
    public x: Signal<number>;
    public y: Signal<number>;
    public state: Signal<FighterState>;
    public health: Signal<number>;
    public chargeLevel: Signal<number>;
    public attackType: Signal<'PUNCH' | 'KICK' | 'NONE'>;
    public attackHeight: Signal<'HIGH' | 'MID' | 'LOW'>;
    public facingRight: boolean = true;

    private chargeStartTime: number = 0;

    constructor(id: string, startX: number) {
        this.id = id;
        this.x = createSignal<number>(startX);
        this.y = createSignal<number>(GROUND_Y);
        this.state = createSignal<FighterState>('IDLE');
        this.health = createSignal<number>(100);
        this.chargeLevel = createSignal<number>(0);
        this.attackType = createSignal<'PUNCH' | 'KICK' | 'NONE'>('NONE');
        this.attackHeight = createSignal<'HIGH' | 'MID' | 'LOW'>('MID');
    }

    public update(dt: number, input: { x: number, y: number, punchHeld: boolean, kickHeld: boolean }) {
        const currentState = this.state.value;

        // Blocking Logic (if not charging/attacking/stunned/overheated)
        if (['IDLE', 'MOVING', 'BLOCKING_HIGH', 'BLOCKING_LOW'].includes(currentState)) {
            if (input.y > 0.5) { // UP
                this.state.value = 'BLOCKING_HIGH';
            } else if (input.y < -0.5) { // DOWN
                this.state.value = 'BLOCKING_LOW';
            } else {
                // Return to IDLE/MOVING if no block input and was blocking
                if (currentState === 'BLOCKING_HIGH' || currentState === 'BLOCKING_LOW') {
                    this.state.value = 'IDLE';
                }
            }
        }

        // Check if currently blocking to restrict movement/charge
        const isBlocking = this.state.value === 'BLOCKING_HIGH' || this.state.value === 'BLOCKING_LOW';

        // Movement (only if not busy and not blocking)
        if (['IDLE', 'MOVING'].includes(currentState) && !isBlocking) {
            if (input.x !== 0) {
                this.state.value = 'MOVING';
                this.x.value += input.x * MOVE_SPEED * dt;
                this.facingRight = input.x > 0;
            } else if (currentState === 'MOVING') {
                this.state.value = 'IDLE';
            }
        }

        // Charge Logic
        if (input.punchHeld || input.kickHeld) {
            // Start charging if possible
            if (!['CHARGING', 'OVERHEATED', 'ATTACKING'].includes(currentState) && !isBlocking) {
                this.state.value = 'CHARGING';
                this.chargeStartTime = performance.now() / 1000;
                this.chargeLevel.value = 0;
                this.attackType.value = input.punchHeld ? 'PUNCH' : 'KICK';
            }

            // Continue charging
            if (currentState === 'CHARGING') {
                const duration = (performance.now() / 1000) - this.chargeStartTime;
                this.chargeLevel.value = Math.min(duration / MAX_CHARGE_TIME, 1.0);

                // Overheat check
                if (duration > OVERHEAT_TIME) {
                    this.state.value = 'OVERHEATED';
                    this.chargeLevel.value = 0;
                    setTimeout(() => { if (this.state.value === 'OVERHEATED') this.state.value = 'IDLE'; }, 1000);
                }
            }
        } else {
            // Release logic
            if (currentState === 'CHARGING') {
                const duration = (performance.now() / 1000) - this.chargeStartTime;

                // Determine modifier based on input.y AT RELEASE time
                let modifier: 'HIGH' | 'MID' | 'LOW' = 'MID';
                if (input.y > 0.5) modifier = 'HIGH';
                if (input.y < -0.5) modifier = 'LOW';

                this.attackHeight.value = modifier;
                this.executeAttack(duration);
                this.chargeLevel.value = 0;
            }
        }
    }

    private executeAttack(chargeDuration: number) {
        this.state.value = 'ATTACKING';
        const isMaxCharge = chargeDuration >= MAX_CHARGE_TIME && chargeDuration < OVERHEAT_TIME;

        // Audio
        // const type = this.attackType.value === 'PUNCH' ? 'JAB' : 'HEAVY'; // TODO: distinct kick sounds
        soundManager.playPunch(isMaxCharge ? 'HEAVY' : 'JAB');

        console.log(`Attack released! Type: ${this.attackType.value}, Height: ${this.attackHeight.value}, Charge: ${chargeDuration.toFixed(2)}s. Max? ${isMaxCharge}`);

        // Reset to idle after animation (mock)
        setTimeout(() => {
            if (this.state.value === 'ATTACKING') this.state.value = 'IDLE';
        }, 300);
    }
}
