interface HistoryCompareBarProps {
  selectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Barra de seleção do modo "Comparar testes" (#75): aparece logo abaixo do
 * toolbar enquanto o modo de seleção está ativo (a lista existente vira o
 * "picker", sem tela nova). Contagem da seleção e o botão de confirmar só
 * habilita com exatamente 2 marcados — nunca com 0 ou 1.
 */
export function HistoryCompareBar({ selectedCount, onConfirm, onCancel }: HistoryCompareBarProps) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3.5"
      style={{ background: "var(--bg-secondary)" }}
    >
      <span className="font-medium text-[13px] text-[color:var(--text-primary)]">
        {selectedCount === 0 && "Selecione 2 testes para comparar."}
        {selectedCount === 1 && "1 selecionado — escolha mais 1."}
        {selectedCount === 2 && "2 selecionados."}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-full border border-[color:var(--border)] bg-transparent px-3 font-medium text-[12px] text-[color:var(--text-primary)] cursor-pointer"
        >
          Cancelar seleção
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={selectedCount !== 2}
          className="h-9 rounded-full border-none px-3 font-medium text-[12px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--on-accent)" }}
        >
          Comparar ({selectedCount} selecionado{selectedCount === 1 ? "" : "s"})
        </button>
      </div>
    </div>
  );
}
