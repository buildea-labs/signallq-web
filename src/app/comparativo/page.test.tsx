import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PAGE_META } from '../../lib/pageMetaCatalog'
import Page from './page'

afterEach(() => cleanup())

/**
 * #63 — Matriz visual `/comparativo` substitui a prosa de 5 seções por uma
 * `ComparisonMatrix` real. Critérios de aceite cobertos aqui: Web e Android
 * não recebem capacidade que não possuem (regra de conservadorismo), os 3
 * CTAs contextuais levam a rotas reais, e a página não volta a afirmar
 * "modem da operadora" nem generaliza "cômodo a cômodo" para sinal móvel
 * (revisão de frases absolutas da especificação).
 */
describe('página /comparativo — matriz visual (#63)', () => {
  it('renderiza a matriz com as 3 colunas e ao menos as 11 capacidades especificadas', () => {
    render(<Page />)
    const table = screen.getByRole('table')
    const headers = within(table).getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent?.trim())).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Teste tradicional'),
        'SignallQ Web/PWA',
        'SignallQ Android',
      ]),
    )
    ;[
      'Download e upload',
      'Latência (repouso)',
      'Latência sob carga (bufferbloat)',
      'Tempo de resposta DNS',
      'Histórico local',
      'Contexto do problema (perguntas guiadas)',
      'Diagnóstico (causa provável)',
      'Próxima ação / reteste comparativo',
      'Sinal Wi-Fi por cômodo',
      'Sinal móvel 4G/5G (RSRP/RSRQ/SINR)',
      'Dispositivos na rede',
    ].forEach((capability) => {
      expect(screen.getByRole('rowheader', { name: capability })).toBeInTheDocument()
    })
  })

  it('não omite a linha de diagnóstico de fibra recomendada para omissão na v1', () => {
    render(<Page />)
    expect(screen.queryByRole('rowheader', { name: /fibra/i })).not.toBeInTheDocument()
  })

  it('trata as 3 capacidades exclusivas de hardware como "Disponível no Android", nunca atribuídas à Web/tradicional', () => {
    render(<Page />)
    for (const capability of [
      'Sinal Wi-Fi por cômodo',
      'Sinal móvel 4G/5G (RSRP/RSRQ/SINR)',
      'Dispositivos na rede',
    ]) {
      const row = screen.getByRole('rowheader', { name: capability }).closest('tr')
      expect(row).not.toBeNull()
      const cells = row ? within(row).getAllByRole('cell') : []
      expect(cells[0]).toHaveTextContent('Não')
      expect(cells[1]).toHaveTextContent('Não')
      expect(cells[2]).toHaveTextContent('Disponível no Android')
    }
  })

  it('aplica a regra de conservadorismo: bufferbloat, DNS e reteste aparecem como "Não" no Android sem evidência publicada', () => {
    render(<Page />)
    for (const capability of [
      'Latência sob carga (bufferbloat)',
      'Tempo de resposta DNS',
      'Próxima ação / reteste comparativo',
    ]) {
      const row = screen.getByRole('rowheader', { name: capability }).closest('tr')
      const cells = row ? within(row).getAllByRole('cell') : []
      expect(cells[2]).toHaveTextContent('Não')
    }
  })

  it('marca o tempo de resposta DNS como "Limitado no navegador" na Web, nunca como "Sim" sem ressalva', () => {
    render(<Page />)
    const row = screen.getByRole('rowheader', { name: 'Tempo de resposta DNS' }).closest('tr')
    const cells = row ? within(row).getAllByRole('cell') : []
    expect(cells[1]).toHaveTextContent('Limitado no navegador')
  })

  it('marca contexto e diagnóstico como "Sim" nas duas plataformas com nota de mecanismo diferente no Android', () => {
    render(<Page />)
    for (const capability of ['Contexto do problema (perguntas guiadas)', 'Diagnóstico (causa provável)']) {
      const row = screen.getByRole('rowheader', { name: capability }).closest('tr')
      const cells = row ? within(row).getAllByRole('cell') : []
      expect(cells[1]).toHaveTextContent('Sim')
      expect(cells[2]).toHaveTextContent('Sim')
      expect(within(cells[2]).getByText('Mecanismo diferente do Web')).toBeInTheDocument()
    }
  })

  it('inclui os 3 CTAs contextuais logo após a matriz, apontando para rotas reais', () => {
    render(<Page />)
    expect(screen.getByRole('link', { name: 'Testar agora no navegador' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Conhecer o app Android' })).toHaveAttribute('href', '/app')
    expect(screen.getByRole('link', { name: 'Entender como medimos' })).toHaveAttribute('href', '/como-medimos')
  })

  it('mantém o CTA final "Fazer meu teste" apontando para /', () => {
    render(<Page />)
    const ctas = screen.getAllByRole('link', { name: 'Fazer meu teste' })
    expect(ctas.length).toBeGreaterThanOrEqual(1)
    ctas.forEach((cta) => expect(cta).toHaveAttribute('href', '/'))
  })

  it('não afirma que o navegador não lê "o modem da operadora" (sem evidência de código)', () => {
    render(<Page />)
    expect(document.body.textContent).not.toContain('modem da operadora')
  })

  it('não generaliza "cômodo a cômodo" para o sinal 4G/5G (granularidade só confirmada para Wi-Fi)', () => {
    render(<Page />)
    const text = document.body.textContent ?? ''
    const idx = text.indexOf('cômodo a cômodo')
    if (idx >= 0) {
      const around = text.slice(Math.max(0, idx - 60), idx + 40)
      expect(around).not.toMatch(/4G\/5G/)
    }
  })

  it('define title/description do catálogo citando a matriz e itens verificáveis, sem repetir "DNS" sem qualificador', () => {
    const meta = PAGE_META['/comparativo']
    expect(meta.title).toContain('comparativo')
    expect(meta.description.toLowerCase()).not.toMatch(/\bdns\b/)
  })
})
