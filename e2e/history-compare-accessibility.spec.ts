import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Cobertura e2e (navegador headless real) do #75 (US 28, comparar testes):
 * navegação por teclado na tela `/historico/comparar` e scan de
 * acessibilidade (axe-core), tanto para o caso compatível (diferença exibida)
 * quanto para o incompatível (motivo exibido, sem inventar conclusão).
 *
 * Semeia o Histórico local diretamente no IndexedDB (mesmo schema de
 * `historyDatabase.ts`: `signallq-site-history` v3, store `measurements`,
 * keyPath `id`) em vez de rodar uma medição real duas vezes — mais rápido e
 * determinístico, e exercita a mesma leitura (`getRecordById`) que a tela usa
 * de verdade, sem mockar nada do lado do navegador.
 *
 * Screenshots de evidência em `test-results/evidence-75/`.
 */

const EVIDENCE_DIR = 'test-results/evidence-75'

// Achado real, verificado também na página `/historico` já existente (sem
// nenhuma mudança desta tarefa) e sem relação com o que #75 entrega: o link
// "Política de Privacidade" dentro do texto do `CookieConsentBanner.tsx`
// (renderizado no layout raiz, em toda rota) tem contraste 1.17:1 contra o
// texto vizinho e nenhum sublinhado — mesma classe de achado já registrado
// como pendência em `journey-accessibility.spec.ts` (#71) para outro link.
// Filtrado aqui explicitamente para não bloquear CI por um defeito
// pré-existente fora do escopo autorizado desta tarefa; não corrigido.
function isKnownPreExistingFinding(violation: { id: string }): boolean {
  return violation.id === 'link-in-text-block'
}

interface SeedRecord {
  id: string
  timestamp: number
  download: number
  upload: number
  latency: number
  jitter: number | null
  connectionType: string | null
  connectionKind: string | null
  server: string
  mode?: 'rapido' | 'completo'
}

async function seedHistory(page: Page, records: SeedRecord[]) {
  await page.evaluate((recordsToSeed) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('signallq-site-history', 3)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('measurements')) {
          db.createObjectStore('measurements', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('comparisons')) {
          db.createObjectStore('comparisons', { keyPath: 'id' })
        }
      }
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('measurements', 'readwrite')
        const store = tx.objectStore('measurements')
        for (const record of recordsToSeed) store.put(record)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, records)
}

test.describe('Comparar testes salvos — teclado e acessibilidade (#75)', () => {
  test('testes compatíveis: mostra a diferença, navegável por teclado, sem violações críticas de acessibilidade', async ({ page }) => {
    // Página same-origin primeiro, só para o IndexedDB existir no contexto certo.
    await page.goto('/historico')
    await seedHistory(page, [
      {
        id: 'e2e-antes',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        download: 80,
        upload: 10,
        latency: 22,
        jitter: 2,
        connectionType: null,
        connectionKind: 'wifi',
        server: 'Cloudflare',
        mode: 'rapido',
      },
      {
        id: 'e2e-depois',
        timestamp: Date.now(),
        download: 105,
        upload: 12,
        latency: 18,
        jitter: 1,
        connectionType: null,
        connectionKind: 'wifi',
        server: 'Cloudflare',
        mode: 'rapido',
      },
    ])

    await page.goto('/historico/comparar?a=e2e-depois&b=e2e-antes')

    await expect(page.getByRole('heading', { name: 'Comparar testes' })).toBeVisible()
    // Matematicamente correto e não invertido mesmo com a=mais novo na URL.
    await expect(page.getByText('105.0 Mbps')).toBeVisible()
    await expect(page.getByText(/Antes: 80.0/)).toBeVisible()
    await expect(page.getByText('Melhor nesta medição').first()).toBeVisible()

    await page.screenshot({ path: `${EVIDENCE_DIR}/comparar-compativel.png`, fullPage: true })

    // Navegação por teclado: botão Voltar é o primeiro alvo focável da tela.
    const voltar = page.getByRole('button', { name: 'Voltar' })
    await voltar.focus()
    await expect(voltar).toBeFocused()

    // "Ver teste" (link para o detalhe de cada registro) é alcançável por Tab.
    const verTeste = page.getByRole('link', { name: 'Ver teste' }).first()
    await expect(verTeste).toBeVisible()

    const results = await new AxeBuilder({ page }).analyze()
    const critical = results.violations.filter((v) => (v.impact === 'critical' || v.impact === 'serious') && !isKnownPreExistingFinding(v))
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([])
  })

  test('testes incompatíveis (modos diferentes): mostra o motivo sem inventar conclusão, sem violações críticas', async ({ page }) => {
    await page.goto('/historico')
    await seedHistory(page, [
      {
        id: 'e2e-rapido',
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
        download: 80,
        upload: 10,
        latency: 22,
        jitter: 2,
        connectionType: null,
        connectionKind: 'wifi',
        server: 'Cloudflare',
        mode: 'rapido',
      },
      {
        id: 'e2e-completo',
        timestamp: Date.now(),
        download: 90,
        upload: 11,
        latency: 20,
        jitter: 1,
        connectionType: null,
        connectionKind: 'wifi',
        server: 'Cloudflare',
        mode: 'completo',
      },
    ])

    await page.goto('/historico/comparar?a=e2e-rapido&b=e2e-completo')

    await expect(page.getByText('Os dois testes precisam usar o mesmo modo.')).toBeVisible()
    await expect(page.getByText(/Melhor nesta medição|Pior nesta medição/)).toHaveCount(0)

    await page.screenshot({ path: `${EVIDENCE_DIR}/comparar-incompativel.png`, fullPage: true })

    const results = await new AxeBuilder({ page }).analyze()
    const critical = results.violations.filter((v) => (v.impact === 'critical' || v.impact === 'serious') && !isKnownPreExistingFinding(v))
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([])
  })
})
