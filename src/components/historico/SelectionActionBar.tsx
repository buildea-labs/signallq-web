interface SelectionActionBarProps {
  selectedCount: number;
  onConfirmDelete: () => void;
  onCancel: () => void;
  /** Falha parcial de um lote (regra de acessibilidade/segurança da issue
   * #76): distinta de sucesso total. Quando presente, sobrepõe a mensagem
   * de contagem normal. */
  failure?: { attempted: number; succeeded: number; failedIds: string[] } | null;
}

/**
 * Barra de ação do modo "Selecionar registros" (#76, item 3): mesmo
 * esqueleto visual de `HistoryCompareBar` (#75), mas com regras de contagem
 * diferentes — habilita a partir de 1 selecionado (não exatamente 2) e usa a
 * cor de destrutivo (`--error`), não a de acento.
 *
 * `role="status"` segue a mesma regra do `HistoryCompareBar`: só é seguro
 * porque este componente é renderizado fora da região `aria-live="polite"`
 * de `HistoricoClient.tsx` (#72) — uma live region aninhada dentro de outra
 * é o antipadrão que aquela correção evitou.
 */
export function SelectionActionBar({ selectedCount, onConfirmDelete, onCancel, failure }: SelectionActionBarProps) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3.5"
      style={{ background: "var(--bg-secondary)" }}
    >
      <span className="font-medium text-[13px] text-[color:var(--text-primary)]">
        {failure
          ? `${failure.succeeded} de ${failure.attempted} testes excluídos. ${failure.failedIds.length} não puderam ser removidos — tente novamente.`
          : selectedCount === 0
            ? "Selecione os testes que deseja excluir."
            : `${selectedCount} selecionado${selectedCount === 1 ? "" : "s"}.`}
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
          onClick={onConfirmDelete}
          disabled={selectedCount === 0}
          className="h-9 rounded-full border-none px-3 font-medium text-[12px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--error)", color: "var(--on-accent)" }}
        >
          Excluir selecionados ({selectedCount})
        </button>
      </div>
    </div>
  );
}
