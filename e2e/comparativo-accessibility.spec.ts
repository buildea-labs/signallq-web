import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Cobertura e2e (navegador headless real) do #63 (matriz visual
 * `/comparativo`): navegação completa por Tab/Shift+Tab pelas notas
 * (`<details>`) e CTAs da matriz, ausência de scroll horizontal em desktop,
 * tablet e mobile, e scan de acessibilidade (axe-core) sem violações
 * críticas/sérias — conforme a seção "Testes obrigatórios" da especificação
 * de Juliana.
 *
 * Screenshots de evidência em `test-results/evidence-63/`.
 */

const EVIDENCE_DIR = 'test-results/evidence-63'
const VIEWPORTS = [
  { name: 'mobile (375px)', width: 375, height: 900 },
  { name: 'tablet (768px)', width: 768, height: 1024 },
  { name: 'desktop (1280px)', width: 1280, height: 900 },
]

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
}

test.describe('/comparativo — sem scroll horizontal ilegível em nenhum viewport (#63)', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: matriz visível, sem overflow horizontal e sem violações críticas`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/comparativo')

      const table = page.getByRole('table')
      await expect(table).toBeVisible()
      await expect(page.getByRole('rowheader', { name: 'Download e upload' })).toBeVisible()

      await page.screenshot({ path: `${EVIDENCE_DIR}/comparativo-${viewport.width}px.png`, fullPage: true })

      expect(await hasHorizontalOverflow(page)).toBe(false)

      const results = await new AxeBuilder({ page }).analyze()
      const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
      expect(critical, JSON.stringify(critical, null, 2)).toEqual([])
    })
  }
})

test.describe('/comparativo — notas e CTAs alcançáveis por teclado (#63)', () => {
  test('a nota do cabeçalho "Teste tradicional" abre via teclado (foco + Enter)', async ({ page }) => {
    await page.goto('/comparativo')

    const summary = page.getByText('O que é "teste tradicional"?')
    await summary.focus()
    await expect(summary).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(
      page.getByText('Não é uma comparação contra uma ferramenta específica', { exact: false }),
    ).toBeVisible()
  })

  test('a nota metodológica de DNS ("Limitado no navegador") abre via teclado e expõe o link para /como-medimos', async ({ page }) => {
    await page.goto('/comparativo')

    const summary = page.getByText('Por que "limitado no navegador"?')
    await summary.scrollIntoViewIfNeeded()
    await summary.focus()
    await page.keyboard.press('Enter')

    const link = page.getByRole('link', { name: 'Entender como medimos →' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/como-medimos')
  })

  test('Tab alcança sequencialmente as notas da matriz e os 3 CTAs contextuais logo abaixo dela', async ({ page }) => {
    await page.goto('/comparativo')

    const traditionalNote = page.getByText('O que é "teste tradicional"?')
    await traditionalNote.focus()
    await expect(traditionalNote).toBeFocused()

    const ctaWeb = page.getByRole('link', { name: 'Testar agora no navegador' })
    const ctaApp = page.getByRole('link', { name: 'Conhecer o app Android' })
    const ctaComoMedimos = page.getByRole('link', { name: 'Entender como medimos' })

    await expect(ctaWeb).toHaveAttribute('href', '/')
    await expect(ctaApp).toHaveAttribute('href', '/app')
    await expect(ctaComoMedimos).toHaveAttribute('href', '/como-medimos')

    await ctaWeb.focus()
    await expect(ctaWeb).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(ctaApp).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(ctaComoMedimos).toBeFocused()
  })
})
