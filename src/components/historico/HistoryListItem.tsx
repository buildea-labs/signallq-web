import { HistoryLinkedPair } from "@/components/historico/HistoryCompare";
import { HistoryRecordCard } from "@/components/historico/HistoryRecordCard";
import type { ComparacaoRegistro } from "@/lib/comparisonRepository";
import type { HistoryPeriodGroup } from "@/lib/historySelectors";
import type { MedicaoRegistro } from "@/lib/measurementRepository";

interface HistoryListItemProps {
  group: HistoryPeriodGroup;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  linkedPairByAfterId?: Map<string, ComparacaoRegistro>;
  byId?: Map<string, MedicaoRegistro>;
}

// Um item da lista de histórico é um período (Hoje/Ontem/Esta semana/
// Anteriores) — cabeçalho com o rótulo e a contagem, seguido pelos itens
// daquele grupo em ordem cronológica decrescente (#73). Conexão deixou de
// ser o agrupador visual: `groupRecordsByConnection` continua existindo,
// mas só para o autocomplete de nomes e a exclusão em massa no
// `HistoryEditDialog`, não para renderizar esta lista.
export function HistoryListItem({ group, selectable, selectedIds, onToggleSelect, linkedPairByAfterId, byId }: HistoryListItemProps) {
  return (
    <section aria-label={`Período ${group.label}`}>
      <h2 className="m-0 mb-2 font-semibold text-[14px] text-[color:var(--text-primary)]">
        {group.label} <span className="font-normal text-[12px] text-[color:var(--text-tertiary)]">({group.records.length})</span>
      </h2>
      <div className="flex flex-col gap-2">
        {group.records.map((r) => {
          const linked = linkedPairByAfterId?.get(r.id);
          const before = linked ? byId?.get(linked.beforeId) : undefined;
          return (
            <div key={r.id} className="flex flex-col gap-1.5">
              <HistoryRecordCard
                record={r}
                selectable={selectable}
                selected={selectedIds?.includes(r.id)}
                onToggleSelect={onToggleSelect}
              />
              {linked && before && <HistoryLinkedPair comparison={linked} before={before} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
