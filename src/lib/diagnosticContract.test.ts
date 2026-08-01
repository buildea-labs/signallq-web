import { describe, expect, it } from 'vitest'
import {
  DIAGNOSTIC_API_PATH,
  DIAGNOSTIC_SNAPSHOT_SCHEMA_VERSION,
  type DiagnosticReportPayload,
  type DiagnosticSnapshot,
} from './diagnosticContract'

describe('diagnostic contract', () => {
  it('keeps the official public evaluation path and current Android schema version', () => {
    expect(DIAGNOSTIC_API_PATH).toBe('/diagnostic/evaluate')
    expect(DIAGNOSTIC_SNAPSHOT_SCHEMA_VERSION).toBe(6)
  })

  it('represents an inconclusive report without manufacturing a conclusion', () => {
    const snapshot: DiagnosticSnapshot = { schemaVersion: DIAGNOSTIC_SNAPSHOT_SCHEMA_VERSION }
    const report: DiagnosticReportPayload = {
      evaluationSource: 'BUNDLED_LOCAL',
      wifiResultados: [], internetResultados: [], mobileResultados: [], fibraResultados: [], dnsResultados: [],
      historicoResultados: [], wifiCanalResultados: [], redeResultados: [], achadosSecundarios: [],
      hipotesesDescartadas: [], dadosAusentes: [], limitacoesEquipamentoLocal: [], recomendacoes: [],
      decisao: {
        id: 'DECISAO-INCONCLUSIVO', titulo: 'Nao foi possivel concluir sua analise', status: 'inconclusive',
        evidencia: null, mensagemUsuario: 'Tente novamente.', recomendacao: null, categoria: 'decisao',
        podeConcluir: false, categoriaOrigem: null,
      },
      scoreEngineResultado: { score: 0, veredictoHumano: 'fraco', dimensoes: [{ id: 'geral', score: 0 }] },
      perfisUso: [], gameReadiness: [], geradoEmMs: 0,
    }

    expect(snapshot.schemaVersion).toBe(6)
    expect(report.decisao.status).toBe('inconclusive')
    expect(report.decisao.podeConcluir).toBe(false)
  })
})
