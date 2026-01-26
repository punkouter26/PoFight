import { test, expect } from '@playwright/test';

test.describe('PoFight Core', () => {
    test('should load the game arena', async ({ page }) => {
        await page.goto('/');

        // Wait for "Loading Arena..." to disappear
        await expect(page.locator('text=Loading Arena...')).toBeHidden({ timeout: 10000 });

        // Wait for WebGPU canvas to be present
        await expect(page.locator('canvas')).toBeVisible();

        // Check for Fighters by text in HUD
        await expect(page.locator('h2', { hasText: 'PLAYER' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'CPU' })).toBeVisible();
    });

    test('should charge attack when holding R', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('text=Loading Arena...')).toBeHidden({ timeout: 10000 });

        const logs: string[] = [];
        page.on('console', msg => logs.push(msg.text()));

        // Focus the window (sometimes needed for input)
        await page.click('body');

        // Hold R (Punch) for 1 second (Sweet spot)
        await page.keyboard.down('r');
        await page.waitForTimeout(1200);
        await page.keyboard.up('r');

        // Allow time for log
        await page.waitForTimeout(1000);

        const attackLog = logs.find(l => l.includes('Attack released'));
        if (!attackLog) {
            console.log('Test Failed. Logs captured:', logs);
        }
        expect(attackLog).toBeTruthy();
        if (attackLog) {
            expect(attackLog).toContain('Max? true');
        }
    });

    test('should overheat if held too long', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('text=Loading Arena...')).toBeHidden({ timeout: 10000 });

        const logs: string[] = [];
        page.on('console', msg => logs.push(msg.text()));

        await page.click('body');

        // Hold R for 2.1 seconds
        await page.keyboard.down('r');
        await page.waitForTimeout(2100);
        await page.keyboard.up('r');
        await page.waitForTimeout(500);

        const attackLog = logs.find(l => l.includes('Attack released'));
        // Should NOT log "Attack released" if overheated
        expect(attackLog).toBeUndefined();
    });
});
