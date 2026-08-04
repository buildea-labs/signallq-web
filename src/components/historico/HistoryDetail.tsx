"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { Velocimetro } from "@/components/Velocimetro";
import { MODE_LABEL } from "@/components/home/homeCopy";
import { ResultTechnicalDetails } from "@/components/home/ResultTechnicalDetails";
import { fractionForThroughput } from "@/lib/gaugeMath";
import { groupRecordsByConnection } from "@/lib/historySelectors";
import { resolveConnectionMetadata } from "@/lib/historyMetadata";
import { adaptRecordForResultView } from "@/lib/historyResultView";
import {
  deleteConnection,
  deleteRecord,
  getRecordById,
  listRecords,
  updateRecordMetadata,
  type HistoryUserMetadata,
  type MedicaoRegistro,
} from "@/lib/measurementRepository";
import { formatarDataHora } from "@/lib/measurementFormat";
import { shareMeasurement } from "@/lib/sharing";
import { WEB_DIAGNOSTIC_RESPONSE_VERSION } from "@/lib/webDiagnosticResponse";
import { HistoryEditDialog } from "./HistoryEditDialog";

type Status = "loading" | "found" | "not-found";

/**
 * Detalhe de um teste salvo do Histórico (#74). Reaproveita `Velocimetro` no
 * estado estático que a jornada ao vivo já atinge em repouso e os mesmos
 * `ResultTechnicalDetails`/`UseCaseSummary`-like blocks da Feature #59 via
 * `adaptRecordForResultView` — nenhum componente novo de apresentação de
 * resultado é criado aqui, só o mapeamento de dados (spec de UX, seção 3).
 */
export function HistoryDetail({ id }: { id: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [record, setRecord] = useState<MedicaoRegistro | null>(null);
  const [allRecords, setAllRecords] = useState<MedicaoRegistro[]>([]);
  const [editing, setEditing] = useState(false);
  const [metadata, setMetadata] = useState<HistoryUserMetadata>({});
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    Promise.all([getRecordById(id), listRecords()]).then(([found, all]) => {
      if (cancelled) return;
      setAllRecords(all);
      if (found) {
        setRecord(found);
        setStatus("found");
      } else {
        setStatus("not-found");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!editing) return;
    dialogRef.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditing(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [editing]);

  const goBack = () => router.back();

  const startEdit = () => {
    if (!record) return;
    setMetadata(record.userMetadata || { connectionName: "", reportedProblem: "" });
    setSelectedConnectionId(record.userMetadata?.connectionId || "");
    setEditing(true);
  };

  const saveMetadata = async () => {
    if (!record) return;
    const resolved = resolveConnectionMetadata(allRecords, record.id, metadata, selectedConnectionId);
    const updated = await updateRecordMetadata(record.id, resolved);
    if (updated) setRecord(updated);
    setEditing(false);
  };

  const removeConnection = async () => {
    const connectionId = record?.userMetadata?.connectionId;
    if (!connectionId || !window.confirm("Excluir todas as medições deste local? Esta ação não pode ser desfeita.")) return;
    await deleteConnection(connectionId);
    setEditing(false);
    router.back();
  };

  const share = async () => {
    if (!record) return;
    await shareMeasurement({
      timestamp: record.timestamp,
      downloadMbps: record.download,
      uploadMbps: record.upload,
      latencyMs: record.latency,
      conclusion: record.diagnostic?.conclusion,
      nextAction: record.diagnostic?.nextAction,
    });
  };

  const remove = async () => {
    if (!record) return;
    await deleteRecord(record.id);
    setConfirmOpen(false);
    router.back();
  };

  if (status === "loading") {
    return (
      <PageShell align="center">
        <div role="status" aria-live="polite" className="flex w-full flex-1 items-center justify-center py-16">
          <span className="font-normal text-[16px] text-[color:var(--text-secondary)]">Carregando teste…</span>
        </div>
      </PageShell>
    );
  }

  if (status === "not-found") {
    return (
      <PageShell align="center">
        <div role="status" className="flex w-full flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <span aria-hidden="true" className="material-symbols-outlined text-[32px] text-[color:var(--text-tertiary)]">
            search_off
          </span>
          <p className="max-w-[320px] font-normal text-[14px] leading-[1.4] text-[color:var(--text-secondary)]">
            Este teste não foi encontrado. Ele pode ter sido excluído.
          </p>
          <Link
            href="/historico"
            className="font-medium text-[13px] leading-[1.33] text-[color:var(--accent)] underline underline-offset-2"
          >
            Voltar ao Histórico
          </Link>
        </div>
      </PageShell>
    );
  }

  const current = record as MedicaoRegistro;
  const modeLabel = current.mode ? MODE_LABEL[current.mode] : undefined;
  const resultView = adaptRecordForResultView(current);
  const reportedProblem = current.userMetadata?.reportedProblem?.trim();
  const nextAction = current.diagnostic?.nextAction;
  const showActionSection = Boolean(reportedProblem) || Boolean(nextAction);
  // Aviso de "versão anterior do contrato" (#74): qualquer um destes sinais
  // indica que o registro foi salvo antes de um schema mais completo existir
  // — nunca inferido de uma métrica opcional ausente isoladamente (jitter
  // null, por exemplo, já é um estado válido tratado linha a linha).
  const isLegacy =
    current.mode === undefined ||
    current.diagnostic === undefined ||
    current.diagnostic.contractVersion !== WEB_DIAGNOSTIC_RESPONSE_VERSION;

  return (
    <PageShell>
      <div className="flex w-full items-center gap-2">
        <button
          onClick={goBack}
          aria-label="Voltar"
          className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-transparent cursor-pointer hover:bg-[color:var(--bg-secondary)] transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[color:var(--text-primary)]">
            arrow_back
          </span>
        </button>
        <h1 className="m-0 font-bold text-[20px] leading-[1.25] text-[color:var(--text-primary)]">Teste salvo</h1>
      </div>

      <div className="w-full flex justify-center px-4 sm:px-8 mt-2">
        <Velocimetro
          fraction={fractionForThroughput(current.download)}
          phaseColor="var(--success)"
          isRunning={false}
          phase="download"
          liveValue={current.download}
          value={current.download.toFixed(1)}
          unit="Mbps"
          metricLabel="Download"
          compact
        />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-normal text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">
          {formatarDataHora(current.timestamp)}
          {modeLabel ? ` · ${modeLabel}` : ""}
        </span>
      </div>

      <section className="mt-2 w-full max-w-[640px] mx-auto py-6 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
        {current.diagnostic ? (
          <>
            <h2 className="m-0 font-bold text-[20px] sm:text-[22px] leading-[1.25] text-[color:var(--text-primary)] tracking-tight">
              {current.diagnostic.conclusion}
            </h2>
            <p className="mt-2 mb-0 font-normal text-[14px] leading-[1.45] text-[color:var(--text-secondary)]">
              {current.diagnostic.confidence}
            </p>
          </>
        ) : (
          <p className="m-0 font-normal text-[14px] leading-[1.45] text-[color:var(--text-secondary)]">
            Este teste não tem uma leitura de diagnóstico salva.
          </p>
        )}
      </section>

      {showActionSection && (
        <section className="w-full max-w-[640px] mx-auto py-6 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)] flex flex-col gap-4">
          {reportedProblem && (
            <div>
              <h3 className="m-0 font-medium text-[11px] uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">
                Problema informado
              </h3>
              <p className="mt-1 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{reportedProblem}</p>
            </div>
          )}
          {nextAction && (
            <div>
              <h3 className="m-0 font-medium text-[11px] uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">
                Próxima ação
              </h3>
              <p className="mt-1 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{nextAction}</p>
            </div>
          )}
        </section>
      )}

      {isLegacy && (
        <div className="w-full max-w-[640px] mx-auto py-3 flex items-start gap-2">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--text-tertiary)]">
            info
          </span>
          <p className="m-0 font-normal text-[12px] leading-[1.4] text-[color:var(--text-tertiary)]">
            Registro salvo em uma versão anterior do histórico — alguns dados podem estar ausentes.
          </p>
        </div>
      )}

      <div className="w-full max-w-[640px] mx-auto">
        <ResultTechnicalDetails result={resultView} />
      </div>

      {/*
        Ações secundárias (#74/#75): editar/compartilhar/excluir saíram do
        card da lista (#73) e vivem só aqui agora. "Comparar com outro teste"
        (#75) pré-seleciona este registro e abre a lista em modo de seleção
        (`/historico?compare=<id>`), pedindo o segundo — reaproveita a lista
        existente como picker, sem tela nova.
      */}
      <div className="w-full max-w-[640px] mx-auto mt-2 flex flex-wrap justify-center gap-[10px] pb-8">
        <button
          onClick={startEdit}
          className="flex items-center gap-[6px] h-[36px] px-2 border-none bg-transparent cursor-pointer hover:bg-[color:var(--bg-secondary)] rounded-full transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">
            edit
          </span>
          <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)]">Editar contexto</span>
        </button>
        <Link
          href={`/historico?compare=${current.id}`}
          className="flex items-center gap-[6px] h-[36px] px-2 rounded-full transition-colors hover:bg-[color:var(--bg-secondary)] no-underline"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">
            compare_arrows
          </span>
          <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)]">Comparar com outro teste</span>
        </Link>
        <button
          onClick={share}
          className="flex items-center gap-[6px] h-[36px] px-2 border-none bg-transparent cursor-pointer hover:bg-[color:var(--bg-secondary)] rounded-full transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">
            share
          </span>
          <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)]">Compartilhar</span>
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          className="flex items-center gap-[6px] h-[36px] px-2 border-none bg-transparent cursor-pointer hover:bg-[color:var(--bg-secondary)] rounded-full transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--error)]">
            delete
          </span>
          <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--error)]">Excluir</span>
        </button>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          icon="delete"
          title="Excluir este teste?"
          description="Remove esta medição salva neste navegador. Não é possível desfazer."
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          danger
          onConfirm={remove}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {editing && (
        <HistoryEditDialog
          record={current}
          metadata={metadata}
          onMetadataChange={setMetadata}
          selectedConnectionId={selectedConnectionId}
          onSelectedConnectionIdChange={setSelectedConnectionId}
          knownConnections={groupRecordsByConnection(allRecords).filter((group) => !group.id.startsWith("legacy:"))}
          dialogRef={dialogRef}
          onSave={saveMetadata}
          onCancel={() => setEditing(false)}
          onRemoveConnection={removeConnection}
        />
      )}
    </PageShell>
  );
}
