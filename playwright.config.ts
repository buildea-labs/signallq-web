import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PORT ?? '3000'
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  // Dois projetos, divididos pela tag `@bandwidth`.
  //
  // Alguns cenários exercitam a medição de verdade: a Home autostarta o modo
  // Rápido ao abrir `/`, e os testes de aprofundamento rodam o modo Completo
  // inteiro (download + upload) contra `speed.cloudflare.com`. Esses testes
  // não compartilham só CPU — compartilham **a conexão de internet da
  // máquina**, que é um recurso externo finito e indivisível. Dois deles em
  // paralelo dividem a mesma banda, cada um mede a fração que sobrou, e as
  // fases não fecham dentro do orçamento de tempo de `speedTestConfig`. A
  // falha aparece como "o resultado nunca chegou", que parece flakiness mas é
  // contenção real: não há timeout que resolva, porque a banda é que não
  // existe. Por isso o projeto `chromium-bandwidth` roda com `workers: 1`.
  //
  // Todo o resto (páginas institucionais, /app, histórico, comparativo, Home
  // ociosa via `?problem=`) não mede nada e continua paralelo.
  //
  // Para rodar só um lado: `--project=chromium` ou `--project=chromium-bandwidth`.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      grepInvert: /@bandwidth/,
    },
    {
      name: 'chromium-bandwidth',
      use: { ...devices['Desktop Chrome'] },
      grep: /@bandwidth/,
      // Um worker só: a banda da máquina é o recurso compartilhado.
      workers: 1,
      fullyParallel: false,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
