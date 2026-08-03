import { useEffect, useRef, useState } from "react";
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
  onSelectRecords: () => void
  compareMode: boolean
  onToggleCompareMode: () => void
}

/**
 * Toolbar do Histórico (#76, item 2). Os chips de filtro continuam sempre
 * visíveis (navegação primária de leitura, não ação secundária). "Comparar
 * testes" (#75) também fica fora do menu — fora de escopo desta issue,
 * mantido como botão de texto inline. As três ações secundárias novas
 * ("Selecionar registros", "Exportar dados", "Apagar tudo") vivem atrás de
 * um menu overflow (`more_vert`) que se abre — a jornada de duas etapas que
 * a issue pede, em vez de uma fileira de botões sempre visível poluindo a
 * lista principal.
 */
export function HistoryToolbar({ filtro, onFiltroChange, onClearAll, onExport, onSelectRecords, compareMode, onToggleCompareMode }: HistoryToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const runAndClose = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

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

      <div className="flex items-center gap-1">
        {/*
          Peso visual secundário, igual às ações do menu (#75): comparação
          fica fora da primeira leitura da lista, nunca um CTA primário.
          Decisão de produto explícita (#76): não agrupar dentro do menu
          overflow, para não expandir o escopo desta entrega.
        */}
        <button
          type="button"
          onClick={onToggleCompareMode}
          aria-pressed={compareMode}
          className="flex items-center gap-[6px] whitespace-nowrap bg-transparent border-none cursor-pointer text-[color:var(--accent)]"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">compare_arrows</span>
          <span className="font-medium text-[12px]">{compareMode ? "Cancelar seleção" : "Comparar testes"}</span>
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Mais opções"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-transparent cursor-pointer hover:bg-[color:var(--bg-secondary)] transition-colors"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[color:var(--text-primary)]">more_vert</span>
          </button>
          {menuOpen && (
            <div
              role="menu"
              aria-label="Mais opções"
              className="absolute right-0 z-10 mt-1 min-w-[210px] rounded-2xl p-1.5"
              style={{ background: "var(--bg-card)", boxShadow: "0 8px 20px rgba(0,0,0,.2)" }}
            >
              <button
                role="menuitem"
                type="button"
                onClick={() => runAndClose(onSelectRecords)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left bg-transparent border-none cursor-pointer hover:bg-[color:var(--bg-secondary)]"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--text-primary)]">checklist</span>
                <span className="font-medium text-[12px] text-[color:var(--text-primary)]">Selecionar registros</span>
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={() => runAndClose(onExport)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left bg-transparent border-none cursor-pointer hover:bg-[color:var(--bg-secondary)]"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--text-primary)]">download</span>
                <span className="font-medium text-[12px] text-[color:var(--text-primary)]">Exportar dados</span>
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={() => runAndClose(onClearAll)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left bg-transparent border-none cursor-pointer hover:bg-[color:var(--bg-secondary)]"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--error)]">delete_sweep</span>
                <span className="font-medium text-[12px] text-[color:var(--error)]">Apagar tudo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
