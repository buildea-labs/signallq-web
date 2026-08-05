// Geometria do velocímetro (arco SVG), extraída para funções puras e testáveis.
export const GAUGE_CX = 180
export const GAUGE_CY = 186
export const GAUGE_R = 136
export const GAUGE_ARC_LEN = Math.PI * GAUGE_R
export const GAUGE_ARC_PATH = `M ${GAUGE_CX - GAUGE_R} ${GAUGE_CY} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${GAUGE_CX + GAUGE_R} ${GAUGE_CY}`

// Raios do ponteiro (linha needleFrom -> needleTo), 1:1 com o protótipo.
export const GAUGE_NEEDLE_FROM_R = GAUGE_R - 36
export const GAUGE_NEEDLE_TO_R = GAUGE_R - 2

// Escala de rótulos exibida sob o arco — não-linear de propósito (o
// protótipo rotula posições igualmente espaçadas do arco com esses valores;
// a fração real percorrida continua vindo de fractionForLatency/
// fractionForThroughput, não desta lista).
export const GAUGE_SCALE_VALUES = ['0', '1', '5', '10', '20', '30', '50', '75', '100'] as const

export function pointOnArc(radius: number, fraction: number): { x: number; y: number } {
  const rad = ((180 - fraction * 180) * Math.PI) / 180
  return { x: GAUGE_CX + radius * Math.cos(rad), y: GAUGE_CY - radius * Math.sin(rad) }
}

export interface Tick {
  x1: number
  y1: number
  x2: number
  y2: number
  major: boolean
}

// 49 traços (i/48), traço maior a cada 6 (9 traços maiores — um por rótulo
// de escala), 1:1 com o protótipo.
export const GAUGE_TICKS: Tick[] = Array.from({ length: 49 }, (_, i) => {
  const fraction = i / 48
  const major = i % 6 === 0
  const a = pointOnArc(GAUGE_R + 11, fraction)
  const b = pointOnArc(GAUGE_R + (major ? 21 : 17), fraction)
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, major }
})

export interface ScaleLabel {
  text: string
  leftPercent: number
  topPercent: number
}

// Posições dos 9 rótulos de escala (0/1/5/10/20/30/50/75/100), em % da
// viewBox 360x210 — usados como `left`/`top` absolutos sobre o SVG.
export const GAUGE_SCALE_LABELS: ScaleLabel[] = GAUGE_SCALE_VALUES.map((text, i) => {
  const p = pointOnArc(GAUGE_R + 36, i / 8)
  return { text, leftPercent: (p.x / 360) * 100, topPercent: (p.y / 210) * 100 }
})

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// Fração do arco preenchida por fase — mesma curva do protótipo:
// latência usa escala linear invertida (menor = mais cheio), throughput usa
// raiz quadrada para não saturar o arco cedo demais em conexões rápidas.
export function fractionForLatency(ms: number): number {
  return clamp(1 - ms / 150, 0, 1)
}

export function fractionForThroughput(mbps: number): number {
  return clamp(Math.sqrt(mbps / 300), 0, 1)
}

export const THROUGHPUT_GAUGE_STEPS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000] as const

/** Menor escala que comporta a leitura, sem nunca diminuir durante a fase. */
export function gaugeScaleForThroughput(mbps: number, currentScale: number = THROUGHPUT_GAUGE_STEPS[0]): number {
  const required = THROUGHPUT_GAUGE_STEPS.find((step) => mbps <= step) ?? THROUGHPUT_GAUGE_STEPS.at(-1)!
  return Math.max(currentScale, required)
}

/** Reinicia a escala ao iniciar uma nova fase; dentro dela, só permite crescimento. */
export function gaugeScaleForThroughputPhase(mbps: number, currentScale: number, startsPhase: boolean): number {
  return gaugeScaleForThroughput(mbps, startsPhase ? THROUGHPUT_GAUGE_STEPS[0] : currentScale)
}

/** Média móvel apenas para a animação do mostrador; não altera a medição final. */
export function movingAverage(values: readonly number[]): number {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

export function gaugeScaleLabels(max: number): string[] {
  return gaugeScaleLabelPositions(max).map(({ text }) => text)
}

/** Rótulos de throughput e suas posições reais no arco. */
export function gaugeScaleLabelPositions(max: number): Array<{ text: string; fraction: number }> {
  return [0, 0.1, 0.25, 0.5, 0.75, 1].map((fraction) => ({
    text: `${Math.round(max * fraction)}`,
    fraction,
  }))
}

/**
 * A leitura de latência é invertida no arco: menor latência fica à direita.
 * Os rótulos seguem a mesma direção da agulha para não sugerir a escala oposta.
 */
export function latencyGaugeLabelPositions(): Array<{ text: string; fraction: number }> {
  return [150, 100, 75, 50, 25, 0].map((value) => ({
    text: `${value}`,
    fraction: fractionForLatency(value),
  }))
}

/** Posição da agulha na mesma escala que está sendo exibida. */
export function fractionForGaugeScale(value: number, scale: number): number {
  return clamp(value / scale, 0, 1)
}

/* ===========================================================================
   Geometria do velocímetro do protótipo (`Speedometer.dc.html`).

   O arco antigo era um semicírculo de 180° com escala linear; o protótipo usa
   um arco de 196° que começa abaixo da horizontal esquerda (188°) e termina
   abaixo da horizontal direita (-8°), com progressão `t^0.78` — mais resolução
   na parte baixa da escala, que é onde as conexões domésticas vivem.

   Tudo aqui é função pura sobre a viewBox 300×200, para que o componente
   React só interpole e desenhe.
   =========================================================================== */

export const GAUGE_VIEWBOX_WIDTH = 300
export const GAUGE_VIEWBOX_HEIGHT = 206
export const DIAL_CX = 150
export const DIAL_CY = 170
export const DIAL_R = 125
export const DIAL_START_ANGLE = 188
export const DIAL_SWEEP = 196

/** Progressão do arco: `t^0.78` — mesma curva do protótipo. */
export function dialCurve(fraction: number): number {
  return Math.pow(clamp(fraction, 0, 1), 0.78)
}

export function dialPolar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return { x: DIAL_CX + radius * Math.cos(rad), y: DIAL_CY - radius * Math.sin(rad) }
}

/** Ângulo (graus) da posição `t` (0..1) já curvada do arco. */
export function dialAngle(t: number): number {
  return DIAL_START_ANGLE - clamp(t, 0, 1) * DIAL_SWEEP
}

/** Caminho SVG do arco entre duas posições curvadas `t0`/`t1` (0..1). */
export function dialArcPath(t0: number, t1: number, radius: number = DIAL_R): string {
  const a0 = dialAngle(t0)
  const a1 = dialAngle(t1)
  const p0 = dialPolar(a0, radius)
  const p1 = dialPolar(a1, radius)
  const large = Math.abs(a0 - a1) > 180 ? 1 : 0
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`
}

const DIAL_SCALE_SETS: Record<number, readonly number[]> = {
  10: [0, 2.5, 5, 7.5, 10],
  20: [0, 5, 10, 15, 20],
  50: [0, 10, 25, 40, 50],
  100: [0, 25, 50, 75, 100],
  200: [0, 50, 100, 150, 200],
  250: [0, 50, 100, 175, 250],
  500: [0, 100, 250, 375, 500],
  1000: [0, 100, 250, 500, 750, 1000],
  2500: [0, 500, 1000, 1750, 2500],
  5000: [0, 1000, 2500, 3750, 5000],
}

/** Valores rotulados de uma escala; cai em 1000 para escalas desconhecidas. */
export function dialScaleSet(max: number): readonly number[] {
  return DIAL_SCALE_SETS[max] ?? DIAL_SCALE_SETS[1000]
}

/** Menor escala do protótipo que comporta a leitura, por unidade. */
export function dialAutoMax(value: number, unit: 'Mbps' | 'ms'): number {
  const v = Number.isFinite(value) ? Math.max(0, value) : 0
  if (unit === 'ms') {
    if (v <= 20) return 20
    if (v <= 50) return 50
    if (v <= 100) return 100
    return 200
  }
  const steps = [10, 50, 100, 250, 500, 1000, 2500, 5000]
  return steps.find((step) => v <= step) ?? 5000
}

/** Escala adaptativa que nunca encolhe dentro da mesma fase de medição. */
export function dialScaleForPhase(value: number, unit: 'Mbps' | 'ms', currentMax: number, startsPhase: boolean): number {
  const required = dialAutoMax(value, unit)
  return startsPhase ? required : Math.max(currentMax, required)
}

/** Rótulo curto de um traço maior: 1000 → "1k", 2.5 → "2.5". */
export function dialTickLabel(value: number): string {
  if (value >= 1000) return `${(value / 1000).toString().replace(/\.0$/, '')}k`
  return String(value)
}

export interface DialTick {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface DialMajorTick extends DialTick {
  labelX: number
  labelY: number
  label: string
}

/** Traços maiores (com rótulo) da escala, na mesma curva do arco. */
export function dialMajorTicks(max: number, strokeWidth: number): DialMajorTick[] {
  return dialScaleSet(max).map((value) => {
    const angle = dialAngle(dialCurve(max > 0 ? value / max : 0))
    const inner = dialPolar(angle, DIAL_R - strokeWidth / 2 - 6)
    const outer = dialPolar(angle, DIAL_R - strokeWidth / 2 - 16)
    const label = dialPolar(angle, DIAL_R - strokeWidth / 2 - 31)
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, labelX: label.x, labelY: label.y, label: dialTickLabel(value) }
  })
}

const DIAL_MINOR_TICK_COUNT = 27

/** Traços menores, pulando os que cairiam sobre um traço maior. */
export function dialMinorTicks(max: number, strokeWidth: number): DialTick[] {
  const majors = dialScaleSet(max).map((value) => dialCurve(max > 0 ? value / max : 0))
  const ticks: DialTick[] = []
  for (let i = 0; i <= DIAL_MINOR_TICK_COUNT; i += 1) {
    const t = i / DIAL_MINOR_TICK_COUNT
    if (majors.some((majorT) => Math.abs(majorT - t) < 0.02)) continue
    const angle = dialAngle(t)
    const inner = dialPolar(angle, DIAL_R - strokeWidth / 2 - 6)
    const outer = dialPolar(angle, DIAL_R - strokeWidth / 2 - 11)
    ticks.push({ x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y })
  }
  return ticks
}
