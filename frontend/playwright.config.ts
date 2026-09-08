import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    workers: 2,
    use: {
        baseURL: 'http://127.0.0.1:4175',
        browserName: 'chromium',
        ...(process.env.CI ? {} : { channel: 'chrome' }),
        viewport: { width: 1440, height: 1000 },
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort',
        url: 'http://127.0.0.1:4175',
        reuseExistingServer: false,
    },
});
