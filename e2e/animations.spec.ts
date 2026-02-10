import { test, expect, Page } from '@playwright/test';

/**
 * Animation E2E Tests — SVG Fallback Mode
 *
 * Forces the legacy SVG renderer via ?renderer=legacy, then inspects
 * SVG path `d` attributes on the player fighter's right arm and right
 * leg to verify wind-up (pull-back during charge) and strike (extension
 * on attack release) animations are geometrically correct.
 *
 * Constants (from engine):
 *   FIGHTER_WIDTH = 100  →  cx = 50
 *   Idle arm guard:  M 65,55 L 80,80 L 95,60
 *   Idle leg stand:  M 60,110 L 75,190
 */

// ── Helpers ──────────────────────────────────────────────────────────

/** Navigate to game arena in SVG-legacy mode. */
async function navigateToGame(page: Page) {
    await page.goto('/?renderer=legacy');
    page.on('console', (msg) => console.log('PAGE:', msg.text()));
    await page.click('text=1 PLAYER');
    await page.click('text=FIGHT!');
    // In legacy mode there's no "Loading Arena..." for long — SVG renders immediately
    await expect(page.locator('svg')).toBeVisible({ timeout: 10_000 });
    // Small settle time for game loop to start
    await page.waitForTimeout(300);
    // Focus so keyboard events reach the game
    await page.click('body');
}

/**
 * Parse all numeric values from an SVG path `d` attribute.
 * e.g. "M 65,55 L 80,80 L 95,60" → [65, 55, 80, 80, 95, 60]
 */
function parsePathNumbers(d: string): number[] {
    return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/** Read the `d` attribute from a data-testid locator. */
async function getPathD(page: Page, testId: string): Promise<string> {
    return await page.locator(`[data-testid="${testId}"]`).getAttribute('d') ?? '';
}

// ── Constants for idle poses (FIGHTER_WIDTH = 100, cx = 50) ──────────
const IDLE_ARM_D = 'M 65,55 L 80,80 L 95,60';
const IDLE_LEG_D = 'M 60,110 L 75,190';

// ── Test Suite ───────────────────────────────────────────────────────

test.describe('Fighter Animations (SVG Legacy)', () => {

    // ── Idle Pose ────────────────────────────────────────────────────

    test('idle pose: arm should be in guard position', async ({ page }) => {
        await navigateToGame(page);

        const armD = await getPathD(page, 'right-arm-player');
        expect(armD).toBe(IDLE_ARM_D);
    });

    test('idle pose: leg should be in standing position', async ({ page }) => {
        await navigateToGame(page);

        const legD = await getPathD(page, 'right-leg-player');
        expect(legD).toBe(IDLE_LEG_D);
    });

    // ── Punch Charge Wind-Up ─────────────────────────────────────────

    test('punch charge: arm pulls back progressively', async ({ page }) => {
        await navigateToGame(page);

        // Baseline idle arm
        const idleArm = parsePathNumbers(await getPathD(page, 'right-arm-player'));

        // Start charging punch (R key)
        await page.keyboard.down('r');
        await page.waitForTimeout(150);

        // Read arm partway through charge (early wind-up, well under 0.5s)
        const earlyD = await getPathD(page, 'right-arm-player');
        const earlyArm = parsePathNumbers(earlyD);

        // Continue charging (still within 0.5s wind-up window)
        await page.waitForTimeout(200);

        // Read arm further into charge
        const lateD = await getPathD(page, 'right-arm-player');
        const lateArm = parsePathNumbers(lateD);

        await page.keyboard.up('r');

        // The arm path should have changed from idle
        expect(earlyD).not.toBe(IDLE_ARM_D);

        // The fist X coordinate (last X in path) should move backward (decrease)
        // as charge progresses: idle > early > late
        const idleFistX = idleArm[idleArm.length - 2];
        const earlyFistX = earlyArm[earlyArm.length - 2];
        const lateFistX = lateArm[lateArm.length - 2];

        expect(earlyFistX).toBeLessThan(idleFistX);
        expect(lateFistX).toBeLessThan(earlyFistX);
    });

    // ── Kick Charge Wind-Up ──────────────────────────────────────────

    test('kick charge: leg chambers progressively', async ({ page }) => {
        await navigateToGame(page);

        // Baseline idle leg
        const idleLeg = parsePathNumbers(await getPathD(page, 'right-leg-player'));

        // Start charging kick (F key)
        await page.keyboard.down('f');
        await page.waitForTimeout(350);

        const earlyD = await getPathD(page, 'right-leg-player');
        const earlyLeg = parsePathNumbers(earlyD);

        await page.waitForTimeout(450);

        const lateD = await getPathD(page, 'right-leg-player');
        const lateLeg = parsePathNumbers(lateD);

        await page.keyboard.up('f');

        // Leg path should now have 3 points (hip, knee, foot) instead of 2 (hip, foot)
        expect(earlyLeg.length).toBeGreaterThan(idleLeg.length);

        // The foot Y (last Y) should move upward (decrease) as charge progresses
        const idleFootY = idleLeg[idleLeg.length - 1];
        const earlyFootY = earlyLeg[earlyLeg.length - 1];
        const lateFootY = lateLeg[lateLeg.length - 1];

        expect(earlyFootY).toBeLessThan(idleFootY);
        expect(lateFootY).toBeLessThan(earlyFootY);
    });

    // ── Charge Aura ──────────────────────────────────────────────────

    test('charge aura grows with charge level', async ({ page }) => {
        await navigateToGame(page);

        const aura = page.locator('[data-testid="charge-aura-player"]');

        // Before charging: radius should be small (10) and opacity near 0
        const rBefore = parseFloat(await aura.getAttribute('r') ?? '0');
        const opBefore = parseFloat(await aura.getAttribute('opacity') ?? '0');

        // Charge punch
        await page.keyboard.down('r');
        await page.waitForTimeout(600);

        const rDuring = parseFloat(await aura.getAttribute('r') ?? '0');
        const opDuring = parseFloat(await aura.getAttribute('opacity') ?? '0');

        await page.keyboard.up('r');

        // Aura radius should have grown
        expect(rDuring).toBeGreaterThan(rBefore);
        // Aura opacity should have increased
        expect(opDuring).toBeGreaterThan(opBefore);
    });

    // ── Punch Release: Arm Extends ───────────────────────────────────

    test('punch release: arm extends forward on attack', async ({ page }) => {
        await navigateToGame(page);

        const logs: string[] = [];
        page.on('console', (msg) => logs.push(msg.text()));

        // Charge briefly then release
        await page.keyboard.down('r');
        await page.waitForTimeout(400);
        await page.keyboard.up('r');

        // Small wait for ATTACKING state to render
        await page.waitForTimeout(50);

        const attackArmD = await getPathD(page, 'right-arm-player');
        const attackArm = parsePathNumbers(attackArmD);

        // In ATTACKING state, the arm should extend FORWARD (large X values)
        // Attack arm is a 2-point path: "M shoulder L target"
        // The target X should be well past the body center (50) — at ~110 (cx+60)
        const targetX = attackArm[attackArm.length - 2];
        expect(targetX).toBeGreaterThan(90); // Extended forward past body

        // Verify console log confirms attack
        await page.waitForTimeout(200);
        const attackLog = logs.find((l) => l.includes('Attack released'));
        expect(attackLog).toBeTruthy();
    });

    // ── Kick Release: Leg Extends ────────────────────────────────────

    test('kick release: leg extends forward on attack', async ({ page }) => {
        await navigateToGame(page);

        // Charge kick then release
        await page.keyboard.down('f');
        await page.waitForTimeout(400);
        await page.keyboard.up('f');

        await page.waitForTimeout(50);

        const attackLegD = await getPathD(page, 'right-leg-player');
        const attackLeg = parsePathNumbers(attackLegD);

        // Body-level kick — leg extends forward, target X past body center (~110 = cx+60)
        const targetX = attackLeg[attackLeg.length - 2];
        expect(targetX).toBeGreaterThan(90);
    });

    // ── State Transition: ATTACKING → IDLE Reset ─────────────────────

    test('arm returns to guard after attack completes', async ({ page }) => {
        await navigateToGame(page);

        // Quick jab: brief charge + release
        await page.keyboard.down('r');
        await page.waitForTimeout(150);
        await page.keyboard.up('r');

        // Immediately after release, should be ATTACKING
        await page.waitForTimeout(50);
        const attackArm = await getPathD(page, 'right-arm-player');
        expect(attackArm).not.toBe(IDLE_ARM_D);

        // Wait for JAB to complete (duration 0.2s + recovery 0.1s = 300ms + buffer)
        await page.waitForTimeout(500);

        // Should have returned to idle guard pose
        const resetArm = await getPathD(page, 'right-arm-player');
        expect(resetArm).toBe(IDLE_ARM_D);
    });

    // ── Overheat Resets Pose ─────────────────────────────────────────

    test('overheat resets arm to idle and clears aura', async ({ page }) => {
        await navigateToGame(page);

        // Hold punch past OVERHEAT_TIME (2.0s)
        await page.keyboard.down('r');
        await page.waitForTimeout(2200);
        await page.keyboard.up('r');

        // Small settle
        await page.waitForTimeout(200);

        // Arm should have reset to idle guard
        const armD = await getPathD(page, 'right-arm-player');
        expect(armD).toBe(IDLE_ARM_D);

        // Charge aura should have shrunk back (chargeLevel = 0 → r = 10, opacity = 0)
        const aura = page.locator('[data-testid="charge-aura-player"]');
        const r = parseFloat(await aura.getAttribute('r') ?? '0');
        const opacity = parseFloat(await aura.getAttribute('opacity') ?? '1');

        expect(r).toBeLessThanOrEqual(10);
        expect(opacity).toBeLessThanOrEqual(0.01);
    });

    // ── Power Bar ────────────────────────────────────────────────────

    test('power bar grows during charge', async ({ page }) => {
        await navigateToGame(page);

        const powerFill = page.locator('[data-testid="power-fill-power"]');

        // Before charging, power bar should be at 0%
        const widthBefore = await powerFill.evaluate((el) => el.style.width);
        expect(widthBefore).toBe('0%');

        // Charge
        await page.keyboard.down('r');
        await page.waitForTimeout(500);

        const widthDuring = await powerFill.evaluate((el) => el.style.width);
        const pctDuring = parseFloat(widthDuring);
        expect(pctDuring).toBeGreaterThan(10);

        await page.keyboard.up('r');
    });

    test('power bar resets to 0% after attack completes', async ({ page }) => {
        await navigateToGame(page);

        const powerFill = page.locator('[data-testid="power-fill-power"]');

        // Charge briefly, then release to attack
        await page.keyboard.down('r');
        await page.waitForTimeout(300);
        await page.keyboard.up('r');

        // Wait for attack duration + recovery to finish (JAB = 200ms + 100ms)
        await page.waitForTimeout(500);

        const widthAfter = await powerFill.evaluate((el) => el.style.width);
        expect(widthAfter).toBe('0%');
    });

    test('power bar resets on overheat', async ({ page }) => {
        await navigateToGame(page);

        const powerFill = page.locator('[data-testid="power-fill-power"]');

        // Charge past overheat
        await page.keyboard.down('r');
        await page.waitForTimeout(2200);
        await page.keyboard.up('r');

        await page.waitForTimeout(100);

        const widthAfter = await powerFill.evaluate((el) => el.style.width);
        expect(widthAfter).toBe('0%');
    });

    test('power bar reaches near 100% at max charge', async ({ page }) => {
        await navigateToGame(page);

        const powerFill = page.locator('[data-testid="power-fill-power"]');

        // Charge for full second
        await page.keyboard.down('r');
        await page.waitForTimeout(1050);

        const widthMax = await powerFill.evaluate((el) => el.style.width);
        const pctMax = parseFloat(widthMax);
        expect(pctMax).toBeGreaterThanOrEqual(90);

        await page.keyboard.up('r');
    });

    test('CPU power bar exists and starts at 0%', async ({ page }) => {
        await navigateToGame(page);

        const cpuFill = page.locator('[data-testid="power-fill-cpu"]');
        await expect(cpuFill).toBeVisible();

        const width = await cpuFill.evaluate((el) => el.style.width);
        expect(width).toBe('0%');
    });

    test('power bar container is rendered for player', async ({ page }) => {
        await navigateToGame(page);

        const powerBar = page.locator('[data-testid="power-bar-power"]');
        await expect(powerBar).toBeVisible();
    });

    // ── Jump ─────────────────────────────────────────────────────────

    test('UP key triggers jump (fighter moves upward)', async ({ page }) => {
        await navigateToGame(page);

        const fighter = page.locator('[data-testid="fighter-player"]');

        // Capture initial transform Y
        const initialTransform = await fighter.evaluate((el) => el.style.transform);
        const initialY = parseFloat((initialTransform.match(/translate\([^,]+,\s*([^p]+)px/) ?? ['', '900'])[1]);

        // Jump
        await page.keyboard.down('w');
        await page.waitForTimeout(200);
        await page.keyboard.up('w');

        // Fighter Y should be less than ground (moved upward in screen coords)
        const jumpTransform = await fighter.evaluate((el) => el.style.transform);
        const jumpY = parseFloat((jumpTransform.match(/translate\([^,]+,\s*([^p]+)px/) ?? ['', '900'])[1]);

        expect(jumpY).toBeLessThan(initialY);
    });

    test('fighter returns to ground after jump', async ({ page }) => {
        await navigateToGame(page);

        const fighter = page.locator('[data-testid="fighter-player"]');

        const initialTransform = await fighter.evaluate((el) => el.style.transform);
        const initialY = parseFloat((initialTransform.match(/translate\([^,]+,\s*([^p]+)px/) ?? ['', '900'])[1]);

        // Jump
        await page.keyboard.down('w');
        await page.waitForTimeout(100);
        await page.keyboard.up('w');

        // Wait for full arc to complete (~0.67s theoretical, pad to 1s)
        await page.waitForTimeout(1000);

        const landTransform = await fighter.evaluate((el) => el.style.transform);
        const landY = parseFloat((landTransform.match(/translate\([^,]+,\s*([^p]+)px/) ?? ['', '0'])[1]);

        // Should be back at ground level (GROUND_Y = 900)
        expect(landY).toBeCloseTo(initialY, 0);
    });

    test('diagonal jump moves fighter horizontally', async ({ page }) => {
        await navigateToGame(page);

        const fighter = page.locator('[data-testid="fighter-player"]');

        const initialTransform = await fighter.evaluate((el) => el.style.transform);
        const initialX = parseFloat((initialTransform.match(/translate\(([^p]+)px/) ?? ['', '400'])[1]);

        // Jump + move right simultaneously
        await page.keyboard.down('d');   // RIGHT
        await page.keyboard.down('w');   // UP
        await page.waitForTimeout(300);
        await page.keyboard.up('w');
        await page.keyboard.up('d');

        const jumpTransform = await fighter.evaluate((el) => el.style.transform);
        const jumpX = parseFloat((jumpTransform.match(/translate\(([^p]+)px/) ?? ['', '400'])[1]);

        expect(jumpX).toBeGreaterThan(initialX);
    });

    test('fighter color changes to violet during jump', async ({ page }) => {
        await navigateToGame(page);

        // Jump
        await page.keyboard.down('w');
        await page.waitForTimeout(150);

        // The body group should have violet color (#a78bfa) during JUMPING
        const bodyColor = await page.locator('[data-testid="fighter-player"] g').first().evaluate((el) => {
            return (el as HTMLElement).style.color;
        });

        await page.keyboard.up('w');

        // Color should be violet (#a78bfa) = rgb(167, 139, 250)
        expect(bodyColor).toContain('rgb(167, 139, 250)');
    });

    test('cannot jump while blocking (DOWN held)', async ({ page }) => {
        await navigateToGame(page);

        const fighter = page.locator('[data-testid="fighter-player"]');

        // Block (DOWN = S key)
        await page.keyboard.down('s');
        await page.waitForTimeout(100);

        const blockTransform = await fighter.evaluate((el) => el.style.transform);
        const blockY = parseFloat((blockTransform.match(/translate\([^,]+,\s*([^p]+)px/) ?? ['', '900'])[1]);

        // Try pressing UP while DOWN is held — should remain on ground
        await page.keyboard.down('w');
        await page.waitForTimeout(200);

        const afterTransform = await fighter.evaluate((el) => el.style.transform);
        const afterY = parseFloat((afterTransform.match(/translate\([^,]+,\s*([^p]+)px/) ?? ['', '900'])[1]);

        await page.keyboard.up('s');
        await page.keyboard.up('w');

        // Y should not have changed (still on ground)
        expect(afterY).toBeCloseTo(blockY, 0);
    });
});
