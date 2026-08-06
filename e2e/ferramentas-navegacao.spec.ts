import { expect, test, type Page } from '@playwright/test'

/**
 * Ferramentas: os dois modos de abertura e a saída de cada um.
 *
 * Esta suíte existe por causa de uma lacuna real. A grade de Ferramentas foi
 * construída com quatro cartões e nenhum teste chegava a abrir um deles — a
 * cobertura toda parava na tela de Velocidade. Três defeitos passaram por
 * todos os gates e só apareceram no uso: painel do modal transparente
 * (`--surface` nunca definido), texto sem acentos e página inteira sem
 * nenhuma saída.
 *
 * Cada asserção aqui corresponde a um desses defeitos.
 */

const FERRAMENTAS = [
  { rota: '/ping', titulo: /Ping/ },
  { rota: '/dns', titulo: /Rotas e DNS/ },
  { rota: '/jogos', titulo: /jogo/i },
  { rota: '/meu-ip', titulo: /IP/ },
] as const

/** Cor de fundo efetiva: sobe na árvore até achar quem de fato pinta. */
async function fundoEfetivo(page: Page, seletor: string): Promise<string> {
  return page.evaluate((sel) => {
    let el = document.querySelector(sel) as HTMLElement | null
    while (el) {
      const bg = getComputedStyle(el).backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg
      el = el.parentElement
    }
    return 'transparente'
  }, seletor)
}

test.describe('Ferramentas — página inteira tem saída e superfície opaca', () => {
  for (const ferramenta of FERRAMENTAS) {
    test(`${ferramenta.rota}: abre por URL direta, tem "Voltar" e volta para Velocidade`, async ({ page }) => {
      await page.goto(ferramenta.rota)

      // Entrada direta (link externo, busca, PWA instalada): não existe
      // entrada anterior no histórico, então a tela precisa de saída própria.
      const voltar = page.getByRole('link', { name: 'Voltar para Velocidade' })
      await expect(voltar).toBeVisible()

      await voltar.click()
      await expect(page).toHaveURL(/\/$/)
    })
  }

  test('o painel da ferramenta é opaco — nunca deixa o conteúdo de trás atravessar', async ({ page }) => {
    await page.goto('/dns')
    await expect(page.getByText('Rotas e DNS')).toBeVisible()

    // `--surface`/`--surface-elevated` não existiam: a declaração inteira caía
    // para `transparent` e a página aparecia por baixo do texto do modal.
    const fundo = await fundoEfetivo(page, '.rounded-3xl')
    expect(fundo).not.toBe('transparente')
    expect(fundo).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('o texto das ferramentas mantém os acentos', async ({ page }) => {
    await page.goto('/dns')

    // O arquivo já esteve com os acentos perdidos ("provedores pblicos",
    // "boto direito"). Uma frase de cada aba basta como sentinela.
    await expect(page.getByText('Tempo de resposta dos provedores públicos a partir da sua rede.')).toBeVisible()

    // A aba é uma rota própria (`/dns/windows`). Vamos direto em vez de
    // clicar: em desenvolvimento a rota é compilada sob demanda, e sob carga
    // paralela essa compilação estoura o tempo padrão de uma asserção — o que
    // falharia por infraestrutura, não pelo texto.
    await page.goto('/dns/windows')
    await expect(page.getByText(/Clique com o botão direito na sua rede/)).toBeVisible()
  })
})

test.describe('Ferramentas — abertas pela grade viram modal sobre o resultado', { tag: '@bandwidth' }, () => {
  test('o cartão abre o modal e o "X" devolve a pessoa ao resultado', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/')

    // A grade só existe depois que há um resultado na tela.
    await expect(page.getByRole('button', { name: 'Fazer teste completo' })).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: 'Recusar' }).click()

    // O rodapé também tem um link para /dns; o alvo é o cartão da grade.
    await page.getByRole('link', { name: 'DNS Resolução de domínio' }).click()
    await expect(page).toHaveURL(/\/dns$/)
    await expect(page.getByText('Rotas e DNS')).toBeVisible()

    // Sobreposto ao resultado, o "X" é a saída — e aqui `router.back()` é
    // correto, porque a entrada anterior existe por construção.
    await page.getByRole('button', { name: 'Fechar' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Fazer teste completo' })).toBeVisible()
  })
})
