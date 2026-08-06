"use client";

import { useEffect, useRef, useState } from "react";
import { contextualProblemFromSearch } from "@/lib/contextualEntry";
import type { ProblemaPercebido } from "@/lib/problemEntry";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { persistRestorableSpeedTestResult, readRestorableSpeedTestResult } from "@/lib/speedTestJourneySession";

interface EntryHandlers {
  isIdle: boolean;
  result: SpeedTestResult | null;
  onRestore: (result: SpeedTestResult) => void;
  onStart: (contextualProblem?: ProblemaPercebido) => void;
}

/**
 * Entrada na rota (protótipo, tela 1.1): não existe tela ociosa.
 *
 * - Com resultado restaurável na sessão: restaura e **não** mede de novo.
 * - Sem resultado restaurável: o velocímetro se forma e o teste rápido começa
 *   sozinho — inclusive quando a pessoa chega de uma rota editorial com
 *   `?context=`, caso em que o problema declarado lá vira o contexto da
 *   medição e sai da URL.
 *
 * Não há guarda de "já autostartou nesta sessão": cancelar leva ao estado de
 * falha (com "Tentar novamente" explícito) e **qualquer** resultado terminal
 * vira restaurável, então nenhum caminho volta a `idle` e cria laço de medição.
 *
 * Extraído de `useSpeedTestJourney` para manter uma responsabilidade por hook
 * (`skills/architecture-guardrails`).
 */
export function useSpeedTestEntry({ isIdle, result, onRestore, onStart }: EntryHandlers) {
  const disparado = useRef(false);
  const [isAutoStarting, setIsAutoStarting] = useState(true);

  useEffect(() => {
    if (!isIdle || disparado.current) {
      if (isIdle && isAutoStarting) setIsAutoStarting(false);
      return;
    }
    disparado.current = true;

    const restaurado = readRestorableSpeedTestResult();
    if (restaurado) {
      setIsAutoStarting(false);
      onRestore(restaurado);
      return;
    }

    const contextualProblem = contextualProblemFromSearch(window.location.search);
    if (contextualProblem) window.history.replaceState(null, "", window.location.pathname);
    setTimeout(() => {
      onStart(contextualProblem ?? undefined);
      setIsAutoStarting(false);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIdle]);

  useEffect(() => {
    if (result) persistRestorableSpeedTestResult(result);
  }, [result]);

  return { isAutoStarting };
}
