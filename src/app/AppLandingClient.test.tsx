import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLandingClient } from './AppLandingClient'
import * as telemetry from '@/lib/telemetry'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('página / — AppLandingClient (landing pública do app Android)', () => {
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

    expect(screen.queryAllByAltText(/^Tela Início do SignallQ/)).toHaveLength(1)
  })

  it('a galeria é uma grade de <figure>/<figcaption> navegável', () => {
    render(<AppLandingClient />)
    const figures = document.querySelectorAll('figure')
    expect(figures.length).toBe(8)
    figures.forEach((fig) => {
      expect(fig.querySelector('img')).not.toBeNull()
      expect(fig.querySelector('figcaption')).not.toBeNull()
    })
  })

  it('exibe o bloco de requisitos/privacidade com link para /privacidade', () => {
    render(<AppLandingClient />)
    expect(screen.getByRole('link', { name: 'Privacidade' })).toHaveAttribute('href', '/privacidade')
  })

  it('mantém um único CTA de download, presente no hero e na faixa final', () => {
    render(<AppLandingClient />)
    const primaryButtons = screen.getAllByRole('button', { name: 'Baixar na Play Store' })
    expect(primaryButtons).toHaveLength(2)
  })

  it('dispara telemetria de download ao clicar no CTA e abre a Play Store', async () => {
    const trackSpy = vi.spyOn(telemetry, 'trackFeatureUsed')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<AppLandingClient />)

    const [primaryHero] = screen.getAllByRole('button', { name: 'Baixar na Play Store' })
    await user.click(primaryHero)
    expect(trackSpy).toHaveBeenCalledWith('download_app_clicado')
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('play.google.com/store/apps/details?id=io.signallq.app'),
      '_blank',
      'noopener,noreferrer',
    )
  })
})
