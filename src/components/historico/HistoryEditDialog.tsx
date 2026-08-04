import type { Dispatch, RefObject, SetStateAction } from "react";
import type { HistoryConnectionGroup } from "@/lib/historySelectors";
import type { HistoryUserMetadata, MedicaoRegistro } from "@/lib/measurementRepository";

interface HistoryEditDialogProps {
  record: MedicaoRegistro
  metadata: HistoryUserMetadata
  onMetadataChange: Dispatch<SetStateAction<HistoryUserMetadata>>
  selectedConnectionId: string
  onSelectedConnectionIdChange: (id: string) => void
  knownConnections: HistoryConnectionGroup[]
  dialogRef: RefObject<HTMLDivElement | null>
  onSave: () => void
  onCancel: () => void
  onRemoveConnection: () => void
}

export function HistoryEditDialog({
  record,
  metadata,
  onMetadataChange,
  selectedConnectionId,
  onSelectedConnectionIdChange,
  knownConnections,
  dialogRef,
  onSave,
  onCancel,
  onRemoveConnection,
}: HistoryEditDialogProps) {
  return (
    <section ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} aria-labelledby="editar-contexto" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={(event) => { event.preventDefault(); void onSave() }} className="w-full max-w-md rounded-2xl bg-[color:var(--bg-primary)] p-5 shadow-xl">
        <h2 id="editar-contexto" className="m-0 text-[18px] text-[color:var(--text-primary)]">Contexto da conexão</h2><p className="mt-2 text-[13px] text-[color:var(--text-secondary)]">Edite somente informações informadas por você. As métricas medidas não são alteradas.</p>
        {knownConnections.length > 0 && <label className="mt-4 flex flex-col gap-1 text-[13px]">Usar conexão/local existente<select value={selectedConnectionId} onChange={(event) => { const id = event.target.value; onSelectedConnectionIdChange(id); const group = knownConnections.find((item) => item.id === id); if (group) onMetadataChange((current) => ({ ...current, connectionId: id, connectionName: group.name })) }} className="rounded border p-2 text-[color:var(--text-primary)]"><option value="">Criar ou identificar pelo nome</option>{knownConnections.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>}
        <label className="mt-4 flex flex-col gap-1 text-[13px]">Nome da conexão ou local<input value={metadata.connectionName || ''} maxLength={120} onChange={(event) => onMetadataChange((current) => ({ ...current, connectionName: event.target.value }))} className="rounded border p-2 text-[color:var(--text-primary)]" /></label>
        <label className="mt-3 flex flex-col gap-1 text-[13px]">Velocidade contratada (Mbps)<input type="number" min="1" value={metadata.contractedSpeedMbps || ''} onChange={(event) => onMetadataChange((current) => ({ ...current, contractedSpeedMbps: event.target.value ? Number(event.target.value) : undefined }))} className="rounded border p-2 text-[color:var(--text-primary)]" /></label>
        <label className="mt-3 flex flex-col gap-1 text-[13px]">Problema relatado<input value={metadata.reportedProblem || ''} maxLength={120} onChange={(event) => onMetadataChange((current) => ({ ...current, reportedProblem: event.target.value }))} className="rounded border p-2 text-[color:var(--text-primary)]" /></label>
        <div className="mt-5 flex justify-between gap-2"><button type="button" onClick={onCancel} className="rounded border px-3 py-2">Cancelar</button><button type="submit" className="rounded bg-[color:var(--accent)] px-3 py-2 text-[color:var(--on-accent)]">Salvar</button></div>
        {record.userMetadata?.connectionId && <button type="button" onClick={onRemoveConnection} className="mt-4 text-[13px] text-[color:var(--error)] underline">Excluir esta conexão</button>}
      </form>
    </section>
  );
}
