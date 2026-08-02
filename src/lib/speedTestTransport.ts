// Transporte HTTP/XHR do motor de medição: requisição instrumentada, geração
// de payload de upload, coleta de latência, throughput escalonado por
// streams e resolução DNS. Sem estatística de alto nível (vive em
// `speedTestStats.ts`) e sem montagem de resultado (vive em `speedEngine.ts`).
import { SPEEDTEST_DOWNLOAD_URL, SPEEDTEST_LATENCY_URL, SPEEDTEST_UPLOAD_URL } from './config'
import { SpeedTestError } from './speedTestError'
import type { SpeedTestModeConfig } from './speedTestConfig'
import { bytesToMbps, cloudflareColo, median } from './speedTestStats'
import type { LatencySummary } from './speedTestStats'
import { summarizeLatency } from './speedTestStats'

export interface CancelToken {
  cancelled: boolean
  contaminated: boolean
  xhrs: Set<XMLHttpRequest>
}

interface Sample {
  tMs: number
  mbps: number
}

export interface ThroughputSummary {
  mbps: number
  peakMbps: number
  samples: number[]
  endedBy: 'time_elapsed' | 'network_changed' | 'cancelled'
  requestErrors: number
}

export interface DnsSummary {
  latencyMs: number | null
  resolverIp: string | null
  provider: string | null
}

function xhrRequest(
  method: 'GET' | 'POST',
  url: string,
  body: Blob | null,
  token: CancelToken,
  onProgress?: (loaded: number) => void,
  onColo?: (colo: string) => void,
): Promise<{ bytes: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    token.xhrs.add(xhr)
    xhr.open(method, url, true)
    xhr.timeout = 20_000
    if (method === 'GET') xhr.responseType = 'arraybuffer'
    const startedAt = performance.now()
    const target = method === 'POST' ? xhr.upload : xhr
    target.onprogress = (event) => onProgress?.(event.loaded)
    const finish = () => token.xhrs.delete(xhr)
    xhr.onload = () => {
      finish()
      if (xhr.status >= 200 && xhr.status < 300) {
        // A leitura só funciona quando o endpoint libera o header por CORS.
        // Não lemos IP, país, cidade ou coordenadas, ainda que estejam presentes.
        const colo = cloudflareColo(xhr.getResponseHeader('cf-meta-colo'))
        if (colo) onColo?.(colo)
        resolve({ bytes: body?.size ?? (xhr.response as ArrayBuffer | null)?.byteLength ?? 0, duration: performance.now() - startedAt })
      }
      else reject(new SpeedTestError('endpoint-unavailable', `HTTP ${xhr.status}`))
    }
    xhr.onerror = () => { finish(); reject(new SpeedTestError(navigator.onLine ? 'endpoint-unavailable' : 'no-connection')) }
    xhr.ontimeout = () => { finish(); reject(new SpeedTestError('endpoint-unavailable', 'timeout')) }
    xhr.onabort = () => { finish(); reject(new SpeedTestError('cancelled')) }
    xhr.send(body)
  })
}

function uploadBlob(bytes: number): Blob {
  const chunks: Uint8Array[] = []
  for (let remaining = bytes; remaining > 0; remaining -= 65_536) {
    const chunk = new Uint8Array(Math.min(65_536, remaining))
    crypto.getRandomValues(chunk)
    chunks.push(chunk)
  }
  return new Blob(chunks as any)
}

export async function measureLatency(token: CancelToken): Promise<number | null> {
  const startedAt = performance.now()
  try {
    await xhrRequest('GET', `${SPEEDTEST_LATENCY_URL}${SPEEDTEST_LATENCY_URL.includes('?') ? '&' : '?'}_cb=${Date.now()}_${Math.random()}`, null, token)
    return performance.now() - startedAt
  } catch (error) {
    if (error instanceof SpeedTestError && error.code === 'cancelled') throw error
    return null
  }
}

export async function collectLatency(count: number, token: CancelToken, onSample: (ms: number) => void): Promise<LatencySummary> {
  const raw: Array<number | null> = []
  for (let index = 0; index < count; index++) {
    if (token.cancelled) throw new SpeedTestError('cancelled')
    const sample = await measureLatency(token)
    raw.push(sample)
    if (sample != null) onSample(sample)
  }
  return summarizeLatency(raw)
}

export async function runThroughput(
  phase: 'download' | 'upload',
  config: SpeedTestModeConfig,
  token: CancelToken,
  onTick: (mbps: number) => void,
  onColo: (colo: string) => void,
): Promise<{ throughput: ThroughputSummary; loadLatencyMs: number }> {
  const durationMs = phase === 'download' ? config.downloadDurationMs : config.uploadDurationMs
  const payloadBytes = phase === 'download' ? config.downloadPayloadBytes : config.uploadPayloadBytes
  const initialStreams = phase === 'download' ? config.downloadInitialStreams : config.uploadInitialStreams
  const maxStreams = phase === 'download' ? config.downloadMaxStreams : config.uploadMaxStreams
  const startedAt = performance.now()
  const samples: Sample[] = []
  const loadPings: number[] = []
  let bytesTick = 0
  let targetStreams = initialStreams
  let requestErrors = 0
  let lastScaleAt = 0
  let previousAverage = 0
  const stopAt = startedAt + durationMs

  const worker = async (index: number) => {
    if (index) await new Promise((resolve) => setTimeout(resolve, index * 200))
    while (!token.cancelled && performance.now() < stopAt) {
      if (index >= targetStreams) { await new Promise((resolve) => setTimeout(resolve, 120)); continue }
      try {
        let previousLoaded = 0
        const onProgress = (loaded: number) => {
          bytesTick += Math.max(0, loaded - previousLoaded)
          previousLoaded = loaded
        }
        const request = phase === 'download'
          ? xhrRequest('GET', `${SPEEDTEST_DOWNLOAD_URL}?bytes=${payloadBytes}&_cb=${Date.now()}_${Math.random()}`, null, token, onProgress, onColo)
          : xhrRequest('POST', `${SPEEDTEST_UPLOAD_URL}?_cb=${Date.now()}_${Math.random()}`, uploadBlob(payloadBytes), token, onProgress, onColo)
        const response = await request
        // Alguns navegadores não emitem progresso de upload para payloads pequenos.
        if (phase === 'upload' && previousLoaded === 0) bytesTick += response.bytes
      } catch (error) {
        if (error instanceof SpeedTestError && error.code === 'cancelled') return
        requestErrors++
        if (!navigator.onLine) { token.contaminated = true; return }
      }
    }
  }

  const sampler = window.setInterval(() => {
    const elapsed = performance.now() - startedAt
    const instant = bytesToMbps(bytesTick, 1000)
    bytesTick = 0
    if (instant > 0) { samples.push({ tMs: elapsed, mbps: instant }); onTick(instant) }
    if (elapsed - lastScaleAt >= 4000 && targetStreams < maxStreams) {
      const recent = samples.filter((sample) => sample.tMs >= Math.max(0, elapsed - 4000)).map((sample) => sample.mbps)
      const average = recent.length ? recent.reduce((sum, value) => sum + value, 0) / recent.length : 0
      if (!previousAverage || average >= previousAverage * 1.1) targetStreams = Math.min(maxStreams, targetStreams + 2)
      previousAverage = average
      lastScaleAt = elapsed
    }
  }, 1000)
  const pingLoop = (async () => {
    while (!token.cancelled && performance.now() < stopAt) {
      const before = performance.now()
      const ping = await measureLatency(token)
      if (ping != null) loadPings.push(ping)
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, 1000 - (performance.now() - before))))
    }
  })()

  await Promise.all(Array.from({ length: maxStreams }, (_, index) => worker(index)))
  window.clearInterval(sampler)
  await pingLoop
  const valid = samples.filter((sample) => sample.tMs >= config.warmupMs && sample.mbps > 0)
  const stable = valid.slice(Math.min(valid.length, Math.ceil(valid.length * 0.35)))
  const measured = stable.length ? stable : valid
  const endedBy = token.cancelled ? 'cancelled' : token.contaminated ? 'network_changed' : 'time_elapsed'
  return {
    throughput: { mbps: measured.length ? measured.reduce((sum, sample) => sum + sample.mbps, 0) / measured.length : 0, peakMbps: valid.reduce((peak, sample) => Math.max(peak, sample.mbps), 0), samples: valid.map((sample) => sample.mbps), endedBy, requestErrors },
    loadLatencyMs: median(loadPings),
  }
}

export async function measureDns(): Promise<DnsSummary> {
  const url = 'https://cloudflare-dns.com/dns-query?name=whoami.cloudflare.com&type=TXT'
  const startedAt = performance.now()
  try {
    const response = await fetch(url, { headers: { accept: 'application/dns-json' }, cache: 'no-store', signal: AbortSignal.timeout(4000) })
    if (!response.ok) return { latencyMs: null, resolverIp: null, provider: null }
    const body = JSON.stringify(await response.json())
    const resolverIp = body.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)?.[0] ?? null
    return { latencyMs: Math.round(performance.now() - startedAt), resolverIp, provider: body.toLowerCase().includes('cloudflare') ? 'cloudflare' : resolverIp ? 'desconhecido' : null }
  } catch {
    return { latencyMs: null, resolverIp: null, provider: null }
  }
}
