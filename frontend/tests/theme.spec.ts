import { expect, test } from '@playwright/test';

test('motion can be paused and follows device preferences', async ({ page }, testInfo) => {
    await page.goto('./#/dashboard');

    await expect(page.locator('.brand .brand-mark')).toBeVisible();
    await expect(page.locator('.brand .lucide-shield-check')).toHaveCount(0);
    await expect(page.locator('.cyber-ambient')).toHaveAttribute('aria-hidden', 'true');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip navigation' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#workspace')).toBeFocused();
    await expect(page).toHaveURL(/\/#\/dashboard$/);
    await page.mouse.move(640, 360);
    await expect.poll(() => page.locator('.app-shell').evaluate(element =>
        [element.style.getPropertyValue('--pointer-x'), element.style.getPropertyValue('--pointer-y')]
    )).toEqual(['640px', '360px']);
    await page.screenshot({ path: testInfo.outputPath('cyberpunk-dashboard.png'), fullPage: true, animations: 'disabled' });

    await page.getByRole('button', { name: 'Pause animations' }).click();
    await expect(page.getByRole('button', { name: 'Resume animations' })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.locator('.route-view').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    expect(await page.locator('.app-shell').evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none');
    const pausedPointer = await page.locator('.app-shell').evaluate(element =>
        [element.style.getPropertyValue('--pointer-x'), element.style.getPropertyValue('--pointer-y')]
    );
    await page.mouse.move(800, 500);
    await expect.poll(() => page.locator('.app-shell').evaluate(element =>
        [element.style.getPropertyValue('--pointer-x'), element.style.getPropertyValue('--pointer-y')]
    )).toEqual(pausedPointer);
    await page.getByRole('button', { name: 'Resume animations' }).click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.locator('.route-view').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    await page.setViewportSize({ width: 320, height: 900 });
    await page.getByRole('link', { name: 'Encrypt File', exact: true }).click();
    await expect(page.getByLabel('Choose a file to encrypt')).toBeAttached();
    await page.screenshot({ path: testInfo.outputPath('cyberpunk-mobile.png'), fullPage: true, animations: 'disabled' });
});
