import type { RetestComparison as RetestComparisonData } from "@/lib/retestComparison";

interface Props {
  comparacao: RetestComparisonData;
  comparacaoNaoSalva: boolean;
}

/** Antes e depois de uma repetição do teste, sem afirmar causa da mudança. */
export function RetestComparison({ comparacao, comparacaoNaoSalva }: Props) {
  return (
    <section aria-labelledby="comparacao-reteste" className="py-7 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
      <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--accent)] tracking-[.3px] uppercase">Antes e depois</div>
      <h2 id="comparacao-reteste" className="mt-[6px] mb-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">Comparação desta repetição</h2>
      {comparacao.compatible && comparacao.changes ? (
        <>
          <p className="mt-2 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">Os valores abaixo comparam as duas medições. Eles não comprovam, por si só, a causa de uma mudança.</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {comparacao.changes.map((item) => {
              const difference = item.after - item.before;
              const signal = difference === 0 ? "sem mudança" : `${difference > 0 ? "+" : ""}${difference.toFixed(1)} ${item.unit}`;
              const direction = item.direction === "better" ? "Melhor nesta medição" : item.direction === "worse" ? "Pior nesta medição" : "Sem mudança";
              return <div key={item.label} className="rounded-xl border border-[color:var(--border)] p-3">
                <div className="text-[12px] text-[color:var(--text-tertiary)]">{item.label}</div>
                <div className="mt-1 font-semibold text-[color:var(--text-primary)]">{item.after.toFixed(1)} {item.unit}</div>
                <div className="mt-1 text-[12px] text-[color:var(--text-secondary)]">Antes: {item.before.toFixed(1)} · {signal}</div>
                <div className="mt-1 text-[12px] text-[color:var(--text-secondary)]">{direction}</div>
              </div>;
            })}
          </div>
        </>
      ) : <p className="mt-2 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{comparacao.reason}</p>}
      {comparacaoNaoSalva && <p role="status" className="mt-3 mb-0 text-[12px] leading-[1.4] text-[color:var(--warning)]">A comparação aparece nesta tela, mas não foi possível salvá-la no histórico local.</p>}
    </section>
  );
}
