"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Estados visuais do mostrador, 1:1 com `Speedometer.dc.html`:
 *
 * - `forming`   arco se desenhando na entrada, sem número (ponto pulsante);
 * - `measuring` medindo: halo pulsante no arco e anel pulsante no marcador;
 * - `settled`   resultado assentado, com desaceleração ao chegar;
 * - `restored`  igual a `settled`, com formação mais curta (nada foi medido agora);
 * - `error`     falha/cancelamento: mostrador neutro, sem pulso;
 * - `quiet`     leitura já arquivada (ex.: um teste do Histórico): desenha o
 *               valor final direto, sem formação — nada está acontecendo agora.
 */
export type VelocimetroMode = "forming" | "measuring" | "settled" | "restored" | "error" | "quiet";

const FORMING_DURATION_MS = 900;
const RESTORED_DURATION_MS = 550;
const MEASURING_TAU_MS = 130;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Interpolação do mostrador: uma única grandeza animada alimenta arco,
 * marcador, ponteiro e número — nunca duas fontes de verdade.
 *
 * Na formação/assentamento roda um easing com duração fixa (desacelera ao
 * concluir); durante a medição segue o alvo com suavização exponencial, que
 * absorve o ruído das amostras sem atrasar a leitura.
 */
export function useAnimatedDial(target: number, mode: VelocimetroMode, reducedMotion: boolean): number {
  const still = reducedMotion || mode === "quiet";
  const [displayed, setDisplayed] = useState(still ? target : 0);
  const frame = useRef<number | null>(null);
  const current = useRef(displayed);
  const targetRef = useRef(target);

  // O alvo é lido dentro do laço de animação; sincronizar por efeito (e não
  // durante o render) mantém o ref fora do caminho de renderização.
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  // Formação/assentamento: transição com duração, a partir do valor corrente.
  const settleKey = mode === "measuring" ? "measuring" : `${mode}:${target}`;

  useEffect(() => {
    if (still) {
      current.current = targetRef.current;
      setDisplayed(targetRef.current);
      return;
    }

    const timed = mode !== "measuring";
    const duration = mode === "restored" ? RESTORED_DURATION_MS : FORMING_DURATION_MS;
    const from = current.current;
    let start: number | null = null;
    let previous: number | null = null;

    const step = (now: number) => {
      if (start === null) start = now;

      if (timed) {
        const progress = Math.min(1, (now - start) / duration);
        current.current = from + (targetRef.current - from) * easeOutCubic(progress);
        setDisplayed(current.current);
        if (progress < 1) frame.current = requestAnimationFrame(step);
        return;
      }

      const delta = previous === null ? 16 : Math.min(64, now - previous);
      previous = now;
      const alpha = 1 - Math.exp(-delta / MEASURING_TAU_MS);
      current.current += (targetRef.current - current.current) * alpha;
      setDisplayed(current.current);
      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [settleKey, mode, still]);

  return still ? target : displayed;
}
