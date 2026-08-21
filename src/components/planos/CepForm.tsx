'use client'

import { useId } from 'react'
import type { CurrentConnectionInput } from '../../lib/plansContract'
import { HeroIlustracao } from './HeroIlustracao'
import { Icone } from './Icone'

function formatCep(digits: string): string {
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

interface CepFormProps {
  cep: string
  onCepChange: (digits: string) => void
  onSubmit: () => void
  loading: boolean
  errorMessage?: string
  measurement: CurrentConnectionInput | null
  measurementTimestamp: number | null
  onUseLastMeasurement: () => void
  onClearMeasurement: () => void
  measurementUnavailable: boolean
}

// Hero comercial de `/planos` — meta visual da referência 01: duas colunas
// no desktop (texto+CEP à esquerda, composição de casa conectada à
// direita), sem card/container fechado em volta, headline em escala maior
// que a do app.
//
// Extensão documentada do SignallQ 2.0: a escala tipográfica do DS para em
// `display-small` (34px) porque nenhuma tela do fluxo do app usa algo
// maior. Esta é a única landing page comercial do site e a referência
// aprovada pede uma headline de impacto — usada aqui via tamanho
// arbitrário, mantendo família, peso e cor dos tokens oficiais.
export function CepForm({
  cep,
  onCepChange,
  onSubmit,
  loading,
  errorMessage,
  measurement,
  measurementTimestamp,
  onUseLastMeasurement,
  onClearMeasurement,
  measurementUnavailable,
}: CepFormProps) {
  const inputId = useId()
  const errorId = useId()

  return (
    <section className="grid w-full grid-cols-1 items-center gap-10 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:py-12">
      <div className="flex flex-col items-start gap-6">
        <span
          className="label-overline rounded-full px-3 py-1"
          style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
        >
          Planos de Internet
        </span>

        <h1
          className="m-0 max-w-[560px] text-[38px] leading-[1.1] font-bold tracking-[-0.5px] text-balance sm:text-[48px] lg:text-[54px]"
          style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}
        >
          O melhor plano não precisa ser o mais rápido.
        </h1>

        <p className="body-large m-0 max-w-[460px] text-[color:var(--text-secondary)]">
          Encontre opções para sua região e descubra qual combina com o jeito que você usa a internet.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!loading) onSubmit()
          }}
          className="flex w-full max-w-[520px] flex-col gap-2"
        >
          <div
            className="flex w-full flex-col gap-2 rounded-[var(--radius-pill)] sm:flex-row sm:items-center sm:gap-2 sm:border sm:p-1.5"
            style={{ borderColor: errorMessage ? 'var(--error)' : 'var(--border)', background: 'var(--bg-card)' }}
          >
            <div className="flex flex-1 items-center gap-2 rounded-[var(--radius-pill)] border px-4 py-2 sm:border-0 sm:py-0" style={{ borderColor: errorMessage ? 'var(--error)' : 'var(--border)' }}>
              <Icone name="location_on" size={20} color="var(--text-tertiary)" />
              <input
                id={inputId}
                aria-label="CEP"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="Informe seu CEP"
                value={formatCep(cep)}
                onChange={(event) => onCepChange(event.target.value.replace(/\D/g, '').slice(0, 8))}
                aria-invalid={errorMessage ? true : undefined}
                aria-describedby={errorMessage ? errorId : undefined}
                className="body-large h-10 w-full border-0 bg-transparent text-[color:var(--text-primary)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || cep.length !== 8}
              className="label-large flex h-12 shrink-0 items-center justify-center rounded-[var(--radius-pill)] px-8 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
            >
              {loading ? 'Buscando…' : 'Continuar'}
            </button>
          </div>
          {errorMessage && (
            <span id={errorId} role="alert" className="label-medium px-4" style={{ color: 'var(--error)' }}>
              {errorMessage}
            </span>
          )}
        </form>

        {measurement ? (
          <div className="flex flex-wrap items-center gap-2">
            <Icone name="check_circle" size={20} color="var(--success)" />
            <span className="body-medium text-[color:var(--text-secondary)]">
              Usando sua última medição{measurementTimestamp ? ` (${new Date(measurementTimestamp).toLocaleDateString('pt-BR')})` : ''}
              {measurement.downloadMbps != null ? ` — ${Math.round(measurement.downloadMbps)} Mbps download` : ''}
            </span>
            <button type="button" onClick={onClearMeasurement} className="label-large underline" style={{ color: 'var(--accent)' }}>
              Remover
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Icone name="speed" size={20} color="var(--text-tertiary)" />
            <span className="body-medium text-[color:var(--text-secondary)]">Já fez um teste no SignallQ?</span>
            <button type="button" onClick={onUseLastMeasurement} className="label-large underline" style={{ color: 'var(--accent)' }}>
              Usar minha medição →
            </button>
            {measurementUnavailable && (
              <span className="label-medium w-full" style={{ color: 'var(--text-tertiary)' }}>
                Nenhuma medição encontrada neste navegador.
              </span>
            )}
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <HeroIlustracao />
      </div>
    </section>
  )
}
