/**
 * Baseline visual do fluxo de teste de velocidade — sobre a Home real (`/`).
 *
 * Substitui o harness `/visual-baseline/speed-test-flow` que vivia em
 * `src/app/`. Aquele harness era compilado junto com a aplicação: mesmo
 * devolvendo 404 em produção (`notFound()` é checagem de runtime), o
 * `await import()` do componente cliente continuava sendo estaticamente
 * analisável, então o bundler atravessava a fronteira `"use client"` e emitia
 * o chunk do harness — com as fixtures dentro — em `.next/static/chunks`.
 *
 * Aqui não há rota de teste, componente de teste nem atributo de depuração no
 * bundle da Home. Cada estado visual é alcançado dirigindo a jornada real:
 *  - `sessionStorage`, com as mesmas chaves que a aplicação já grava;
 *  - interceptação de rede do Playwright nas origens externas do motor;
 *  - cliques e leituras pelos mesmos textos/papéis que a pessoa usuária vê.
 *
 * Os nove estados abaixo são os de `SpeedTestVisualState`
 * (`src/lib/speedTestVisualState.ts`). Determinismo aqui é de *estado*: cada
 * teste só termina quando o estado alvo está inequivocamente na tela. Os
 * números medidos vêm do motor real sobre transporte simulado e ficam
 * aproximadamente estáveis, não idênticos byte a byte — a baseline serve para
 * comparação visual antes/depois do redesenho, não para diff de pixels.
 *
 * Execução: `npm run test:visual`. Fora de `npm run test:e2e` de propósito
 * (config e testDir próprios), para não somar dezenas de segundos de medição
 * simulada à suíte principal.
 */
import { expect, test, type Page } from '@playwright/test'
import { restoredResultFixture } from '../src/test/fixtures/speedTestResults'
import { SPEEDTEST_DOWNLOAD_URL } from '../src/lib/config'
import { IDLE_URL, mockMeasurementNetwork, seedJourneySession } from './support/measurementMocks'

const BASELINE_DIR = 'test-results/speed-test-flow-baseline'

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
] as const

/**
 * Dá tempo ao mostrador de sair do zero antes da captura.
 *
 * A asserção de fase (`Quase acabando...`) passa no instante em que a fase
 * começa — momento em que a leitura ao vivo ainda é ~0 e a captura mostraria
 * um velocímetro vazio, que não representa o estado "medindo". Não há falha
 * sendo escondida aqui: o estado alvo já está provado pelas asserções; isto
 * escolhe *quando* fotografá-lo.
 */
async function settleDial(page: Page) {
  await page.waitForTimeout(2_000)
}

async function capture(page: Page, state: string, viewport: (typeof VIEWPORTS)[number]) {
  await page.screenshot({
    path: `${BASELINE_DIR}/${state}-${viewport.width}x${viewport.height}.png`,
    fullPage: true,
  })
}

for (const viewport of VIEWPORTS) {
  test.describe(`baseline visual do fluxo de teste — ${viewport.name}`, () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(180_000)
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
    })

    test('forming: Home ociosa, antes de qualquer medição', async ({ page }) => {
      await mockMeasurementNetwork(page)
      await page.goto(IDLE_URL)

      await expect(page.getByRole('button', { name: 'Testar agora' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Minha internet está com problema' })).toBeVisible()

      await capture(page, 'forming', viewport)
    })

    test('quick-running: medição do modo Rápido em andamento', async ({ page }) => {
      await mockMeasurementNetwork(page)
      // Sem semear `speedtest_autostarted`: a Home autostarta o modo Rápido,
      // que é o comportamento real de produto na primeira visita da sessão.
      await page.goto('/')

      await expect(page.getByText('Quase acabando...')).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('button', { name: 'Cancelar teste' })).toBeVisible()
      await settleDial(page)

      await capture(page, 'quick-running', viewport)
    })

    test('quick-result: resultado do modo Rápido com a pergunta pós-resultado', async ({ page }) => {
      await mockMeasurementNetwork(page)
      await page.goto('/')

      await expect(page.getByText('Você está tendo algum problema agora?')).toBeVisible({ timeout: 60_000 })

      await capture(page, 'quick-result', viewport)
    })

    test('full-running: medição do modo Completo em andamento', async ({ page }) => {
      await mockMeasurementNetwork(page)
      await seedJourneySession(page, { autoStarted: true })
      await page.goto(IDLE_URL)

      await page.getByRole('button', { name: 'Completo' }).click()
      await page.getByRole('button', { name: 'Testar agora' }).click()

      await expect(page.getByText('Avaliando capacidade de download...')).toBeVisible({ timeout: 30_000 })
      await settleDial(page)

      await capture(page, 'full-running', viewport)
    })

    test('full-result: resultado do modo Completo, sem aprofundamento', async ({ page }) => {
      await mockMeasurementNetwork(page)
      await seedJourneySession(page, { autoStarted: true })
      await page.goto(IDLE_URL)

      await page.getByRole('button', { name: 'Completo' }).click()
      await page.getByRole('button', { name: 'Testar agora' }).click()

      await expect(page.getByText('Ver detalhes do teste')).toBeVisible({ timeout: 120_000 })
      // Discriminante contra `diagnosing`: sem escolha pós-resultado ativa, o
      // cartão da pergunta não existe nesta tela.
      await expect(page.getByText('Você está tendo algum problema agora?')).toHaveCount(0)

      await capture(page, 'full-result', viewport)
    })

    test('diagnosing: aprofundamento pós-resultado concluído em modo Completo', async ({ page }) => {
      await mockMeasurementNetwork(page)
      await page.goto('/')

      await expect(page.getByText('Você está tendo algum problema agora?')).toBeVisible({ timeout: 60_000 })
      // O `input[type=radio]` é `sr-only`; quem recebe o clique na tela é o
      // `<label>` que o embrulha — mesmo alvo que a pessoa usuária toca.
      await page.getByText('Está lenta', { exact: true }).click()
      await expect(page.getByRole('radio', { name: 'Está lenta' })).toBeChecked()
      await page.getByRole('button', { name: 'Fazer teste completo' }).click()

      // Fases que só existem no modo Completo — provam que o aprofundamento
      // reexecutou a medição de verdade, não reaproveitou o resultado rápido.
      await expect(page.getByText('Quase acabando, medindo upload...')).toBeVisible({ timeout: 60_000 })
      await expect(page.getByText('Ver detalhes do teste')).toBeVisible({ timeout: 120_000 })
      await expect(page.getByText('Você está tendo algum problema agora?')).toBeVisible()

      await capture(page, 'diagnosing', viewport)
    })

    test('restored-result: resultado restaurado da sessão, sem medir de novo', async ({ page }) => {
      await mockMeasurementNetwork(page)
      await seedJourneySession(page, { restorableResult: restoredResultFixture })

      // Conta só requisições de medição: `bytes=0` é a sonda de checagem ativa
      // de internet do `useEstadoRede`, que roda em toda montagem da tela e
      // não mede nada.
      let measurementRequests = 0
      page.on('request', (request) => {
        const url = request.url()
        if (!url.startsWith(SPEEDTEST_DOWNLOAD_URL)) return
        if (new URL(url).searchParams.get('bytes') === '0') return
        measurementRequests += 1
      })

      await page.goto('/')

      await expect(page.getByText('Ver detalhes do teste')).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('button', { name: 'Cancelar teste' })).toHaveCount(0)
      // A restauração não pode disparar medição: só a sonda de checagem ativa
      // de internet toca o endpoint de download, e ela nem chega a rodar aqui.
      expect(measurementRequests).toBe(0)

      await capture(page, 'restored-result', viewport)
    })

    test('error: medição interrompida pela pessoa usuária', async ({ page }) => {
      await mockMeasurementNetwork(page)
      await page.goto('/')

      const cancelar = page.getByRole('button', { name: 'Cancelar teste' })
      await expect(cancelar).toBeVisible({ timeout: 30_000 })
      await cancelar.click()

      await expect(page.getByText('Teste cancelado')).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()

      await capture(page, 'error', viewport)
    })

    test('offline: sem internet real detectada antes de medir', async ({ page }) => {
      await mockMeasurementNetwork(page, { offline: true })
      await seedJourneySession(page, { autoStarted: true })
      await page.goto(IDLE_URL)

      await page.getByRole('button', { name: 'Testar agora' }).click()

      await expect(page.getByText('Sem conexão')).toBeVisible({ timeout: 30_000 })

      await capture(page, 'offline', viewport)
    })
  })
}
