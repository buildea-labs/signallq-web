"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DIAL_R,
  GAUGE_VIEWBOX_HEIGHT,
  GAUGE_VIEWBOX_WIDTH,
  dialAngle,
  dialArcPath,
  dialAutoMax,
  dialCurve,
  dialMajorTicks,
  dialMinorTicks,
  dialPolar,
  dialScaleForPhase,
} from "@/lib/gaugeMath";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

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

// Espessuras/tamanhos em unidades da viewBox — o SVG escala junto com o
// contêiner, então não há degraus de tamanho por breakpoint (o protótipo
// trocava valores em px por `size`; aqui um único desenho responde a todas as
// larguras).
const STROKE_WIDTH = 14;
const DOT_RADIUS = 7;
const PIVOT_RADIUS = 5;

const FORMING_DURATION_MS = 900;
const RESTORED_DURATION_MS = 550;
const MEASURING_TAU_MS = 130;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

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

/**
 * Interpolação do mostrador: uma única grandeza animada alimenta arco,
 * marcador, ponteiro e número — nunca duas fontes de verdade.
 *
 * Na formação/assentamento roda um easing com duração fixa (desacelera ao
 * concluir); durante a medição segue o alvo com suavização exponencial, que
 * absorve o ruído das amostras sem atrasar a leitura.
 */
function useAnimatedDial(target: number, mode: VelocimetroMode, reducedMotion: boolean) {
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
  const t = dialCurve(Math.max(0, Math.min(1, rawFraction)));
  const drawnT = Math.max(t, 0.0006);

  const trackPath = useMemo(() => dialArcPath(0, 1), []);
  const activePath = dialArcPath(0, drawnT);
  const marker = dialPolar(dialAngle(drawnT), DIAL_R);
  const needleTip = dialPolar(dialAngle(drawnT), DIAL_R - 22);
  const needleBase = dialPolar(dialAngle(drawnT), 58);

  // Na formação não há leitura: uma escala numérica nesse momento sugeriria
  // um limite já conhecido para uma medição que nem começou.
  const showTicks = showScale && !compact && !hideValue;
  const majorTicks = useMemo(() => (showTicks ? dialMajorTicks(scale, STROKE_WIDTH) : []), [showTicks, scale]);
  const minorTicks = useMemo(() => (showTicks ? dialMinorTicks(scale, STROKE_WIDTH) : []), [showTicks, scale]);

  const pulsing = resolvedMode === "measuring" && !reducedMotion;
  const glow = `drop-shadow(0 0 8px color-mix(in srgb, ${phaseColor} 45%, transparent))`;
  const trackColor = "color-mix(in srgb, var(--border) 22%, transparent)";

  const displayValue =
    parsedValue === null ? value : animated.toFixed(decimalsOf(value));
  const showCenter = hasValue && !hideValue;

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
          <path d={trackPath} fill="none" stroke={trackColor} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />

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

          <path
            d={activePath}
            fill="none"
            stroke={phaseColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            style={{ filter: glow }}
          />

          {showTicks && (
            <g>
              {minorTicks.map((tick, index) => (
                <line
                  key={`minor-${index}`}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke="var(--text-tertiary)"
                  strokeWidth={1.2}
                  opacity={0.28}
                  strokeLinecap="round"
                />
              ))}
              {majorTicks.map((tick) => (
                <g key={`major-${tick.label}`}>
                  <line
                    x1={tick.x1}
                    y1={tick.y1}
                    x2={tick.x2}
                    y2={tick.y2}
                    stroke="var(--text-tertiary)"
                    strokeWidth={1.8}
                    opacity={0.55}
                    strokeLinecap="round"
                  />
                  <text
                    x={tick.labelX}
                    y={tick.labelY}
                    fill="var(--text-tertiary)"
                    fontSize={11}
                    fontWeight={600}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}
            </g>
          )}

          {pulsing && (
            <circle
              cx={marker.x}
              cy={marker.y}
              r={DOT_RADIUS}
              fill="none"
              stroke={phaseColor}
              strokeWidth={2}
              className="sq-dial-dotpulse"
            />
          )}

          {/* Ponteiro só quando há leitura: na formação não existe valor para
              apontar, e um ponteiro parado na origem é lido como "zero
              medido" em vez de "ainda vou medir". */}
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
          <circle
            cx={marker.x}
            cy={marker.y}
            r={DOT_RADIUS}
            fill={phaseColor}
            stroke="var(--bg-primary)"
            strokeWidth={2}
            style={{ filter: glow }}
          />

          {showCenter && (
            <g textAnchor="middle">
              <text
                x={GAUGE_VIEWBOX_WIDTH / 2}
                y={158}
                fill="var(--text-primary)"
                fontSize={48}
                fontWeight={800}
                letterSpacing={-1}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {displayValue}
              </text>
              {unit && (
                <text x={GAUGE_VIEWBOX_WIDTH / 2} y={180} fill="var(--text-tertiary)" fontSize={13} fontWeight={600}>
                  {unit}
                </text>
              )}
              {metricLabel && (
                <text
                  x={GAUGE_VIEWBOX_WIDTH / 2}
                  y={196}
                  fill="var(--text-tertiary)"
                  fontSize={11}
                  fontWeight={600}
                  letterSpacing={0.5}
                  style={{ textTransform: "uppercase" }}
                >
                  {metricLabel.toUpperCase()}
                </text>
              )}
            </g>
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
