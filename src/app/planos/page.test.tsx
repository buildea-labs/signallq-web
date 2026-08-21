import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Page from './page'

afterEach(() => cleanup())

describe('página /planos (Issue #10)', () => {
  it('renderiza o hero e a entrada por CEP como primeiro passo da jornada', () => {
    render(<Page />)
    expect(screen.getByRole('heading', { level: 1, name: 'O melhor plano não precisa ser o mais rápido.' })).toBeInTheDocument()
    expect(screen.getByLabelText('CEP')).toBeInTheDocument()
  })

  it('inclui o bloco editorial Escolher/Entender/Resolver logo após o hero (referência 02)', () => {
    render(<Page />)
    expect(screen.getByText('Escolher')).toBeInTheDocument()
    expect(screen.getByText('Entender')).toBeInTheDocument()
    expect(screen.getByText('Resolver')).toBeInTheDocument()
  })

  it('inclui a entrada alternativa "Já tem internet?" (referência 02)', () => {
    render(<Page />)
    expect(screen.getByText('Já tem internet?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Analisar minha conexão' })).toBeInTheDocument()
  })
})
