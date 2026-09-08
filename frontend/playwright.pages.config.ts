import { defineConfig } from '@playwright/test';

const repository = process.env.GITHUB_REPOSITORY ?? 'local/securevault';
const repositoryName = repository.split('/').at(-1) ?? 'securevault';
const basePath = repositoryName.toLowerCase().endsWith('.github.io') ? '/' : `/${repositoryName}/`;
const previewUrl = `http://127.0.0.1:4176${basePath}`;

export default defineConfig({
    testDir: './tests',
    testMatch: 'deployment.spec.ts',
    workers: 1,
    use: {
        baseURL: previewUrl,
        browserName: 'chromium',
        ...(process.env.CI ? {} : { channel: 'chrome' }),
        viewport: { width: 1440, height: 1000 },
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npm run preview -- --host 127.0.0.1 --port 4176 --strictPort',
        url: previewUrl,
        env: {
            ...process.env,
            GITHUB_PAGES: 'true',
            GITHUB_REPOSITORY: repository,
        },
        reuseExistingServer: false,
    },
});
