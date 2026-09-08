import { test, expect, type Download } from '@playwright/test';
import { gotoWorkspace } from './helpers';

async function downloadedBytes(download: Download): Promise<Buffer> {
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
}

test('encrypt, reload, decrypt, import and audit a real file', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const original = Buffer.from('Portfolio note - private data.\n\u0000\u0001');
    await gotoWorkspace(page, '/encrypt');
    await page.getByLabel('Choose a file to encrypt').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: original });
    await page.getByRole('button', { name: 'Encrypt File', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Enter an encryption password');
    await page.getByLabel('Password', { exact: true }).fill('portfolio example passphrase');
    await page.getByLabel('Confirm password', { exact: true }).fill('does not match');
    await page.getByRole('button', { name: 'Encrypt File', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('do not match');
    await page.getByLabel('Confirm password', { exact: true }).fill('portfolio example passphrase');
    const encryptedDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Encrypt File', exact: true }).click();
    const encrypted = await downloadedBytes(await encryptedDownload);
    expect(encrypted.subarray(0, 5).toString()).toBe('SVLT2');
    expect(encrypted.includes(original)).toBe(false);
    await expect(page.getByRole('status')).toContainText('encrypted successfully');
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
    await gotoWorkspace(page, '/vault');
    await page.reload();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.getByRole('button', { name: 'Decrypt', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByLabel('Password', { exact: true }).fill('wrong');
    await page.getByRole('button', { name: 'Decrypt File', exact: true }).click();
    await expect(page.locator('.alert-error')).toContainText('Incorrect password');
    await page.getByRole('dialog').getByLabel('Password', { exact: true }).fill('portfolio example passphrase');
    const originalDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Decrypt File', exact: true }).click();
    expect(await downloadedBytes(await originalDownload)).toEqual(original);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Decrypt', exact: true })).toBeFocused();
    await page.getByLabel('Import a .secure file').setInputFiles({ name: 'backup.secure', mimeType: 'application/octet-stream', buffer: encrypted });
    await page.getByRole('button', { name: 'Verify and import' }).click();
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Enter the archive password');
    await page.getByLabel('Import file password').fill('portfolio example passphrase');
    await page.getByRole('button', { name: 'Verify and import' }).click();
    await expect(page.getByRole('status')).toContainText('imported successfully');
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await page.screenshot({ path: testInfo.outputPath('vault.png'), fullPage: true });
    await page.getByRole('button', { name: 'Metadata', exact: true }).first().click();
    await expect(page.getByRole('dialog')).toContainText('PBKDF2');
    await page.keyboard.press('Escape');
    await gotoWorkspace(page, '/audit-logs');
    await expect(page.locator('.audit-list')).toContainText('imported into the Vault');
    await gotoWorkspace(page, '/dashboard');
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
    expect(errors).toEqual([]);
});

test('manual decryption supports empty files and rejects incomplete files', async ({ page }) => {
    await gotoWorkspace(page, '/encrypt');
    await page.getByLabel('Choose a file to encrypt').setInputFiles({ name: 'empty.txt', mimeType: 'text/plain', buffer: Buffer.alloc(0) });
    await page.getByLabel('Password', { exact: true }).fill('test passphrase for an empty file');
    await page.getByLabel('Confirm password', { exact: true }).fill('test passphrase for an empty file');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Encrypt File', exact: true }).click();
    const encrypted = await downloadedBytes(await download);
    await gotoWorkspace(page, '/decrypt');
    await page.getByLabel('Choose a .secure file').setInputFiles({ name: 'empty.txt.secure', mimeType: 'application/octet-stream', buffer: encrypted });
    await page.getByLabel('Password', { exact: true }).fill('test passphrase for an empty file');
    const decrypted = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Decrypt File', exact: true }).click();
    expect((await downloadedBytes(await decrypted)).length).toBe(0);
    await gotoWorkspace(page, '/vault');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.getByLabel('Import a .secure file').setInputFiles({ name: 'incomplete.secure', mimeType: 'application/octet-stream', buffer: encrypted.subarray(0, 8) });
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('AES-256-GCM is the only file encryption algorithm', async ({ page }) => {
    await gotoWorkspace(page, '/encrypt');
    await expect(page.locator('[aria-label="Encryption algorithm"]')).toContainText('AES-256-GCM');
    await expect(page.getByRole('combobox', { name: 'Encryption Algorithm' })).toHaveCount(0);
    await expect(page.getByText(/ChaCha|AES-CTR|AES-CBC/)).toHaveCount(0);
});

test('a deleted file leaves the Vault even when audit storage fails', async ({ page }) => {
    await gotoWorkspace(page, '/encrypt');
    await page.getByLabel('Choose a file to encrypt').setInputFiles({
        name: 'delete-me.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Delete regression fixture'),
    });
    await page.getByLabel('Password', { exact: true }).fill('portfolio delete regression passphrase');
    await page.getByLabel('Confirm password', { exact: true }).fill('portfolio delete regression passphrase');
    const encryptedDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Encrypt File', exact: true }).click();
    await encryptedDownload;

    await gotoWorkspace(page, '/vault');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.evaluate(() => {
        const originalTransaction = IDBDatabase.prototype.transaction;
        IDBDatabase.prototype.transaction = function (storeNames, mode, options) {
            if (this.name === 'SecureVaultAuditDB') {
                throw new DOMException('Injected audit failure', 'AbortError');
            }
            return originalTransaction.call(this, storeNames, mode, options);
        };
    });

    page.once('dialog', dialog => void dialog.accept());
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.locator('tbody tr')).toHaveCount(0);
    await expect(page.getByRole('alert')).toContainText('was deleted, but the activity event could not be saved');
});

test('all pages fit mobile, tablet and desktop', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const route of ['/dashboard', '/encrypt', '/decrypt', '/vault', '/signatures', '/audit-logs']) {
            await gotoWorkspace(page, route);
            await expect(page.locator('.page-title')).toBeVisible();
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        }
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await gotoWorkspace(page, '/encrypt');
    await page.screenshot({ path: testInfo.outputPath('encrypt-mobile.png'), fullPage: true });
    expect(errors).toEqual([]);
});
