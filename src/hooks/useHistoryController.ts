"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  clearAll,
  createHistoryExport,
  deleteConnection,
  deleteRecord,
  groupRecordsByConnection,
  listComparisons,
  listRecords,
  updateRecordMetadata,
  type ComparacaoRegistro,
  type HistoryUserMetadata,
  type MedicaoRegistro,
} from "@/lib/historyStore";
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
    const name = metadata.connectionName?.trim();
    // O nome é a chave humana: se já existe, reutiliza a conexão. Caso seja
    // novo, uma chave estável derivada dele permite que a próxima medição seja
    // agrupada sem depender do id técnico da medição.
    const matching = name
      ? records.find(
          (record) =>
            record.id !== editing.id &&
            record.userMetadata?.connectionName?.localeCompare(name, "pt-BR", { sensitivity: "accent" }) === 0
        )
      : undefined;
    const connectionId =
      selectedConnectionId ||
      matching?.userMetadata?.connectionId ||
      (name
        ? `connection:${name
            .toLocaleLowerCase("pt-BR")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")}`
        : undefined);
    const updated = await updateRecordMetadata(editing.id, { ...metadata, connectionId });
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
  const removeConnection = async () => {
    const connectionId = editing?.userMetadata?.connectionId;
    if (!connectionId || !window.confirm("Excluir todas as medições deste local? Esta ação não pode ser desfeita."))
      return;
    await deleteConnection(connectionId);
    setRecords((current) => current.filter((record) => record.userMetadata?.connectionId !== connectionId));
    setComparisons(await listComparisons());
    setEditing(null);
  };

  const isEmpty = status === "loaded" && records.length === 0;
  const hasRecords = status === "loaded" && records.length > 0;
  const filtered = records.filter((r) => filtro === "todos" || r.connectionKind === filtro);
  const groups = groupRecordsByConnection(filtered);
  const knownConnections = groupRecordsByConnection(records).filter((group) => !group.id.startsWith("legacy:"));
  const byId = new Map(records.map((record) => [record.id, record]));
  const recoverableComparisons = comparisons.filter(
    (comparison) => byId.has(comparison.beforeId) && byId.has(comparison.afterId)
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
    shareRecord,
    isEmpty,
    hasRecords,
    filtered,
    groups,
    knownConnections,
    byId,
    recoverableComparisons,
  };
}
