import { test, expect, type Page } from '@playwright/test'

/**
 * Reprodução do bug crítico encontrado pela revisão independente do Caio
 * (2/2 determinístico): usuário reporta problema pós-resultado -> app inicia
 * o teste completo (aprofundamento) -> a rede cai DURANTE a fase de download
 * (não no instante do clique) -> a medição cai no caminho pré-existente
 * `contaminated` (não mexido por este fix) -> rede volta -> usuário clica
 * "Testar novamente".
 *
 * Duas causas raiz corrigidas em `useSpeedTestJourney.ts` e
 * `CompleteDiagnosis.tsx`:
 *  1. `terminalOutcome` tratava o `result` antigo como terminal mesmo durante
 *     fases de execução (`isRunning`) de um reteste, fazendo o velocímetro
 *     mostrar cor/rótulo do resultado velho ("Contaminado") por cima de uma
 *     medição nova que nem terminou.
 *  2. O botão "Testar novamente" (visível quando `status !== "complete"`)
 *     chamava `journey.retry()` puro em vez de `iniciarReteste`/
 *     `iniciarAprofundamento` — pulando o bookkeeping que reseta o fluxo de
 *     aprofundamento pós-resultado corretamente.
 *
 * Usa rede real (Cloudflare speed test, mesmo padrão de
 * `journey-accessibility.spec.ts`) e `context.setOffline` para simular a
 * queda de rede real durante a fase de download.
 */

const EVIDENCE_DIR = 'test-results/evidence-bug-caio'

async function reproduceOfflineDuringAprofundamentoRetry(page: Page, runLabel: string) {
  test.setTimeout(180_000)
  await page.goto('/')

  // 1. Resultado rápido inicial (autostart real, sem mocks).
  await expect(page.getByText('Você está tendo algum problema agora?')).toBeVisible({ timeout: 60_000 })

  // 2. Reporta um problema pós-resultado -> aprofundamento real (troca de
  //    verdade para modo Completo e reinicia a medição, GH#1367 follow-up).
  //    O radio real é `sr-only` (visualmente escondido, estilo aplicado no
  //    `<label>` que o envolve) -- mesmo padrão de
  //    `journey-accessibility.spec.ts`: foco + tecla, nunca `.check()`/
  //    `.click()` direto no input (fica fora do viewport/coberto pelo label).
  const estaLenta = page.getByRole('radio', { name: 'Está lenta' })
  await estaLenta.focus()
  await page.keyboard.press('Space')
  await expect(page.getByText('Aprofundando com um teste completo…')).toBeVisible({ timeout: 10_000 })

  // 3. Espera a fase de download do aprofundamento -- a rede cai DURANTE essa
  //    fase, não no instante do clique (cenário exato do Caio).
  await expect(page.getByText('Avaliando capacidade de download...')).toBeVisible({ timeout: 30_000 })
  await page.context().setOffline(true)

  // 4. Estado terminal de falha real: caminho pré-existente `contaminated`
  //    (useSpeedTestNetworkGuard/redeMudouDuranteOTeste) -- resultado real
  //    marcado "Contaminado", não um card de erro novo. Comportamento
  //    intencional, não alterado por este fix.
  const statusBarContaminado = page.getByText('Contaminado.')
  await expect(statusBarContaminado).toBeVisible({ timeout: 60_000 })
  const testarNovamente = page.getByRole('button', { name: 'Testar novamente' })
  await expect(testarNovamente).toBeVisible()
  await page.screenshot({ path: `${EVIDENCE_DIR}/${runLabel}-01-contaminado.png`, fullPage: true })

  // 5. Rede volta.
  await page.context().setOffline(false)

  // 6. Clica "Testar novamente" com a rede religada.
  await testarNovamente.click()

  // FIX #2: passou pelo mesmo caminho de reset do aprofundamento -- a
  // transição "Aprofundando com um teste completo…" aparece de novo (não é
  // um `retry()` puro que pula direto para fases sem aviso).
  await expect(page.getByText('Aprofundando com um teste completo…')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: 'Cancelar teste' })).toBeVisible()

  // FIX #1: o resultado antigo (banner "Contaminado.", badge de status) NUNCA
  // aparece simultaneamente com a tela de execução (TestRunning) do NOVO
  // teste, em nenhum ponto da nova medição.
  await expect(statusBarContaminado).not.toBeVisible()
  await page.screenshot({ path: `${EVIDENCE_DIR}/${runLabel}-02-aprofundando-sem-resultado-antigo.png`, fullPage: true })

  // 7. Confirma que um NOVO teste completo roda de verdade (fases reais:
  // latência já observada acima -> download -> upload), sem o resultado
  // antigo reaparecer em nenhuma delas.
  await expect(page.getByText('Avaliando capacidade de download...')).toBeVisible({ timeout: 30_000 })
  await expect(statusBarContaminado).not.toBeVisible()
  // O rótulo "Contaminado" do velocímetro (sem ponto final, fix #1) também
  // não pode aparecer durante a fase de download do novo teste.
  await expect(page.getByText('Contaminado', { exact: true })).not.toBeVisible()
  await page.screenshot({ path: `${EVIDENCE_DIR}/${runLabel}-03-download-real-sem-sobreposicao.png`, fullPage: true })

  await expect(page.getByText('Quase acabando, medindo upload...')).toBeVisible({ timeout: 30_000 })
  await expect(statusBarContaminado).not.toBeVisible()
  await page.screenshot({ path: `${EVIDENCE_DIR}/${runLabel}-04-upload-real-sem-sobreposicao.png`, fullPage: true })
}

test.describe('Bug crítico Caio: rede cai durante download do aprofundamento, reteste após reconectar (2/2 determinístico)', () => {
  test('reprodução 1/2: transição "Aprofundando…" aparece e resultado antigo nunca sobrepõe TestRunning', async ({ page }) => {
    await reproduceOfflineDuringAprofundamentoRetry(page, 'run1')
  })

  test('reprodução 2/2: mesma sequência, para confirmar que não é intermitente', async ({ page }) => {
    await reproduceOfflineDuringAprofundamentoRetry(page, 'run2')
  })
})

test.describe('Regressão: cancelamento do aprofundamento continua restaurando o resultado rápido', () => {
  test('cancelar o teste completo durante o aprofundamento volta ao resultado rápido, sem travar', async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto('/')

    await expect(page.getByText('Você está tendo algum problema agora?')).toBeVisible({ timeout: 60_000 })
    const estaTravando = page.getByRole('radio', { name: 'Está travando' })
    await estaTravando.focus()
    await page.keyboard.press('Space')
    // O texto "Aprofundando…" só existe na fase de latência, que em redes
    // rápidas pode terminar em poucas centenas de ms (25 amostras) --
    // fugaz demais para depender dele aqui. `TestRunning` (via "Cancelar
    // teste") fica visível em toda fase de execução, então é o sinal
    // estável de que o aprofundamento (modo Completo) realmente começou.
    await expect(page.getByRole('button', { name: 'Cancelar teste' })).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Cancelar teste' }).click()

    // Restaura o resultado rápido original (nunca trava numa tela de
    // loading/erro) com o aviso de cancelamento.
    await expect(page.getByText('Teste completo cancelado. O resultado rápido acima continua disponível.')).toBeVisible({
      timeout: 15_000,
    })
    // Volta a mostrar a pergunta pós-resultado, disponível para nova escolha.
    await expect(page.getByText('Você está tendo algum problema agora?')).toBeVisible()
  })
})
