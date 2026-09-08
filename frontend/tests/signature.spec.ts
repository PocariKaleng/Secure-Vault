import { expect, test } from '@playwright/test';

test('opens the dashboard directly without a Vault password', async ({ page }) => {
    await page.goto('./');

    await expect(page).toHaveURL(/\/#\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'A private space for your files.' })).toBeVisible();
    await expect(page.getByLabel('Password Vault')).toHaveCount(0);
});

test('ECDSA P-256 signs a message and rejects tampering', async ({ page }) => {
    await page.goto('./#/dashboard');

    const result = await page.evaluate(async () => {
        const modulePath = '/src/crypto/signatures/ecdsa.ts';
        const { createSigningKeyPair, exportPublicKey, signMessage, verifyMessage } = await import(modulePath);
        const keys = await createSigningKeyPair();
        const message = 'Release manifest v1';
        const signature = await signMessage(message, keys.privateKey);

        return {
            signatureBytes: signature.byteLength,
            valid: await verifyMessage(message, signature, keys.publicKey),
            tampered: await verifyMessage(`${message}!`, signature, keys.publicKey),
            privateKeyExtractable: keys.privateKey.extractable,
            publicKey: await exportPublicKey(keys.publicKey),
        };
    });

    expect(result.signatureBytes).toBe(64);
    expect(result.valid).toBe(true);
    expect(result.tampered).toBe(false);
    expect(result.privateKeyExtractable).toBe(false);
    expect(result.publicKey).toMatchObject({ kty: 'EC', crv: 'P-256' });
});

test('digital signature demo verifies the current message', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('./#/signatures');

    await expect(page.getByRole('heading', { name: 'Digital Signature' })).toBeVisible();
    await page.getByRole('button', { name: 'Generate key pair' }).click();
    await expect(page.getByRole('status')).toContainText('Key pair ready');
    await page.getByRole('button', { name: 'Sign message' }).click();
    await page.getByRole('button', { name: 'Verify signature' }).click();
    await expect(page.getByRole('status')).toContainText('Signature is valid');
    await page.screenshot({ path: testInfo.outputPath('signature-valid.png'), fullPage: true });

    await page.getByLabel('Message to sign').fill('The message has been changed.');
    await page.getByRole('button', { name: 'Verify signature' }).click();
    await expect(page.getByRole('alert')).toContainText('Signature is invalid');
    expect(errors).toEqual([]);
});
