// Mapper de dados (#74): adapta um `MedicaoRegistro` (shape achatado do
// Histórico) para o subconjunto de campos que `UseCaseSummary` e
// `ResultTechnicalDetails` de fato leem (`ResultView`). Decisão explícita da
// spec de UX: mapper, não variante visual — os dois componentes continuam
// sendo os mesmos usados pela jornada ao vivo (Feature #59), sem duplicar
// design. Nenhum campo ausente em `MedicaoRegistro` é inventado: onde o dado
// não existe, a linha correspondente some (comportamento já garantido pelos
// gates existentes em `resultTechnicalDetailsRows.ts`).
import type { MedicaoRegistro } from './measurementRepository'
import type { ResultView } from './resultView'
import { bufferbloatSeverity } from './speedTestStats'

export function adaptRecordForResultView(record: MedicaoRegistro): ResultView {
  return {
    download: { mbps: record.download },
    upload: { mbps: record.upload },
    latency: {
      ms: record.latency,
      // Sinalizador sintético (não uma contagem real de amostras, que não
      // existe neste shape) só para acionar o gate de "perda de pacotes" já
      // existente em `buildTechnicalDetailGroups` por presença do dado
      // persistido, e não por `validSamples` — nunca exibido diretamente.
      validSamples: record.packetLossPercent !== undefined ? 1 : 0,
    },
    jitter: record.jitter !== null ? { ms: record.jitter } : null,
    packetLoss: { percent: record.packetLossPercent ?? 0 },
    // Severidade nunca é persistida: reaplica a mesma classificação
    // determinística já usada ao vivo sobre o valor salvo (não recalcula
    // diagnóstico, só reclassifica um número existente para exibição).
    bufferbloat: record.bufferbloatMs !== undefined
      ? { ms: record.bufferbloatMs, severity: bufferbloatSeverity(record.bufferbloatMs) }
      : undefined,
    stabilityScore: record.stabilityScore,
    mode: record.mode,
    server: record.server,
    timestamp: record.timestamp,
    // `durationMs` e `dns.latencyMs` nunca existem em `MedicaoRegistro`:
    // ausência permanente de schema, não um caso condicional.
    durationMs: undefined,
    dns: { latencyMs: null },
    // `status` nunca é persistido: todo registro salvo é implicitamente
    // completo (`persistSpeedTestResult` só roda com `status === 'complete'`).
    // Deixar ausente (em vez de forjar `'complete'`) faz `UseCaseSummary`
    // tratar o selo como completo sem ler um campo inexistente.
    status: undefined,
  }
}
