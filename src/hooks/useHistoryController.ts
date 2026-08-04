"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { listComparisons, type ComparacaoRegistro } from "@/lib/comparisonRepository";
import { createHistoryExport } from "@/lib/historyExport";
import { resolveConnectionMetadata } from "@/lib/historyMetadata";
import { groupRecordsByConnection, groupRecordsByPeriod } from "@/lib/historySelectors";
import {
  clearAll,
  deleteConnection,
  deleteRecord,
  listRecords,
  updateRecordMetadata,
  type HistoryUserMetadata,
  type MedicaoRegistro,
} from "@/lib/measurementRepository";
import { shareMeasurement } from "@/lib/sharing";

export type HistoryStatus = "loading" | "loaded" | "unavailable";
export type HistoryFiltro = "todos" | "wifi" | "celular" | "ethernet";

export const FILTROS: Array<{ value: HistoryFiltro; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "celular", label: "Rede móvel" },
  { value: "ethernet", label: "Ethernet" },
];

async function shareRecord(record: MedicaoRegistro) {
  await shareMeasurement({
    timestamp: record.timestamp,
    downloadMbps: record.download,
    uploadMbps: record.upload,
    latencyMs: record.latency,
    conclusion: record.diagnostic?.conclusion,
    nextAction: record.diagnostic?.nextAction,
  });
}

export type HistoryController = ReturnType<typeof useHistoryController>;

/**
 * Estado e orquestração da página de Histórico: carregamento, filtro,
 * exportação, exclusão (registro, conexão e tudo), agrupamento por conexão,
 * comparações recuperáveis e edição de metadados. A UI só consome o que este
 * hook devolve.
 */
export function useHistoryController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<HistoryStatus>("loading");
  const [records, setRecords] = useState<MedicaoRegistro[]>([]);
  const [comparisons, setComparisons] = useState<ComparacaoRegistro[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [justDeleted, setJustDeleted] = useState(false);
  const [filtro, setFiltro] = useState<HistoryFiltro>("todos");
  const [editing, setEditing] = useState<MedicaoRegistro | null>(null);
  const [metadata, setMetadata] = useState<HistoryUserMetadata>({});
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  // Seleção manual de comparação (#75): a lista existente vira o "picker" —
  // nenhuma tela nova de escolha de registro é construída. `selectedForCompare`
  // é uma fila de no máximo 2 ids, na ordem em que foram marcados (não por
  // timestamp) — ao marcar um 3º, o primeiro marcado sai automaticamente,
  // permitindo trocar uma seleção sem reiniciar a jornada.
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [preselectApplied, setPreselectApplied] = useState(false);

  // Exclusão de conexão (#76, item 1): `window.confirm` nativo sai,
  // `ConfirmDialog` declarativo entra. Ficar aberto/fechado é estado, não
  // bloqueio de thread — por isso este flag, independente de `editing`
  // (o diálogo de edição continua aberto atrás enquanto este confirma).
  const [confirmRemoveConnectionOpen, setConfirmRemoveConnectionOpen] = useState(false);

  // Seleção múltipla para exclusão em massa (#76, item 3): mesmo esqueleto de
  // `compareMode`/`selectedForCompare` (#75), sem teto de contagem. Os dois
  // modos são mutuamente exclusivos — entrar em um cancela o outro.
  const [deleteSelectMode, setDeleteSelectMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  // Falha parcial (regra de acessibilidade/segurança da issue): distinta de
  // sucesso total, mantém os ids que falharam selecionados para nova tentativa.
  const [bulkDeleteFailure, setBulkDeleteFailure] = useState<{ attempted: number; succeeded: number; failedIds: string[] } | null>(null);

  const load = async () => {
    setStatus("loading");
    try {
      const [r, c] = await Promise.all([listRecords(), listComparisons()]);
      setRecords(r);
      setComparisons(c);
      setStatus("loaded");
    } catch {
      setStatus("unavailable");
    }
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!editing) return;
    dialogRef.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditing(null);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [editing]);

  // A partir do detalhe (#74), "Comparar com outro teste" navega para
  // `/historico?compare=<id>` e a lista deve abrir já em modo de seleção com
  // esse registro marcado, pedindo o segundo. Só aplica quando os registros
  // já carregaram (precisa existir para fazer sentido marcar) e só uma vez
  // por carregamento da página, para não reimpor a seleção se o usuário a
  // limpar manualmente depois.
  useEffect(() => {
    if (preselectApplied || status !== "loaded") return;
    const compareId = searchParams.get("compare");
    if (compareId && records.some((record) => record.id === compareId)) {
      setCompareMode(true);
      setSelectedForCompare([compareId]);
    }
    setPreselectApplied(true);
  }, [preselectApplied, status, records, searchParams]);

  const toggleCompareMode = () => {
    // Entrar em "Comparar" cancela a seleção de exclusão em massa, se ativa
    // (modos mutuamente exclusivos).
    setDeleteSelectMode(false);
    setSelectedForDelete([]);
    setBulkDeleteFailure(null);
    setCompareMode((current) => {
      if (current) setSelectedForCompare([]);
      return !current;
    });
  };

  const enterDeleteSelectMode = () => {
    setCompareMode(false);
    setSelectedForCompare([]);
    setDeleteSelectMode(true);
  };

  const cancelDeleteSelectMode = () => {
    setDeleteSelectMode(false);
    setSelectedForDelete([]);
    setBulkDeleteFailure(null);
  };

  const toggleSelectForDelete = (id: string) => {
    setSelectedForDelete((current) =>
      current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id]
    );
  };

  const handleBulkDelete = async () => {
    const ids = selectedForDelete;
    const results = await Promise.allSettled(ids.map((id) => deleteRecord(id)));
    const failedIds = ids.filter((id, index) => results[index].status === "rejected");
    const succeeded = ids.length - failedIds.length;
    setRecords((current) => current.filter((r) => !ids.includes(r.id) || failedIds.includes(r.id)));
    setComparisons(await listComparisons());
    setConfirmBulkDeleteOpen(false);
    if (failedIds.length > 0) {
      // Falha parcial: não sai do modo de seleção, mantém só os que falharam
      // marcados, para permitir nova tentativa sem perder o restante do lote.
      setSelectedForDelete(failedIds);
      setBulkDeleteFailure({ attempted: ids.length, succeeded, failedIds });
    } else {
      setDeleteSelectMode(false);
      setSelectedForDelete([]);
      setBulkDeleteFailure(null);
    }
  };

  const toggleSelectForCompare = (id: string) => {
    setSelectedForCompare((current) => {
      if (current.includes(id)) return current.filter((existing) => existing !== id);
      if (current.length < 2) return [...current, id];
      // Já há 2 marcados: o primeiro marcado sai, o novo entra — troca sem
      // precisar cancelar e recomeçar a seleção (spec de UX do #75).
      return [current[1], id];
    });
  };

  const confirmCompare = () => {
    if (selectedForCompare.length !== 2) return;
    const [first, second] = selectedForCompare;
    const a = byIdRecord(first);
    const b = byIdRecord(second);
    // Ordem na URL só por legibilidade — `compareHistoryRecords` reordena por
    // timestamp de qualquer forma, então isto não afeta o resultado.
    const [olderId, newerId] =
      a && b && a.timestamp <= b.timestamp ? [first, second] : [second, first];
    setCompareMode(false);
    setSelectedForCompare([]);
    router.push(`/historico/comparar?a=${olderId}&b=${newerId}`);
  };

  function byIdRecord(id: string): MedicaoRegistro | undefined {
    return records.find((record) => record.id === id);
  }

  const remove = async (id: string) => {
    await deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setJustDeleted(true);
    setTimeout(() => setJustDeleted(false), 2500);
  };

  const handleClearAll = async () => {
    await clearAll();
    setRecords([]);
    setComparisons([]);
    setConfirmOpen(false);
  };
  const startEdit = (record: MedicaoRegistro) => {
    setEditing(record);
    setMetadata(record.userMetadata || { connectionName: "", reportedProblem: "" });
    setSelectedConnectionId(record.userMetadata?.connectionId || "");
  };
  const saveMetadata = async () => {
    if (!editing) return;
    const resolved = resolveConnectionMetadata(records, editing.id, metadata, selectedConnectionId);
    const updated = await updateRecordMetadata(editing.id, resolved);
    if (updated) setRecords((current) => current.map((record) => (record.id === updated.id ? updated : record)));
    setEditing(null);
  };
  const exportHistory = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(createHistoryExport(records, comparisons), null, 2)], { type: "application/json" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "signallq-historico-local.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  // Abre o `ConfirmDialog` declarativo (#76, item 1) em vez de bloquear a
  // thread com `window.confirm`; o diálogo de edição fica aberto atrás.
  const removeConnection = () => {
    if (!editing?.userMetadata?.connectionId) return;
    setConfirmRemoveConnectionOpen(true);
  };

  const confirmRemoveConnection = async () => {
    const connectionId = editing?.userMetadata?.connectionId;
    setConfirmRemoveConnectionOpen(false);
    if (!connectionId) return;
    await deleteConnection(connectionId);
    setRecords((current) => current.filter((record) => record.userMetadata?.connectionId !== connectionId));
    setComparisons(await listComparisons());
    setEditing(null);
  };

  const isEmpty = status === "loaded" && records.length === 0;
  const hasRecords = status === "loaded" && records.length > 0;
  const filtered = records.filter((r) => filtro === "todos" || r.connectionKind === filtro);
  // Período é o agrupador visual primário da lista (#73); conexão continua
  // existindo só para o autocomplete e a exclusão em massa no
  // `HistoryEditDialog` (`knownConnections`), não para renderizar a lista.
  const groups = groupRecordsByPeriod(filtered);
  const knownConnections = groupRecordsByConnection(records).filter((group) => !group.id.startsWith("legacy:"));
  const byId = new Map(records.map((record) => [record.id, record]));
  const recoverableComparisons = comparisons.filter(
    (comparison) => byId.has(comparison.beforeId) && byId.has(comparison.afterId)
  );
  // Pares já vinculados (#10) deixam de ser uma seção fixa no topo (#75,
  // achado transversal seção 0): aparecem inline na lista, na posição
  // cronológica do registro mais recente do par. Chave = id do registro mais
  // novo (`afterId`), único ponto onde o conector visual é desenhado.
  const linkedPairByAfterId = new Map(
    recoverableComparisons.map((comparison) => [comparison.afterId, comparison])
  );

  return {
    status,
    records,
    filtro,
    setFiltro,
    confirmOpen,
    setConfirmOpen,
    justDeleted,
    editing,
    setEditing,
    metadata,
    setMetadata,
    selectedConnectionId,
    setSelectedConnectionId,
    dialogRef,
    load,
    startTest: () => router.push("/"),
    remove,
    handleClearAll,
    startEdit,
    saveMetadata,
    exportHistory,
    removeConnection,
    confirmRemoveConnectionOpen,
    confirmRemoveConnection,
    cancelRemoveConnection: () => setConfirmRemoveConnectionOpen(false),
    shareRecord,
    isEmpty,
    hasRecords,
    filtered,
    groups,
    knownConnections,
    byId,
    recoverableComparisons,
    linkedPairByAfterId,
    compareMode,
    selectedForCompare,
    toggleCompareMode,
    toggleSelectForCompare,
    confirmCompare,
    deleteSelectMode,
    selectedForDelete,
    enterDeleteSelectMode,
    cancelDeleteSelectMode,
    toggleSelectForDelete,
    confirmBulkDeleteOpen,
    setConfirmBulkDeleteOpen,
    handleBulkDelete,
    bulkDeleteFailure,
  };
}
