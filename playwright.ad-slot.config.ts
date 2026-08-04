import { defineConfig, devices } from '@playwright/test'

// Config Playwright dedicada ao slot de anúncio único (issue #21).
//
// Isolada de `playwright.config.ts` (e do seu `testDir: './e2e'`) porque
// precisa que o servidor de dev suba com `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`
// e `NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT` configurados — variáveis que a
// suíte principal deliberadamente NÃO define (para preservar seu próprio
// comportamento/baseline sem anúncio). Roda numa porta e testDir próprios
// para não colidir com a suíte principal nem exigir tocar no config dela.
//
// Execução manual: `npx playwright test --config=playwright.ad-slot.config.ts`
// (não faz parte de `npm run test:e2e`).
const PORT = '3101'
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e-ad-slot',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  timeout: 180_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: 'ca-pub-0000000000000000',
      NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT: '1234567890',
    },
  },
})
