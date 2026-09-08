import { expect, type Page } from '@playwright/test';

export async function gotoWorkspace(page: Page, route: string): Promise<void> {
    await page.goto(`./#${route}`);
    await expect(page.locator('.page-title')).toBeVisible();
}
