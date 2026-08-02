// Cálculo estatístico puro do motor de medição: mediana, jitter, conversão de
// unidades, resumo de latência, bufferbloat e estabilidade. Sem transporte,
// sem React — só matemática sobre amostras já coletadas.
import { SPEEDTEST_SERVER_LABEL } from './config'
import type { BufferbloatSeverity } from './speedEngine'

export interface LatencySummary {
  ms: number
  jitterMs: number
  packetLossPercent: number
  totalSamples: number
  validSamples: number
  timeouts: number
  maxMs: number
  p95Ms: number
  peaks: number
}

export function median(nums: number[]): number {
  if (!nums.length) return 0
  const values = [...nums].sort((a, b) => a - b)
  const middle = Math.floor(values.length / 2)
  return values.length % 2 ? values[middle]! : (values[middle - 1]! + values[middle]!) / 2
}

export function meanAbsJitter(nums: number[]): number | null {
  if (nums.length < 2) return null
  return nums.slice(1).reduce((sum, value, index) => sum + Math.abs(value - nums[index]!), 0) / (nums.length - 1)
}

export function bytesToMbps(bytes: number, ms: number): number {
  return ms > 0 ? (bytes * 8) / (ms / 1000) / 1e6 : 0
}

/**
 * O código de colo é uma informação da borda que respondeu à requisição, não
 * uma localização escolhida pelo navegador. Só aceitamos o formato IATA de
 * três letras para nunca renderizar um valor de header arbitrário.
 */
export function cloudflareColo(value: string | null): string | null {
  const colo = value?.trim().toUpperCase() ?? ''
  return /^[A-Z]{3}$/.test(colo) ? colo : null
}

export function measurementServerLabel(colo: string | null): string {
  return colo ? `Borda Cloudflare · PoP ${colo}` : SPEEDTEST_SERVER_LABEL
}

export function summarizeLatency(raw: Array<number | null>): LatencySummary {
  const samples = raw.slice(1)
  const timeouts = samples.filter((sample) => sample == null).length
  const valid = samples.filter((sample): sample is number => sample != null && Number.isFinite(sample))
  const baseMedian = median(valid)
  const filtered = baseMedian > 0 ? valid.filter((sample) => sample <= baseMedian * 3) : valid
  const used = filtered.length ? filtered : valid
  const ordered = [...valid].sort((a, b) => a - b)
  const p95Index = ordered.length ? Math.min(ordered.length - 1, Math.max(0, Math.ceil(ordered.length * 0.95) - 1)) : 0
  return {
    ms: median(used),
    jitterMs: meanAbsJitter(used) ?? 0,
    packetLossPercent: samples.length ? (timeouts / samples.length) * 100 : 0,
    totalSamples: samples.length,
    validSamples: used.length,
    timeouts,
    maxMs: ordered.at(-1) ?? 0,
    p95Ms: ordered[p95Index] ?? 0,
    peaks: valid.length - used.length,
  }
}

export function bufferbloatSeverity(ms: number): BufferbloatSeverity {
  if (ms < 5) return 'none'
  if (ms <= 30) return 'mild'
  if (ms <= 100) return 'moderate'
  return 'severe'
}

export function stability(samples: number[]): number {
  if (samples.length < 2) return 0
  const mean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length
  if (!mean) return 0
  const deviation = Math.sqrt(samples.reduce((sum, sample) => sum + (sample - mean) ** 2, 0) / samples.length)
  return Math.max(0, Math.min(100, 100 - (deviation / mean) * 100))
}
