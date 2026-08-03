"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RetestComparison } from "@/components/home/RetestComparison";
import { MODE_LABEL } from "@/components/home/homeCopy";
import { formatarDataHora } from "@/lib/measurementFormat";
import { getRecordById, type MedicaoRegistro } from "@/lib/measurementRepository";
import { compareHistoryRecords } from "@/lib/retestComparison";

type Status = "loading" | "ready" | "missing-params" | "not-found";

interface HistoryCompareResultProps {
  aId?: string;
  bId?: string;
}

function RecordSummary({ record }: { record: MedicaoRegistro }) {
  const modeLabel = record.mode ? MODE_LABEL[record.mode] : undefined;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-[13px] text-[color:var(--text-primary)]">
        {formatarDataHora(record.timestamp)}
      </span>
      <span className="text-[12px] text-[color:var(--text-tertiary)]">
        {modeLabel ?? "Modo não informado"}
      </span>
      <Link
        href={`/historico/${record.id}`}
        className="w-fit text-[12px] font-medium text-[color:var(--accent)] underline underline-offset-2"
      >
        Ver teste
      </Link>
    </div>
  );
}

/**
 * Comparação entre dois testes salvos do Histórico (#75). Alimenta o mesmo
 * `RetestComparison` já usado na jornada ao vivo (nenhuma mudança nesse
 * componente) com `compareHistoryRecords`, tanto para pares já vinculados
 * (link "Ver comparação" inline na lista) quanto para a seleção manual — as
 * duas entradas convergem aqui, sem dois designs de "resultado de comparação".
 */
export function HistoryCompareResult({ aId, bId }: HistoryCompareResultProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [recordA, setRecordA] = useState<MedicaoRegistro | null>(null);
  const [recordB, setRecordB] = useState<MedicaoRegistro | null>(null);

  useEffect(() => {
    if (!aId || !bId) {
      setStatus("missing-params");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    Promise.all([getRecordById(aId), getRecordById(bId)]).then(([a, b]) => {
      if (cancelled) return;
      if (!a || !b) {
        setStatus("not-found");
        return;
      }
      setRecordA(a);
      setRecordB(b);
      setStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [aId, bId]);

  const goBack = () => router.back();

  const header = (
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
      <h1 className="m-0 font-bold text-[20px] leading-[1.25] text-[color:var(--text-primary)]">Comparar testes</h1>
    </div>
  );

  if (status === "loading") {
    return (
      <div className="flex w-full flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
        {header}
        <div role="status" aria-live="polite" className="flex w-full flex-1 items-center justify-center py-16">
          <span className="font-normal text-[16px] text-[color:var(--text-secondary)]">Carregando comparação…</span>
        </div>
      </div>
    );
  }

  if (status === "missing-params" || status === "not-found") {
    return (
      <div className="flex w-full flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
        {header}
        <div role="status" className="flex w-full flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <span aria-hidden="true" className="material-symbols-outlined text-[32px] text-[color:var(--text-tertiary)]">
            search_off
          </span>
          <p className="max-w-[320px] font-normal text-[14px] leading-[1.4] text-[color:var(--text-secondary)]">
            {status === "missing-params"
              ? "Selecione dois testes salvos para comparar."
              : "Um dos testes selecionados não foi encontrado. Ele pode ter sido excluído."}
          </p>
          <Link
            href="/historico"
            className="font-medium text-[13px] leading-[1.33] text-[color:var(--accent)] underline underline-offset-2"
          >
            Voltar ao Histórico
          </Link>
        </div>
      </div>
    );
  }

  const a = recordA as MedicaoRegistro;
  const b = recordB as MedicaoRegistro;
  const comparacao = compareHistoryRecords(a, b);
  // `compareHistoryRecords` reordena internamente por timestamp — a
  // apresentação usa a mesma ordem (mais antigo primeiro) para não relatar
  // "antes"/"depois" invertido, qualquer que tenha sido a ordem de clique.
  const [before, after] = a.timestamp <= b.timestamp ? [a, b] : [b, a];

  return (
    <div className="flex w-full flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
      {header}
      <div className="mx-auto grid w-full max-w-[640px] grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl p-3.5" style={{ background: "var(--bg-secondary)" }}>
          <div className="mb-1 font-medium text-[11px] uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">Antes</div>
          <RecordSummary record={before} />
        </div>
        <div className="rounded-2xl p-3.5" style={{ background: "var(--bg-secondary)" }}>
          <div className="mb-1 font-medium text-[11px] uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">Depois</div>
          <RecordSummary record={after} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[640px]">
        <RetestComparison comparacao={comparacao} comparacaoNaoSalva={false} />
      </div>
    </div>
  );
}
