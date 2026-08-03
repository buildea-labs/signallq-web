import { HistoryListItem } from "@/components/historico/HistoryListItem";
import type { ComparacaoRegistro } from "@/lib/comparisonRepository";
import type { HistoryPeriodGroup } from "@/lib/historySelectors";
import type { MedicaoRegistro } from "@/lib/measurementRepository";

interface HistoryListProps {
  groups: HistoryPeriodGroup[];
  filteredCount: number;
  totalCount: number;
  /** Modo de seleção do #75 (a lista existente vira o picker de comparação). */
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  linkedPairByAfterId?: Map<string, ComparacaoRegistro>;
  byId?: Map<string, MedicaoRegistro>;
}

export function HistoryList({
  groups,
  filteredCount,
  totalCount,
  selectable,
  selectedIds,
  onToggleSelect,
  linkedPairByAfterId,
  byId,
}: HistoryListProps) {
  return (
    <>
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <HistoryListItem
            key={group.id}
            group={group}
            selectable={selectable}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            linkedPairByAfterId={linkedPairByAfterId}
            byId={byId}
          />
        ))}
        {filteredCount === 0 && (
          <div className="col-span-full py-6 text-center font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
            Nenhuma medição neste filtro.
          </div>
        )}
      </div>

      <div className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
        {totalCount} {totalCount === 1 ? "medição salva" : "medições salvas"}
      </div>
    </>
  );
}
