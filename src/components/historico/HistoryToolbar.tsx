import { FILTROS, type HistoryFiltro } from "@/hooks/useHistoryController";

export function HistoryDiagnosticTip() {
  return (
    <div className="flex items-start gap-3 rounded-[16px] p-4 bg-[color-mix(in_srgb,_var(--accent)_15%,_transparent)]">
      <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[color:var(--accent)] mt-0.5">lightbulb</span>
      <div className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-secondary)]">
        <b className="text-[color:var(--text-primary)]">Dica de Diagnóstico:</b> Compare a sua conexão fazendo um teste perto do roteador e outro no cômodo onde a internet fica lenta. A diferença mostra o quanto você perde no Wi-Fi.
      </div>
    </div>
  );
}

interface HistoryToolbarProps {
  filtro: HistoryFiltro
  onFiltroChange: (filtro: HistoryFiltro) => void
  onClearAll: () => void
  onExport: () => void
}

export function HistoryToolbar({ filtro, onFiltroChange, onClearAll, onExport }: HistoryToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap border border-[color:var(--border)] rounded-full p-[2px]">
        {FILTROS.map(f => (
          <button
            key={f.value}
            type="button" onClick={() => onFiltroChange(f.value)} aria-pressed={filtro === f.value}
            className={`border-0 rounded-full py-[6px] px-4 font-medium text-[12px] leading-[1.33] whitespace-nowrap cursor-pointer transition-colors ${
              filtro === f.value ? "bg-[color:var(--accent)] text-[color:var(--on-accent)]" : "text-[color:var(--text-primary)] hover:bg-[color:var(--bg-secondary)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <button onClick={onClearAll} className="flex items-center gap-[6px] whitespace-nowrap bg-transparent border-none cursor-pointer">
        <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">
          delete_sweep
        </span>
        <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)] hover:underline">
          Limpar histórico
        </span>
      </button>
      <button type="button" onClick={onExport} className="flex items-center gap-[6px] whitespace-nowrap bg-transparent border-none cursor-pointer text-[color:var(--accent)]"><span aria-hidden="true" className="material-symbols-outlined text-[16px]">download</span><span className="font-medium text-[12px]">Exportar dados</span></button>
    </div>
  );
}
