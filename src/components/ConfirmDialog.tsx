import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  icon: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Componente genérico de confirmação destrutiva do Histórico (#74/#75/#76).
// Foco programático ao abrir e fechamento por Esc equivalente a `onCancel`
// beneficiam todos os usos, existentes e novos (achado de acessibilidade da
// spec de UX do #76, seção 4): sem isto, um leitor de tela/teclado que já
// estava focado fora do diálogo não é levado a ele, e Esc não tem efeito.
export function ConfirmDialog({ title, description, confirmLabel, cancelLabel, icon, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 p-5" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[380px] flex-col items-center gap-3 rounded-[var(--radius-dialog)] p-6 text-center outline-none"
        style={{ background: 'var(--bg-card)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 32, color: danger ? 'var(--error)' : 'var(--accent)' }}>
          {icon}
        </span>
        <div className="headline-small">{title}</div>
        <div className="body-medium">{description}</div>
        <div className="mt-2 flex w-full gap-2.5">
          <button onClick={onCancel} className="h-11 flex-1 rounded-[var(--radius-button)] border label-large" style={{ borderColor: 'var(--border)' }}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="h-11 flex-1 rounded-[var(--radius-button)] label-large"
            style={{ background: danger ? 'var(--error)' : 'var(--accent)', color: 'var(--on-accent)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
