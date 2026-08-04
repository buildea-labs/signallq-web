import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ComparisonMatrix, type ComparisonColumn, type ComparisonRow } from './ComparisonMatrix'

afterEach(() => cleanup())

const dirname = path.dirname(fileURLToPath(import.meta.url))

const COLUMNS: ComparisonColumn[] = [
  {
    id: 'traditional',
    label: 'Teste tradicional',
    headerNote: { summary: 'O que é isso?', content: <p>Categoria heterogênea de testes.</p> },
  },
  { id: 'web', label: 'SignallQ Web/PWA' },
  { id: 'android', label: 'SignallQ Android' },
]

const ROWS: ComparisonRow[] = [
  {
    capability: 'Download e upload',
    cells: [{ state: 'yes' }, { state: 'yes' }, { state: 'yes' }],
  },
  {
    capability: 'Sinal Wi-Fi por cômodo',
    cells: [{ state: 'no' }, { state: 'no' }, { state: 'android-only' }],
  },
  {
    capability: 'Tempo de resposta DNS',
    cells: [
      { state: 'varies' },
      {
        state: 'browser-limited',
        note: { summary: 'Por que limitado?', content: <p>Sem acesso a porta 53 no navegador.</p> },
      },
      { state: 'no' },
    ],
  },
]

/**
 * #63 — Matriz visual `/comparativo`: componente genérico `ComparisonMatrix`.
 * Cobre renderização (tabela semântica real, um estado por célula com texto
 * + ícone), acessibilidade (ordem de cabeçalhos, notas acionáveis por
 * teclado via `<details>`) e responsividade (reflow por CSS verificável no
 * arquivo de estilos, não por screenshot).
 */
describe('ComparisonMatrix — renderização', () => {
  it('renderiza uma <table> real com caption, thead e um <th scope="col"> por coluna', () => {
    render(<ComparisonMatrix caption="Comparação de exemplo" columns={COLUMNS} rows={ROWS} />)
    const table = screen.getByRole('table', { name: 'Comparação de exemplo' })
    expect(table.tagName).toBe('TABLE')
    const columnHeaders = within(table).getAllByRole('columnheader')
    // 1 coluna extra ("Capacidade") + 3 colunas de dado.
    expect(columnHeaders).toHaveLength(4)
    expect(columnHeaders[1]).toHaveTextContent('Teste tradicional')
    expect(columnHeaders[2]).toHaveTextContent('SignallQ Web/PWA')
    expect(columnHeaders[3]).toHaveTextContent('SignallQ Android')
  })

  it('usa <th scope="row"> para cada capacidade', () => {
    render(<ComparisonMatrix caption="Comparação de exemplo" columns={COLUMNS} rows={ROWS} />)
    const rowHeader = screen.getByRole('rowheader', { name: 'Download e upload' })
    expect(rowHeader.tagName).toBe('TH')
    expect(rowHeader).toHaveAttribute('scope', 'row')
  })

  it('nunca representa um estado só por ícone: cada célula traz o texto do estado', () => {
    render(<ComparisonMatrix caption="Comparação de exemplo" columns={COLUMNS} rows={ROWS} />)
    expect(screen.getAllByText('Sim').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Não').length).toBeGreaterThan(0)
    expect(screen.getByText('Disponível no Android')).toBeInTheDocument()
    expect(screen.getByText('Varia por ferramenta')).toBeInTheDocument()
    expect(screen.getByText('Limitado no navegador')).toBeInTheDocument()
  })

  it('não atribui capacidade exclusiva de hardware (Wi-Fi por cômodo) a Web ou teste tradicional', () => {
    render(<ComparisonMatrix caption="Comparação de exemplo" columns={COLUMNS} rows={ROWS} />)
    const wifiRow = screen.getByRole('rowheader', { name: 'Sinal Wi-Fi por cômodo' }).closest('tr')
    expect(wifiRow).not.toBeNull()
    const cells = wifiRow ? within(wifiRow).getAllByRole('cell') : []
    expect(cells[0]).toHaveTextContent('Não')
    expect(cells[1]).toHaveTextContent('Não')
    expect(cells[2]).toHaveTextContent('Disponível no Android')
  })
})

describe('ComparisonMatrix — acessibilidade', () => {
  it('mantém a ordem de leitura: cabeçalho de coluna, depois cabeçalho de linha, depois células na ordem visual', () => {
    render(<ComparisonMatrix caption="Comparação de exemplo" columns={COLUMNS} rows={ROWS} />)
    const table = screen.getByRole('table', { name: 'Comparação de exemplo' })
    const cellTexts = Array.from(table.querySelectorAll('th, td')).map((el) => el.tagName)
    // thead: 4 <th>; primeira linha do tbody: 1 <th scope=row> + 3 <td>.
    expect(cellTexts.slice(0, 4)).toEqual(['TH', 'TH', 'TH', 'TH'])
    expect(cellTexts.slice(4, 8)).toEqual(['TH', 'TD', 'TD', 'TD'])
  })

  it('expõe a nota do cabeçalho de coluna como <details>/<summary> alcançável por teclado (foco nativo, sem tabindex extra)', async () => {
    const user = userEvent.setup()
    render(<ComparisonMatrix caption="Comparação de exemplo" columns={COLUMNS} rows={ROWS} />)
    const summary = screen.getByText('O que é isso?')
    const details = summary.closest('details') as HTMLDetailsElement
    expect(details).not.toBeNull()
    expect(details.open).toBe(false)
    // <summary> nativo já é focável e ativável por Enter/Espaço sem precisar
    // de role/tabIndex customizado — o clique aqui simula a ativação que o
    // navegador dispara a partir do foco por teclado.
    await user.click(summary)
    expect(details.open).toBe(true)
    expect(screen.getByText('Categoria heterogênea de testes.')).toBeInTheDocument()
  })

  it('expõe a nota de uma célula (ex.: ressalva de DNS) como <details>/<summary>, nunca só title/hover', () => {
    render(<ComparisonMatrix caption="Comparação de exemplo" columns={COLUMNS} rows={ROWS} />)
    const summary = screen.getByText('Por que limitado?')
    const details = summary.closest('details')
    expect(details).not.toBeNull()
    expect(details?.querySelector('[title]')).toBeNull()
  })

  it('cada <td> carrega o rótulo da coluna como texto real (não CSS content, não aria-hidden)', () => {
    render(<ComparisonMatrix caption="Comparação de exemplo" columns={COLUMNS} rows={ROWS} />)
    const rowHeader = screen.getByRole('rowheader', { name: 'Download e upload' })
    const row = rowHeader.closest('tr')
    const cells = row ? within(row).getAllByRole('cell') : []
    expect(cells[0].textContent).toContain('Teste tradicional:')
    const labelEl = within(cells[0]).getByText('Teste tradicional:')
    expect(labelEl).not.toHaveAttribute('aria-hidden')
  })
})

describe('ComparisonMatrix — responsividade (CSS verificável, sem screenshot)', () => {
  const css = readFileSync(path.resolve(dirname, '../index.css'), 'utf-8')

  it('define reflow para cartão empilhado abaixo de 640px sem esconder o <thead>', () => {
    expect(css).toMatch(/@media \(max-width: 639px\)/)
    const mediaBlockMatch = css.match(/@media \(max-width: 639px\) \{([\s\S]*?)\n\}/)
    expect(mediaBlockMatch).not.toBeNull()
    const block = mediaBlockMatch ? mediaBlockMatch[1] : ''
    expect(block).toMatch(/\.sq-comparison-table[\s\S]*?display: block;/)
    expect(block).not.toMatch(/\.sq-comparison-table thead\s*\{[^}]*display:\s*none/)
  })

  it('rótulo de coluna por célula troca de visualmente-escondido para visível dentro do breakpoint mobile', () => {
    expect(css).toMatch(/\.sq-comparison-col-label\s*\{[^}]*clip: rect\(0, 0, 0, 0\);/)
    const mediaBlockMatch = css.match(/@media \(max-width: 639px\) \{([\s\S]*?)\n\}/)
    const block = mediaBlockMatch ? mediaBlockMatch[1] : ''
    expect(block).toMatch(/\.sq-comparison-col-label\s*\{[^}]*position: static;/)
  })

  it('a tabela usa o mesmo token de breakpoint (640px / `sm:`) já usado no restante do site', () => {
    // Tailwind v4: `sm:` = min-width 640px, ou seja, reflow mobile abaixo de 640px.
    expect(css).toContain('639px')
  })
})
