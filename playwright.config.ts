import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E. Corre contra el emulador Firebase + `next dev`.
 * Lanzar SIEMPRE vía `pnpm test:e2e` (envuelve con `firebase emulators:exec`,
 * que exporta FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST y siembra datos).
 */
// Puerto dedicado para tests (evita chocar con un `pnpm dev` ya corriendo).
const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Config web pública dummy: con el emulador no se valida contra Firebase real,
// pero client.ts exige que apiKey/projectId/appId existan.
const firebaseEnv = {
  NEXT_PUBLIC_FIREBASE_EMULATOR: '1',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'theirgin.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'theirgin',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'theirgin.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '0',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:0:web:test',
  PAYMENTS_MODE: 'mock',
  GCLOUD_PROJECT: 'theirgin',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Todas las callables de checkout pegan a un único emulador de Functions
  // (proceso aparte). A workers = nº de CPUs lo saturaban y alguna llamada
  // pasaba el timeout del assert; 4 lo mantiene holgado sin alargar la suite.
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    locale: 'es-CL',
  },
  projects: [
    // Loguea al admin una vez y guarda storageState; los specs admin lo reusan.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: firebaseEnv,
  },
});
