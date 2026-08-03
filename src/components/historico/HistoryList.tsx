import { HistoryListItem } from "@/components/historico/HistoryListItem";
import type { HistoryPeriodGroup } from "@/lib/historySelectors";

interface HistoryListProps {
  groups: HistoryPeriodGroup[]
  filteredCount: number
  totalCount: number
}

export function HistoryList({ groups, filteredCount, totalCount }: HistoryListProps) {
  return (
    <>
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <HistoryListItem key={group.id} group={group} />
        ))}
        {filteredCount === 0 && (
          <div className="col-span-full py-6 text-center font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
            Nenhuma medição neste filtro.
          </div>
        )}
      </div>

      <div className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
        {totalCount} {totalCount === 1 ? 'medição salva' : 'medições salvas'}
      </div>
    </>
  );
}
