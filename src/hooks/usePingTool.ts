"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SpeedTestError } from "@/lib/speedEngine";
import type { LatencySummary } from "@/lib/speedTestStats";
import { collectLatency, type CancelToken } from "@/lib/speedTestTransport";

export const PING_SAMPLE_COUNT = 20;

export type PingToolState =
  | { status: "idle" }
  | { status: "running"; samples: number[] }
  | { status: "done"; summary: LatencySummary; samples: number[] }
  | { status: "error" };

/**
 * Controller da ferramenta de Ping.
 *
 * Reaproveita exatamente a mesma coleta de latência do motor de velocidade
 * (`collectLatency` + `summarizeLatency`), contra o mesmo endpoint de sonda —
 * não existe uma segunda definição de "ping" no produto. A diferença é só o
 * recorte: aqui a latência é o resultado, não uma fase de uma medição maior.
 */
export function usePingTool() {
  const [state, setState] = useState<PingToolState>({ status: "idle" });
  const token = useRef<CancelToken | null>(null);

  const cancel = useCallback(() => {
    if (token.current) token.current.cancelled = true;
    token.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const run = useCallback(async () => {
    cancel();
    const current: CancelToken = { cancelled: false, contaminated: false, xhrs: new Set() };
    token.current = current;

    const samples: number[] = [];
    setState({ status: "running", samples });

    try {
      const summary = await collectLatency(PING_SAMPLE_COUNT, current, (sample) => {
        samples.push(sample);
        if (!current.cancelled) setState({ status: "running", samples: [...samples] });
      });
      if (current.cancelled) return;
      setState({ status: "done", summary, samples: [...samples] });
    } catch (error) {
      // Cancelamento é saída normal desta ferramenta (desmontar a página), não
      // uma falha para reportar.
      if (error instanceof SpeedTestError && error.code === "cancelled") return;
      setState({ status: "error" });
    } finally {
      if (token.current === current) token.current = null;
    }
  }, [cancel]);

  return { state, run, cancel };
}
