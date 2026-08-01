/**
 * Contrato de transporte do motor de diagnostico SignallQ.
 *
 * Fonte canonica: docs_ai/CONTRATOS/openapi/signallq-diagnostic-worker.yaml
 * e integrations/cloudflare/signallq-diagnostic-worker/src/contracts.ts no
 * repositorio SignallQ. Nao implemente regras, classificacoes ou fallbacks
 * neste modulo: ele existe somente para preservar o shape da API oficial.
 */

export const DIAGNOSTIC_API_PATH = '/diagnostic/evaluate' as const
export const DIAGNOSTIC_SNAPSHOT_SCHEMA_VERSION = 6 as const

export type DiagnosticEvaluationSource = 'REMOTE' | 'CACHED_LOCAL' | 'BUNDLED_LOCAL'
export type DiagnosticCardStatus = 'ok' | 'info' | 'attention' | 'critical' | 'inconclusive'
export type DiagnosticConfidence = 'LOW' | 'MEDIUM' | 'HIGH'
export type DiagnosticOverallStatus = 'OK' | 'ATTENTION' | 'CRITICAL' | 'INCONCLUSIVE'
export type DiagnosticFlowCode =
  | 'isp_externo'
  | 'wifi_local'
  | 'dns'
  | 'fibra'
  | 'rede_movel'
  | 'historico_degradacao'
  | 'internet_instavel'
  | 'sem_dados_suficientes'
  | 'saudavel_monitorar'

export type DiagnosticJsonValue = string | number | boolean | null | DiagnosticJsonObject | DiagnosticJsonValue[]
export type DiagnosticJsonObject = { [key: string]: DiagnosticJsonValue }

export interface DiagnosticSnapshot {
  schemaVersion: number
  sessionId?: string
  appVersion?: string
  platform?: string
  connection?: { type?: string; hasInternet?: boolean; ipv6Available?: boolean }
  wifi?: {
    band?: string
    rssiDbm?: number
    frequencyMhz?: number
    linkSpeedMbps?: number
    has5GhzAvailable?: boolean
    devicesOnNetwork?: number
  }
  wifiScan?: {
    connectedChannel?: number
    networks?: Array<{ channel?: number; frequencyMhz?: number; rssiDbm?: number; ssid?: string }>
  }
  speed?: { downloadMbps?: number; uploadMbps?: number }
  quality?: { latencyMs?: number; jitterMs?: number; packetLossPercent?: number; loadedLatencyMs?: number }
  dns?: { latencyMs?: number; currentProvider?: string; [key: string]: DiagnosticJsonValue | undefined }
  fiber?: { rxPowerDbm?: number; txPowerDbm?: number; temperatureCelsius?: number; [key: string]: DiagnosticJsonValue | undefined } | null
  mobile?: { technology?: string; rsrpDbm?: number; rsrqDb?: number; sinrDb?: number; operatorName?: string; [key: string]: DiagnosticJsonValue | undefined } | null
  historical?: {
    testsCount7d?: number; testsCount30d?: number; avgDownload7d?: number; avgDownload30d?: number
    avgUpload7d?: number; avgUpload30d?: number; avgPing7d?: number; avgPing30d?: number
    avgDns7d?: number; avgDns30d?: number; worstTimeWindow?: string; bestTimeWindow?: string
  }
  gateway?: { rttMs?: number }
  localEquipment?: Record<string, DiagnosticJsonValue> | null
}

export interface DiagnosticCard {
  id: string
  titulo: string
  status: DiagnosticCardStatus
  evidencia: string | null
  mensagemUsuario: string
  recomendacao: string | null
  categoria: string
  podeConcluir: boolean
  categoriaOrigem: string | null
}

export interface DiagnosticReportPayload {
  evaluationSource: DiagnosticEvaluationSource
  wifiResultados: DiagnosticCard[]
  internetResultados: DiagnosticCard[]
  mobileResultados: DiagnosticCard[]
  fibraResultados: DiagnosticCard[]
  dnsResultados: DiagnosticCard[]
  historicoResultados: DiagnosticCard[]
  wifiCanalResultados: DiagnosticCard[]
  redeResultados: DiagnosticCard[]
  decisao: DiagnosticCard
  achadosSecundarios: DiagnosticCard[]
  hipotesesDescartadas: DiagnosticCard[]
  dadosAusentes: string[]
  limitacoesEquipamentoLocal: string[]
  recomendacoes: DiagnosticCard[]
  scoreEngineResultado: {
    score: number
    veredictoHumano: string
    dimensoes: Array<{ id: string; score: number }>
  }
  perfisUso: Array<{ profileId: string; label: string; status: DiagnosticCardStatus }>
  gameReadiness: Array<{ profileCode: string; label: string; status: 'bom' | 'atencao' | 'ruim' | 'sem_dados' }>
  aiAssist?: {
    version: number
    mode: 'single_shot_explainer'
    shouldInvoke: boolean
    reason: string
    systemPrompt: string
    userPrompt: string
    expectedOutputSchema: { format: 'json'; fields: string[] }
  }
  geradoEmMs: number
}

export interface DiagnosticValidationErrorResponse {
  error: string
  details?: string[]
}
