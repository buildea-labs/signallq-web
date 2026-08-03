import type { ReactNode } from 'react'

// Matriz de comparação genérica (issue #63) — tabela semântica real
// (<table>/<caption>/<thead>/<tbody>) que se mantém uma única fonte de
// verdade em todos os breakpoints: abaixo de 640px o CSS em `src/index.css`
// (regras `.sq-comparison-*`) faz o reflow para cartão empilhado via
// `display: block` nos elementos da tabela, sem duplicar conteúdo no DOM e
// sem esconder o `<thead>` (permanece na árvore de acessibilidade, só
// reflui visualmente). Não é específico de Web-vs-Android: `columns`/`rows`
// são genéricos para qualquer matriz de N colunas que o site precise no
// futuro.

export type ComparisonState = 'yes' | 'no' | 'varies' | 'browser-limited' | 'android-only'

export const COMPARISON_STATE_LABEL: Record<ComparisonState, string> = {
  yes: 'Sim',
  no: 'Não',
  varies: 'Varia por ferramenta',
  'browser-limited': 'Limitado no navegador',
  'android-only': 'Disponível no Android',
}

const STATE_ICON: Record<ComparisonState, string> = {
  yes: 'check_circle',
  no: 'cancel',
  varies: 'compare_arrows',
  'browser-limited': 'warning',
  'android-only': 'smartphone',
}

const STATE_COLOR_VAR: Record<ComparisonState, string> = {
  yes: '--success',
  no: '--text-tertiary',
  varies: '--accent-blue',
  'browser-limited': '--warning',
  'android-only': '--accent',
}

export interface ComparisonNote {
  /** Texto do gatilho (`<summary>`), sempre acionável por teclado — nunca só hover/title. */
  summary: string
  content: ReactNode
}

export interface ComparisonColumn {
  id: string
  label: string
  /** Nota ancorada no cabeçalho da coluna (ex.: esclarecer "teste tradicional" como categoria). */
  headerNote?: ComparisonNote
}

export interface ComparisonCell {
  state: ComparisonState
  /** Ressalva metodológica ou de mecanismo específica desta célula. */
  note?: ComparisonNote
}

export interface ComparisonRow {
  /** Nome da capacidade — vira o cabeçalho de linha (`<th scope="row">`). */
  capability: string
  /** Uma célula por coluna, na mesma ordem de `columns`. */
  cells: ComparisonCell[]
}

export interface ComparisonMatrixProps {
  /** Resumo da tabela para tecnologia assistiva (`<caption>`); pode ficar visível ou só sr-only. */
  caption: string
  captionVisible?: boolean
  columns: ComparisonColumn[]
  rows: ComparisonRow[]
}

function MatrixNote({ summary, content, className = '' }: ComparisonNote & { className?: string }) {
  return (
    <details className={`sq-comparison-note mt-1 ${className}`}>
      <summary className="label-small inline-flex cursor-pointer list-none items-center gap-1 text-[color:var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">info</span>
        {summary}
      </summary>
      <div className="body-small mt-1 max-w-[36ch] [&>p]:m-0 [&_a]:underline">{content}</div>
    </details>
  )
}

function StateCell({ state, note }: ComparisonCell) {
  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[18px]"
          style={{ color: `var(${STATE_COLOR_VAR[state]})` }}
        >
          {STATE_ICON[state]}
        </span>
        <span className="body-medium m-0">{COMPARISON_STATE_LABEL[state]}</span>
      </span>
      {note && <MatrixNote {...note} />}
    </>
  )
}

export function ComparisonMatrix({ caption, captionVisible, columns, rows }: ComparisonMatrixProps) {
  return (
    <div className="sq-comparison-wrap rounded-[var(--radius-card)] border" style={{ borderColor: 'var(--border)' }}>
      <table className="sq-comparison-table w-full border-collapse text-left">
        <caption className={captionVisible ? 'title-medium px-4 py-3 text-left' : 'sr-only'}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="sq-comparison-corner p-3 label-large" style={{ background: 'var(--bg-secondary)' }}>
              Capacidade
            </th>
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className="p-3 label-large text-left align-top"
                style={{ background: 'var(--bg-secondary)' }}
              >
                {col.label}
                {col.headerNote && <MatrixNote {...col.headerNote} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.capability}>
              <th scope="row" className="p-3 label-large border-t align-top" style={{ borderColor: 'color-mix(in srgb, var(--border) 40%, transparent)' }}>
                {row.capability}
              </th>
              {row.cells.map((cell, i) => (
                <td
                  key={columns[i].id}
                  className="p-3 border-t align-top"
                  style={{ borderColor: 'color-mix(in srgb, var(--border) 40%, transparent)' }}
                >
                  <span className="sq-comparison-col-label label-small">{columns[i].label}:</span>
                  <StateCell {...cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
