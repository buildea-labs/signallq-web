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

const IDLE_URL = '/?problem=e2e-idle'
const EVIDENCE_DIR = 'test-results/evidence-71'
const VIEWPORTS = [
  { name: 'mobile (375px)', width: 375, height: 812 },
  { name: 'desktop (1280px)', width: 1280, height: 800 },
]

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
}

test.describe('Home ociosa — acessibilidade e overflow por viewport (#71)', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: sem overflow horizontal e sem violações críticas de acessibilidade`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(IDLE_URL)
      await expect(page.getByRole('heading').first()).toBeVisible()

      await page.screenshot({ path: `${EVIDENCE_DIR}/home-idle-${viewport.width}px.png`, fullPage: true })

      expect(await hasHorizontalOverflow(page)).toBe(false)

      const results = await new AxeBuilder({ page }).analyze()
      const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
      expect(critical, JSON.stringify(critical, null, 2)).toEqual([])
    })
  }
})

test.describe('Popover de ajuda sob demanda — não cortado em viewport estreita (#71 §3.3/§3.4.7)', () => {
  test('o popover do HelpButton dos modos fica visível e dentro da viewport em 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(IDLE_URL)

    const helpButton = page.getByRole('button', { name: 'O que muda entre os modos?' })
    await expect(helpButton).toBeVisible()
    await helpButton.click()

    const popover = page.getByText('Triagem curta: mede velocidade, latência e resposta sob carga', { exact: false })
    await expect(popover).toBeVisible()

    await page.screenshot({ path: `${EVIDENCE_DIR}/popover-modo-375px.png`, fullPage: true })

    // Achado real (#71 pendente): o popover (width=240) centralizado sob o
    // HelpButton do seletor de modo ultrapassa a borda direita em 375px —
    // ver relatório para a recomendação (não corrigido nesta tarefa, fora
    // do escopo autorizado de "escrever testes/evidência").
    const box = await popover.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(375 + 1)
    }
  })
})

test.describe('Jornada Rápido — teclado e resultado real (#71, bug crítico #1+#2)', () => {
  test('navega por teclado pela pergunta pós-resultado, aprofunda de verdade em modo Completo (reteste real) e o resultado passa no scan de acessibilidade', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/')

    // Autostart do modo Rápido dispara sozinho (comportamento de produto);
    // aguarda o resultado real da medição.
    const primeiraProblema = page.getByText('Você está tendo algum problema agora?')
    await expect(primeiraProblema).toBeVisible({ timeout: 60_000 })
    await page.screenshot({ path: `${EVIDENCE_DIR}/rapido-resultado.png`, fullPage: true })

    // Navegação por teclado até o radio "Está lenta" e seleção via teclado.
    const estaLenta = page.getByRole('radio', { name: 'Está lenta' })
    await estaLenta.focus()
    await expect(estaLenta).toBeFocused()
    await page.keyboard.press('Space')

    // Decisão de produto revertida (bug crítico #1+#2): selecionar um
    // problema pós-resultado agora troca de verdade para o modo Completo e
    // reinicia a medição (download+upload+latência+jitter reais) — não fica
    // mais só perguntando sobre o download do modo Rápido. A mensagem de
    // transição some o fieldset (substituído por `TestRunning`) e só volta a
    // aparecer quando o teste completo concluir.
    await expect(page.getByText('Aprofundando com um teste completo…')).toBeVisible({ timeout: 10_000 })
    await page.screenshot({ path: `${EVIDENCE_DIR}/rapido-aprofundamento-transicao.png`, fullPage: true })

    // Fases reais do teste completo (não só o download do modo Rápido).
    await expect(page.getByText('Avaliando capacidade de download...')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Quase acabando, medindo upload...')).toBeVisible({ timeout: 30_000 })

    // Aprofundamento contextual aparece (agora depois do teste completo real)
    // e é operável via teclado (Tab + Enter).
    const pergunta = page.getByText('Quando a lentidão ocorre?')
    await expect(pergunta).toBeVisible({ timeout: 60_000 })
    const primeiraOpcao = page.getByRole('button', { name: 'Em horários específicos' })
    await primeiraOpcao.focus()
    await expect(primeiraOpcao).toBeFocused()
    await page.keyboard.press('Enter')

    const diagnostico = page.getByTestId('post-result-diagnostico')
    await expect(diagnostico).toBeVisible()
    await expect(page.getByText('Próxima ação')).toBeVisible()
    await page.screenshot({ path: `${EVIDENCE_DIR}/rapido-pos-resultado-concluido.png`, fullPage: true })

    // A escolha continua marcada. O modo Completo já ficou provado ativo
    // pelas fases reais aguardadas acima ("Avaliando capacidade de
    // download..."/"Quase acabando, medindo upload..." só existem no modo
    // Completo) — regra de produto revertida: #69 dizia "nunca trocar de
    // modo silenciosamente"; a decisão atual é justamente trocar de verdade,
    // com aviso visível, não mais um segredo, mas também sem exigir clique extra.
    await expect(estaLenta).toBeChecked()

    // Uma única "Próxima ação" na tela — `CompleteDiagnosis` (agora ligado,
    // porque o modo é Completo de verdade) suprime a sua própria conclusão
    // genérica para não duplicar a conclusão específica do aprofundamento.
    await expect(page.getByText('Próxima ação')).toHaveCount(1)

    const results = await new AxeBuilder({ page }).analyze()
    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([])
  })
})

test.describe('Jornada Completo — teclado no controle expansível de #70 e resultado real (#71)', () => {
  test('alterna para o modo Completo, navega por teclado até "Ver detalhes do teste" e expande com o teclado', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto(IDLE_URL)

    await page.getByRole('button', { name: 'Completo' }).click()
    await page.getByRole('button', { name: 'Testar agora' }).click()

    const detalhes = page.getByText('Ver detalhes do teste')
    await expect(detalhes).toBeVisible({ timeout: 90_000 })
    await page.screenshot({ path: `${EVIDENCE_DIR}/completo-resultado.png`, fullPage: true })

    // O <summary> é nativamente focável e ativável por teclado.
    await detalhes.focus()
    await expect(detalhes).toBeFocused()

    const detailsElement = page.locator('details')
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
