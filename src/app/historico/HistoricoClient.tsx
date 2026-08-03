"use client";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { HistoryCompareBar } from "@/components/historico/HistoryCompareBar";
import { HistoryEditDialog } from "@/components/historico/HistoryEditDialog";
import { HistoryEmptyState, HistoryLoadingState, HistoryUnavailableState } from "@/components/historico/HistoryEmptyState";
import { HistoryEvolutionChart } from "@/components/historico/HistoryEvolutionChart";
import { HistoryList } from "@/components/historico/HistoryList";
import { HistoryDiagnosticTip, HistoryToolbar } from "@/components/historico/HistoryToolbar";
;
import { useHistoryController } from "@/hooks/useHistoryController";

export function HistoricoClient() {
  const history = useHistoryController()

  return (
    <PageShell>
      <div className="flex flex-wrap items-baseline justify-between gap-3 w-full">
        <h1 className="m-0 font-bold text-[26px] leading-[1.23] text-[color:var(--text-primary)]">Histórico</h1>
        <span className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
          Salvo só neste navegador
        </span>
      </div>

      {/*
        Região única de status para o estado carregando/indisponível/vazio/carregado
        (#72, Gap A): sem isto, um leitor de tela parado no H1 nunca é avisado quando
        o carregamento termina — precisaria varrer a tela manualmente. `aria-live`
        fica só aqui (não duplicado dentro de cada subcomponente) para não gerar
        anúncio duplicado quando o estado troca.
      */}
      <div aria-live="polite" className="flex w-full flex-1 flex-col">
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
              compareMode={history.compareMode}
              onToggleCompareMode={history.toggleCompareMode}
            />

            {history.compareMode && (
              <HistoryCompareBar
                selectedCount={history.selectedForCompare.length}
                onConfirm={history.confirmCompare}
                onCancel={history.toggleCompareMode}
              />
            )}

            <HistoryList
              groups={history.groups}
              filteredCount={history.filtered.length}
              totalCount={history.records.length}
              selectable={history.compareMode}
              selectedIds={history.selectedForCompare}
              onToggleSelect={history.toggleSelectForCompare}
              linkedPairByAfterId={history.linkedPairByAfterId}
              byId={history.byId}
            />

            {/*
              A lista deve favorecer varredura visual e não competir com um
              gráfico obrigatório na abertura (achado transversal da spec de
              UX, seção 0, que afeta #73 além de #75). O gráfico continua
              consumindo os mesmos `records` — nenhuma lógica de
              `historyChartMath.ts` muda, só a posição/visibilidade: recolhido
              por padrão, depois da lista, mesmo padrão de disclosure do #70.
            */}
            <details className="rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
              <summary className="cursor-pointer select-none p-3.5 font-medium text-[13px] text-[color:var(--text-primary)]">
                Ver evolução
              </summary>
              <div className="p-3.5 pt-0">
                <HistoryEvolutionChart records={history.records} />
              </div>
            </details>
          </div>
        )}
      </div>

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
