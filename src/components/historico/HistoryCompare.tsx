import Link from "next/link";
import type { ComparacaoRegistro } from "@/lib/comparisonRepository";
import type { MedicaoRegistro } from "@/lib/measurementRepository";

interface HistoryLinkedPairProps {
  comparison: ComparacaoRegistro;
  before: MedicaoRegistro;
}

/**
 * Indicador inline de um par antes/depois já vinculado (#10), renderizado
 * logo após o item mais recente do par na lista (#75, achado transversal
 * seção 0 da spec de UX: deixou de ser a seção fixa "Retestes vinculados" no
 * topo, que competia com a lista). "Ação" exibida é `before.diagnostic?.nextAction`
 * — a recomendação que motivou o reteste, não uma confirmação de que o
 * usuário a executou (risco documentado na spec, seção 4/5.3). Quando não há
 * diagnóstico salvo no registro "antes", a linha de ação simplesmente não
 * aparece — nenhum texto é inventado.
 */
export function HistoryLinkedPair({ comparison, before }: HistoryLinkedPairProps) {
  const action = before.diagnostic?.nextAction;
  return (
    <div
      className="ml-4 flex flex-col gap-1 rounded-xl border-l-2 border-[color:var(--border)] py-2 pl-3 text-[12px] leading-[1.4]"
      style={{ color: "var(--text-secondary)" }}
    >
      <span>Vinculado a um teste anterior · modo {comparison.mode}</span>
      {action && <span>Ação recomendada: {action}</span>}
      <Link
        href={`/historico/comparar?a=${comparison.beforeId}&b=${comparison.afterId}`}
        className="w-fit font-medium text-[color:var(--accent)] underline underline-offset-2"
      >
        Ver comparação
      </Link>
    </div>
  );
}
