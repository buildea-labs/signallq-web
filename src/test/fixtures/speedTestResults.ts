import type { SpeedTestResult } from '@/lib/speedEngine'

type ResultOverrides = Partial<Omit<SpeedTestResult, 'download' | 'upload' | 'latency' | 'jitter' | 'packetLoss' | 'loadedLatency' | 'bufferbloat' | 'dns'>> & {
  download?: Partial<SpeedTestResult['download']>
  upload?: Partial<SpeedTestResult['upload']>
  latency?: Partial<SpeedTestResult['latency']>
  jitter?: SpeedTestResult['jitter']
  packetLoss?: Partial<SpeedTestResult['packetLoss']>
  loadedLatency?: SpeedTestResult['loadedLatency']
  bufferbloat?: Partial<SpeedTestResult['bufferbloat']>
  dns?: Partial<SpeedTestResult['dns']>
}

export function createSpeedTestResultFixture(overrides: ResultOverrides = {}): SpeedTestResult {
  const status = overrides.status ?? 'complete'
  const mode = overrides.mode ?? 'completo'

  return {
    id: overrides.id ?? `fixture-${mode}-${status}`,
    timestamp: overrides.timestamp ?? 1_798_588_800_000,
    mode,
    status,
    download: { mbps: 240, peakMbps: 265, ...overrides.download },
    upload: { mbps: mode === 'rapido' ? 0 : 85, peakMbps: mode === 'rapido' ? 0 : 92, ...overrides.upload },
    latency: { ms: 18, samples: 12, validSamples: 12, timeouts: 0, maxMs: 26, p95Ms: 23, peaks: 0, ...overrides.latency },
    jitter: overrides.jitter ?? { ms: 4 },
    packetLoss: { percent: 0, ...overrides.packetLoss },
    loadedLatency: overrides.loadedLatency ?? { downloadMs: 42, uploadMs: mode === 'rapido' ? 0 : 58 },
    bufferbloat: { ms: 24, severity: 'mild', ...overrides.bufferbloat },
    stabilityScore: overrides.stabilityScore ?? 94,
    dns: { latencyMs: 21, resolverIp: '1.1.1.1', provider: 'cloudflare', ...overrides.dns },
    connectionType: overrides.connectionType ?? 'wifi',
    server: overrides.server ?? 'Cloudflare automatico',
    durationMs: overrides.durationMs ?? (mode === 'rapido' ? 18_000 : 42_000),
    partial: overrides.partial ?? status !== 'complete',
    rounds: overrides.rounds,
  }
}

export const quickResultFixture = createSpeedTestResultFixture({
  id: 'fixture-quick-result',
  mode: 'rapido',
  download: { mbps: 118, peakMbps: 132 },
})

export const goodFullResultFixture = createSpeedTestResultFixture({
  id: 'fixture-full-good',
  mode: 'completo',
  download: { mbps: 310, peakMbps: 336 },
  upload: { mbps: 124, peakMbps: 137 },
  latency: { ms: 12, p95Ms: 16, maxMs: 19 },
  bufferbloat: { ms: 8, severity: 'none' },
  stabilityScore: 98,
})

export const attentionFullResultFixture = createSpeedTestResultFixture({
  id: 'fixture-full-attention',
  mode: 'completo',
  download: { mbps: 74, peakMbps: 92 },
  upload: { mbps: 12, peakMbps: 18 },
  latency: { ms: 46, p95Ms: 110, maxMs: 180, peaks: 3 },
  bufferbloat: { ms: 122, severity: 'severe' },
  stabilityScore: 61,
})

export const partialResultFixture = createSpeedTestResultFixture({
  id: 'fixture-partial',
  status: 'partial',
  mode: 'completo',
  partial: true,
  upload: { mbps: 0, peakMbps: 0 },
})

export const inconclusiveResultFixture = createSpeedTestResultFixture({
  id: 'fixture-inconclusive',
  status: 'inconclusive',
  mode: 'completo',
  partial: true,
  latency: { validSamples: 1, timeouts: 11 },
  jitter: null,
})

export const contaminatedResultFixture = createSpeedTestResultFixture({
  id: 'fixture-contaminated',
  status: 'contaminated',
  mode: 'completo',
  partial: true,
  connectionType: '4g',
})

export const restoredResultFixture = createSpeedTestResultFixture({
  id: 'fixture-restored',
  mode: 'completo',
  timestamp: 1_798_502_400_000,
})

export const errorResultFallbackFixture = quickResultFixture

export const offlineResultFallbackFixture = quickResultFixture
