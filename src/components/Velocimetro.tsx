"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { fractionForGaugeScale, gaugeScaleForThroughputPhase, gaugeScaleLabelPositions, latencyGaugeLabelPositions, movingAverage } from "@/lib/gaugeMath";

const CX = 180, CY = 186, R = 136;
const ARC_LEN = Math.PI * R;
const ARC_PATH = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
const VISUAL_SAMPLE_WINDOW = 4;

function point(radius: number, fraction: number) {
  const rad = ((180 - fraction * 180) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

const TICKS = Array.from({ length: 49 }, (_, i) => {
  const f = i / 48;
  const major = i % 6 === 0;
  const a = point(R + 11, f);
  const b = point(R + (major ? 21 : 17), f);
  return {
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y,
    width: major ? 2 : 1,
    color: major
      ? "color-mix(in srgb, var(--text-tertiary) 45%, transparent)"
      : "color-mix(in srgb, var(--border) 28%, transparent)",
  };
});

function scaleLabels(scale: Array<{ text: string; fraction: number }>) {
  return scale.map(({ text, fraction }) => {
  const p = point(R + 36, fraction);
  return {
    text,
    left: `${(p.x / 360) * 100}%`,
    top: `${(p.y / 210) * 100}%`,
  };
  });
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
  compact = false,
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
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const [throughputScale, setThroughputScale] = useState(100);
  const [smoothedThroughput, setSmoothedThroughput] = useState(0);
  const activeThroughputPhase = useRef<string | null>(null);
  const visualSamples = useRef<number[]>([]);
  useEffect(() => {
    if (phase === "download" || phase === "upload") {
      const startsPhase = activeThroughputPhase.current !== phase;
      activeThroughputPhase.current = phase;
      visualSamples.current = startsPhase
        ? [liveValue]
        : [...visualSamples.current, liveValue].slice(-VISUAL_SAMPLE_WINDOW);
      setSmoothedThroughput(movingAverage(visualSamples.current));
      setThroughputScale((current) => gaugeScaleForThroughputPhase(liveValue, current, startsPhase));
    } else {
      activeThroughputPhase.current = null;
      visualSamples.current = [];
      setSmoothedThroughput(0);
      setThroughputScale(100);
    }
  }, [liveValue, phase]);
  const isThroughput = phase === "download" || phase === "upload";
  const labels = useMemo(
    () => scaleLabels(isThroughput ? gaugeScaleLabelPositions(throughputScale) : latencyGaugeLabelPositions()),
    [isThroughput, throughputScale],
  );
  const visualFraction = isThroughput ? fractionForGaugeScale(smoothedThroughput, throughputScale) : fraction;
  const needle = point(R - 2, visualFraction);
  const needleFrom = point(R - 36, visualFraction);
  const dashOffset = ARC_LEN * (1 - visualFraction);
  const showMeasurement = isRunning || compact;

  const showCenter = Boolean(value && (isRunning || compact));

  return (
    <div className={`relative aspect-[360/210] ${compact ? "w-[280px]" : "w-full"} transition-[width,transform] duration-500 ease-out motion-reduce:transition-none ${compact ? "" : isRunning ? "sm:w-[520px]" : "sm:w-[440px]"}`}>
      {phaseLabel && <span className="sr-only" role="status" aria-live="polite">{phaseLabel}{narrative ? `. ${narrative}` : ""}</span>}
      {children}
      
      {/* Glow effect when running or idle */}
      <div
        className="absolute left-[50%] top-[62%] w-[60%] aspect-square rounded-full pointer-events-none sq-gauge-glow"
        style={{
          background:
            `radial-gradient(circle, color-mix(in srgb, ${phaseColor} 30%, transparent), transparent 72%)`,
        }}
      />

      <svg
        viewBox="0 0 360 210"
        className="absolute inset-0 w-full h-full block pointer-events-none"
      >
        {TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.color}
            strokeWidth={t.width}
            strokeLinecap="round"
          />
        ))}

        {/* Base Arc */}
        <path
          d={ARC_PATH}
          stroke="color-mix(in srgb, var(--border) 20%, transparent)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />

        {/* Active Arc & Needle (only when running) */}
        {showMeasurement && (
          <>
            <path
              d={ARC_PATH}
              stroke={phaseColor}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={ARC_LEN}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-100 ease-out motion-reduce:transition-none"
            />
            <line
              x1={needleFrom.x}
              y1={needleFrom.y}
              x2={needle.x}
              y2={needle.y}
              stroke={phaseColor}
              strokeWidth="4"
              strokeLinecap="round"
              className="transition-[x2,y2,x1,y1] duration-100 ease-out motion-reduce:transition-none"
            />
          </>
        )}
      </svg>

      {showCenter && (
        <div className={`absolute inset-x-0 top-[42%] -translate-y-1/2 flex flex-col items-center text-center ${compact ? "gap-0" : "gap-1"}`}>
          <div className={`${compact ? "text-[34px]" : "text-[48px] sm:text-[58px]"} font-bold leading-none tabular-nums`} style={{ color: phaseColor }}>
            {value}
          </div>
          {unit && <div className="font-medium text-[12px] leading-[1.33] tracking-[.5px] text-[color:var(--text-tertiary)]">{unit}</div>}
          {phaseLabel && <div className="mt-2 font-semibold text-[11px] leading-[1.45] tracking-[1px]" style={{ color: phaseColor }}>{phaseLabel}</div>}
          {!compact && narrative && <div className="mt-1 max-w-[260px] text-[12px] leading-[1.33] text-[color:var(--text-secondary)]">{narrative}</div>}
        </div>
      )}

      {/* Scale Labels */}
      {labels.map((l, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 font-medium text-[12px] leading-[1] text-[color:var(--text-tertiary)]"
          style={{ left: l.left, top: l.top }}
        >
          {l.text}
        </div>
      ))}
    </div>
  );
}
