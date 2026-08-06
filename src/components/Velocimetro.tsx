"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { DialReading, DialScale } from "@/components/speedtest/DialScale";
import { useAnimatedDial, type VelocimetroMode } from "@/hooks/useAnimatedDial";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  DIAL_R,
  GAUGE_VIEWBOX_HEIGHT,
  GAUGE_VIEWBOX_WIDTH,
  dialAngle,
  dialArcPath,
  dialAutoMax,
  dialCurve,
  dialPolar,
  dialScaleForPhase,
} from "@/lib/gaugeMath";

export type { VelocimetroMode };

// Espessuras/tamanhos em unidades da viewBox — o SVG escala junto com o
// contêiner, então não há degraus de tamanho por breakpoint (o protótipo
// trocava valores em px por `size`; aqui um único desenho responde a todas as
// larguras).
const STROKE_WIDTH = 14;
const DOT_RADIUS = 7;
const PIVOT_RADIUS = 5;

/** Casas decimais que o chamador escolheu para o número central. */
function decimalsOf(value: string | undefined) {
  if (!value) return 0;
  const dot = value.indexOf(".");
  return dot === -1 ? 0 : value.length - dot - 1;
}

function parseDialNumber(value: string | undefined) {
  if (value === undefined) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function Velocimetro({
  fraction,
  phaseColor,
  isRunning,
  phase,
  liveValue,
  value,
  unit,
  phaseLabel,
  narrative,
  metricLabel,
  compact = false,
  mode,
  hideValue = false,
  showScale = true,
  children,
}: {
  fraction: number;
  phaseColor: string;
  isRunning: boolean;
  phase: string;
  liveValue: number;
  value?: string;
  unit?: string;
  phaseLabel?: string;
  narrative?: string;
  metricLabel?: string;
  compact?: boolean;
  mode?: VelocimetroMode;
  hideValue?: boolean;
  showScale?: boolean;
  children?: React.ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const isThroughput = phase === "download" || phase === "upload";
  const unitKind: "Mbps" | "ms" = unit === "ms" ? "ms" : "Mbps";
  const hasValue = value !== undefined;

  // Estado do mostrador derivado do que o chamador já informa; `mode` explícito
  // sobrescreve quando a tela conhece a intenção (ex.: resultado restaurado).
  const resolvedMode: VelocimetroMode = mode ?? (isRunning ? "measuring" : hasValue ? "settled" : "forming");

  const parsedValue = parseDialNumber(value);
  const numericTarget = isThroughput ? liveValue : (parsedValue ?? 0);

  // Escala adaptativa: reinicia a cada nova fase de medição e, dentro dela, só
  // cresce — a agulha nunca "volta" porque a escala encolheu.
  const [scale, setScale] = useState(() => dialAutoMax(numericTarget, unitKind));
  const activePhase = useRef<string | null>(null);
  useEffect(() => {
    const startsPhase = activePhase.current !== phase;
    activePhase.current = phase;
    setScale((currentScale) => dialScaleForPhase(numericTarget, unitKind, currentScale, startsPhase));
  }, [numericTarget, phase, unitKind]);

  const animated = useAnimatedDial(numericTarget, resolvedMode, reducedMotion);

  // Sem número legível (ex.: fase de latência, que só tem fração) o arco segue
  // a fração informada pelo chamador; com número, segue a escala exibida.
  const rawFraction = parsedValue === null && !isThroughput ? fraction : scale > 0 ? animated / scale : 0;
  const drawnT = Math.max(dialCurve(Math.max(0, Math.min(1, rawFraction))), 0.0006);

  const trackPath = useMemo(() => dialArcPath(0, 1), []);
  const activePath = dialArcPath(0, drawnT);
  const marker = dialPolar(dialAngle(drawnT), DIAL_R);
  const needleTip = dialPolar(dialAngle(drawnT), DIAL_R - 22);
  const needleBase = dialPolar(dialAngle(drawnT), 58);

  const showCenter = hasValue && !hideValue;
  // Na formação não há leitura: uma escala numérica nesse momento sugeriria um
  // limite já conhecido para uma medição que nem começou.
  const showTicks = showScale && !compact && !hideValue;
  const pulsing = resolvedMode === "measuring" && !reducedMotion;
  const glow = `drop-shadow(0 0 8px color-mix(in srgb, ${phaseColor} 45%, transparent))`;

  return (
    <div
      className={`flex flex-col items-center ${compact ? "max-w-[260px]" : "max-w-[356px] lg:max-w-[380px]"} w-full transition-[max-width] duration-500 ease-out motion-reduce:transition-none`}
    >
      <div className="relative w-full" style={{ aspectRatio: `${GAUGE_VIEWBOX_WIDTH} / ${GAUGE_VIEWBOX_HEIGHT}` }}>
        {phaseLabel && (
          <span className="sr-only" role="status" aria-live="polite">
            {phaseLabel}
            {narrative ? `. ${narrative}` : ""}
          </span>
        )}

        {/* Profundidade: halo radial suave atrás do arco, nunca uma sombra
            pesada — o protótipo pede "brilho suave, profundidade sutil". */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[58%] w-[62%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none sq-gauge-glow"
          style={{ background: `radial-gradient(circle, color-mix(in srgb, ${phaseColor} 22%, transparent), transparent 70%)` }}
        />

        <svg
          viewBox={`0 0 ${GAUGE_VIEWBOX_WIDTH} ${GAUGE_VIEWBOX_HEIGHT}`}
          className="absolute inset-0 block h-full w-full overflow-visible pointer-events-none"
          aria-hidden="true"
        >
          <path
            d={trackPath}
            fill="none"
            stroke="color-mix(in srgb, var(--border) 22%, transparent)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />

          {pulsing && (
            <path
              d={activePath}
              fill="none"
              stroke={phaseColor}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              className="sq-dial-arcpulse"
            />
          )}

          <path d={activePath} fill="none" stroke={phaseColor} strokeWidth={STROKE_WIDTH} strokeLinecap="round" style={{ filter: glow }} />

          {showTicks && <DialScale scale={scale} strokeWidth={STROKE_WIDTH} />}

          {pulsing && (
            <circle cx={marker.x} cy={marker.y} r={DOT_RADIUS} fill="none" stroke={phaseColor} strokeWidth={2} className="sq-dial-dotpulse" />
          )}

          {/* Ponteiro só quando há leitura: na formação não existe valor para
              apontar, e um ponteiro parado na origem é lido como "zero medido"
              em vez de "ainda vou medir". */}
          {showCenter && (
            <>
              <line
                x1={needleBase.x}
                y1={needleBase.y}
                x2={needleTip.x}
                y2={needleTip.y}
                stroke={phaseColor}
                strokeWidth={3}
                strokeLinecap="round"
                style={{ filter: glow }}
              />
              <circle cx={needleBase.x} cy={needleBase.y} r={PIVOT_RADIUS} fill={phaseColor} stroke="var(--bg-primary)" strokeWidth={2} />
            </>
          )}

          {/* Marcador luminoso na extremidade ativa. */}
          <circle cx={marker.x} cy={marker.y} r={DOT_RADIUS} fill={phaseColor} stroke="var(--bg-primary)" strokeWidth={2} style={{ filter: glow }} />

          {showCenter && (
            <DialReading
              value={parsedValue === null ? value : animated.toFixed(decimalsOf(value))}
              unit={unit}
              metricLabel={metricLabel}
            />
          )}
        </svg>

        {/* Sem número na tela (formação): um ponto pulsante ocupa o centro, em
            vez de um "0" que seria lido como medição já feita. */}
        {!showCenter && (
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[56%] h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full sq-dial-pulse"
            style={{ background: phaseColor }}
          />
        )}

        {children}
      </div>

      {showCenter && (phaseLabel || narrative) && (
        <div className={`flex flex-col items-center text-center mt-6 ${compact ? "gap-0" : "gap-1"}`}>
          {phaseLabel && (
            <div className="font-semibold text-[11px] leading-[1.45] tracking-[1px] uppercase" style={{ color: phaseColor }}>
              {phaseLabel}
            </div>
          )}
          {!compact && narrative && (
            <div className="mt-1 max-w-[260px] text-[12px] leading-[1.33] text-[color:var(--text-secondary)]">{narrative}</div>
          )}
        </div>
      )}
    </div>
  );
}
