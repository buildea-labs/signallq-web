import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Cobertura e2e (navegador headless real) da issue #61 (página `/app`):
 * jornada de inscrição em mobile/desktop, link externo do CTA principal com
 * noopener/noreferrer, galeria de capturas navegável por teclado e
 * compatível com leitor de tela, imagens com dimensão intrínseca (sem CLS
 * relevante) e telemetria separada para o CTA do grupo (download_app_clicado)
 * vs. o CTA de teste no navegador (app_landing_web_test_clicado).
 *
 * Screenshots de evidência em `test-results/evidence-61/`.
 */

const EVIDENCE_DIR = 'test-results/evidence-61'
const VIEWPORTS = [
  { name: 'mobile (375px)', width: 375, height: 900 },
  { name: 'desktop (1280px)', width: 1280, height: 900 },
]

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
}

test.describe('/app — jornada de inscrição sem overflow horizontal e sem violações críticas', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: hero, galeria e CTA final visíveis, sem overflow e sem violações críticas`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/app')

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Entrar na lista de teste' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Testar no navegador agora' }).first()).toBeVisible()

      await page.getByRole('heading', { name: 'O app por dentro' }).scrollIntoViewIfNeeded()
      await expect(page.locator('figure').first()).toBeVisible()

      await page.screenshot({ path: `${EVIDENCE_DIR}/app-${viewport.width}px.png`, fullPage: true })

      expect(await hasHorizontalOverflow(page)).toBe(false)

      const results = await new AxeBuilder({ page }).analyze()
      // "link-in-text-block" no link "Política de Privacidade" do rodapé
      // (`SiteFooter.tsx`) é um achado pré-existente e global do site (não
      // introduzido por #61, não reproduzido pelas capturas/seções novas
      // desta página) — mesmo padrão de registro-sem-bloqueio já usado em
      // `journey-accessibility.spec.ts` (#71) para achados fora do escopo
      // autorizado desta tarefa.
      const critical = results.violations.filter(
        (v) => (v.impact === 'critical' || v.impact === 'serious') && v.id !== 'link-in-text-block',
      )
      expect(critical, JSON.stringify(critical, null, 2)).toEqual([])
    })
  }
})

test.describe('/app — CTA principal abre o grupo de testadores com noopener/noreferrer', () => {
  test('o clique no CTA "Entrar na lista de teste" abre uma nova aba sem window.opener (noopener/noreferrer)', async ({ page, context }) => {
    await page.goto('/app')

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Entrar na lista de teste' }).first().click(),
    ])

    // `noopener` faz `window.opener` ser null dentro da própria aba nova —
    // verificação direta do efeito real do atributo, não só da API de alto
    // nível do Playwright (que rastreia a relação via CDP independente disso).
    expect(await popup.evaluate(() => window.opener)).toBeNull()
    expect(popup.url()).toContain('groups.google.com')
    await popup.close()
  })
})

test.describe('/app — galeria navegável por teclado e compatível com leitor de tela', () => {
  test('as 8 capturas reais aparecem como imagens nomeadas (alt text específico), sem depender de setas de carrossel', async ({ page }) => {
    await page.goto('/app')

    const gallerySection = page.locator('figure')
    await expect(gallerySection).toHaveCount(8)

    const firstImage = page.getByAltText(/Tela 'Medindo\.\.\.' do SignallQ/)
    await expect(firstImage).toBeVisible()

    const lastImage = page.getByAltText(/Tela 'Resultado para o jogo' do SignallQ/)
    await lastImage.scrollIntoViewIfNeeded()
    await expect(lastImage).toBeVisible()

    // Nenhum controle de seta/próximo-anterior é necessário: a grade é
    // estática e cada item é alcançável por leitura sequencial de árvore de
    // acessibilidade (figure > img[alt] + figcaption), diferente do
    // carrossel de Diferenciais (com marquee em loop). Regex ancorada para
    // não colidir com o botão de dev tools do Next.js ("Open Next.js Dev
    // Tools") presente só em ambiente de desenvolvimento.
    await expect(
      page.getByRole('button', { name: /^(próxima captura|captura anterior|next slide|previous slide)$/i }),
    ).toHaveCount(0)
  })

  test('Tab alcança o link "Ver comparação completa" e o bloco de privacidade logo depois da tabela comparativa', async ({ page }) => {
    await page.goto('/app')

    const compareLink = page.getByRole('link', { name: 'Ver comparação completa →' })
    await compareLink.scrollIntoViewIfNeeded()
    await compareLink.focus()
    await expect(compareLink).toBeFocused()
    await expect(compareLink).toHaveAttribute('href', '/comparativo')

    await expect(
      page
        .getByRole('main')
        .getByText('O teste web está disponível em beta; o aplicativo Android está em teste fechado.', { exact: false }),
    ).toBeVisible()
  })
})

test.describe('/app — imagens com dimensão intrínseca (sem CLS relevante)', () => {
  test('as imagens da galeria e do hero declaram width/height, sem depender de carregamento para reservar espaço', async ({ page }) => {
    await page.goto('/app')

    const heroImg = page.getByAltText(/Tela Início do SignallQ em modo escuro/)
    await expect(heroImg).toHaveAttribute('width', /\d+/)
    await expect(heroImg).toHaveAttribute('height', /\d+/)

    const galleryImages = page.locator('figure img')
    const count = await galleryImages.count()
    expect(count).toBe(8)
    for (let i = 0; i < count; i++) {
      const img = galleryImages.nth(i)
      await expect(img).toHaveAttribute('width', /\d+/)
      await expect(img).toHaveAttribute('height', /\d+/)
    }
  })
})

test.describe('/app — telemetria separada para CTA do grupo vs. CTA de teste no navegador', { tag: '@bandwidth' }, () => {
  test('o CTA "Entrar na lista de teste" envia feature_id download_app_clicado e o CTA Web envia app_landing_web_test_clicado', async ({ page }) => {
    const trackedFeatureIds: string[] = []
    await page.route('**/api/track', async (route) => {
      const body = route.request().postDataJSON() as { events?: Array<{ feature_id?: string }> }
      for (const evt of body.events ?? []) {
        if (evt.feature_id) trackedFeatureIds.push(evt.feature_id)
      }
      await route.fulfill({ status: 200, body: '{}' })
    })

    await page.goto('/app')

    // CTA secundário (Web) — navega para "/", então clicamos e voltamos.
    await page.getByRole('link', { name: 'Testar no navegador agora' }).first().click()
    await page.waitForURL('**/')
    await page.goto('/app')

    // CTA primário (grupo) — abre nova aba; fechamos para não deixar pendurado.
    const [popup] = await Promise.all([
      page.context().waitForEvent('page'),
      page.getByRole('button', { name: 'Entrar na lista de teste' }).first().click(),
    ])
    await popup.close()

    await page.waitForTimeout(500)

    expect(trackedFeatureIds).toContain('app_landing_web_test_clicado')
    expect(trackedFeatureIds).toContain('download_app_clicado')
  })
})
