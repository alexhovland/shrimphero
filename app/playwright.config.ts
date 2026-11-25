import { defineConfig } from '@playwright/test';

// End-to-end tests against the production build, with a fake Supabase
// (tests/mock-server.mjs). Nothing here talks to the real database.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    trace: 'off',
  },
  webServer: [
    {
      command: 'node tests/mock-server.mjs',
      url: 'http://127.0.0.1:54321/rest/v1/rpc/impact_settings',
      reuseExistingServer: false,
    },
    {
      command: 'npx vite build --mode test && npx vite preview --mode test --port 4173 --strictPort --host 127.0.0.1',
      url: 'http://127.0.0.1:4173/',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
