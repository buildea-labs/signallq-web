"use client";

import { useEffect, useState } from "react";
import type { FasePainel } from "@/lib/speedTestPhase";
import type { SpeedTestResult } from "@/lib/speedEngine";

interface DeepeningInput {
  phase: FasePainel;
  isProblem: boolean;
  result: SpeedTestResult | null;
  onCancelado: () => void;
}

/**
 * Aprofundamento pós-resultado: a passagem do resultado rápido para um teste
 * completo de verdade (bug crítico GH#1367 follow-up).
 *
 * Antes, escolher um problema só alimentava perguntas contextuais sobre um
 * resultado que continuava sendo só de download. Agora o modo vira "completo"
 * e a medição reexecuta — e este hook guarda o que essa transição precisa
 * lembrar: se está em curso, se foi cancelada e qual era o download antes,
 * para saber se o número mudou.
 *
 * Extraído de `useSpeedTestJourney` para manter uma responsabilidade por hook
 * (`skills/architecture-guardrails`).
 */
export function useSpeedTestDeepening({ phase, isProblem, result, onCancelado }: DeepeningInput) {
  const [ativo, setAtivo] = useState(false);
  const [notaCancelado, setNotaCancelado] = useState(false);
  const [downloadAntes, setDownloadAntes] = useState<number | null>(null);

  // Cancelamento durante o aprofundamento: volta ao resultado rápido original
  // (nunca trava numa tela de loading/erro) e permite escolher de novo, sem
  // forçar nova escolha nem perder o resultado já medido.
  useEffect(() => {
    if (phase !== "cancelado" || !ativo) return;
    setAtivo(false);
    setNotaCancelado(true);
    onCancelado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, ativo]);

  /** Chamado ao disparar o teste completo a partir do resultado rápido. */
  function iniciar(resultadoAtual: SpeedTestResult | null) {
    setNotaCancelado(false);
    setDownloadAntes(resultadoAtual ? resultadoAtual.download.mbps : null);
    setAtivo(true);
  }

  /** Uma nova rodada por outro caminho (reteste, teste direto) encerra a nota. */
  function limpar() {
    setAtivo(false);
    setNotaCancelado(false);
  }

  // Falha (não cancelamento) durante o aprofundamento: mantém o mesmo cartão de
  // erro genérico do fluxo principal, só acrescido de contexto.
  const erroDurante = isProblem && phase !== "cancelado" && ativo;

  // "Este é o resultado do teste completo..." só quando o download realmente
  // mudou em relação à estimativa rápida anterior — comparação booleana, sem
  // exibir os dois valores (spec Juliana §3).
  const downloadMudou = ativo && downloadAntes !== null && result !== null && result.download.mbps !== downloadAntes;

  return { ativo, notaCancelado, erroDurante, downloadMudou, iniciar, limpar };
}
