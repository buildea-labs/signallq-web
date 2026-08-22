import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MedicaoRegistro } from '@/lib/measurementRepository'
import { FerramentasClient } from './FerramentasClient'

const listRecordsMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/measurementRepository', async () => {
  const actual = await vi.importActual<typeof import('@/lib/measurementRepository')>('@/lib/measurementRepository')
  return { ...actual, listRecords: listRecordsMock }
})

const latest: MedicaoRegistro = {
  id: 'teste-1',
  timestamp: 1_700_000_000_000,
  download: 487,
  upload: 93,
  latency: 18,
  jitter: 4,
  connectionType: '4g',
  connectionKind: 'wifi',
  server: 'Cloudflare',
  mode: 'completo',
}

describe('FerramentasClient', () => {
  beforeEach(() => {
    listRecordsMock.mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
    listRecordsMock.mockReset()
  })

  it('apresenta a página como central de investigação, não como catálogo técnico', () => {
    render(<FerramentasClient />)

    expect(screen.getByRole('heading', { level: 1, name: 'Entenda o que está acontecendo com a sua internet.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Testar minha conexão/ })).toHaveAttribute('href', '/teste-de-velocidade')
    expect(screen.getByText('Comece pelo que você está percebendo.')).toBeInTheDocument()
    expect(screen.getByText('Minha conexão parece mais lenta do que deveria')).toBeInTheDocument()
    expect(screen.getByText('Tenho lag mesmo com velocidade boa')).toBeInTheDocument()
  })

  it('expõe todas as ferramentas reais atualmente disponíveis', () => {
    render(<FerramentasClient />)

    expect(screen.getByRole('link', { name: /Medir ping/ })).toHaveAttribute('href', '/ping')
    expect(screen.getByRole('link', { name: /Comparar DNS/ })).toHaveAttribute('href', '/dns')
    expect(screen.getByRole('link', { name: /Ver meu IP/ })).toHaveAttribute('href', '/meu-ip')
    expect(screen.getByRole('link', { name: /Testar jogos/ })).toHaveAttribute('href', '/jogos')
  })

  it('mostra estado vazio do histórico sem inventar uma medição', async () => {
    render(<FerramentasClient />)

    expect(await screen.findByText('Seu histórico começa no primeiro teste.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fazer primeira medição' })).toHaveAttribute('href', '/teste-de-velocidade')
  })

  it('reaproveita a última medição local quando ela existe', async () => {
    listRecordsMock.mockResolvedValue([latest])
    render(<FerramentasClient />)

    expect(await screen.findByText('Sua última medição')).toBeInTheDocument()
    expect(screen.getByText('487 Mbps')).toBeInTheDocument()
    expect(screen.getByText('93 Mbps')).toBeInTheDocument()
    expect(screen.getByText('18 ms')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver resultado' })).toHaveAttribute('href', '/historico/teste-1')
  })

  it('fecha a jornada levando para comparação de planos sem misturar a função das ferramentas', () => {
    render(<FerramentasClient />)

    expect(screen.getByText('Descubra qual faixa de internet faz sentido para a sua casa.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Encontrar planos/ })).toHaveAttribute('href', '/')
  })
})
