"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SpeedTestError } from "@/lib/speedEngine";
import type { LatencySummary } from "@/lib/speedTestStats";
import { collectLatency, type CancelToken } from "@/lib/speedTestTransport";

export const PING_SAMPLE_COUNT = 20;

const SESSION_KEY = "signallq_ping_last_v1";

/**
 * Última leitura desta sessão. Sem isto, cada visita a `/ping` dispararia 20
 * requisições à sonda — e a ferramenta está linkada na grade de todo resultado
 * e na tela de falha, então revisitar é comum. Restaurar e deixar o "Medir
 * novamente" explícito respeita a banda de quem já está com a conexão ruim.
 */
function lerSessao(): LatencySummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as LatencySummary) : null;
  } catch {
    return null;
  }
}

function gravarSessao(summary: LatencySummary) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(summary));
  } catch {
    // Cota ou modo privativo: medir de novo é aceitável, quebrar não.
  }
}

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
      gravarSessao(summary);
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

  /** Restaura a leitura da sessão; devolve `false` quando não há o que restaurar. */
  const restore = useCallback(() => {
    const salvo = lerSessao();
    if (!salvo) return false;
    setState({ status: "done", summary: salvo, samples: [] });
    return true;
  }, []);

  return { state, run, restore, cancel };
}
