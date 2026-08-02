import type { ComparacaoRegistro, MedicaoRegistro } from "@/lib/historyStore";

interface HistoryCompareProps {
  comparisons: ComparacaoRegistro[]
  byId: Map<string, MedicaoRegistro>
}

// Só recebe comparações já filtradas como recuperáveis (as duas medições ainda
// existem no histórico), por isso o acesso ao mapa pode ser não-nulo.
export function HistoryCompare({ comparisons, byId }: HistoryCompareProps) {
  if (comparisons.length === 0) return null

  return (
    <section aria-labelledby="historico-comparacoes" className="rounded-2xl border border-[color:var(--border)] p-4">
      <h2 id="historico-comparacoes" className="m-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">Retestes vinculados</h2>
      <div className="mt-3 flex flex-col gap-2">
        {comparisons.map((comparison) => {
          const before = byId.get(comparison.beforeId)!
          const after = byId.get(comparison.afterId)!
          return <div key={comparison.id} className="text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{new Date(before.timestamp).toLocaleString('pt-BR')} → {new Date(after.timestamp).toLocaleString('pt-BR')} · modo {comparison.mode}</div>
        })}
      </div>
    </section>
  );
}
