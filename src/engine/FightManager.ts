import { Fighter } from './Fighter';
import { checkCollision, resolvePushCollision } from './Collision';
import { GameLoop } from './GameLoop';
import { AIController } from './AIController';
import { inputManager } from './InputManager';
import { useGameStore } from '../store/gameState';
import { ATTACK_FRAME_DATA, FIGHTER_WIDTH } from './Constants';

export class FightManager {
    public player: Fighter;
    public cpu: Fighter;
    public ai: AIController;
    private gameLoop: GameLoop;

    constructor(gameLoop: GameLoop) {
        this.gameLoop = gameLoop;

        const store = useGameStore.getState();
        const level = store.currentLevel;

        this.player = new Fighter('player', 400);
        this.cpu = new Fighter('cpu', 1200);
        // facing setup
        this.player.facingRight = true;
        this.cpu.facingRight = false;

        this.ai = new AIController(this.cpu, this.player, level);

        // Bind update
        gameLoop.setUpdateCallback(this.update.bind(this));
    }

    update(dt: number) {
        // 1. Get Inputs
        const playerInput = {
            x: inputManager.getAxis().x,
            y: inputManager.getAxis().y,
            punchHeld: inputManager.isPressed('PUNCH'),
            kickHeld: inputManager.isPressed('KICK')
        };



        // AI Input
        const cpuInput = this.ai.getInput();

        // 2. Update Fighters
        this.player.update(dt, playerInput);
        this.cpu.update(dt, cpuInput);

        // 3. Physics / Collision
        if (checkCollision(this.player, this.cpu)) {
            resolvePushCollision(this.player, this.cpu);
        }

        // 4. Hit Detection (Not fully implemented yet, need Hitbox logic)
        this.checkHits();

        // 5. Win Condition
        if (this.cpu.health.value <= 0) {
            this.handleWin();
        } else if (this.player.health.value <= 0) {
            this.handleLoss();
        }
    }

    checkHits() {
        this.checkHitForAttacker(this.player, this.cpu);
        this.checkHitForAttacker(this.cpu, this.player);
    }

    private checkHitForAttacker(attacker: Fighter, defender: Fighter) {
        // Only check hits if attacker is in ATTACKING state
        if (attacker.state.value !== 'ATTACKING') return;

        // Check if in range
        const distance = Math.abs(attacker.x.value - defender.x.value);
        const attackRange = FIGHTER_WIDTH * 1.5; // Extended reach during attack

        if (distance > attackRange) return;

        // Check if defender is blocking correctly
        const attackHeight = attacker.attackHeight.value;
        const defenderState = defender.state.value;

        const isBlockedHigh = defenderState === 'BLOCKING_HIGH' && attackHeight === 'HIGH';
        const isBlockedLow = defenderState === 'BLOCKING_LOW' && attackHeight === 'LOW';
        const isBlockedMid = (defenderState === 'BLOCKING_HIGH' || defenderState === 'BLOCKING_LOW') && attackHeight === 'MID';

        if (isBlockedHigh || isBlockedLow) {
            // Perfect block - no damage, attacker gets slight pushback
            console.log(`${defender.id} BLOCKED ${attackHeight}!`);
            return;
        }

        if (isBlockedMid) {
            // Mid attacks do chip damage through blocks
            const chipDamage = 2;
            defender.health.value = Math.max(0, defender.health.value - chipDamage);
            console.log(`${defender.id} blocked but took ${chipDamage} chip damage`);
            return;
        }

        // Calculate damage based on attack type and charge
        const attackType = attacker.attackType.value;
        const chargeLevel = attacker.chargeLevel.peek();

        let baseDamage = 0;
        if (attackType === 'PUNCH') {
            baseDamage = chargeLevel >= 0.9 ? ATTACK_FRAME_DATA.HEAVY_PUNCH.damage : ATTACK_FRAME_DATA.JAB.damage;
        } else if (attackType === 'KICK') {
            baseDamage = chargeLevel >= 0.9 ? ATTACK_FRAME_DATA.HEAVY_KICK.damage : ATTACK_FRAME_DATA.KICK_FLICK.damage;
        }

        // Apply damage
        defender.health.value = Math.max(0, defender.health.value - baseDamage);
        defender.state.value = 'STUNNED';

        console.log(`${attacker.id} HIT ${defender.id} for ${baseDamage} damage! (${attackType} ${attackHeight})`);

        // Reset attacker to prevent multi-hit
        attacker.state.value = 'IDLE';
        attacker.attackType.value = 'NONE';

        // Stun recovery
        setTimeout(() => {
            if (defender.state.value === 'STUNNED') {
                defender.state.value = 'IDLE';
            }
        }, 300);
    }

    handleWin() {
        this.gameLoop.stop();
        const store = useGameStore.getState();
        const nextLevel = store.currentLevel + 1;
        store.unlockLevel(nextLevel);
        store.setHighScore(store.currentLevel, this.player.health.value * 100);
        // Trigger UI / Next Level (would typically emit an event or update a signal)
        console.log("YOU WIN");
        // Simple reload for now, or callback
        setTimeout(() => {
            // alert("Victory! Loading next level...");
            if (nextLevel <= 5) {
                store.setCurrentLevel(nextLevel);
                window.location.reload();
            } else {
                console.log("GAME BEATEN");
            }
        }, 2000);
    }

    handleLoss() {
        this.gameLoop.stop();
        console.log("GAME OVER");
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}
