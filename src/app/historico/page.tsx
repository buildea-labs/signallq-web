"use client";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { HistoryCompare } from "@/components/historico/HistoryCompare";
import { HistoryEditDialog } from "@/components/historico/HistoryEditDialog";
import { HistoryEmptyState, HistoryLoadingState, HistoryUnavailableState } from "@/components/historico/HistoryEmptyState";
import { HistoryEvolutionChart } from "@/components/historico/HistoryEvolutionChart";
import { HistoryList } from "@/components/historico/HistoryList";
import { HistoryDiagnosticTip, HistoryToolbar } from "@/components/historico/HistoryToolbar";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useHistoryController } from "@/hooks/useHistoryController";
import { PAGE_META } from "@/lib/pageMetaCatalog";

export default function Page() {
  useDocumentMeta(PAGE_META['/historico'])
  const history = useHistoryController()

  return (
    <PageShell>
      <div className="flex flex-wrap items-baseline justify-between gap-3 w-full">
        <h1 className="m-0 font-bold text-[26px] leading-[1.23] text-[color:var(--text-primary)]">Histórico</h1>
        <span className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
          Salvo só neste navegador
        </span>
      </div>

      {history.status === 'loading' && <HistoryLoadingState />}

      {history.status === 'unavailable' && <HistoryUnavailableState onRetry={history.load} />}

      {history.isEmpty && <HistoryEmptyState onStartTest={history.startTest} />}

      {history.hasRecords && (
        <div className="flex flex-col gap-[14px] w-full">
          <HistoryDiagnosticTip />

          <HistoryToolbar
            filtro={history.filtro}
            onFiltroChange={history.setFiltro}
            onClearAll={() => history.setConfirmOpen(true)}
            onExport={history.exportHistory}
          />

          <HistoryEvolutionChart records={history.records} />

          <HistoryCompare comparisons={history.recoverableComparisons} byId={history.byId} />

          <HistoryList
            groups={history.groups}
            filteredCount={history.filtered.length}
            totalCount={history.records.length}
            onShare={history.shareRecord}
            onRemove={history.remove}
            onEdit={history.startEdit}
          />
        </div>
      )}

      {history.justDeleted && <div className="font-medium text-[14px] leading-[1.43] text-center mt-2">Medição excluída.</div>}

      {history.confirmOpen && (
        <ConfirmDialog
          icon="delete_sweep"
          title="Limpar todo o histórico?"
          description="Remove todas as medições salvas neste navegador. Não é possível desfazer."
          confirmLabel="Limpar tudo"
          cancelLabel="Cancelar"
          danger
          onConfirm={history.handleClearAll}
          onCancel={() => history.setConfirmOpen(false)}
        />
      )}
      {history.editing && (
        <HistoryEditDialog
          record={history.editing}
          metadata={history.metadata}
          onMetadataChange={history.setMetadata}
          selectedConnectionId={history.selectedConnectionId}
          onSelectedConnectionIdChange={history.setSelectedConnectionId}
          knownConnections={history.knownConnections}
          dialogRef={history.dialogRef}
          onSave={history.saveMetadata}
          onCancel={() => history.setEditing(null)}
          onRemoveConnection={history.removeConnection}
        />
      )}
    </PageShell>
  )
}
