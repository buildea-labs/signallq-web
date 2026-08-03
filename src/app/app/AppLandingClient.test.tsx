import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLandingClient } from './AppLandingClient'
import * as telemetry from '@/lib/telemetry'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/**
 * Cobertura de integração real (RTL) da página `/app` (issue #61):
 * galeria de capturas reais navegável/acessível, comparação aditiva
 * (3 colunas, sem desqualificar concorrentes genericamente), Web e Android
 * não confundidos, ausência de escassez artificial, e telemetria separada
 * para o CTA do grupo de testadores vs. o CTA de teste no navegador.
 */
describe('página /app — AppLandingClient (#61)', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  it('renderiza a galeria com as 8 capturas reais, cada uma com alt text específico', () => {
    render(<AppLandingClient />)

    const expectedAlts = [
      /Tela 'Medindo\.\.\.' do SignallQ/,
      /Tela de resultado do teste do SignallQ/,
      /Tela 'Vamos descobrir o que está acontecendo'/,
      /Tela 'O que identifiquei' do SignallQ/,
      /Aba Sinal \(Wi-Fi\) do SignallQ/,
      /Aba Sinal \(Móvel\) do SignallQ/,
      /Aba Sinal \(Canal\) do SignallQ/,
      /Tela 'Resultado para o jogo' do SignallQ/,
    ]

    for (const pattern of expectedAlts) {
      expect(screen.getByAltText(pattern)).toBeInTheDocument()
    }

    // Nenhum alt genérico tipo "screenshot" ou "imagem do app" — cada uma
    // descreve o conteúdo real, e nenhuma repete a tela Início do hero.
    expect(screen.queryAllByAltText(/^Tela Início do SignallQ/)).toHaveLength(1)
  })

  it('recorta a captura de jogos (teste-09) removendo o anúncio de teste, sem servir o arquivo original', () => {
    render(<AppLandingClient />)
    const img = screen.getByAltText(/Tela 'Resultado para o jogo' do SignallQ/) as HTMLImageElement
    expect(img.src).toContain('teste-09-jogos-recortado.jpg')
    expect(img.src).not.toContain(encodeURIComponent('/assets/teste-09-jogos.jpg'))
    expect(document.body.textContent).not.toMatch(/Patrocinado/i)
    expect(document.body.textContent).not.toMatch(/Google Ads/i)
  })

  it('a galeria é uma grade de <figure>/<figcaption> navegável, não um carrossel com itens duplicados/ocultos', () => {
    render(<AppLandingClient />)
    const figures = document.querySelectorAll('figure')
    expect(figures.length).toBe(8)
    figures.forEach((fig) => {
      expect(fig.querySelector('img')).not.toBeNull()
      expect(fig.querySelector('figcaption')).not.toBeNull()
    })
  })

  it('renderiza a comparação aditiva com 3 colunas (tradicional, Web/PWA, Android), não a comparação absoluta anterior', () => {
    render(<AppLandingClient />)
    const table = screen.getByRole('table')
    const headers = within(table).getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent?.trim())).toEqual(
      expect.arrayContaining(['Teste tradicional', 'SignallQ Web/PWA', 'SignallQ Android']),
    )
    expect(screen.queryByText('App SignallQ')).not.toBeInTheDocument()
    expect(screen.queryByText('Testes tradicionais')).not.toBeInTheDocument()
  })

  it('trata capacidades exclusivas de hardware como "Disponível no Android", nunca atribuídas à Web/tradicional', () => {
    render(<AppLandingClient />)
    for (const capability of [
      'Sinal Wi-Fi por cômodo',
      'Sinal 4G/5G nativo (RSRP/RSRQ/SINR)',
      'Dispositivos conectados à rede',
    ]) {
      const row = screen.getByRole('rowheader', { name: capability }).closest('tr')
      expect(row).not.toBeNull()
      const cells = row ? within(row).getAllByRole('cell') : []
      expect(cells[0]).toHaveTextContent('Não')
      expect(cells[1]).toHaveTextContent('Não')
      expect(cells[2]).toHaveTextContent('Disponível no Android')
    }
  })

  it('não atribui diagnóstico por IA ao navegador: Web aparece como "Sim" com nota de mecanismo diferente (regras, não IA)', () => {
    render(<AppLandingClient />)
    const row = screen.getByRole('rowheader', { name: 'Diagnóstico por IA da causa' }).closest('tr')
    const cells = row ? within(row).getAllByRole('cell') : []
    expect(cells[1]).toHaveTextContent('Sim')
    expect(within(cells[1]).getByText('Mecanismo diferente do Android')).toBeInTheDocument()
    expect(cells[2]).toHaveTextContent('Sim')
  })

  it('"Modo gamer por jogo" não afirma suporte no Web sem evidência', () => {
    render(<AppLandingClient />)
    const row = screen.getByRole('rowheader', { name: 'Modo gamer por jogo' }).closest('tr')
    const cells = row ? within(row).getAllByRole('cell') : []
    expect(cells[1]).toHaveTextContent('Não')
    expect(cells[2]).toHaveTextContent('Sim')
  })

  it('inclui o link "Ver comparação completa" apontando para /comparativo', () => {
    render(<AppLandingClient />)
    expect(screen.getByRole('link', { name: /Ver comparação completa/ })).toHaveAttribute('href', '/comparativo')
  })

  it('não afirma escassez artificial: nenhuma menção a "vagas limitadas" ou número de vagas', () => {
    render(<AppLandingClient />)
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/vagas limitadas/i)
    expect(text).not.toMatch(/\d+\s+vagas/i)
  })

  it('não usa mais a frase absoluta "nenhum teste de velocidade tradicional consegue ver"', () => {
    render(<AppLandingClient />)
    expect(document.body.textContent).not.toMatch(/nenhum teste de velocidade tradicional consegue ver/i)
  })

  it('exibe o bloco de estágio/requisitos/privacidade com a frase já aprovada (#54) e link para /privacidade', () => {
    render(<AppLandingClient />)
    expect(
      screen.getByText(/O teste web está disponível em beta; o aplicativo Android está em teste fechado\./),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacidade' })).toHaveAttribute('href', '/privacidade')
  })

  it('mantém um único CTA principal (entrar no teste fechado), presente no hero e na faixa final, com CTA secundário Web em cada ponto', () => {
    render(<AppLandingClient />)
    const primaryButtons = screen.getAllByRole('button', { name: 'Entrar na lista de teste' })
    expect(primaryButtons).toHaveLength(2)

    const secondaryLinks = screen.getAllByRole('link', { name: 'Testar no navegador agora' })
    expect(secondaryLinks).toHaveLength(2)
    secondaryLinks.forEach((link) => expect(link).toHaveAttribute('href', '/'))
  })

  it('dispara telemetria separada para o CTA do grupo (download_app_clicado) e o CTA Web (app_landing_web_test_clicado)', async () => {
    const trackSpy = vi.spyOn(telemetry, 'trackFeatureUsed')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<AppLandingClient />)

    const [primaryHero] = screen.getAllByRole('button', { name: 'Entrar na lista de teste' })
    await user.click(primaryHero)
    expect(trackSpy).toHaveBeenCalledWith('download_app_clicado')
    expect(window.open).toHaveBeenCalledWith(expect.any(String), '_blank', 'noopener,noreferrer')

    trackSpy.mockClear()
    const [secondaryHero] = screen.getAllByRole('link', { name: 'Testar no navegador agora' })
    await user.click(secondaryHero)
    expect(trackSpy).toHaveBeenCalledWith('app_landing_web_test_clicado')
  })
})
