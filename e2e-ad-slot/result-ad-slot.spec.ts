import { test, expect } from '@playwright/test'

/**
 * Cobertura e2e (navegador real) do único slot de anúncio autorizado
 * (issue #21). Roda contra `playwright.ad-slot.config.ts`, que sobe o dev
 * server com `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`/`NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT`
 * configurados — sem isso o slot nunca renderiza (ver `ResultAdSlot.tsx`),
 * então este é o único jeito de observar o comportamento real do componente
 * com o script do AdSense de fato solicitado.
 *
 * `?problem=e2e-idle` suspende o autostart do modo Rápido (mesmo mecanismo
 * de `journey-accessibility.spec.ts`), para dar tempo de trocar para o modo
 * Completo antes de qualquer medição começar.
 *
 * Publisher id e slot id acima são placeholders sintaticamente válidos, não
 * credenciais reais do Luiz — o objetivo aqui é validar NOSSO gate/contêiner/
 * posicionamento, não o preenchimento real de um anúncio do Google (que
 * exigiria uma conta AdSense aprovada servindo este domínio, fora do
 * alcance deste ambiente).
 */

const IDLE_URL = '/?problem=e2e-idle'
const EVIDENCE_DIR = 'test-results/evidence-21-ad-slot'

test.describe('Slot de anúncio único pós-resultado completo (issue #21)', () => {
  test('ausente durante o teste e sem consentimento; presente só após aceite, com rótulo, dimensão reservada e sem CLS', async ({ page }) => {
    test.setTimeout(240_000)

    await page.goto(IDLE_URL)

    // --- Fase 1: banner de consentimento ainda não decidido ---------------
    const consentBanner = page.getByRole('dialog', { name: 'Consentimento de cookies' })
    await expect(consentBanner).toBeVisible()

    // --- Fase 2: modo Completo, teste em andamento -> slot ausente ---------
    await page.getByRole('button', { name: 'Completo' }).click()
    await page.getByRole('button', { name: 'Testar agora' }).click()

    // Checagem imediata pós-clique: o teste está rodando, o slot não pode
    // existir nesse instante (nem o rótulo, nem o contêiner).
    await expect(page.getByText('Publicidade', { exact: true })).toHaveCount(0)
    await expect(page.getByTestId('result-ad-slot')).toHaveCount(0)

    // --- Fase 3: resultado completo real, mas consentimento ainda não decidido
    const detalhes = page.getByText('Ver detalhes do teste')
    await expect(detalhes).toBeVisible({ timeout: 90_000 })
    await page.screenshot({ path: `${EVIDENCE_DIR}/completo-resultado-sem-consentimento.png`, fullPage: true })

    await expect(page.getByTestId('result-ad-slot')).toHaveCount(0)
    await expect(page.getByText('Publicidade', { exact: true })).toHaveCount(0)

    // --- Fase 4: recusa explícita -> continua ausente -----------------------
    await page.getByRole('button', { name: 'Recusar' }).click()
    await expect(consentBanner).toBeHidden()
    await expect(page.getByTestId('result-ad-slot')).toHaveCount(0)
    await expect(page.getByText('Publicidade', { exact: true })).toHaveCount(0)

    // --- Fase 5: aceite -> recarrega e refaz a medição, agora com consentimento
    // aceito. Simula a decisão via o mesmo contrato de armazenamento que
    // `setAdConsent`/`CookieConsentBanner` usam (localStorage + o evento
    // customizado que a store dispara) e recarrega a página — o resultado da
    // Fase 3 é estado em memória (não persistido), por isso a medição
    // Completo precisa ser refeita, agora já com a decisão de consentimento
    // presente desde o primeiro paint.
    await page.evaluate(() => {
      window.localStorage.setItem('signallq_ad_consent', 'accepted')
    })
    await page.goto(IDLE_URL)
    await expect(page.getByRole('dialog', { name: 'Consentimento de cookies' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Completo' }).click()
    await page.getByRole('button', { name: 'Testar agora' }).click()

    // Ainda em andamento -> continua ausente mesmo já com consentimento aceito.
    await expect(page.getByText('Publicidade', { exact: true })).toHaveCount(0)

    await expect(page.getByText('Ver detalhes do teste')).toBeVisible({ timeout: 90_000 })

    const adSlot = page.getByTestId('result-ad-slot')
    await expect(adSlot).toBeVisible()
    await expect(page.getByText('Publicidade', { exact: true })).toBeVisible()

    // Escopado ao NOSSO contêiner: com ids sintéticos (sem conta AdSense
    // aprovada por trás), o script real do Google responde "unfilled" e
    // injeta seu próprio `<ins class="adsbygoogle adsbygoogle-noablate">`
    // de no-op em outro ponto do DOM — comportamento real da biblioteca,
    // não nosso código. Sem escopo, `ins.adsbygoogle` bate nos dois.
    const ins = adSlot.locator('ins.adsbygoogle')
    await expect(ins).toHaveAttribute('data-ad-client', 'ca-pub-0000000000000000')
    await expect(ins).toHaveAttribute('data-ad-slot', '1234567890')

    // Posição: depois da ação primária (reteste) e das ações secundárias
    // (compartilhar/copiar resumo) — nunca antes ou entre elas.
    const repetirBox = await page.getByRole('button', { name: 'Fazer e testar novamente' }).boundingBox()
    const compartilharBox = await page.getByRole('button', { name: 'Compartilhar' }).boundingBox()
    const adBox = await adSlot.boundingBox()
    expect(repetirBox).not.toBeNull()
    expect(compartilharBox).not.toBeNull()
    expect(adBox).not.toBeNull()
    if (repetirBox && compartilharBox && adBox) {
      expect(adBox.y).toBeGreaterThan(repetirBox.y)
      expect(adBox.y).toBeGreaterThan(compartilharBox.y)
    }

    await page.screenshot({ path: `${EVIDENCE_DIR}/completo-resultado-com-consentimento-aceito.png`, fullPage: true })

    // --- CLS: mede layout-shift real a partir do momento em que o slot já
    // está montado (contêiner com aspect-ratio reservado) — se o script do
    // AdSense pintar (ou marcar "unfilled", como acontece aqui com ids
    // sintéticos) algo dentro do `<ins>` sem alterar a altura do contêiner,
    // o valor deve ficar ~0. Deliberadamente SEM `buffered: true`: buffered
    // devolveria também os layout-shifts acumulados desde a navegação (toda
    // a jornada Completo, animações do velocímetro etc.), que não têm
    // relação com o slot e inflariam o número sem sentido — só nos
    // interessa o que se move DEPOIS que o slot já está visível.
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let clsValue = 0
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
              if (!entry.hadRecentInput) clsValue += entry.value
            }
          })
          observer.observe({ type: 'layout-shift', buffered: false })
          setTimeout(() => {
            observer.disconnect()
            resolve(clsValue)
          }, 4000)
        })
    )
    expect(cls).toBeLessThan(0.01)
  })
})
