import { HistoryRecordCard } from "@/components/historico/HistoryRecordCard";
import type { HistoryPeriodGroup } from "@/lib/historySelectors";

interface HistoryListItemProps {
  group: HistoryPeriodGroup
}

// Um item da lista de histórico é um período (Hoje/Ontem/Esta semana/
// Anteriores) — cabeçalho com o rótulo e a contagem, seguido pelos itens
// daquele grupo em ordem cronológica decrescente (#73). Conexão deixou de
// ser o agrupador visual: `groupRecordsByConnection` continua existindo,
// mas só para o autocomplete de nomes e a exclusão em massa no
// `HistoryEditDialog`, não para renderizar esta lista.
export function HistoryListItem({ group }: HistoryListItemProps) {
  return (
    <section aria-label={`Período ${group.label}`}>
      <h2 className="m-0 mb-2 font-semibold text-[14px] text-[color:var(--text-primary)]">
        {group.label} <span className="font-normal text-[12px] text-[color:var(--text-tertiary)]">({group.records.length})</span>
      </h2>
      <div className="flex flex-col gap-2">
        {group.records.map((r) => <HistoryRecordCard key={r.id} record={r} />)}
      </div>
    </section>
  );
}
