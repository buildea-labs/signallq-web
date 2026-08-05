import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Cobertura e2e (navegador headless real) exigida por #71: navegação por
 * teclado pela jornada principal, scan de acessibilidade (axe-core) na Home
 * e no resultado (rápido e completo), e verificação em 2 viewports de que
 * não há overflow horizontal nem popover cortado.
 *
 * Usa `?problem=e2e-idle` para suspender o autostart automático do modo
 * Rápido (ver `useSpeedTestJourney`, checagem literal de substring
 * "problem=" na URL) e conseguir observar a tela ociosa antes de qualquer
 * medição. O parâmetro não corresponde a nenhum `context` reconhecido por
 * `contextualProblemFromSearch`, então não abre o fluxo de problema
 * percebido — só bloqueia o autostart.
 *
 * Screenshots de evidência ("depois" desta branch) são salvos em
 * `test-results/evidence-71/`. Não há "antes" nesta mesma rodada: para
 * comparar literalmente antes/depois seria preciso rodar esta mesma suíte
 * contra `main`, o que não faz parte deste escopo.
 */

const EVIDENCE_DIR = 'test-results/evidence-71'
const VIEWPORTS = [
  { name: 'mobile (375px)', width: 375, height: 812 },
  { name: 'desktop (1280px)', width: 1280, height: 800 },
]

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
}

test.describe('Entrada na rota — acessibilidade e overflow por viewport (#71)', { tag: '@bandwidth' }, () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: sem overflow horizontal e sem violações críticas de acessibilidade`, async ({ page }) => {
      test.setTimeout(120_000)
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      // A jornada do protótipo não tem tela ociosa: a rota entra medindo, e o
      // primeiro estado estável de conteúdo é o resultado rápido.
      await page.goto('/')
      await expect(page.getByRole('button', { name: 'Fazer teste completo' })).toBeVisible({ timeout: 60_000 })
      await expect(page.getByRole('heading').first()).toBeVisible()

      await page.screenshot({ path: `${EVIDENCE_DIR}/resultado-rapido-${viewport.width}px.png`, fullPage: true })

      expect(await hasHorizontalOverflow(page)).toBe(false)

      const results = await new AxeBuilder({ page }).analyze()
      const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
      expect(critical, JSON.stringify(critical, null, 2)).toEqual([])
    })
  }
})

/**
 * O seletor de modo e seu popover de ajuda deixaram de existir com a jornada
 * do protótipo (a rota entra medindo e o teste completo vem do resultado).
 * O que ocupa o lugar deles como superfície sobreposta é o sheet de
 * diagnóstico — que, por ser modal, tem exigências de teclado mais duras.
 */
test.describe('Sheet de diagnóstico — modal operável por teclado (protótipo, tela 2.1)', { tag: '@bandwidth' }, () => {
  test('abre pelo teclado, prende o foco, fecha com Esc e devolve o foco ao gatilho em 375px', async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const gatilho = page.getByRole('button', { name: /Problemas com a sua internet/ })
    await expect(gatilho).toBeVisible({ timeout: 60_000 })
    await gatilho.focus()
    await page.keyboard.press('Enter')

    const sheet = page.getByRole('dialog', { name: 'Diagnosticar minha internet' })
    await expect(sheet).toBeVisible()
    // O foco entra no sheet, não fica preso atrás dele.
    await expect(sheet.locator(':focus')).toHaveCount(1)

    const box = await sheet.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(375 + 1)
    }

    await page.screenshot({ path: `${EVIDENCE_DIR}/sheet-diagnostico-375px.png`, fullPage: true })

    const results = await new AxeBuilder({ page }).analyze()
    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([])

    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
    await expect(gatilho).toBeFocused()
  })
})

test.describe('Jornada Rápido — teclado e resultado real (#71, bug crítico #1+#2)', { tag: '@bandwidth' }, () => {
  test('navega por teclado pela pergunta pós-resultado, aprofunda de verdade em modo Completo (reteste real) e o resultado passa no scan de acessibilidade', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/')

    // Autostart do modo Rápido dispara sozinho (jornada do protótipo);
    // aguarda o resultado real da medição.
    const gatilhoSheet = page.getByRole('button', { name: /Problemas com a sua internet/ })
    await expect(gatilhoSheet).toBeVisible({ timeout: 60_000 })
    await page.screenshot({ path: `${EVIDENCE_DIR}/rapido-resultado.png`, fullPage: true })

    await gatilhoSheet.click()

    // Declaração de contexto por teclado, dentro do sheet.
    const estaLenta = page.getByRole('radio', { name: 'Está lenta' })
    await estaLenta.focus()
    await expect(estaLenta).toBeFocused()
    await page.keyboard.press('Enter')

    // Pergunta de aprofundamento acontece dentro do sheet — o resultado
    // completo nunca reapresenta questionário (protótipo, tela 2.4).
    const pergunta = page.getByText('Quando a lentidão ocorre?')
    await expect(pergunta).toBeVisible()
    const primeiraOpcao = page.getByRole('radio', { name: 'Em horários específicos' })
    await primeiraOpcao.focus()
    await expect(primeiraOpcao).toBeFocused()
    await page.keyboard.press('Enter')

    // Responder não mede: só a confirmação explícita mede.
    const confirmar = page.getByRole('button', { name: 'Diagnosticar minha internet' })
    await confirmar.focus()
    await expect(confirmar).toBeFocused()
    await page.keyboard.press('Enter')

    // Sinal estável do aprofundamento: `TestRunning` mostra o contexto
    // informado em todas as fases de execução. O texto "Aprofundando com um
    // teste completo…" só existe na fase de latência, curta demais (25
    // amostras) para ser um marco confiável — mesma conclusão já registrada
    // em `aprofundamento-retry-network.spec.ts`.
    await expect(page.getByText('Contexto informado: Está lenta')).toBeVisible({ timeout: 10_000 })
    await page.screenshot({ path: `${EVIDENCE_DIR}/rapido-aprofundamento-transicao.png`, fullPage: true })

    // Fases reais do teste completo (não só o download do modo Rápido).
    await expect(page.getByText('Avaliando capacidade de download...')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Quase acabando, medindo upload...')).toBeVisible({ timeout: 30_000 })

    const diagnostico = page.getByTestId('post-result-diagnostico')
    await expect(diagnostico).toBeVisible({ timeout: 120_000 })
    await page.screenshot({ path: `${EVIDENCE_DIR}/rapido-pos-resultado-concluido.png`, fullPage: true })

    // Uma única conclusão com "Próxima ação" — a calculada com o contexto
    // declarado — e nenhum questionário reapresentado (protótipo, tela 2.4).
    await expect(page.getByText('Próxima ação')).toHaveCount(1)
    await expect(page.getByRole('radio')).toHaveCount(0)

    const results = await new AxeBuilder({ page }).analyze()
    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([])
  })
})

test.describe('Jornada Completo — teclado no controle expansível de #70 e resultado real (#71)', { tag: '@bandwidth' }, () => {
  test('vai ao teste completo pelo CTA do resultado, navega por teclado até "Ver detalhes da medição" e expande com o teclado', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/')

    // Único caminho para o teste completo na jornada do protótipo.
    await page.getByRole('button', { name: 'Fazer teste completo' }).click({ timeout: 60_000 })

    const detalhes = page.getByText('Ver detalhes da medição')
    await expect(detalhes).toBeVisible({ timeout: 120_000 })
    await page.screenshot({ path: `${EVIDENCE_DIR}/completo-resultado.png`, fullPage: true })

    // O <summary> é nativamente focável e ativável por teclado.
    await detalhes.focus()
    await expect(detalhes).toBeFocused()

    const detailsElement = page.locator('details').filter({ hasText: 'Ver detalhes da medição' })
    await expect(detailsElement).not.toHaveJSProperty('open', true)

    await page.keyboard.press('Enter')
    await expect(detailsElement).toHaveJSProperty('open', true)

    // Uma linha com ajuda contextual (#70) some/aparece só sob demanda.
    const helpButtons = page.getByRole('button', { name: 'O que é isso?' })
    await expect(helpButtons.first()).toBeVisible()
    await page.screenshot({ path: `${EVIDENCE_DIR}/completo-detalhes-expandido.png`, fullPage: true })

    // Achado real (#71 pendente): axe reporta "link-in-text-block" no link
    // "Entenda como o teste mede sua conexão" (contraste 1.17:1 contra o
    // texto vizinho, sem sublinhado) — ver relatório para a recomendação
    // (não corrigido nesta tarefa, fora do escopo autorizado).
    const results = await new AxeBuilder({ page }).analyze()
    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([])
  })
})
