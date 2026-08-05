import { defineConfig, devices } from '@playwright/test'

// Config Playwright dedicada à baseline visual do fluxo de teste de
// velocidade (`e2e-visual/`).
//
// Isolada de `playwright.config.ts` pelos mesmos motivos de
// `playwright.ad-slot.config.ts`: precisa de timeout longo (o motor real roda
// as fases do modo Completo, ~40 s por estado, mesmo com transporte
// simulado), de service worker bloqueado (para a interceptação de rede valer
// para todas as requisições) e de porta própria. Não faz parte de
// `npm run test:e2e`.
//
// Execução: `npm run test:visual`.
const PORT = '3102'
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e-visual',
  // Serial de propósito. Em paralelo, várias páginas disputam a mesma
  // interceptação de rede do Playwright e o motor real deixa de completar as
  // fases dentro do orçamento de tempo de `speedTestConfig` — o resultado
  // seriam capturas de estados que não são os pedidos. Baseline visual é
  // determinismo antes de velocidade.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  timeout: 180_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    // A interceptação de `page.route` não cobre requisições originadas por um
    // service worker; a baseline depende dela para todos os estados.
    serviceWorkers: 'block',
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
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
