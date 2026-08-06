"use client";

import { useEffect, useRef, useState } from "react";
import type { RetestComparison } from "@/lib/retestComparison";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { persistRetestComparison, retestComparisonId } from "@/lib/speedTestJourneyComparison";

/**
 * Comparação entre a rodada anterior e a atual, quando houve reteste.
 *
 * A persistência pode falhar (banco local indisponível, cota); nesse caso a
 * comparação some da tela e `comparacaoNaoSalva` avisa — nunca se finge que
 * foi salva. Extraído de `useSpeedTestJourney` para manter uma
 * responsabilidade por hook (`skills/architecture-guardrails`).
 */
export function useRetestComparison(result: SpeedTestResult | null) {
  const [retesteBase, setRetesteBase] = useState<SpeedTestResult | null>(null);
  const [comparacaoReteste, setComparacaoReteste] = useState<RetestComparison | null>(null);
  const [comparacaoNaoSalva, setComparacaoNaoSalva] = useState(false);
  const persistida = useRef<string | null>(null);

  useEffect(() => {
    if (!retesteBase || !result || retesteBase.id === result.id) return;
    const comparisonId = `${retesteBase.id}:${result.id}`;
    void persistRetestComparison(retesteBase, result, persistida.current)
      .then(({ comparison, persisted }) => {
        if (comparison) setComparacaoReteste(comparison);
        if (persisted) persistida.current = retestComparisonId(retesteBase, result);
      })
      .catch(() => {
        setComparacaoReteste(null);
        if (persistida.current !== comparisonId) setComparacaoNaoSalva(true);
      });
  }, [result, retesteBase]);

  /** Marca a rodada atual como base da comparação e limpa o estado anterior. */
  function iniciarComparacao(base: SpeedTestResult) {
    setRetesteBase(base);
    setComparacaoReteste(null);
    setComparacaoNaoSalva(false);
  }

  return { retesteBase, comparacaoReteste, comparacaoNaoSalva, iniciarComparacao };
}
