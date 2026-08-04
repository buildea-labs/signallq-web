// Subconjunto de `SpeedTestResult` que `UseCaseSummary` e
// `ResultTechnicalDetails` de fato leem (#74). `SpeedTestResult` satisfaz
// esta interface estruturalmente — nenhum call-site da jornada ao vivo
// precisa mudar. Os campos aqui marcados opcionais só ficam ausentes quando
// a fonte é um `MedicaoRegistro` do Histórico (ver `adaptRecordForResultView`
// em `historyResultView.ts`); a jornada ao vivo sempre os preenche.
import type { BufferbloatSeverity, MeasurementStatus, SpeedTestMode } from './speedEngine'

export interface ResultView {
  download: { mbps: number }
  upload: { mbps: number }
  /** `validSamples` aqui só controla o gate de exibição de "perda de
   * pacotes" reaproveitado por `buildTechnicalDetailGroups` — nunca é
   * exibido. Para o Histórico é um sinalizador sintético de presença do
   * dado, não uma contagem real de amostras (que não existe nesse shape). */
  latency: { ms: number; validSamples: number }
  jitter: { ms: number } | null
  packetLoss: { percent: number }
  bufferbloat?: { ms: number; severity: BufferbloatSeverity }
  stabilityScore?: number
  mode?: SpeedTestMode
  server: string
  timestamp: number
  durationMs?: number
  dns: { latencyMs: number | null }
  /** Ausente para registros do Histórico (nunca persistido) — nesse caso o
   * selo de status é sempre tratado como "Completo", sem inventar o campo. */
  status?: MeasurementStatus
}
