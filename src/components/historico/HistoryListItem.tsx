import { HistoryRecordCard } from "@/components/historico/HistoryRecordCard";
import type { HistoryConnectionGroup, MedicaoRegistro } from "@/lib/historyStore";

interface HistoryListItemProps {
  group: HistoryConnectionGroup
  onShare: (record: MedicaoRegistro) => void
  onRemove: (id: string) => void
  onEdit: (record: MedicaoRegistro) => void
}

// Um item da lista de histórico é uma conexão/local: cabeçalho com o nome e a
// contagem, resumo do padrão local e os cards das medições daquele grupo.
export function HistoryListItem({ group, onShare, onRemove, onEdit }: HistoryListItemProps) {
  const average = group.records.reduce((sum, record) => sum + record.download, 0) / group.records.length
  const latest = group.records[0]

  return (
    <section aria-label={`Conexão ${group.name}`}><h2 className="m-0 mb-1 font-semibold text-[14px] text-[color:var(--text-primary)]">{group.name} <span className="font-normal text-[12px] text-[color:var(--text-tertiary)]">({group.records.length})</span></h2><p className="m-0 mb-2 text-[12px] text-[color:var(--text-secondary)]">Padrão local: {average.toFixed(1)} Mbps de download · última medição {latest.download >= average ? 'acima' : 'abaixo'} desse padrão.</p><div className="grid grid-cols-1 gap-[10px] md:grid-cols-2">{group.records.map((r) => <HistoryRecordCard key={r.id} record={r} onShare={onShare} onRemove={onRemove} onEdit={onEdit} />)}</div></section>
  );
}
