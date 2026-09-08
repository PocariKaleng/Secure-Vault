import { expect, test } from '@playwright/test';

test('the production shell supports reload-safe hash routes and browser hardening metadata', async ({ page }) => {
    await page.goto('./#/missing-route');
    await expect(page.getByRole('heading', { name: 'A private space for your files.' })).toBeVisible();
    await expect(page).toHaveURL(/\/#\/dashboard$/);

    await page.goto('./#/vault');
    await expect(page.getByRole('heading', { name: 'Encrypted Files' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Encrypted Files' })).toBeVisible();
    await expect(page).toHaveURL(/\/#\/vault$/);

    const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /archive\.svg$/);
});
